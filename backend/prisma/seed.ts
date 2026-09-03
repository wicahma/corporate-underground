import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Seed companies
  const companies = [
    {
      name: 'Acme Corp',
      slug: 'acme-corp',
      allowedDomains: ['@acme.com'],
    },
    {
      name: 'TechNova',
      slug: 'technova',
      allowedDomains: ['@technova.io'],
    },
  ];

  for (const company of companies) {
    const existing = await prisma.company.findUnique({ where: { slug: company.slug } });
    if (existing) {
      console.log(`Company ${company.slug} already exists, skipping`);
      continue;
    }
    await prisma.company.create({ data: company });
    console.log(`Created company: ${company.name} (${company.slug})`);
  }

  // Seed demo verified users with identities for both companies
  const demoUsers = [
    { email: 'alice@acme.com', password: 'demo1234' },
    { email: 'bob@acme.com', password: 'demo1234' },
    { email: 'carol@technova.io', password: 'demo1234' },
  ];

  for (const demo of demoUsers) {
    const passwordHash = await bcrypt.hash(demo.password, 10);
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { email: demo.email, passwordHash },
    });

    const company = await prisma.company.findUnique({
      where: { slug: demo.email.includes('acme') ? 'acme-corp' : 'technova' },
    });
    if (!company) throw new Error(`Missing company for ${demo.email}`);

    const membership = await prisma.companyMembership.upsert({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
      update: {},
      create: {
        userId: user.id,
        companyId: company.id,
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    // Create anonymous identity if missing
    const identityCount = await prisma.anonymousIdentity.count({
      where: { membershipId: membership.id },
    });
    if (identityCount === 0) {
      const pseudonyms = ['Silent Fox', 'Midnight Owl', 'Neon Badger'];
      const adj = ['Silent', 'Midnight', 'Neon'];
      const animals = ['Fox', 'Owl', 'Badger'];
      const idx = demoUsers.indexOf(demo);
      let pseudo = pseudonyms[idx] ?? 'Lone Wolf';
      // Ensure uniqueness within company
      while (
        await prisma.anonymousIdentity.findUnique({
          where: { companyId_pseudonym: { companyId: company.id, pseudonym: pseudo } },
        })
      ) {
        pseudo = `${adj[idx % adj.length]} ${animals[(idx + Math.floor(Math.random() * 3)) % animals.length]} #${Math.floor(Math.random() * 4000)}`;
      }
      let seed = '';
      for (let i = 0; i < 32; i++) seed += '0123456789abcdef'[Math.floor(Math.random() * 16)];
      await prisma.anonymousIdentity.create({
        data: { companyId: company.id, membershipId: membership.id, pseudonym: pseudo, avatarSeed: seed },
      });
      console.log(`Created identity ${pseudo} for ${demo.email}`);
    }
  }

  // Seed a sample post in acme-corp from an existing identity
  const acme = await prisma.company.findUnique({ where: { slug: 'acme-corp' } });
  if (acme) {
    const identity = await prisma.anonymousIdentity.findFirst({
      where: { companyId: acme.id },
    });
    if (identity) {
      const postCount = await prisma.post.count({
        where: { companyId: acme.id, authorId: identity.id },
      });
      if (postCount === 0) {
        await prisma.post.create({
          data: {
            companyId: acme.id,
            authorId: identity.id,
            type: 'NORMAL',
            title: 'First day underground',
            content: 'Welcome to the underground. This is a private space for verified Acme employees only.',
          },
        });
        console.log('Seeded sample post in acme-corp');
      }
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());