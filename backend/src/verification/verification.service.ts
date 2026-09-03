import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnonymousIdentityService } from '../anonymous-identity/anonymous-identity.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private identityService: AnonymousIdentityService,
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

    // Check if user already has a verified membership for this company
    const existingMembership = await this.prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId, companyId: company.id } },
    });
    if (existingMembership?.status === 'VERIFIED') {
      throw new BadRequestException('Already verified for this company');
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpCodeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create or update membership as PENDING
    const membership = await this.prisma.companyMembership.upsert({
      where: { userId_companyId: { userId, companyId: company.id } },
      update: { status: 'PENDING' },
      create: { userId, companyId: company.id, status: 'PENDING' },
    });

    // Store verification request
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

    // ponytail: OTP delivery — in production, send via email service.
    // For dev, return OTP in response.
    return {
      requestId: request.id,
      message: `OTP sent to ${normalizedEmail} (expires in 15 minutes)`,
      // DEV ONLY — remove in production
      devOtp: otp,
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

    // Mark request as approved
    await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    // Activate membership
    const membership = await this.prisma.companyMembership.update({
      where: { userId_companyId: { userId, companyId: request.companyId } },
      data: { status: 'VERIFIED', verifiedAt: new Date() },
    });

    // Create anonymous identity
    const identity = await this.identityService.createIdentity(request.companyId, membership.id);

    // Purge sensitive email from verification request
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
}
