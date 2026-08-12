# Supabase / Database

BUET Prep AI uses Supabase (PostgreSQL). All schema changes are version-controlled migrations under `supabase/migrations/`.

## Requirements

- Supabase project (free tier is fine for development)
- pgvector extension for semantic duplicate detection (optional, disabled by default)
- `pg_trgm` for fuzzy duplicate detection (enabled in `0001`)

## Applying migrations

Apply migrations in order using the Supabase CLI:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

For local development:

```bash
supabase start
supabase db reset
```

## Seeding

Seed migrations are part of the normal migration set (`0011`, `0012`, `0013`) so they apply automatically. To re-seed after clearing data, run `supabase db reset`.

## Migration map

| Migration | Purpose |
| --- | --- |
| `0001_init.sql` | Extensions, enums |
| `0002_programs_subjects_topics.sql` | Universities, programs, test configs, sections, subjects, topics |
| `0003_questions.sql` | Questions, options, sources, reviews, reports, duplicates |
| `0004_mock_tests.sql` | Mock tests, attempts, answers |
| `0005_progress.sql` | User progress, topic progress, plans, sessions, mistakes, bookmarks, daily stats |
| `0006_gamification_notifications.sql` | XP, achievements, stats, notifications, leaderboard |
| `0007_ai.sql` | AI conversations, messages, usage, app settings |
| `0008_admin_audit.sql` | Profiles, admin users, audit logs, devices, sync queue |
| `0009_foreign_keys.sql` | FK resolution to `auth.users` |
| `0010_rls.sql` | Row Level Security policies |
| `0011_seed_taxonomy.sql` | Seed universities, programs, configs, sections |
| `0012_seed_topics.sql` | Seed topics per subject |
| `0013_seed_starter_questions.sql` | Starter approved question set |

## Key design decisions

- **UUID PKs** everywhere.
- **Database-driven test structure**: `test_configurations` + `test_sections` define BUET layout. Changing a program's distribution is a row update, not a code change.
- **RLS is the security boundary**: students can only read `approved` questions and their own rows. All writes to content go through the backend (service role).
- **Provenance on every question**: `source_type`, `source_reference`, `copyright_status`, `generated_by`, `reviewed`, `reviewer_id` fields ensure no third-party material is mislabeled.
- **Scoring is server-side only**.
- **Validity window** (`valid_from`/`valid_until`) on questions so dated GK content can be retired without deletion.
