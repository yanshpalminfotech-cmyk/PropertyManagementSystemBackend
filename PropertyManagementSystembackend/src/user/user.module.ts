import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserCodeService } from './user-code.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserCodeService],
  exports: [UserService, UserCodeService],
})
export class UserModule { }
