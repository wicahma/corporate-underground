import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export interface ReputationTier {
  name: string;
  min: number;
}

const TIERS = [
  { name: 'Novice Lurker', min: 0 },
  { name: 'Underground Voice', min: 51 },
  { name: 'Company Whisperer', min: 201 },
  { name: 'Street Legend', min: 601 },
  { name: 'The Shadow Syndicate', min: 1501 },
];

// Score = (Likes * 3) + (Comments * 5) + (PollVotes * 2) + (VerifiedPosts * 10)
export const REPUTATION_WEIGHTS = {
  LIKE: 3,
  COMMENT: 5,
  POLL_VOTE: 2,
  VERIFIED_POST: 10,
};

export function tierForScore(score: number): ReputationTier {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (score >= t.min) tier = t;
  }
  return tier;
}

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async computeIdentityStats(identityId: string) {
    const [likes, postComments, pollVotes, posts] = await Promise.all([
      this.prisma.reaction.count({
        where: { commentId: null, post: { authorId: identityId }, type: 'LIKE' },
      }),
      this.prisma.comment.count({ where: { authorId: identityId, isDeleted: false } }),
      this.prisma.pollVote.count({ where: { voterId: identityId } }),
      this.prisma.post.count({ where: { authorId: identityId, isDeleted: false } }),
    ]);

    const score =
      likes * REPUTATION_WEIGHTS.LIKE +
      postComments * REPUTATION_WEIGHTS.COMMENT +
      pollVotes * REPUTATION_WEIGHTS.POLL_VOTE +
      posts * REPUTATION_WEIGHTS.VERIFIED_POST;

    return {
      likes,
      comments: postComments,
      pollVotes,
      posts,
      score,
      tier: tierForScore(score),
    };
  }

  async getSelfProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            company: { select: { id: true, slug: true, name: true, logoUrl: true } },
            anonymousIdentity: {
              include: {
                _count: { select: { posts: true, comments: true, reactions: true, pollVotes: true } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, photoUrl: user.photoUrl, createdAt: user.createdAt, memberships: user.memberships };
  }

  async getPublicProfile(identifier: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const identity = await this.prisma.anonymousIdentity.findFirst({
      where: isUUID ? { id: identifier } : { pseudonym: identifier },
      include: {
        company: { select: { id: true, slug: true, name: true } },
        posts: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            _count: { select: { comments: true, reactions: true } },
          },
        },
      },
    });
    if (!identity || identity.isBanned) throw new NotFoundException('Identity not found');

    const stats = await this.computeIdentityStats(identity.id);
    return {
      pseudonym: identity.pseudonym,
      avatarSeed: identity.avatarSeed,
      isMuted: identity.isMuted,
      company: identity.company,
      createdAt: identity.createdAt,
      stats,
      posts: identity.posts,
    };
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('File too large (max 5MB)');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Invalid file type');

    const key = `profiles/${userId}.webp`;
    const { url } = await this.storage.uploadImage(file.buffer, key, file.mimetype);

    await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: url },
    });

    return { photoUrl: url };
  }
}