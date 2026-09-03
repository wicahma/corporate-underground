import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrivacyAssistanceModule } from '../privacy-assistance/privacy-assistance.module';

@Module({
  imports: [PrivacyAssistanceModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}