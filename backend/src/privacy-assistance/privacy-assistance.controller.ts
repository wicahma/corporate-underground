import { Controller, Post, Body } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { PrivacyAssistanceService } from './privacy-assistance.service';

export class CheckLeakDto {
  @IsString()
  @MaxLength(10000)
  content!: string;
}

@Controller('privacy')
export class PrivacyAssistanceController {
  constructor(private privacyService: PrivacyAssistanceService) {}

  @Post('check-leak')
  checkLeak(@Body() dto: CheckLeakDto) {
    return this.privacyService.checkText(dto.content);
  }
}