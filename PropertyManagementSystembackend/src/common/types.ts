import { Request } from 'express';
import { UserRole } from '../user/entities/user.entity';

export type SqlParam = string | number | boolean | Date | null | undefined;

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: UserInfo;
  jti: string;
  accessToken: string;
}
