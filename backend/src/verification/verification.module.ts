import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { AnonymousIdentityModule } from '../anonymous-identity/anonymous-identity.module';
import { CommunityModule } from '../community/community.module';

@Module({
  imports: [AnonymousIdentityModule, CommunityModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
