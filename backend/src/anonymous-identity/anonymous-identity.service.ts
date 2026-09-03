import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnonymousIdentityService {
  private adjectives = [
    'Silent', 'Midnight', 'Quantum', 'Shadow', 'Neon', 'Cyber',
    'Curious', 'Tactical', 'Phantom', 'Cosmic', 'Electric', 'Frozen',
    'Lone', 'Hidden', 'Swift', 'Dark', 'Noble', 'Wandering',
  ];
  private animals = [
    'Fox', 'Octopus', 'Owl', 'Falcon', 'Panther', 'Badger',
    'Wolf', 'Raven', 'Coyote', 'Hawk', 'Lynx', 'Heron',
    'Jaguar', 'Mantis', 'Viper', 'Crane', 'Stag', 'Orca',
  ];

  constructor(private prisma: PrismaService) {}

  async generatePseudonym(companyId: string): Promise<string> {
    for (let attempt = 0; attempt < 50; attempt++) {
      const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
      const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
      const pseudonym = `${adj} ${animal}`;
      const exists = await this.prisma.anonymousIdentity.findUnique({
        where: { companyId_pseudonym: { companyId, pseudonym } },
      });
      if (!exists) return pseudonym;
    }
    const discriminator = Math.floor(Math.random() * 9999);
    return `${this.adjectives[0]} ${this.animals[0]} #${discriminator}`;
  }

  generateAvatarSeed(): string {
    const chars = 'abcdef0123456789';
    let seed = '';
    for (let i = 0; i < 32; i++) seed += chars[Math.floor(Math.random() * chars.length)];
    return seed;
  }

  async createIdentity(companyId: string, membershipId: string) {
    const pseudonym = await this.generatePseudonym(companyId);
    const avatarSeed = this.generateAvatarSeed();
    return this.prisma.anonymousIdentity.create({
      data: { companyId, membershipId, pseudonym, avatarSeed },
    });
  }

  async updateReputation(identityId: string, delta: number) {
    return this.prisma.anonymousIdentity.update({
      where: { id: identityId },
      data: { reputation: { increment: delta } },
    });
  }
}
