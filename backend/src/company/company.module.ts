import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { AnonymousIdentityModule } from '../anonymous-identity/anonymous-identity.module';

@Module({
  imports: [AnonymousIdentityModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
