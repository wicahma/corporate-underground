# Corporate Underground - System Architecture & Specification

## 1. Product Requirement Breakdown & Core Principles

Corporate Underground is a private, anonymous social network for verified company employees: **"Your workplace. Without your name attached."**

### Core Principles
1. **Verified Membership** — Only verified employees enter a company community.
2. **Strong Anonymity** — Real identity is completely decoupled from anonymous identity in social contexts.
3. **Private Company Community** — Strict company-scoped isolation (no data leakage across boundaries).
4. **Safe Moderation** — Enforcement without deanonymization.

---

## 2. Feature Priority (MVP Roadmap)

### Phase 1: Core Foundation (MVP)
* Auth & Registration (Email + Password / Magic link)
* Real Identity Storage (Private, encrypted)
* Company Management & Verification (Corporate Email domain validation + OTP code)
* Anonymous Identity Generation (Unique persistent pseudonym per company)
* Company Access Control & RBAC
* NestJS Backend + Prisma + PostgreSQL 17 + Redis Session Cache

### Phase 2: Social Feed & Community
* Threaded Feed (Posts, Comments, Nested Replies)
* Engagement (Likes, Reactions, Topic tags, Hashtags)
* Content Moderation & Reporting (Platform-level review queue, anonymous reports)

### Phase 3: Privacy & Pulse Assistance
* Identity Leak Detector (Rule-based heuristics + Privacy Risk warning)
* Anonymous Polls (Multi-choice, aggregated voting)
* Underground Pulse & Office Temperature (Aggregated sentiment & metrics, min threshold = 5 active users)
* Anonymous Reputation System (Company-scoped score, zero cross-company link)

### Phase 4: Advanced Features
* Confession Mode & Hot Take Mode (Special reactions)
* Anonymous AMA (Question/Reply upvoting)
* Corporate Buzzword Radar (Aggregated terminology trend analysis)
* Underground Time Capsule (Time-locked encrypted posts)

---

## 3. User Flow

```
[User Register] 
      ↓
[Authenticate (JWT / Redis Session)]
      ↓
[Select Company / Submit Verification (e.g. corporate email: user@corp.com)]
      ↓
[Verify OTP / Proof] 
      ↓
[System Assigns/Derives Anonymous Identity (e.g., "Silent Fox", Avatar #14)]
      ↓
[Enter Private Company Underground Feed]
      ↓
[Create Posts / Polls / Comments / React under Pseudonym]
      ↓
[Pre-publish Identity Leak Check] -> [Publish to Community Feed]
```

---

## 4. System Architecture (NestJS Modular Monolith)

Deploying on **ThinkCentre M710q (8GB RAM)**:
- **Backend**: NestJS (TypeScript) with Fastify/Express adapter, structured as clean internal modules.
- **Frontend**: Next.js (App Router, Tailwind CSS, Lucide icons, Swiss/Neubrutalism design).
- **Database**: PostgreSQL 17 (Port 5432) with Prisma ORM.
- **Cache / Sessions**: Redis (Port 6379).
- **Process Management**: systemd user units (`corporate-underground-backend.service`, `corporate-underground-frontend.service`).
- **Networking / Gateway**: Cloudflare Tunnel (`underground.diama.dev` -> Next.js / NestJS reverse proxy).

### NestJS Module Breakdown
1. `AuthModule` — User auth, JWT token issuance, session refresh, bcrypt password hashing.
2. `IdentityModule` — Private user profiles, real identity verification status.
3. `CompanyModule` — Company directory, domains, verification rules, stats.
4. `VerificationModule` — Email OTP validation, Secret code validation, Proof document handling.
5. `AnonymousIdentityModule` — Pseudonym generator, company-user identity derivation, anonymous reputation.
6. `CommunityModule` — Posts, Comments, Polls, Reactions, Topics, Feed retrieval.
7. `PrivacyAssistanceModule` — Identity Leak Detector rules, buzzword aggregator, temperature check-ins.
8. `ModerationModule` — Content flags, pseudonym bans/mutes, appeal handling.

---

## 5. Database Design (Prisma Schema Reference)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. REAL IDENTITY LAYER (Strictly Isolated)
model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  memberships   CompanyMembership[]
  verifications VerificationRequest[]
  
  @@map("users")
}

