import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const SESSION_INACTIVE_TTL_MS = parseInt(process.env.SESSION_INACTIVE_TTL_MS || '86400000', 10);

@Injectable()
export class SessionTimeoutGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException();

    const key = `session:${userId}:lastActivity`;
    const last = await this.redis.get(key);
    if (last && Date.now() - parseInt(last, 10) > SESSION_INACTIVE_TTL_MS) {
      await this.redis.del(`session:${userId}`);
      await this.redis.del(key);
      throw new UnauthorizedException('Session expired due to inactivity');
    }
    await this.redis.set(key, Date.now().toString(), Math.ceil(SESSION_INACTIVE_TTL_MS / 1000));
    return true;
  }
}
