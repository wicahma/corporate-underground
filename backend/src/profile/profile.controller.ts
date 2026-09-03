import {
  Controller, Get, Param, Request, Post, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionTimeoutGuard } from '../auth/session-timeout.guard';

@Controller()
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Get('profile')
  getSelf(@Request() req: { user: { sub: string } }) {
    return this.profileService.getSelfProfile(req.user.sub);
  }

  @Get('users/:identifier/profile')
  getPublic(@Param('identifier') identifier: string) {
    return this.profileService.getPublicProfile(identifier);
  }

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Post('profile/photo')
  @UseInterceptors(FileInterceptor('photo', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new BadRequestException('Invalid file type'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  uploadPhoto(
    @Request() req: { user: { sub: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadProfilePhoto(req.user.sub, file);
  }
}