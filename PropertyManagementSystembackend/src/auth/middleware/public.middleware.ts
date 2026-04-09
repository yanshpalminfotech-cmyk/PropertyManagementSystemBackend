import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PublicRouteMiddleware implements NestMiddleware {
    use(req: Request & { isPublic?: boolean }, res: Response, next: NextFunction) {
        const path = req.originalUrl.split('?')[0];

        const isPublic =
            (
                path.startsWith('/v1/auth/login') ||
                path.startsWith('/v1/auth/register') ||
                path.startsWith('/v1/auth/register-admin') ||
                path.startsWith('/v1/auth/refresh')
            ) ||
            (
                req.method === 'GET' &&
                (
                    path === '/v1/properties' ||
                    /^\/v1\/properties\/[0-9a-fA-F-]+$/.test(path)
                )
            ) ||
            (
                path === '/v1/' || path === '/v1/'
            );

        req.isPublic = isPublic;

        next();
    }
}