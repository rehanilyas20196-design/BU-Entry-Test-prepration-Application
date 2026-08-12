-- 0006_gamification_notifications.sql
-- BUET Prep AI — XP, achievements, badges, notifications, leaderboard

-- =============================================================
-- ACHIEVEMENTS (definitions + earned records)
-- =============================================================
create table if not exists "public"."achievements" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

create index if not exists idx_achievements_user on "public"."achievements"(user_id);

-- =============================================================
-- USER XP / LEVELS
-- =============================================================
create table if not exists "public"."user_stats" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  xp integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  total_questions_answered integer not null default 0,
  total_questions_correct integer not null default 0,
  total_mock_tests integer not null default 0,
  total_study_minutes integer not null default 0,
  best_accuracy numeric(5,2),
  best_mock_score numeric(7,2),
  updated_at timestamptz not null default now()
);

create trigger trg_user_stats_updated_at before update on "public"."user_stats"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- NOTIFICATIONS
-- =============================================================
create table if not exists "public"."notifications" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on "public"."notifications"(user_id, read, created_at desc);

-- =============================================================
-- XP EVENTS (auditable XP ledger)
-- =============================================================
create table if not exists "public"."xp_events" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_xp_events_user on "public"."xp_events"(user_id, created_at desc);

-- =============================================================
-- LEADERBOARD (period-based)
-- =============================================================
create table if not exists "public"."leaderboard_entries" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  period text not null default 'all_time' check (period in ('all_time','weekly','monthly')),
  xp integer not null default 0,
  rank_position integer,
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

create index if not exists idx_leaderboard_period on "public"."leaderboard_entries"(period, xp desc);
