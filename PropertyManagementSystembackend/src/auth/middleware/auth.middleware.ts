import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest, JwtPayload } from '../../common/types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) { }

  async use(req: Request & { user?: any; isPublic?: boolean }, res: Response, next: NextFunction) {

    if (req.isPublic) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      const isTokenValid = await this.authService.validateToken(token);
      if (!isTokenValid) {
        throw new UnauthorizedException('Token has been revoked. please login.');
      }

      // Step 3: Fetch fresh user from DB (Production Pattern)
      const user = await this.authService.findUserById(payload.sub);

      // Step 4: Validate user exists and is active/unlocked
      if (!user) {
        throw new UnauthorizedException('User account no longer exists.');
      }

      if (user.isLocked) {
        throw new UnauthorizedException('Account is locked. Please contact support.');
      }

      // Populate req.user with DB-fresh data instead of token data
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: user.id,
        email: user.email,
        role: user.role, // Always use DB-fresh role
      };
      authenticatedReq.jti = payload.jti;
      next();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Authentication failed: ${message}`);
      throw new UnauthorizedException(`Invalid or expired token: ${message}`);
    }
  }
}
