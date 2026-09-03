import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST') || 'localhost',
      port: config.get<number>('REDIS_PORT') || 6379,
      password: config.get<string>('REDIS_PASSWORD') || undefined,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
