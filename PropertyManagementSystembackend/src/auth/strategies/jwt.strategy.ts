// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { AuthService } from '../auth.service';
// import { JwtPayload } from '../../common/types';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     configService: ConfigService,
//     private readonly authService: AuthService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: configService.get<string>('jwt.accessSecret')!,
//       passReqToCallback: true,
//     });
//   }

//   async validate(req: any, payload: JwtPayload) {
//     const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
//     if (!token) {
//         throw new UnauthorizedException('Token not found');
//     }

//     const isTokenValid = await this.authService.validateToken(token);
//     if (!isTokenValid) {
//       throw new UnauthorizedException('Token has been revoked or is invalid');
//     }

//     return { id: payload.sub, email: payload.email, role: payload.role, jti: payload.jti };
//   }
// }
