import { Injectable, UnauthorizedException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../common/database/database.service';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import {
  AUTH_GET_ADMIN_COUNT_QUERY,
  AUTH_FIND_USER_BY_EMAIL_QUERY,
  AUTH_UPDATE_FAILED_ATTEMPTS_QUERY,
  AUTH_RESET_FAILED_ATTEMPTS_QUERY,
  AUTH_REVOKE_USER_TOKENS_QUERY,
  AUTH_INSERT_TOKEN_QUERY,
  AUTH_REVOKE_SPECIFIC_TOKEN_QUERY,
  AUTH_REVOKE_REFRESH_TOKENS_QUERY,
  AUTH_FIND_VALID_REFRESH_TOKEN_QUERY,
  AUTH_VALIDATE_TOKEN_QUERY,
  AUTH_REVOKE_TOKEN_BY_ID_QUERY,
  AUTH_FIND_USER_BY_ID_QUERY,
} from './auth.queries';

export enum UserRole {
  ADMIN = 'ADMIN',
  BROKER = 'BROKER',
  CUSTOMER = 'CUSTOMER',
}

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  isLocked: boolean;
  failedLoginAttempts: number;
}

export enum TokenType {
  REFRESH = 'REFRESHTOKEN',
  ACCESS = 'ACCESSTOKEN',
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly db: DatabaseService,
  ) { }

  /**
   * Helper to map raw User DB result to IUser shape
   */
  private mapUser(raw: Record<string, unknown>, isSensitiveRequest = false): IUser | null {
    if (!raw) return null;
    const user: IUser = {
      id: raw.id as string,
      email: raw.email as string,
      role: raw.role as UserRole,
      passwordHash: raw.password_hash as string,
      isLocked: Boolean(raw.is_locked),
      failedLoginAttempts: raw.failed_login_attempts as number,
    };

    if (!isSensitiveRequest) {
      delete user.passwordHash;
    }

    return user;
  }

  private hashJti(jti: string): string {
    return crypto.createHash('sha256').update(jti).digest('hex');
  }

  async register(registerDto: RegisterDto): Promise<{ success: boolean; message: string }> {
    const { role = UserRole.CUSTOMER, ...rest } = registerDto;

    if (role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot register as an administrator');
    }

    await this.userService.create({
      ...rest,
      role: role as any, // UserService expect string
    });
    return { success: true, message: 'User registered successfully' };
  }

  async registerInitialAdmin(registerDto: RegisterDto): Promise<{ success: boolean; message: string }> {
    const admins = await this.db.query(AUTH_GET_ADMIN_COUNT_QUERY) as unknown[];

    if (admins.length > 0) {
      throw new ForbiddenException('Initial admin registration is disabled as an administrator already exists.');
    }

    await this.userService.create({
      ...registerDto,
      role: UserRole.ADMIN,
    });

    return { success: true, message: 'Initial administrator created successfully' };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: IUser | null }> {
    const { email, password } = loginDto;

    const [row] = await this.db.query(AUTH_FIND_USER_BY_EMAIL_QUERY, [email]) as Record<string, unknown>[];
    const user = this.mapUser(row, true);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new BadRequestException('Account is locked. Please contact admin or use unlock endpoint.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const isLocked = newAttempts >= 5;

      await this.db.query(AUTH_UPDATE_FAILED_ATTEMPTS_QUERY, [
        newAttempts, 
        isLocked ? 1 : 0, 
        user.id
      ]);

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.db.query(AUTH_RESET_FAILED_ATTEMPTS_QUERY, [user.id]);

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: this.mapUser(row, false),
    };
  }

  async generateTokens(user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    await this.db.query(AUTH_REVOKE_USER_TOKENS_QUERY, [user.id]);

    const accessTokenJti = uuidv4();
    const refreshTokenJti = uuidv4();

    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: accessTokenJti,
    };

    const refreshTokenPayload = {
      sub: user.id,
      jti: refreshTokenJti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: (this.configService.get<string>('jwt.refreshExpires') || '7d') as JwtSignOptions['expiresIn'],
      }),
    ]);

    await Promise.all([
      this.storeToken(user, accessToken, TokenType.ACCESS),
      this.storeToken(user, refreshToken, TokenType.REFRESH),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async storeToken(user: IUser, token: string, type: TokenType): Promise<void> {
    const hashedToken = this.hashJti(token);

    const configKey = type === TokenType.ACCESS ? 'jwt.accessExpires' : 'jwt.refreshExpires';
    const defaultVal = type === TokenType.ACCESS ? '15m' : '7d';
    const expiresIn = this.configService.get<string>(configKey) || defaultVal;

    const duration = this.getDurationMs(expiresIn);
    const expiresAt = new Date(Date.now() + duration);

    await this.db.query(AUTH_INSERT_TOKEN_QUERY, [
      uuidv4(),
      hashedToken,
      expiresAt,
      type,
      0,
      user.id
    ]);
  }

  async logout(userId: string, token: string): Promise<void> {
    const hashedToken = this.hashJti(token);

    await this.db.query(AUTH_REVOKE_SPECIFIC_TOKEN_QUERY, [hashedToken, userId]);
    await this.db.query(AUTH_REVOKE_REFRESH_TOKENS_QUERY, [userId, TokenType.REFRESH]);

    this.logger.log(`User ${userId} logged out — access & all refresh tokens revoked`);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const hashedToken = this.hashJti(refreshToken);

      const [row] = await this.db.query(AUTH_FIND_VALID_REFRESH_TOKEN_QUERY, [hashedToken, TokenType.REFRESH]) as Record<string, unknown>[];

      if (!row) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      const user = this.mapUser(row);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.isLocked) {
        this.logger.warn(`Refresh attempt by locked user ${user.id}`);
        throw new UnauthorizedException('Account is locked. Please contact an administrator.');
      }

      await this.db.query(AUTH_REVOKE_TOKEN_BY_ID_QUERY, [row.t_id as string]);

      return this.generateTokens(user);
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async findUserById(id: string): Promise<IUser | null> {
    const [row] = await this.db.query(AUTH_FIND_USER_BY_ID_QUERY, [id]) as Record<string, unknown>[];
    return this.mapUser(row, false);
  }

  async validateToken(token: string): Promise<boolean> {
    const hashedToken = this.hashJti(token);
    const tokens = await this.db.query(AUTH_VALIDATE_TOKEN_QUERY, [hashedToken, new Date()]) as unknown[];

    return tokens.length > 0;
  }

  private getDurationMs(expiresIn: string): number {
    const unit = expiresIn.slice(-1).toLowerCase();
    const value = parseInt(expiresIn.slice(0, -1), 10);

    if (isNaN(value)) {
      const num = parseInt(expiresIn, 10);
      return isNaN(num) ? 0 : num;
    }

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value;
    }
  }
}
