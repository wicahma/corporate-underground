import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { VerificationModule } from './verification/verification.module';
import { AnonymousIdentityModule } from './anonymous-identity/anonymous-identity.module';
import { CommunityModule } from './community/community.module';
import { PrivacyAssistanceModule } from './privacy-assistance/privacy-assistance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompanyModule,
    VerificationModule,
    AnonymousIdentityModule,
    CommunityModule,
    PrivacyAssistanceModule,
  ],
})
export class AppModule {}
