import {
  Controller, Post, Get, Body, Request, Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto.email, dto.password);
    res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS);
    return result;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req: { user: { sub: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.sub);
    res.clearCookie('accessToken', { path: '/' });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: { user: { sub: string } }) {
    return this.authService.me(req.user.sub);
  }
}
