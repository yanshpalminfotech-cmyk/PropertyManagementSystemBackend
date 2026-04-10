import { Controller, Post, Body, UseGuards, Request, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-admin')
  @ApiOperation({ summary: 'Register the first administrator (System Bootstrap)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Initial admin registered successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin registration is disabled' })
  async registerAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.registerInitialAdmin(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens refreshed' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logged out successfully' })
  async logout(@Request() req: AuthenticatedRequest) {
    await this.authService.logout(req.user.id, req.jti);
    return { success: true };
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
