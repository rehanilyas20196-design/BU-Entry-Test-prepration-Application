-- 0021_premium.sql
-- BUET Prep AI — premium gating
-- Adds an is_premium flag to profiles and a hard_mock mode for tests.

-- =============================================================
-- PROFILES: premium flag
-- =============================================================
alter table "public"."profiles"
  add column if not exists is_premium boolean not null default false;

create index if not exists idx_profiles_premium on "public"."profiles"(is_premium);

-- =============================================================
-- TEST MODE: add hard_mock (full-length mock with hard questions)
-- =============================================================
do $$
begin
  alter type "public"."test_mode" add value if not exists 'hard_mock';
exception when duplicate_object then null;
end $$;