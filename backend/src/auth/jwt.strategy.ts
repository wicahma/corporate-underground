import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

const cookieExtractor = (req: Request): string | null => {
  if (req?.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private authService: AuthService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'corporate-underground-dev-jwt-secret-change-in-prod',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const token = cookieExtractor(req);
    const valid = await this.authService.validateSession(payload.sub, token!);
    if (!valid) return null;
    return { sub: payload.sub };
  }
}