// 2. COMPANY LAYER
model Company {
  id             String    @id @default(uuid()) @db.Uuid
  name           String
  slug           String    @unique
  allowedDomains String[]  // e.g. ["@company.com", "@subsidiary.com"]
  logoUrl        String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  memberships    CompanyMembership[]
  identities     AnonymousIdentity[]
  posts          Post[]
  topics         Topic[]
  checkIns       OfficeTemperatureCheckIn[]
  verifications  VerificationRequest[]

  @@map("companies")
}

// 3. MEMBERSHIP BRIDGE (Connects User & Company, stores Verification status)
model CompanyMembership {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @db.Uuid
  companyId     String    @db.Uuid
  status        MembershipStatus @default(PENDING) // PENDING, VERIFIED, REVOKED, EXPIRED
  verifiedAt    DateTime?
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Link to Anonymous Identity
  anonymousIdentity AnonymousIdentity?

  @@unique([userId, companyId])
  @@map("company_memberships")
}

enum MembershipStatus {
  PENDING
  VERIFIED
  REVOKED
  EXPIRED
}

// 4. ANONYMOUS IDENTITY LAYER (Public Social Face)
model AnonymousIdentity {
  id            String    @id @default(uuid()) @db.Uuid
  companyId     String    @db.Uuid
  membershipId  String    @unique @db.Uuid
  pseudonym     String    // e.g., "Silent Fox", "Midnight Owl"
  avatarSeed    String    // Determistic or random seed for avatar SVG
  reputation    Int       @default(0)
  isMuted       Boolean   @default(false)
  isBanned      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  membership    CompanyMembership @relation(fields: [membershipId], references: [id], onDelete: Cascade)

  posts         Post[]
  comments      Comment[]
  reactions     Reaction[]
  pollVotes     PollVote[]
  reportsFiled  Report[]  @relation("Reporter")
  
  @@unique([companyId, pseudonym])
  @@map("anonymous_identities")
}

// 5. SOCIAL COMMUNITY LAYER
enum PostType {
  NORMAL
  POLL
  CONFESSION
  HOT_TAKE
  AMA
  TIME_CAPSULE
}

model Post {
  id            String    @id @default(uuid()) @db.Uuid
  companyId     String    @db.Uuid
  authorId      String    @db.Uuid // Points to AnonymousIdentity.id
  type          PostType  @default(NORMAL)
  title         String?
  content       String
  metadata      Json?     // For polls, time capsules, hot takes
  unlocksAt     DateTime? // For Time Capsules
  isLocked      Boolean   @default(false)
  isDeleted     Boolean   @default(false)
  likeCount     Int       @default(0)
  commentCount  Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  author        AnonymousIdentity @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments      Comment[]
  reactions     Reaction[]
  pollOptions   PollOption[]
  reports       Report[]

  @@map("posts")
}

model Comment {
  id            String    @id @default(uuid()) @db.Uuid
  postId        String    @db.Uuid
  authorId      String    @db.Uuid // Points to AnonymousIdentity.id
  parentId      String?   @db.Uuid // For nested replies
  content       String
  isDeleted     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  post          Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author        AnonymousIdentity @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent        Comment?  @relation("NestedReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies       Comment[] @relation("NestedReplies")
  reactions     Reaction[]
  reports       Report[]

  @@map("comments")
}

model Reaction {
  id            String    @id @default(uuid()) @db.Uuid
  authorId      String    @db.Uuid
  postId        String?   @db.Uuid
  commentId     String?   @db.Uuid
  type          String    // LIKE, AGREE, DISAGREE, WHO_HURT_YOU, FIRE, HEART
  createdAt     DateTime  @default(now())

  author        AnonymousIdentity @relation(fields: [authorId], references: [id], onDelete: Cascade)
  post          Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment       Comment?  @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([authorId, postId, commentId, type])
  @@map("reactions")
}

model PollOption {
  id            String    @id @default(uuid()) @db.Uuid
  postId        String    @db.Uuid
  text          String
  voteCount     Int       @default(0)

  post          Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  votes         PollVote[]

  @@map("poll_options")
}

model PollVote {
  id            String    @id @default(uuid()) @db.Uuid
  optionId      String    @db.Uuid
  voterId       String    @db.Uuid // AnonymousIdentity.id
  createdAt     DateTime  @default(now())

  option        PollOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  voter         AnonymousIdentity @relation(fields: [voterId], references: [id], onDelete: Cascade)

  @@unique([optionId, voterId])
  @@map("poll_votes")
}

model Topic {
  id            String    @id @default(uuid()) @db.Uuid
  companyId     String    @db.Uuid
  name          String
  slug          String
  postCount     Int       @default(0)

  company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, slug])
  @@map("topics")
}

