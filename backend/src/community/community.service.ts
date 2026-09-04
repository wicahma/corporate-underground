import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnonymousIdentityService } from '../anonymous-identity/anonymous-identity.service';
import { PostType } from '@prisma/client';

const VALID_REACTION_TYPES = ['LIKE', 'AGREE', 'DISAGREE', 'WHO_HURT_YOU', 'FIRE', 'HEART'];
const VALID_MOODS = ['GREAT', 'SURVIVING', 'CHAOS', 'MEETING_AGAIN'];
const VALID_SORTS = ['latest', 'hottest', 'popular'];

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private identityService: AnonymousIdentityService,
  ) {}

  findCompany(slug: string) {
    return this.prisma.company.findUnique({ where: { slug } });
  }

  getPostCounts(postId: string) {
    return this.prisma.post.findUnique({
      where: { id: postId },
      select: { commentCount: true, likeCount: true },
    });
  }

  async findMembership(userId: string, companyId: string) {
    return this.prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { anonymousIdentity: true },
    });
  }

  async joinAsUnverified(userId: string, companyId: string) {
    const membership = await this.prisma.companyMembership.upsert({
      where: { userId_companyId: { userId, companyId } },
      update: {},
      create: { userId, companyId, status: 'PENDING' },
    });

    let identity = await this.prisma.anonymousIdentity.findUnique({
      where: { membershipId: membership.id },
    });

    if (!identity) {
      identity = await this.identityService.createIdentity(companyId, membership.id);
    }

    return { ...membership, anonymousIdentity: identity };
  }

  async getFeed(
    companySlug: string,
    identityId: string | null,
    opts: { limit?: number; cursor?: string; sort?: string; type?: string },
  ) {
    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) throw new NotFoundException('Company not found');

    const limit = Math.min(opts.limit || 20, 50);
    const sort = VALID_SORTS.includes(opts.sort || 'latest') ? opts.sort || 'latest' : 'latest';

    const orderBy =
      sort === 'hottest'
        ? { commentCount: 'desc' as const }
        : sort === 'popular'
          ? { likeCount: 'desc' as const }
          : { createdAt: 'desc' as const };

    const where: Record<string, unknown> = { companyId: company.id, isDeleted: false };
    if (opts.type && Object.values(PostType).includes(opts.type as PostType)) {
      where.type = opts.type;
    }

    const cursor = opts.cursor
      ? { id: opts.cursor }
      : undefined;

    const posts = await this.prisma.post.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor } : {}),
      include: {
        author: { 
          select: { 
            id: true, 
            pseudonym: true, 
            avatarSeed: true, 
            reputation: true,
            membership: { select: { status: true } }
          } 
        },
        _count: { select: { comments: true, reactions: true } },
        pollOptions: { select: { id: true, text: true, voteCount: true } },
        reactions: { 
          where: identityId ? { authorId: identityId, type: 'LIKE' } : undefined,
          select: { type: true, authorId: true }
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const last = posts.pop()!;
      nextCursor = last.id;
    }

    // Add userLiked and verifiedEmployee status to each post
    const postsWithStatus = posts.map(post => {
      const isVerified = (post.author as { membership?: { status?: string } })?.membership?.status === 'VERIFIED';
      return {
        ...post,
        metadata: {
          ...((post.metadata as Record<string, unknown> | null) ?? {}),
          verifiedEmployee: isVerified,
        },
        userLiked: identityId ? post.reactions.some(r => r.authorId === identityId && r.type === 'LIKE') : false,
      };
    });

    return { posts: postsWithStatus, nextCursor };
  }

  async getPostWithThread(companyId: string, postId: string, identityId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, companyId, isDeleted: false },
      include: {
        author: { 
          select: { 
            id: true, 
            pseudonym: true, 
            avatarSeed: true, 
            reputation: true,
            membership: { select: { status: true } }
          } 
        },
        pollOptions: { select: { id: true, text: true, voteCount: true } },
        reactions: {
          where: { authorId: identityId, type: 'LIKE' },
          select: { type: true, authorId: true }
        },
      },
    });
    if (!post) return null;

    // Hash-map comment tree to prevent recursion stack overflow
    const allComments = await this.prisma.comment.findMany({
      where: { postId: post.id, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, pseudonym: true, avatarSeed: true, reputation: true } },
      },
    });

    const map = new Map<string, { id: string; parentId: string | null; replies: unknown[]; [k: string]: unknown }>();
    const roots: unknown[] = [];

    for (const c of allComments) {
      map.set(c.id, { ...c, replies: [] });
    }
    for (const c of allComments) {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        (map.get(c.parentId)!.replies as unknown[]).push(node);
      } else {
        roots.push(node);
      }
    }

    const userLiked = post.reactions.some(r => r.authorId === identityId && r.type === 'LIKE');
    const isVerified = (post.author as { membership?: { status?: string } })?.membership?.status === 'VERIFIED';

    return {
      ...post,
      metadata: {
        ...((post.metadata as Record<string, unknown> | null) ?? {}),
        verifiedEmployee: isVerified,
      },
      comments: roots,
      userLiked,
    };
  }

  async createPost(
    authorId: string,
    companyId: string,
    dto: {
      content: string;
      title?: string;
      type?: string;
      pollOptions?: string[];
      topics?: string[];
      unlockAt?: string;
    },
  ) {
    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Post content is required');
    }
    if (dto.content.length > 10000) {
      throw new BadRequestException('Post content too long (max 10000 chars)');
    }

    const type = (dto.type as PostType) || 'NORMAL';
    const isPoll = type === 'POLL';
    if (isPoll) {
      const options = dto.pollOptions || [];
      if (options.length < 2) {
        throw new BadRequestException('Poll requires at least 2 options');
      }
      if (options.length > 10) {
        throw new BadRequestException('Poll supports at most 10 options');
      }
    }

    const identity = await this.prisma.anonymousIdentity.findUnique({
      where: { id: authorId },
      include: { membership: { select: { status: true } } },
    });
    const isVerified = identity?.membership?.status === 'VERIFIED';

    const post = await this.prisma.post.create({
      data: {
        companyId,
        authorId,
        type,
        title: dto.title,
        content: dto.content,
        unlocksAt: dto.unlockAt ? new Date(dto.unlockAt) : undefined,
        metadata: { verifiedEmployee: isVerified },
        pollOptions: isPoll
          ? { create: dto.pollOptions!.map((text) => ({ text })) }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            pseudonym: true,
            avatarSeed: true,
            reputation: true,
            membership: { select: { status: true } },
          },
        },
        pollOptions: true,
      },
    });

    if (dto.topics && dto.topics.length > 0) {
      for (const topicName of dto.topics) {
        const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (!slug) continue;
        const topic = await this.prisma.topic.upsert({
          where: { companyId_slug: { companyId, slug } },
          update: { postCount: { increment: 1 } },
          create: { companyId, name: topicName, slug, postCount: 1 },
        });
        const existingMeta = (post.metadata as Record<string, unknown> | null) ?? {};
        await this.prisma.post.update({
          where: { id: post.id },
          data: { metadata: { ...existingMeta, topics: [...((existingMeta.topics as string[]) ?? []), topic.id] } },
        });
      }
    }

    await this.prisma.anonymousIdentity.update({
      where: { id: authorId },
      data: { reputation: { increment: 1 } },
    });

    return post;
  }

  async addComment(
    authorId: string,
    companySlug: string,
    postId: string,
    dto: { content: string; parentId?: string },
  ) {
    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Comment content is required');
    }
    if (dto.content.length > 4000) {
      throw new BadRequestException('Comment too long (max 4000 chars)');
    }

    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) throw new NotFoundException('Company not found');

    const post = await this.prisma.post.findFirst({
      where: { id: postId, companyId: company.id, isDeleted: false },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const identity = await this.prisma.anonymousIdentity.findUnique({
      where: { id: authorId },
      include: { membership: { select: { status: true } } },
    });
    const isVerified = identity?.membership?.status === 'VERIFIED';

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        parentId: dto.parentId,
        content: dto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            pseudonym: true,
            avatarSeed: true,
            reputation: true,
            membership: { select: { status: true } },
          },
        },
      },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    await this.prisma.anonymousIdentity.update({
      where: { id: authorId },
      data: { reputation: { increment: 1 } },
    });

    return { ...comment, replies: [], metadata: { verifiedEmployee: isVerified } };
  }

  async addReaction(authorId: string, postId: string, type: string, commentId?: string) {
    if (!VALID_REACTION_TYPES.includes(type)) {
      throw new BadRequestException(`Invalid reaction type. Allowed: ${VALID_REACTION_TYPES.join(', ')}`);
    }
    if (!commentId && !postId) throw new BadRequestException('Target post or comment required');

    if (commentId) {
      const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
      if (!comment) throw new NotFoundException('Comment not found');
    } else {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.reaction.findFirst({
      where: {
        authorId,
        postId: commentId ? null : postId,
        commentId: commentId ?? null,
        type,
      },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      if (type === 'LIKE' && !commentId) {
        await this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });
      }
      return { removed: true, type };
    }

    await this.prisma.reaction.create({
      data: {
        authorId,
        postId: commentId ? null : postId,
        commentId: commentId ?? null,
        type,
      },
    });

    if (type === 'LIKE' && !commentId) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
    }

    return { removed: false, type };
  }

  async voteOnPoll(voterId: string, postId: string, optionId: string) {
    const option = await this.prisma.pollOption.findUnique({
      where: { id: optionId },
      include: { post: true },
    });
    if (!option || option.postId !== postId) {
      throw new NotFoundException('Poll option not found for this post');
    }
    if (option.post.type !== 'POLL') {
      throw new BadRequestException('Post is not a poll');
    }

    const existing = await this.prisma.pollVote.findUnique({
      where: { optionId_voterId: { optionId, voterId } },
    });
    if (existing) throw new BadRequestException('Already voted for this option');

    const pollOptions = await this.prisma.pollOption.findMany({
      where: { postId },
      select: { id: true },
    });
    const alreadyVoted = await this.prisma.pollVote.findFirst({
      where: { voterId, optionId: { in: pollOptions.map((o) => o.id) } },
    });
    if (alreadyVoted) throw new BadRequestException('Already voted on this poll');

    await this.prisma.pollVote.create({ data: { optionId, voterId } });
    await this.prisma.pollOption.update({
      where: { id: optionId },
      data: { voteCount: { increment: 1 } },
    });

    return this.prisma.pollOption.findMany({
      where: { postId },
      select: { id: true, text: true, voteCount: true },
      orderBy: { voteCount: 'desc' },
    });
  }

  async addTemperatureCheckIn(identityId: string, companyId: string, mood: string) {
    const moodUpper = mood.toUpperCase();
    if (!VALID_MOODS.includes(moodUpper)) {
      throw new BadRequestException(`Invalid mood. Allowed: ${VALID_MOODS.join(', ')}`);
    }
    const today = new Date().toISOString().slice(0, 10);
    const existing = await this.prisma.officeTemperatureCheckIn.findUnique({
      where: {
        identityId_companyId_date: { identityId, companyId, date: new Date(today + 'T00:00:00.000Z') },
      },
    });
    if (existing) {
      const updated = await this.prisma.officeTemperatureCheckIn.update({
        where: { id: existing.id },
        data: { mood: moodUpper },
      });
      return { checkIn: moodUpper, anonymous: true, updated: true, id: updated.id };
    }
    const created = await this.prisma.officeTemperatureCheckIn.create({
      data: { companyId, identityId, mood: moodUpper },
    });
    await this.prisma.anonymousIdentity.update({
      where: { id: identityId },
      data: { reputation: { increment: 1 } },
    });
    return { checkIn: moodUpper, anonymous: true, updated: false, id: created.id };
  }
}
