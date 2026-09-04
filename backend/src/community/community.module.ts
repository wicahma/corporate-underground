import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityEventsService } from './community-events.service';
import { PrivacyAssistanceModule } from '../privacy-assistance/privacy-assistance.module';
import { AnonymousIdentityModule } from '../anonymous-identity/anonymous-identity.module';

@Module({
  imports: [PrivacyAssistanceModule, AnonymousIdentityModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityEventsService],
  exports: [CommunityEventsService],
})
export class CommunityModule {}