model OfficeTemperatureCheckIn {
  id            String    @id @default(uuid()) @db.Uuid
  companyId     String    @db.Uuid
  mood          String    // GREAT, SURVIVING, CHAOS, MEETING_AGAIN
  date          DateTime  @default(now()) @db.Date

  company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@map("office_temperature_checkins")
}

model VerificationRequest {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @db.Uuid
  companyId     String    @db.Uuid
  type          String    // EMAIL_OTP, SECRET_CODE, PROOF_DOC
  targetEmail   String?
  otpCodeHash   String?
  status        String    // PENDING, APPROVED, REJECTED, EXPIRED
  expiresAt     DateTime
  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@map("verification_requests")
}

model Report {
  id            String    @id @default(uuid()) @db.Uuid
  reporterId    String    @db.Uuid
  postId        String?   @db.Uuid
  commentId     String?   @db.Uuid
  reason        String
  status        String    @default("PENDING") // PENDING, RESOLVED, DISMISSED
  createdAt     DateTime  @default(now())

  reporter      AnonymousIdentity @relation("Reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  post          Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment       Comment?  @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@map("reports")
}
```

---

## 6. Anonymous Identity Model & Pseudonym Generation

1. **Deterministic Pseudonym Generation**:
   * Combines an adjective + animal / persona + random discriminator if duplicate occurs.
   * Wordlists: `["Silent", "Midnight", "Quantum", "Shadow", "Neon", "Cyber", "Curious", "Tactical", ...]` + `["Fox", "Octopus", "Owl", "Falcon", "Panther", "Badger", "Wolf", "Raven", ...]`.
2. **Avatar Generation**:
   * SVG Geometric Identicon generated deterministically from the AnonymousIdentity UUID seed.
3. **Cross-Company Isolation**:
   * A user belonging to Company A gets pseudonym "Silent Fox" in Company A.
   * The same user in Company B gets pseudonym "Neon Badger" in Company B.
   * Pseudonym records are strictly scoped to `company_id`.

---

## 7. Company Verification Flow

1. **Email OTP Flow**:
   * User enters work email: `jane.doe@techcorp.com`.
   * Backend checks if `@techcorp.com` matches `Company.allowedDomains`.
   * Backend generates 6-digit cryptographic OTP, hashes it, stores in `VerificationRequest` with 15-minute TTL.
   * OTP sent via Mailer service.
   * User submits OTP -> Membership activated with `VERIFIED` status -> Anonymous Identity created.
   * Raw work email is purged from verification request after confirmation or retained in one-way salted hash.
2. **Secret Code Flow**:
   * Admins/Community creators generate single-use or rate-limited invitation codes.
   * User inputs code -> Code validated & decremented -> Membership activated.
3. **Proof of Employment**:
   * Upload encrypted proof -> Review queue for Platform Moderator -> Approved/Rejected -> Document deleted immediately after verification.

---

## 8. Privacy & Security Threat Model

| Threat | Vector | Defense / Mitigation |
| :--- | :--- | :--- |
| **Deanonymization via API Response** | Malicious inspection of JSON payloads | Feed queries NEVER join or select `User` table. Only `AnonymousIdentity` is returned. |
| **Cross-Company Correlation** | Tracking users across multiple companies | Every `AnonymousIdentity` has a unique UUID, separate reputation counter, and distinct pseudonym per company. |
| **Company Admin Snooping** | Company executives requesting poster identities | Company Admins have no DB access or administrative endpoints to inspect identity links. Only Platform Super-Moderators can act on severe legal/safety reports via isolated hashes. |
| **Timing Attacks / Leak in Content** | User writing identifying details in post | **Identity Leak Detector** analyzes text for specific keywords (exact job title, local office names, isolated project names) and flags risk before publish. |
| **Sybil Attack (Multiple Accounts)** | One employee creating 10 burner accounts | 1 corporate email = 1 membership = 1 anonymous identity per company. |

---

## 9. API Design (Key Endpoints)

### Auth & User (`/api/auth`)
* `POST /api/auth/register` — Register account
* `POST /api/auth/login` — Login & issue JWT session
* `GET /api/auth/me` — Get current logged-in real user

### Verification & Membership (`/api/verification`)
* `POST /api/verification/request-email` — Request corporate email OTP
* `POST /api/verification/verify-otp` — Verify OTP & claim membership
* `POST /api/verification/claim-code` — Verify invite code

### Companies (`/api/companies`)
* `GET /api/companies` — List companies (public search/list)
* `GET /api/companies/:slug` — Get company profile & stats
* `GET /api/companies/:id/pulse` — Get aggregated sentiment & active stats (min 5 users threshold)

### Community Social Feed (`/api/community/:companySlug`)
* `GET /api/community/:companySlug/feed` — Get posts (filter by type, topic, trending)
* `POST /api/community/:companySlug/posts` — Create post (with leak check header/consent)
* `GET /api/community/:companySlug/posts/:id` — Get post with comments & thread
* `POST /api/community/:companySlug/posts/:id/comments` — Add comment / reply
* `POST /api/community/:companySlug/posts/:id/react` — React to post (Like, Agree, etc.)
* `POST /api/community/:companySlug/posts/:id/vote` — Vote on poll

### Privacy Assistance (`/api/privacy`)
* `POST /api/privacy/check-leak` — Analyze text payload for identity exposure risk score

---

## 10. Frontend Architecture (Next.js + Tailwind)

* **Design System**: Swiss Minimalist / Modern Terminal Underground theme (Dark monochrome `#0c0d0e`, crisp borders `#27272a`, monospaced accents, high contrast typography, 0 decorative emojis in chrome).
* **Pages & Routes**:
  * `/` — Landing page / Underground Manifesto
  * `/login` & `/register` — Authentication
  * `/verify` — Corporate email / code verification
  * `/c/[companySlug]` — Company Underground Feed
  * `/c/[companySlug]/post/[id]` — Post discussion thread
  * `/c/[companySlug]/pulse` — Underground Pulse & Temperature
  * `/c/[companySlug]/ama` — AMA Hall
* **Components**:
  * `FeedCard` — Post renderer with pseudonym badge, type tags, hot-take badges.
  * `LeakDetectorModal` — Pre-publish privacy warning popup.
  * `PollWidget` — Interactive anonymous poll with live aggregate percentages.
  * `TemperatureCheckIn` — Quick mood vote widget.

---

## 11. Resolution of 10 Critical Questions

1. **Proof of Employment**: Corporate email domain verification with time-limited OTP + optional signed employment proof verification.
2. **User-to-User Anonymity**: Real names and emails are stored in isolated tables; feed APIs only return `AnonymousIdentity` pseudonyms.
3. **Company Admin Protection**: Company admins are regular members with basic topic moderation tools; no DB queries or API endpoints exist to reveal identity mappings.
4. **Safe Moderation**: Reports target `Post.id` or `AnonymousIdentity.id`. Moderators ban the pseudonym or suspend the membership token without needing to inspect real user records.
5. **Sybil Prevention**: Single email domain mapping to one verified membership record per company.
6. **Cross-Company Isolation**: Cryptographically independent pseudonyms and reputations generated per company ID.
7. **Identity Leak Detection**: Rule-based NLP heuristics scanning for job titles, departmental singulars ("I am the only...", "in Surabaya branch"), and team identifiers.
8. **Employee Offboarding (Resignations)**: Verification status has an expiration TTL (e.g., 90 or 180 days) requiring periodic corporate email re-validation.
9. **Expired Verifications**: When membership status transitions to `EXPIRED`, read-only access is granted or write access is suspended until re-verified.
10. **Persistent yet Unlinkable Identity**: The pseudonym is linked to `CompanyMembership` ID, which acts as an internal opaque foreign key without exposing personal PII in queries.
