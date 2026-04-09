import { Injectable, UnauthorizedException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../user/entities/user.entity';
import { Token, TokenType } from './entities/token.entity';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../common/types';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * Helper to map raw User DB result (with snake_case) to object
   */
  private mapUser(raw: any, isSensitiveRequest = false): any {
    if (!raw) return null;
    const user = {
      id: raw.id,
      email: raw.email,
      role: raw.role,
      passwordHash: raw.password_hash,
      isLocked: Boolean(raw.is_locked),
      failedLoginAttempts: raw.failed_login_attempts,
    };

    if (!isSensitiveRequest) {
      delete user.passwordHash;
    }

    return user;
  }

  private hashJti(jti: string): string {
    return crypto.createHash('sha256').update(jti).digest('hex');
  }

  async register(registerDto: RegisterDto) {
    const { role = UserRole.CUSTOMER, ...rest } = registerDto;

    if (role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot register as an administrator');
    }

    await this.userService.create({
      ...rest,
      role,
    });
    return { success: true, message: 'User registered successfully' };
  }

  async registerInitialAdmin(registerDto: RegisterDto) {
    // Check if any admin already exists using raw SQL as per project standards
    const admins = await this.userRepository.query(
      'SELECT id FROM users WHERE role = ? LIMIT 1',
      [UserRole.ADMIN]
    );

    if (admins.length > 0) {
      throw new ForbiddenException('Initial admin registration is disabled as an administrator already exists.');
    }

    // Create the first admin
    await this.userService.create({
      ...registerDto,
      role: UserRole.ADMIN,
    });

    return { success: true, message: 'Initial administrator created successfully' };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Direct SQL lookup
    const [row] = await this.userRepository.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = this.mapUser(row, true);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new BadRequestException('Account is locked. Please contact admin or use unlock endpoint.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const isLocked = newAttempts >= 5;

      await this.userRepository.query(
        'UPDATE users SET failed_login_attempts = ?, is_locked = ? WHERE id = ?',
        [newAttempts, isLocked ? 1 : 0, user.id]
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    await this.userRepository.query(
      'UPDATE users SET failed_login_attempts = 0 WHERE id = ?',
      [user.id]
    );

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: this.mapUser(row, false),
    };
  }

  async generateTokens(user: any) {
    // Revoke all existing tokens for this user before issuing new ones
    await this.tokenRepository.query(
      'UPDATE tokens SET is_revoked = 1 WHERE user_id = ? AND is_revoked = 0',
      [user.id]
    );

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

  private async storeToken(user: any, token: string, type: TokenType) {
    const hashedToken = this.hashJti(token); // reusing hashJti as a general SHA-256 hasher

    // Fetch duration from config to match JWT expiration
    const configKey = type === TokenType.ACCESS ? 'jwt.accessExpires' : 'jwt.refreshExpires';
    const defaultVal = type === TokenType.ACCESS ? '15m' : '7d';
    const expiresIn = this.configService.get<string>(configKey) || defaultVal;

    const duration = this.getDurationMs(expiresIn);
    const expiresAt = new Date(Date.now() + duration);

    const sql = `
      INSERT INTO tokens (
        id, hashed_token, expires_at, token_type, is_revoked, user_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.tokenRepository.query(sql, [
      uuidv4(),
      hashedToken,
      expiresAt,
      type,
      0, // is_revoked
      user.id
    ]);
  }

  async logout(userId: string, token: string) {
    const hashedToken = this.hashJti(token);

    // Revoke the specific access token being presented
    await this.tokenRepository.query(
      'UPDATE tokens SET is_revoked = 1 WHERE hashed_token = ? AND user_id = ?',
      [hashedToken, userId],
    );

    // Revoke ALL active refresh tokens so the user cannot obtain new access tokens
    await this.tokenRepository.query(
      'UPDATE tokens SET is_revoked = 1 WHERE user_id = ? AND token_type = ? AND is_revoked = 0',
      [userId, TokenType.REFRESH],
    );

    this.logger.log(`User ${userId} logged out — access & all refresh tokens revoked`);
  }

  async refresh(refreshToken: string) {
    try {
      const hashedToken = this.hashJti(refreshToken);

      // Raw JOIN — also guard with expires_at as DB-level defense-in-depth
      const [row] = await this.tokenRepository.query(
        `SELECT t.id as t_id, u.*
         FROM tokens t
         JOIN users u ON t.user_id = u.id
         WHERE t.hashed_token = ?
           AND t.is_revoked = 0
           AND t.token_type = ?
           AND t.expires_at > NOW()`,
        [hashedToken, TokenType.REFRESH],
      );

      if (!row) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      const user = this.mapUser(row);

      // Reject refresh attempts from locked accounts
      if (user.isLocked) {
        this.logger.warn(`Refresh attempt by locked user ${user.id}`);
        throw new UnauthorizedException('Account is locked. Please contact an administrator.');
      }

      // Revoke old refresh token before issuing new ones (rotation)
      await this.tokenRepository.query(
        'UPDATE tokens SET is_revoked = 1 WHERE id = ?',
        [row.t_id],
      );

      return this.generateTokens(user);
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async findUserById(id: string): Promise<any> {
    const [row] = await this.userRepository.query('SELECT * FROM users WHERE id = ?', [id]);
    return this.mapUser(row, false);
  }

  async validateToken(token: string): Promise<boolean> {
    const hashedToken = this.hashJti(token);
    const tokens = await this.tokenRepository.query(
      'SELECT id FROM tokens WHERE hashed_token = ? AND is_revoked = 0 AND expires_at > ?',
      [hashedToken, new Date()],
    );

    return tokens.length > 0;
  }

  /**
   * Helper to parse JWT expiration strings like '15m', '7d' into milliseconds
   */
  private getDurationMs(expiresIn: string): number {
    const unit = expiresIn.slice(-1).toLowerCase();
    const value = parseInt(expiresIn.slice(0, -1), 10);

    if (isNaN(value)) {
      // Fallback: If it's just a number, treat as milliseconds
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
