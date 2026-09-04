import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Request,
  NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { IsString, IsOptional, IsArray, IsDateString, IsBoolean, MaxLength, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
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

export class FeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsIn(['latest', 'hottest', 'popular'])
  sort?: 'latest' | 'hottest' | 'popular';

  @IsOptional()
  @IsIn(['NORMAL', 'POLL', 'CONFESSION', 'HOT_TAKE', 'AMA', 'TIME_CAPSULE'])
  type?: 'NORMAL' | 'POLL' | 'CONFESSION' | 'HOT_TAKE' | 'AMA' | 'TIME_CAPSULE';
}

@Controller('community/:companySlug')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(
    private communityService: CommunityService,
    private privacyService: PrivacyAssistanceService,
  ) {}

  // Universal read access: any user can join as unverified member with pseudonym
  private async getIdentity(req: { user: { sub: string } }, companySlug: string) {
    const company = await this.communityService.findCompany(companySlug);
    if (!company) throw new NotFoundException(`Company ${companySlug} not found`);
    
    let membership = await this.communityService.findMembership(req.user.sub, company.id);
    
    // Auto-join as unverified member if not already a member
    if (!membership) {
      membership = await this.communityService.joinAsUnverified(req.user.sub, company.id);
    }
    
    if (!membership.anonymousIdentity) {
      throw new ForbiddenException('No anonymous identity found');
    }
    
    return { company, membership, identity: membership.anonymousIdentity };
  }

  @Get('feed')
  async feed(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Query() query: FeedQueryDto,
  ) {
    const { identity } = await this.getIdentity(req, companySlug);
    return this.communityService.getFeed(companySlug, identity.id, query);
  }

  @Get('posts/:id')
  async getPost(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Param('id') postId: string,
  ) {
    const { identity, company } = await this.getIdentity(req, companySlug);
    const post = await this.communityService.getPostWithThread(company.id, postId, identity.id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Post('posts')
  async createPost(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Body() dto: CreatePostDto,
  ) {
    const { company, identity } = await this.getIdentity(req, companySlug);

    if (!dto.skipLeakCheck) {
      const leakCheck = this.privacyService.checkText(dto.content || '');
      if (leakCheck.hasLeak) {
        throw new BadRequestException({
          message: 'Potential identity leak detected',
          findings: leakCheck.findings,
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
    const { identity } = await this.getIdentity(req, companySlug);
    return this.communityService.addComment(identity.id, companySlug, postId, dto);
  }

  @Post('posts/:id/react')
  async react(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Param('id') postId: string,
    @Body() dto: ReactDto,
  ) {
    const { identity } = await this.getIdentity(req, companySlug);
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
    const { identity } = await this.getIdentity(req, companySlug);
    return this.communityService.voteOnPoll(identity.id, postId, dto.optionId);
  }

  @Post('temperature')
  async checkIn(
    @Request() req: { user: { sub: string } },
    @Param('companySlug') companySlug: string,
    @Body() dto: TemperatureDto,
  ) {
    const { identity, company } = await this.getIdentity(req, companySlug);
    return this.communityService.addTemperatureCheckIn(identity.id, company.id, dto.mood);
  }
}