import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email: normalized, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
    return { user, accessToken: this.issueToken(user.id) };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');
    return {
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      accessToken: this.issueToken(user.id),
    };
  }

  private issueToken(userId: string) {
    return this.jwtService.sign({ sub: userId });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, createdAt: true,
        memberships: {
          select: {
            id: true,
            status: true,
            company: { select: { slug: true, name: true } },
            anonymousIdentity: { select: { pseudonym: true, reputation: true } },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}