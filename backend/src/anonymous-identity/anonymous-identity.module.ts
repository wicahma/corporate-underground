import { Module } from '@nestjs/common';
import { AnonymousIdentityService } from './anonymous-identity.service';

@Module({
  providers: [AnonymousIdentityService],
  exports: [AnonymousIdentityService],
})
export class AnonymousIdentityModule {}
