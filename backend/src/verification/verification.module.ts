import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { AnonymousIdentityModule } from '../anonymous-identity/anonymous-identity.module';

@Module({
  imports: [AnonymousIdentityModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
