-- 0005_progress.sql
-- BUET Prep AI — progress tracking, study plans, sessions

-- =============================================================
-- USER PROGRESS (granular answer log)
-- =============================================================
create table if not exists "public"."user_progress" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  subject_id uuid not null references "public"."subjects"(id) on delete cascade,
  topic_id uuid references "public"."topics"(id) on delete set null,
  difficulty "public"."difficulty" not null,
  is_correct boolean,
  time_spent_seconds integer,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_progress_user on "public"."user_progress"(user_id);
create index if not exists idx_user_progress_user_topic on "public"."user_progress"(user_id, topic_id);
create index if not exists idx_user_progress_user_subject on "public"."user_progress"(user_id, subject_id);
create index if not exists idx_user_progress_answered on "public"."user_progress"(user_id, answered_at desc);

-- =============================================================
-- TOPIC PROGRESS (materialized rollup per user per topic)
-- =============================================================
create table if not exists "public"."topic_progress" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  topic_id uuid not null references "public"."topics"(id) on delete cascade,
  attempted integer not null default 0,
  correct integer not null default 0,
  last_accuracy numeric(5,2),
  best_streak integer not null default 0,
  current_streak integer not null default 0,
  avg_time_seconds numeric(8,2),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create index if not exists idx_topic_progress_user on "public"."topic_progress"(user_id);

create trigger trg_topic_progress_updated_at before update on "public"."topic_progress"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- STUDY PLANS
-- =============================================================
create table if not exists "public"."study_plans" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  program_id uuid references "public"."programs"(id) on delete set null,
  test_date date,
  daily_study_minutes integer not null check (daily_study_minutes > 0),
  start_date date not null,
  generated_by text not null default 'SYSTEM' check (generated_by in ('AI','SYSTEM')),
  status "public"."plan_status" not null default 'active',
  content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_study_plans_user on "public"."study_plans"(user_id, status);

create trigger trg_study_plans_updated_at before update on "public"."study_plans"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- STUDY SESSIONS (per-day targets)
-- =============================================================
create table if not exists "public"."study_sessions" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  study_plan_id uuid references "public"."study_plans"(id) on delete cascade,
  date date not null,
  target_questions integer not null default 0,
  completed_questions integer not null default 0,
  target_minutes integer not null default 0,
  completed_minutes integer,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_plan_id, date)
);

create index if not exists idx_study_sessions_user on "public"."study_sessions"(user_id, date);

create trigger trg_study_sessions_updated_at before update on "public"."study_sessions"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- MISTAKE NOTEBOOK
-- =============================================================
create table if not exists "public"."mistakes" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  topic_id uuid references "public"."topics"(id) on delete set null,
  last_wrong_at timestamptz not null default now(),
  wrong_count integer not null default 1,
  correct_count integer not null default 0,
  last_accuracy numeric(5,2),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists idx_mistakes_user on "public"."mistakes"(user_id, resolved);
create index if not exists idx_mistakes_topic on "public"."mistakes"(topic_id);

create trigger trg_mistakes_updated_at before update on "public"."mistakes"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- BOOKMARKS
-- =============================================================
create table if not exists "public"."bookmarks" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists idx_bookmarks_user on "public"."bookmarks"(user_id, created_at desc);

-- =============================================================
-- DAILY USER STATS (streaks)
-- =============================================================
create table if not exists "public"."daily_user_stats" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  questions_answered integer not null default 0,
  questions_correct integer not null default 0,
  minutes_studied integer not null default 0,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_daily_stats_user on "public"."daily_user_stats"(user_id, date);
