# Corporate Underground

**Private Anonymous Network for Verified Employees.**

Your workplace. Without your name attached.

An anonymous social network for verified company employees. Real identity is used only for authentication and company verification; all social activity happens under persistent, company-scoped pseudonymous identities.

## Architecture

- `backend/` — NestJS API server (modular monolith, TypeScript, Prisma/PostgreSQL)
- `frontend/` — Next.js web app (App Router, Tailwind CSS, TypeScript)
- `docs/` — Architecture, PRD, threat model

## Core Principles

1. **Verified Membership** — only verified employees enter a company community
2. **Strong Anonymity** — real identity and anonymous identity are strictly separated
3. **Private Company Community** — content is scoped to verified employees only
4. **Safe Moderation** — enforcement without deanonymization

## License

MIT