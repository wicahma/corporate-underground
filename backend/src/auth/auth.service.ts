import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7d, keep in sync with JWT_EXPIRES_IN

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  private sessionKey(userId: string) {
    return `session:${userId}`;
  }

  private formatUser(user: { id: string; email: string; createdAt: Date }) {
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email: normalized, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
    const sessionId = this.issueToken(user.id);
    await this.redis.set(this.sessionKey(user.id), sessionId, SESSION_TTL_SECONDS);
    return { user: this.formatUser(user), accessToken: sessionId };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    // Single-session enforcement: new login overwrites the Redis session key,
    // invalidating any previously issued token.
    const sessionId = this.issueToken(user.id);
    await this.redis.set(this.sessionKey(user.id), sessionId, SESSION_TTL_SECONDS);
    return { user: this.formatUser(user), accessToken: sessionId };
  }

  async logout(userId: string) {
    await this.redis.del(this.sessionKey(userId));
    return { success: true };
  }

  async validateSession(userId: string, token: string): Promise<boolean> {
    const active = await this.redis.get(this.sessionKey(userId));
    if (!active) return false;
    return active === token;
  }

  private issueToken(userId: string) {
    return this.jwtService.sign({ sub: userId, nonce: crypto.randomUUID() });
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
            anonymousIdentity: { select: { id: true, pseudonym: true, avatarSeed: true, reputation: true } },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}