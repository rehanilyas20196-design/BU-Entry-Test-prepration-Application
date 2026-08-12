# BUET Prep AI

> **Independent educational preparation platform — NOT affiliated with or endorsed by Bahria University.**

BUET Prep AI is a production-grade mobile application that helps students prepare for the Bahria University Entry Test (BUET). It provides topic-wise practice, timed mock tests, AI tutoring, mistake tracking, and personalized study plans built around the published BUET test structure.

This monorepo contains:

| Package | Path | Description |
| --- | --- | --- |
| `@buet-prep/mobile` | `apps/mobile` | React Native + Expo mobile app (students) |
| `@buet-prep/api` | `apps/api` | NestJS REST API backend (`/api/v1/...`) |
| `@buet-prep/admin` | `apps/admin` | Web-based admin dashboard (content & ops) |
| `@buet-prep/shared` | `packages/shared` | Shared TypeScript types & validation schemas |
| Supabase | `supabase/` | PostgreSQL schema, migrations, RLS policies, seeds |

## Disclaimer

This is an independent educational preparation platform and is not affiliated with, endorsed by, or operated by Bahria University. Practice questions are original AI-generated content designed around the publicly published BUET test structure. No question is claimed to be an official or actual future exam question, and no application result guarantees admission.

## Architecture

```
Mobile App (Expo / React Native)
        │  HTTPS /api/v1
        ▼
   NestJS API Gateway ──► Auth ──► Business Logic ──► Supabase PostgreSQL
        │                                                     │
        └──────────────────────────────────────────────────────┘
                                                              │
                                                         AI Service
                                                   (OpenAI / Gemini / …)
```

See `docs/architecture.md` for full detail.

## Quick Start

1. Install dependencies: `npm install`
2. Copy environment files (see `.env.example` files in each app) and fill in Supabase credentials.
3. Apply migrations and seed data to your Supabase project (see `supabase/README.md`).
4. Run the API: `npm run api:dev`
5. Run the mobile app: `npm run mobile:start`
6. Run the admin dashboard: `npm run admin:dev`

## Documentation

- `docs/architecture.md` — System architecture & data flow
- `docs/database.md` — Database schema documentation
- `docs/api.md` — REST API documentation
- `docs/security.md` — Security model, RLS, and AI security
- `docs/deployment.md` — Deployment instructions
- `docs/roadmap.md` — Phase plan

## Development Process

We build in phases (see `docs/roadmap.md`). At the end of every phase we run lint, type checks, tests, and verify database policies before moving on.
