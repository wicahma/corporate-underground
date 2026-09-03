import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        allowedDomains: true,
        _count: { select: { memberships: true, posts: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.company.findUnique({
      where: { slug },
      include: {
        _count: { select: { memberships: true, posts: true } },
        topics: { select: { id: true, name: true, slug: true, postCount: true } },
      },
    });
  }

  async create(data: { name: string; slug: string; allowedDomains: string[]; logoUrl?: string }) {
    const existing = await this.prisma.company.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException(`Company with slug ${data.slug} already exists`);
    return this.prisma.company.create({ data });
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
