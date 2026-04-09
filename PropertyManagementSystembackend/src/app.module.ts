import { Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { SiteSlotsModule } from './site-slots/site-slots.module';
import { VisitRequestsModule } from './visit-requests/visit-requests.module';
import { VisitFeedbackModule } from './visit-feedback/visit-feedback.module';
import { configValidationSchema } from './config/config.schema';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { PublicRouteMiddleware } from './auth/middleware/public.middleware';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
    validationSchema: configValidationSchema,
  }),
  TypeOrmModule.forRootAsync(databaseConfig),
    UserModule,
    AuthModule,
  ThrottlerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => [
      {
        ttl: config.get<number>('throttler.ttl') ?? 60000,
        limit: config.get<number>('throttler.limit') ?? 10,
      },
    ],
  }),
    PropertiesModule,
    SiteSlotsModule,
    VisitRequestsModule,
    VisitFeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    consumer.apply(PublicRouteMiddleware).forRoutes('*');
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}
