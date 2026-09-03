import {
  Controller, Get, Post, Body, Param, UseGuards, Request,
  NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { IsString, IsOptional, IsArray, IsDateString, IsBoolean, MaxLength, IsIn } from 'class-validator';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrivacyAssistanceService } from '../privacy-assistance/privacy-assistance.service';

export class CreatePostDto {
  @IsString()
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(['NORMAL', 'POLL', 'CONFESSION', 'HOT_TAKE', 'AMA', 'TIME_CAPSULE'])
  type?: 'NORMAL' | 'POLL' | 'CONFESSION' | 'HOT_TAKE' | 'AMA' | 'TIME_CAPSULE';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pollOptions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @IsOptional()
  @IsDateString()
  unlockAt?: string;

  @IsOptional()
  @IsBoolean()
  skipLeakCheck?: boolean;
}

export class AddCommentDto {
  @IsString()
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ReactDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  commentId?: string;
}

export class VoteDto {
  @IsString()
  optionId!: string;
}

export class TemperatureDto {
  @IsString()
  mood!: string;
}

@Controller('community/:companySlug')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(
    private communityService: CommunityService,
    private privacyService: PrivacyAssistanceService,
  ) {}

  private async getVerifiedIdentity(req: { user: { sub: string } }, companySlug: string) {
    const company = await this.communityService.findCompany(companySlug);
    if (!company) throw new NotFoundException(`Company ${companySlug} not found`);
    const membership = await this.communityService.findVerifiedMembership(req.user.sub, company.id);
    if (!membership || membership.status !== 'VERIFIED' || !membership.anonymousIdentity) {
      throw new ForbiddenException('You are not a verified member of this company');
    }
    return { company, identity: membership.anonymousIdentity };
  }

  @Get('feed')
  async feed(@Request() req: { user: { sub: string } }, @Param('companySlug') companySlug: string) {
    await this.getVerifiedIdentity(req, companySlug);
    return this.communityService.getFeed(companySlug);
  }

  @Get('posts/:id')
  async getPost(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Param('id') postId: string,
  ) {
    const { company } = await this.getVerifiedIdentity(req, companySlug);
    const post = await this.communityService.getPostWithThread(company.id, postId);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Post('posts')
  async createPost(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Body() dto: CreatePostDto,
  ) {
    const { company, identity } = await this.getVerifiedIdentity(req, companySlug);

    if (!dto.skipLeakCheck) {
      const leakCheck = this.privacyService.checkText(dto.content || '');
      if (leakCheck.hasLeak) {
        throw new BadRequestException({
          message: 'Identity leak risk detected. Publish blocked.',
          leakCheck,
        });
      }
    }

    return this.communityService.createPost(identity.id, company.id, dto);
  }

  @Post('posts/:id/comments')
  async addComment(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Param('id') postId: string,
    @Body() dto: AddCommentDto,
  ) {
    const { identity } = await this.getVerifiedIdentity(req, companySlug);
    return this.communityService.addComment(identity.id, companySlug, postId, dto);
  }

  @Post('posts/:id/react')
  async react(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Param('id') postId: string,
    @Body() dto: ReactDto,
  ) {
    const { identity } = await this.getVerifiedIdentity(req, companySlug);
    if (!dto.type) throw new BadRequestException('Reaction type required');
    return this.communityService.addReaction(identity.id, postId, dto.type, dto.commentId);
  }

  @Post('posts/:id/vote')
  async vote(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Param('id') postId: string,
    @Body() dto: VoteDto,
  ) {
    const { identity } = await this.getVerifiedIdentity(req, companySlug);
    return this.communityService.voteOnPoll(identity.id, postId, dto.optionId);
  }

  @Post('temperature')
  async checkIn(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Body() dto: TemperatureDto,
  ) {
    const { identity, company } = await this.getVerifiedIdentity(req, companySlug);
    return this.communityService.addTemperatureCheckIn(identity.id, company.id, dto.mood);
  }
}