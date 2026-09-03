import {
  Controller, Post, Body, UseGuards, Request,
  BadRequestException,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
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

  @IsOptional()
  @IsString()
  otp?: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class ClaimSecretCodeDto {
  @IsOptional()
  @IsString()
  companySlug?: string;

  @IsOptional()
  @IsString()
  secretCode?: string;

  @IsOptional()
  @IsString()
  code?: string;
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
    const otpValue = dto.otp || dto.code;
    if (!otpValue) throw new BadRequestException('OTP code is required');
    return this.verificationService.verifyOtp(req.user.sub, dto.requestId, otpValue);
  }

  @Post('claim-code')
  claimCode(@Request() req: { user: { sub: string } }, @Body() dto: ClaimSecretCodeDto) {
    const codeValue = dto.secretCode || dto.code;
    if (!codeValue) throw new BadRequestException('Secret code is required');
    return this.verificationService.claimSecretCode(req.user.sub, dto.companySlug, codeValue);
  }
}
