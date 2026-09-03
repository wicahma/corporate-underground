import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('profile')
  getSelf(@Request() req: { user: { sub: string } }) {
    return this.profileService.getSelfProfile(req.user.sub);
  }

  @Get('users/:identityId/profile')
  getPublic(@Param('identityId') identityId: string) {
    return this.profileService.getPublicProfile(identityId);
  }
}