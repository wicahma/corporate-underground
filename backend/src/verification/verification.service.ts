import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnonymousIdentityService } from '../anonymous-identity/anonymous-identity.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private identityService: AnonymousIdentityService,
    private emailService: EmailService,
  ) {}

  async requestEmailOtp(userId: string, companySlug: string, workEmail: string) {
    const normalizedEmail = workEmail.trim().toLowerCase();
    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) throw new NotFoundException(`Company ${companySlug} not found`);

    const emailDomain = '@' + normalizedEmail.split('@')[1];
    const domainAllowed = company.allowedDomains.some(
      (d) => d.toLowerCase() === emailDomain,
    );
    if (!domainAllowed) {
      throw new BadRequestException(`Email domain ${emailDomain} not allowed for ${company.name}`);
    }

    const existingMembership = await this.prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId, companyId: company.id } },
    });
    if (existingMembership?.status === 'VERIFIED') {
      throw new BadRequestException('Already verified for this company');
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpCodeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.companyMembership.upsert({
      where: { userId_companyId: { userId, companyId: company.id } },
      update: { status: 'PENDING' },
      create: { userId, companyId: company.id, status: 'PENDING' },
    });

    const request = await this.prisma.verificationRequest.create({
      data: {
        userId,
        companyId: company.id,
        type: 'EMAIL_OTP',
        targetEmail: normalizedEmail,
        otpCodeHash,
        status: 'PENDING',
        expiresAt,
      },
    });

    // Send real email via SMTP / nodemailer
    await this.emailService.sendOtp(normalizedEmail, otp, company.name);

    return {
      requestId: request.id,
      message: `OTP sent to ${normalizedEmail} (expires in 15 minutes)`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async verifyOtp(userId: string, requestId: string, otp: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { company: true },
    });
    if (!request) throw new NotFoundException('Verification request not found');
    if (request.userId !== userId) throw new BadRequestException('Unauthorized');
    if (request.status !== 'PENDING') throw new BadRequestException(`Request already ${request.status.toLowerCase()}`);
    if (new Date() > request.expiresAt) throw new BadRequestException('OTP expired');
    if (!request.otpCodeHash) throw new BadRequestException('No OTP hash stored');

    const otpValid = await bcrypt.compare(otp, request.otpCodeHash);
    if (!otpValid) throw new BadRequestException('Invalid OTP');

    await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    const membership = await this.prisma.companyMembership.update({
      where: { userId_companyId: { userId, companyId: request.companyId } },
      data: { status: 'VERIFIED', verifiedAt: new Date() },
    });

    let identity = await this.prisma.anonymousIdentity.findUnique({
      where: { membershipId: membership.id },
    });

    if (!identity) {
      identity = await this.identityService.createIdentity(request.companyId, membership.id);
    }

    await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { targetEmail: null, otpCodeHash: null },
    });

    return {
      membershipId: membership.id,
      company: { slug: request.company.slug, name: request.company.name },
      anonymousIdentity: {
        pseudonym: identity.pseudonym,
        avatarSeed: identity.avatarSeed,
      },
    };
  }

  async claimSecretCode(userId: string, companySlug: string | undefined, secretCode: string) {
    const normalizedCode = secretCode.trim().toLowerCase();
    let company;
    if (companySlug) {
      company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
      if (!company) throw new NotFoundException(`Company ${companySlug} not found`);
    } else {
      const companies = await this.prisma.company.findMany();
      company = companies.find((c) =>
        (c.secretCodes || []).some((sc) => sc.trim().toLowerCase() === normalizedCode),
      );
      if (!company) throw new NotFoundException(`No company found for secret code "${secretCode}"`);
    }

    const validCode = (company.secretCodes || []).some(
      (code) => code.trim().toLowerCase() === normalizedCode,
    );
    if (!validCode) {
      throw new BadRequestException('Invalid company secret code');
    }

    const existingMembership = await this.prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId, companyId: company.id } },
      include: { anonymousIdentity: true },
    });

    if (existingMembership?.status === 'VERIFIED') {
      return {
        membershipId: existingMembership.id,
        company: { slug: company.slug, name: company.name },
        anonymousIdentity: {
          pseudonym: existingMembership.anonymousIdentity?.pseudonym,
          avatarSeed: existingMembership.anonymousIdentity?.avatarSeed,
        },
      };
    }

    const membership = await this.prisma.companyMembership.upsert({
      where: { userId_companyId: { userId, companyId: company.id } },
      update: { status: 'VERIFIED', verifiedAt: new Date() },
      create: { userId, companyId: company.id, status: 'VERIFIED', verifiedAt: new Date() },
    });

    let identity = await this.prisma.anonymousIdentity.findUnique({
      where: { membershipId: membership.id },
    });

    if (!identity) {
      identity = await this.identityService.createIdentity(company.id, membership.id);
    }

    return {
      membershipId: membership.id,
      company: { slug: company.slug, name: company.name },
      anonymousIdentity: {
        pseudonym: identity.pseudonym,
        avatarSeed: identity.avatarSeed,
      },
    };
  }
}
