import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { hashEmail } from './email-hash.util';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7d, keep in sync with JWT_EXPIRES_IN
const RESET_TOKEN_TTL_HOURS = 1;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  private sessionKey(userId: string) {
    return `session:${userId}`;
  }

  private formatUser(user: { id: string; createdAt: Date }) {
    return { id: user.id, createdAt: user.createdAt };
  }

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const emailHash = hashEmail(normalized);
    const existing = await this.prisma.user.findFirst({ where: { emailHash } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { emailHash, passwordHash },
      select: { id: true, createdAt: true },
    });
    const sessionId = this.issueToken(user.id);
    await this.redis.set(this.sessionKey(user.id), sessionId, SESSION_TTL_SECONDS);
    await this.redis.set(`session:${user.id}:lastActivity`, Date.now().toString(), SESSION_TTL_SECONDS);
    return { user: this.formatUser(user), accessToken: sessionId };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const emailHash = hashEmail(normalized);
    const user = await this.prisma.user.findFirst({ where: { emailHash } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    const sessionId = this.issueToken(user.id);
    await this.redis.set(this.sessionKey(user.id), sessionId, SESSION_TTL_SECONDS);
    await this.redis.set(`session:${user.id}:lastActivity`, Date.now().toString(), SESSION_TTL_SECONDS);
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
        id: true, photoUrl: true, createdAt: true,
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

  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const emailHash = hashEmail(normalized);
    const user = await this.prisma.user.findFirst({ where: { emailHash } });

    // If user exists, create token and send email (always return success to prevent user enumeration)
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

      // Invalidate any previous unused tokens for this user
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: tokenHash,
          expiresAt,
        },
      });

      const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'https://underground.diama.dev';
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
      await this.emailService.sendPasswordReset(normalized, resetLink);
    }

    return { success: true, message: 'Jika email terdaftar, instruksi reset kata sandi telah dikirimkan.' };
  }

  async validateResetToken(rawToken: string) {
    if (!rawToken || !rawToken.trim()) throw new BadRequestException('Token tidak valid');
    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Token reset kata sandi tidak valid atau telah kedaluwarsa');
    }

    return { valid: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Kata sandi baru minimal 8 karakter');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Token reset kata sandi tidak valid atau telah kedaluwarsa');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password, mark token as used, and invalidate active sessions in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Invalidate any active session on Redis
    await this.redis.del(this.sessionKey(resetRecord.userId));

    return { success: true, message: 'Kata sandi berhasil diatur ulang. Silakan masuk kembali.' };
  }
}