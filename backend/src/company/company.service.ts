import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnonymousIdentityService } from '../anonymous-identity/anonymous-identity.service';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private identityService: AnonymousIdentityService,
  ) {}

  async list() {
    return this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        allowedDomains: true,
        _count: { 
          select: { 
            memberships: { where: { status: 'VERIFIED' } },
            posts: true 
          } 
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.company.findUnique({
      where: { slug },
      include: {
        _count: { 
          select: { 
            memberships: { where: { status: 'VERIFIED' } },
            posts: true 
          } 
        },
        topics: { select: { id: true, name: true, slug: true, postCount: true } },
      },
    });
  }

  async create(data: { name: string; slug: string; allowedDomains: string[]; logoUrl?: string }) {
    const existing = await this.prisma.company.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException(`Company with slug ${data.slug} already exists`);
    return this.prisma.company.create({ data });
  }

  async joinAsUnverified(userId: string, slug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company) throw new NotFoundException(`Company ${slug} not found`);

    const membership = await this.prisma.companyMembership.upsert({
      where: { userId_companyId: { userId, companyId: company.id } },
      update: {},
      create: { userId, companyId: company.id, status: 'PENDING' },
    });

    let identity = await this.prisma.anonymousIdentity.findUnique({
      where: { membershipId: membership.id },
    });

    if (!identity) {
      identity = await this.identityService.createIdentity(company.id, membership.id);
    }

    return {
      membershipId: membership.id,
      status: membership.status,
      company: { slug: company.slug, name: company.name },
      anonymousIdentity: { pseudonym: identity.pseudonym, avatarSeed: identity.avatarSeed },
    };
  }

  async getPulse(slug: string) {
    const company = await this.findBySlug(slug);
    if (!company) throw new NotFoundException(`Company ${slug} not found`);

    const verifiedCount = await this.prisma.companyMembership.count({
      where: { companyId: company.id, status: 'VERIFIED' },
    });

    if (verifiedCount < 5) {
      return {
        thresholdMet: false,
        message: 'Underground pulse requires minimum 5 verified employees to preserve anonymity.',
        activeMembers: verifiedCount,
      };
    }

    const checkIns = await this.prisma.officeTemperatureCheckIn.findMany({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
      take: 100,
    });

    const moodCounts = checkIns.reduce<Record<string, number>>((acc, item) => {
      acc[item.mood] = (acc[item.mood] || 0) + 1;
      return acc;
    }, {});

    return {
      thresholdMet: true,
      activeMembers: verifiedCount,
      totalCheckIns: checkIns.length,
      moodDistribution: moodCounts,
    };
  }
}
