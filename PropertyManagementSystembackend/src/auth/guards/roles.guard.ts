import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../user/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../../common/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    // console.log(user)
    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    if (!requiredRoles.some((role) => user.role === role)) {
      throw new ForbiddenException('Insufficient permissions to access this resource');
    }
    return true;
  }
}
