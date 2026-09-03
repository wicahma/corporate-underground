import { Module } from '@nestjs/common';
import { PrivacyAssistanceService } from './privacy-assistance.service';
import { PrivacyAssistanceController } from './privacy-assistance.controller';

@Module({
  controllers: [PrivacyAssistanceController],
  providers: [PrivacyAssistanceService],
  exports: [PrivacyAssistanceService],
})
export class PrivacyAssistanceModule {}
