import {
  Controller, Post, Body, UseGuards, Request,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { IsEmail, IsString, Length } from 'class-validator';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class RequestEmailDto {
  @IsString()
  companySlug!: string;

  @IsEmail()
  workEmail!: string;
}

export class VerifyOtpDto {
  @IsString()
  requestId!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('request-email')
  requestEmail(@Request() req: { user: { sub: string } }, @Body() dto: RequestEmailDto) {
    return this.verificationService.requestEmailOtp(req.user.sub, dto.companySlug, dto.workEmail);
  }

  @Post('verify-otp')
  verifyOtp(@Request() req: { user: { sub: string } }, @Body() dto: VerifyOtpDto) {
    return this.verificationService.verifyOtp(req.user.sub, dto.requestId, dto.otp);
  }
}