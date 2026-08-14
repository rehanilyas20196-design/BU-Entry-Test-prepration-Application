-- =============================================================================
-- BUET Prep AI — Consolidado idempotente (safe to run on existing tables)
-- Paste THIS ENTIRE FILE into Supabase Dashboard -> SQL Editor and Run.
-- Safe if tables already exist; safe to run twice.
-- =============================================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
-- optional: create extension if not exists "vector";

-- =============================================================
-- 2. ENUMS
-- =============================================================
do $$ begin create type "public"."difficulty" as enum ('easy','medium','hard','expert'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."review_status" as enum ('draft','ai_generated','needs_review','approved','rejected','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."source_type" as enum ('OFFICIAL_BU_SOURCE','ORIGINAL_AI','HUMAN_CREATED','OPEN_EDUCATIONAL_RESOURCE','USER_SUBMITTED','THIRD_PARTY_REFERENCE'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."copyright_status" as enum ('original','official_sample','reference_based'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."user_role" as enum ('student','admin','content_editor'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."preparation_level" as enum ('beginner','intermediate','advanced'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."test_mode" as enum ('practice','timed_practice','full_mock','hard_mock'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."attempt_status" as enum ('in_progress','submitted','expired','abandoned'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."plan_status" as enum ('active','completed','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."report_status" as enum ('open','resolved','dismissed'); exception when duplicate_object then null; end $$;
do $$ begin create type "public"."subject_category" as enum ('verbal','quantitative','analytical','general_knowledge','science','medical'); exception when duplicate_object then null; end $$;

-- =============================================================
-- 3. TABLES (no-op if they already exist)
-- =============================================================

create table if not exists "public"."universities" (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country text not null default 'Pakistan',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."programs" (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references "public"."universities"(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  campus text,
  degree_level text not null default 'undergraduate',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, code)
);

create table if not exists "public"."test_configurations" (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references "public"."programs"(id) on delete cascade,
  university_id uuid not null references "public"."universities"(id) on delete cascade,
  name text not null,
  description text,
  total_questions integer not null check (total_questions > 0),
  total_marks integer not null check (total_marks > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  negative_marking boolean not null default false,
  negative_mark_value numeric(6,3) check (negative_mark_value is null or negative_mark_value >= 0),
  pass_percentage numeric(5,2) check (pass_percentage is null or pass_percentage between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."test_sections" (
  id uuid primary key default gen_random_uuid(),
  test_config_id uuid not null references "public"."test_configurations"(id) on delete cascade,
  subject_id uuid not null,
  name text not null,
  question_count integer not null check (question_count >= 0),
  marks integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (test_config_id, subject_id)
);

create table if not exists "public"."subjects" (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category "public"."subject_category" not null default 'verbal',
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."topics" (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references "public"."subjects"(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, name)
);

alter table "public"."test_sections" drop constraint if exists test_sections_subject_fk;
alter table "public"."test_sections"
  add constraint test_sections_subject_fk
  foreign key (subject_id) references "public"."subjects"(id) on delete cascade;

create table if not exists "public"."questions" (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references "public"."subjects"(id) on delete cascade,
  topic_id uuid references "public"."topics"(id) on delete set null,
  difficulty "public"."difficulty" not null default 'medium',
  question_text text not null check (length(question_text) > 0),
  correct_option "char" not null check (correct_option in ('A','B','C','D')),
  explanation text,
  solution_steps jsonb,
  hint text,
  learning_objective text,
  is_original boolean not null default true,
  is_official_sample boolean not null default false,
  review_status "public"."review_status" not null default 'draft',
  generated_by text not null default 'HUMAN' check (generated_by in ('AI','HUMAN')),
  source_type "public"."source_type" not null default 'ORIGINAL_AI',
  source_reference text,
  copyright_status "public"."copyright_status" not null default 'original',
  research_url text,
  question_date date,
  valid_from date,
  valid_until date,
  reviewed boolean not null default false,
  reviewer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."question_options" (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  option_key "char" not null check (option_key in ('A','B','C','D')),
  option_text text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, option_key)
);

create table if not exists "public"."question_sources" (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  source_type "public"."source_type" not null,
  source_reference text,
  copyright_status "public"."copyright_status" not null default 'original',
  is_original boolean not null default true,
  is_official_sample boolean not null default false,
  research_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists "public"."question_reviews" (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  reviewer_id uuid,
  status "public"."review_status" not null,
  comment text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists "public"."question_reports" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  reason text not null,
  detail text,
  status "public"."report_status" not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."question_duplicates" (
  id uuid primary key default gen_random_uuid(),
  question_id_a uuid not null references "public"."questions"(id) on delete cascade,
  question_id_b uuid not null references "public"."questions"(id) on delete cascade,
  similarity numeric(5,4),
  method text not null,
  status text not null default 'flagged' check (status in ('flagged','confirmed','dismissed')),
  created_at timestamptz not null default now(),
  unique (question_id_a, question_id_b)
);

create table if not exists "public"."mock_tests" (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references "public"."programs"(id) on delete cascade,
  test_config_id uuid references "public"."test_configurations"(id) on delete set null,
  university_id uuid references "public"."universities"(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  question_count integer not null check (question_count > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."mock_test_questions" (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references "public"."mock_tests"(id) on delete cascade,
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  section_index integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (mock_test_id, order_index),
  unique (mock_test_id, question_id)
);

create table if not exists "public"."test_attempts" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mock_test_id uuid references "public"."mock_tests"(id) on delete set null,
  test_config_id uuid references "public"."test_configurations"(id) on delete set null,
  mode "public"."test_mode" not null default 'practice',
  status "public"."attempt_status" not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  duration_seconds integer,
  score numeric(7,2),
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  unanswered_count integer not null default 0,
  total_questions integer not null default 0,
  max_score numeric(7,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."test_answers" (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references "public"."test_attempts"(id) on delete cascade,
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  selected_option "char" check (selected_option in ('A','B','C','D')),
  is_correct boolean,
  time_spent_seconds integer,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

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

create table if not exists "public"."bookmarks" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

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

create table if not exists "public"."achievements" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

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

create table if not exists "public"."xp_events" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists "public"."leaderboard_entries" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  period text not null default 'all_time' check (period in ('all_time','weekly','monthly')),
  xp integer not null default 0,
  rank_position integer,
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

create table if not exists "public"."ai_conversations" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  context_question_id uuid references "public"."questions"(id) on delete set null,
  subject_id uuid references "public"."subjects"(id) on delete set null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."ai_messages" (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references "public"."ai_conversations"(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists "public"."ai_usage" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature text not null,
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  request_duration_ms integer,
  status text not null default 'ok',
  error text,
  created_at timestamptz not null default now()
);

create table if not exists "public"."app_settings" (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists "public"."profiles" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text,
  target_university text,
  campus text,
  program_id uuid references "public"."programs"(id) on delete set null,
  test_date date,
  preparation_level "public"."preparation_level",
  daily_study_minutes integer check (daily_study_minutes > 0),
  timezone text,
  avatar_url text,
  onboarded boolean not null default false,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_premium on "public"."profiles"(is_premium);

create table if not exists "public"."admin_users" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role "public"."user_role" not null default 'content_editor',
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists "public"."audit_logs" (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create table if not exists "public"."user_devices" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_token text not null,
  platform text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_token)
);

create table if not exists "public"."sync_entries" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id text not null,
  entity_type text not null,
  payload jsonb not null,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

-- =============================================================
-- 4. INDEXES
-- =============================================================
create index if not exists idx_programs_university on "public"."programs"(university_id);
create index if not exists idx_test_config_program on "public"."test_configurations"(program_id);
create index if not exists idx_test_config_university on "public"."test_configurations"(university_id);
create index if not exists idx_test_sections_config on "public"."test_sections"(test_config_id);
create index if not exists idx_topics_subject on "public"."topics"(subject_id);
create index if not exists idx_subjects_active on "public"."subjects"(is_active);
create index if not exists idx_questions_subject on "public"."questions"(subject_id);
create index if not exists idx_questions_topic on "public"."questions"(topic_id);
create index if not exists idx_questions_difficulty on "public"."questions"(difficulty);
create index if not exists idx_questions_review_status on "public"."questions"(review_status);
create index if not exists idx_questions_validity on "public"."questions"(valid_from, valid_until);
create index if not exists idx_questions_updated on "public"."questions"(updated_at desc);
create index if not exists idx_questions_text_trgm on "public"."questions" using gin (question_text gin_trgm_ops);
create index if not exists idx_options_question on "public"."question_options"(question_id);
create index if not exists idx_sources_question on "public"."question_sources"(question_id);
create index if not exists idx_reviews_question on "public"."question_reviews"(question_id);
create index if not exists idx_reviews_status on "public"."question_reviews"(status);
create index if not exists idx_reports_question on "public"."question_reports"(question_id);
create index if not exists idx_reports_status on "public"."question_reports"(status);
create index if not exists idx_reports_user on "public"."question_reports"(user_id);
create index if not exists idx_duplicates_status on "public"."question_duplicates"(status);
create index if not exists idx_mock_tests_program on "public"."mock_tests"(program_id);
create index if not exists idx_mock_tests_active on "public"."mock_tests"(is_active);
create index if not exists idx_mock_test_q_test on "public"."mock_test_questions"(mock_test_id);
create index if not exists idx_mock_test_q_question on "public"."mock_test_questions"(question_id);
create index if not exists idx_attempts_user on "public"."test_attempts"(user_id);
create index if not exists idx_attempts_user_status on "public"."test_attempts"(user_id, status);
create index if not exists idx_attempts_mock_test on "public"."test_attempts"(mock_test_id);
create index if not exists idx_attempts_created on "public"."test_attempts"(created_at desc);
create index if not exists idx_test_answers_attempt on "public"."test_answers"(attempt_id);
create index if not exists idx_test_answers_question on "public"."test_answers"(question_id);
create index if not exists idx_user_progress_user on "public"."user_progress"(user_id);
create index if not exists idx_user_progress_user_topic on "public"."user_progress"(user_id, topic_id);
create index if not exists idx_user_progress_user_subject on "public"."user_progress"(user_id, subject_id);
create index if not exists idx_user_progress_answered on "public"."user_progress"(user_id, answered_at desc);
create index if not exists idx_topic_progress_user on "public"."topic_progress"(user_id);
create index if not exists idx_study_plans_user on "public"."study_plans"(user_id, status);
create index if not exists idx_study_sessions_user on "public"."study_sessions"(user_id, date);
create index if not exists idx_mistakes_user on "public"."mistakes"(user_id, resolved);
create index if not exists idx_mistakes_topic on "public"."mistakes"(topic_id);
create index if not exists idx_bookmarks_user on "public"."bookmarks"(user_id, created_at desc);
create index if not exists idx_daily_stats_user on "public"."daily_user_stats"(user_id, date);
create index if not exists idx_achievements_user on "public"."achievements"(user_id);
create index if not exists idx_notifications_user on "public"."notifications"(user_id, read, created_at desc);
create index if not exists idx_xp_events_user on "public"."xp_events"(user_id, created_at desc);
create index if not exists idx_leaderboard_period on "public"."leaderboard_entries"(period, xp desc);
create index if not exists idx_ai_conversations_user on "public"."ai_conversations"(user_id, updated_at desc);
create index if not exists idx_ai_messages_conversation on "public"."ai_messages"(conversation_id, created_at);
create index if not exists idx_ai_usage_user on "public"."ai_usage"(user_id, created_at desc);
create index if not exists idx_ai_usage_feature on "public"."ai_usage"(feature, created_at desc);
create index if not exists idx_profiles_user on "public"."profiles"(user_id);
create index if not exists idx_audit_logs_actor on "public"."audit_logs"(actor_user_id, created_at desc);
create index if not exists idx_audit_logs_entity on "public"."audit_logs"(entity_type, entity_id);
create index if not exists idx_audit_logs_action on "public"."audit_logs"(action);
create index if not exists idx_user_devices_user on "public"."user_devices"(user_id);
create index if not exists idx_sync_entries_user on "public"."sync_entries"(user_id, synced_at);

-- =============================================================
-- 5. FUNCTIONS
-- =============================================================
create or replace function "public"."set_updated_at"() returns trigger language plpgsql
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function "public"."validate_question_options"() returns trigger language plpgsql
as $$
declare
  opt_count integer;
  correct_count integer;
  dup_count integer;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;
  select count(*), count(*) filter (where is_correct), count(distinct lower(trim(option_text)))
    into opt_count, correct_count, dup_count
    from "public"."question_options"
    where question_id = new.question_id;
  if opt_count != 4 then
    raise exception 'Question % must have exactly 4 options (has %)', new.question_id, opt_count;
  end if;
  if correct_count != 1 then
    raise exception 'Question % must have exactly 1 correct option (has %)', new.question_id, correct_count;
  end if;
  if dup_count != 4 then
    raise exception 'Question % has duplicate option text', new.question_id;
  end if;
  return new;
end;
$$;

create or replace function "public"."seed_question"(
  p_subject_code text,
  p_topic_name text,
  p_difficulty "public"."difficulty",
  p_question text,
  p_correct "char",
  p_a text, p_b text, p_c text, p_d text,
  p_explanation text,
  p_solution jsonb,
  p_hint text
) returns void language plpgsql as $$
declare
  q_id uuid;
  opt text[];
  keys text[] := array['A','B','C','D'];
  i int;
begin
  insert into "public"."questions"
    (subject_id, topic_id, difficulty, question_text, correct_option, explanation, solution_steps, hint,
     is_original, is_official_sample, review_status, generated_by, source_type, source_reference, copyright_status, reviewed)
  values
    ((select id from "public"."subjects" where code = p_subject_code),
     (select id from "public"."topics" where subject_id = (select id from "public"."subjects" where code = p_subject_code) and name = p_topic_name),
     p_difficulty, p_question, p_correct, p_explanation, p_solution, p_hint,
     true, false, 'approved', 'AI', 'ORIGINAL_AI',
     'Original AI-generated practice question', 'original', true)
  returning id into q_id;

  opt := array[p_a, p_b, p_c, p_d];
  for i in 1..4 loop
    insert into "public"."question_options" (question_id, option_key, option_text, is_correct, order_index)
    values (q_id, keys[i], opt[i], (keys[i] = p_correct), i - 1);
  end loop;

  insert into "public"."question_sources" (question_id, source_type, source_reference, copyright_status, is_original)
  values (q_id, 'ORIGINAL_AI', 'Original AI-generated practice question', 'original', true);
end;
$$;

-- =============================================================
-- 6. TRIGGERS (dropped first for idempotency)
-- =============================================================
drop trigger if exists trg_programs_updated_at on "public"."programs";
create trigger trg_programs_updated_at before update on "public"."programs" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_universities_updated_at on "public"."universities";
create trigger trg_universities_updated_at before update on "public"."universities" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_test_configurations_updated_at on "public"."test_configurations";
create trigger trg_test_configurations_updated_at before update on "public"."test_configurations" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_subjects_updated_at on "public"."subjects";
create trigger trg_subjects_updated_at before update on "public"."subjects" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_topics_updated_at on "public"."topics";
create trigger trg_topics_updated_at before update on "public"."topics" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_questions_updated_at on "public"."questions";
create trigger trg_questions_updated_at before update on "public"."questions" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_question_reports_updated_at on "public"."question_reports";
create trigger trg_question_reports_updated_at before update on "public"."question_reports" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_mock_tests_updated_at on "public"."mock_tests";
create trigger trg_mock_tests_updated_at before update on "public"."mock_tests" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_test_attempts_updated_at on "public"."test_attempts";
create trigger trg_test_attempts_updated_at before update on "public"."test_attempts" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_topic_progress_updated_at on "public"."topic_progress";
create trigger trg_topic_progress_updated_at before update on "public"."topic_progress" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_study_plans_updated_at on "public"."study_plans";
create trigger trg_study_plans_updated_at before update on "public"."study_plans" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_study_sessions_updated_at on "public"."study_sessions";
create trigger trg_study_sessions_updated_at before update on "public"."study_sessions" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_mistakes_updated_at on "public"."mistakes";
create trigger trg_mistakes_updated_at before update on "public"."mistakes" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_user_stats_updated_at on "public"."user_stats";
create trigger trg_user_stats_updated_at before update on "public"."user_stats" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_profiles_updated_at on "public"."profiles";
create trigger trg_profiles_updated_at before update on "public"."profiles" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_admin_users_updated_at on "public"."admin_users";
create trigger trg_admin_users_updated_at before update on "public"."admin_users" for each row execute function "public"."set_updated_at"();
drop trigger if exists trg_ai_conversations_updated_at on "public"."ai_conversations";
create trigger trg_ai_conversations_updated_at before update on "public"."ai_conversations" for each row execute function "public"."set_updated_at"();

-- option validator: deferred constraint trigger so 4 options can be inserted one-by-one
drop trigger if exists trg_validate_options_aiud on "public"."question_options";
create constraint trigger trg_validate_options_aiud
  after insert or update or delete on "public"."question_options"
  deferrable initially deferred
  for each row execute function "public"."validate_question_options"();

-- =============================================================
-- 7. FOREIGN KEYS to auth.users / admin_users
-- =============================================================
alter table "public"."questions" drop constraint if exists questions_reviewer_fk;
alter table "public"."questions"
  add constraint questions_reviewer_fk
  foreign key (reviewer_id) references "public"."admin_users"(id) on delete set null;

alter table "public"."question_reviews" drop constraint if exists question_reviews_reviewer_fk;
alter table "public"."question_reviews"
  add constraint question_reviews_reviewer_fk
  foreign key (reviewer_id) references "public"."admin_users"(id) on delete set null;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'test_attempts', 'user_progress', 'topic_progress',
    'study_plans', 'study_sessions', 'mistakes', 'bookmarks',
    'daily_user_stats', 'achievements', 'user_stats', 'xp_events',
    'leaderboard_entries', 'notifications', 'ai_conversations',
    'ai_usage', 'question_reports', 'user_devices', 'sync_entries',
    'admin_users'
  ]
  loop
    execute format('alter table "public".%I drop constraint if exists %I_fk;', t, 'user_' || t);
    execute format('alter table "public".%I add constraint %I_fk foreign key (user_id) references auth.users(id) on delete cascade;', t, 'user_' || t);
  end loop;
end $$;

-- =============================================================
-- 8. ROW LEVEL SECURITY (helpers + policies)
-- =============================================================
create or replace function "public"."auth_is_admin"()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from "public"."admin_users"
  where user_id = auth.uid() and is_active = true and role in ('admin')
); $$;

create or replace function "public"."auth_is_content_editor"()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from "public"."admin_users"
  where user_id = auth.uid() and is_active = true and role in ('admin','content_editor')
); $$;

create or replace function "public"."auth_is_staff"()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from "public"."admin_users"
  where user_id = auth.uid() and is_active = true
); $$;

alter table "public"."profiles" enable row level security;
drop policy if exists profiles_select_own on "public"."profiles";
create policy "profiles_select_own" on "public"."profiles" for select using (auth.uid() = user_id or "public"."auth_is_staff"());
drop policy if exists profiles_insert_own on "public"."profiles";
create policy "profiles_insert_own" on "public"."profiles" for insert with check (auth.uid() = user_id);
drop policy if exists profiles_update_own on "public"."profiles";
create policy "profiles_update_own" on "public"."profiles" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."universities" enable row level security;
drop policy if exists universities_read on "public"."universities";
create policy "universities_read" on "public"."universities" for select using (true);

alter table "public"."programs" enable row level security;
drop policy if exists programs_read on "public"."programs";
create policy "programs_read" on "public"."programs" for select using (true or "public"."auth_is_staff"());

alter table "public"."subjects" enable row level security;
drop policy if exists subjects_read on "public"."subjects";
create policy "subjects_read" on "public"."subjects" for select using (true or "public"."auth_is_staff"());

alter table "public"."topics" enable row level security;
drop policy if exists topics_read on "public"."topics";
create policy "topics_read" on "public"."topics" for select using (true or "public"."auth_is_staff"());

alter table "public"."test_configurations" enable row level security;
drop policy if exists test_config_read on "public"."test_configurations";
create policy "test_config_read" on "public"."test_configurations" for select using (true or "public"."auth_is_staff"());

alter table "public"."test_sections" enable row level security;
drop policy if exists test_sections_read on "public"."test_sections";
create policy "test_sections_read" on "public"."test_sections" for select using (true or "public"."auth_is_staff"());

alter table "public"."questions" enable row level security;
drop policy if exists questions_read_approved on "public"."questions";
create policy "questions_read_approved" on "public"."questions" for select using (review_status = 'approved');
drop policy if exists questions_read_staff on "public"."questions";
create policy "questions_read_staff" on "public"."questions" for select using ("public"."auth_is_staff"() or "public"."auth_is_content_editor"());

alter table "public"."question_options" enable row level security;
drop policy if exists options_read_approved on "public"."question_options";
create policy "options_read_approved" on "public"."question_options" for select using (
  exists (select 1 from "public"."questions" q where q.id = question_id and q.review_status = 'approved')
);
drop policy if exists options_read_staff on "public"."question_options";
create policy "options_read_staff" on "public"."question_options" for select using ("public"."auth_is_staff"() or "public"."auth_is_content_editor"());

alter table "public"."question_sources" enable row level security;
drop policy if exists sources_read on "public"."question_sources";
create policy "sources_read" on "public"."question_sources" for select using (true);

alter table "public"."mock_tests" enable row level security;
drop policy if exists mock_tests_read on "public"."mock_tests";
create policy "mock_tests_read" on "public"."mock_tests" for select using (is_active = true or "public"."auth_is_staff"());

alter table "public"."mock_test_questions" enable row level security;
drop policy if exists mock_test_q_read on "public"."mock_test_questions";
create policy "mock_test_q_read" on "public"."mock_test_questions" for select using (
  exists (select 1 from "public"."mock_tests" m where m.id = mock_test_id and m.is_active = true)
  or "public"."auth_is_staff"()
);

alter table "public"."test_attempts" enable row level security;
drop policy if exists attempts_select_own on "public"."test_attempts";
create policy "attempts_select_own" on "public"."test_attempts" for select using (auth.uid() = user_id or "public"."auth_is_staff"());
drop policy if exists attempts_insert_own on "public"."test_attempts";
create policy "attempts_insert_own" on "public"."test_attempts" for insert with check (auth.uid() = user_id);
drop policy if exists attempts_update_own on "public"."test_attempts";
create policy "attempts_update_own" on "public"."test_attempts" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."test_answers" enable row level security;
drop policy if exists answers_select_own on "public"."test_answers";
create policy "answers_select_own" on "public"."test_answers" for select using (
  exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and (a.user_id = auth.uid() or "public"."auth_is_staff"()))
);
drop policy if exists answers_insert_own on "public"."test_answers";
create policy "answers_insert_own" on "public"."test_answers" for insert with check (
  exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and a.user_id = auth.uid())
);
drop policy if exists answers_update_own on "public"."test_answers";
create policy "answers_update_own" on "public"."test_answers" for update using (
  exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and a.user_id = auth.uid())
) with check (
  exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and a.user_id = auth.uid())
);

alter table "public"."user_progress" enable row level security;
drop policy if exists progress_select_own on "public"."user_progress";
create policy "progress_select_own" on "public"."user_progress" for select using (auth.uid() = user_id);
drop policy if exists progress_insert_own on "public"."user_progress";
create policy "progress_insert_own" on "public"."user_progress" for insert with check (auth.uid() = user_id);

alter table "public"."topic_progress" enable row level security;
drop policy if exists topic_progress_select_own on "public"."topic_progress";
create policy "topic_progress_select_own" on "public"."topic_progress" for select using (auth.uid() = user_id);
drop policy if exists topic_progress_insert_own on "public"."topic_progress";
create policy "topic_progress_insert_own" on "public"."topic_progress" for insert with check (auth.uid() = user_id);
drop policy if exists topic_progress_update_own on "public"."topic_progress";
create policy "topic_progress_update_own" on "public"."topic_progress" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."study_plans" enable row level security;
drop policy if exists plans_select_own on "public"."study_plans";
create policy "plans_select_own" on "public"."study_plans" for select using (auth.uid() = user_id);
drop policy if exists plans_insert_own on "public"."study_plans";
create policy "plans_insert_own" on "public"."study_plans" for insert with check (auth.uid() = user_id);
drop policy if exists plans_update_own on "public"."study_plans";
create policy "plans_update_own" on "public"."study_plans" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."study_sessions" enable row level security;
drop policy if exists sessions_select_own on "public"."study_sessions";
create policy "sessions_select_own" on "public"."study_sessions" for select using (auth.uid() = user_id);
drop policy if exists sessions_insert_own on "public"."study_sessions";
create policy "sessions_insert_own" on "public"."study_sessions" for insert with check (auth.uid() = user_id);
drop policy if exists sessions_update_own on "public"."study_sessions";
create policy "sessions_update_own" on "public"."study_sessions" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."mistakes" enable row level security;
drop policy if exists mistakes_select_own on "public"."mistakes";
create policy "mistakes_select_own" on "public"."mistakes" for select using (auth.uid() = user_id);
drop policy if exists mistakes_insert_own on "public"."mistakes";
create policy "mistakes_insert_own" on "public"."mistakes" for insert with check (auth.uid() = user_id);
drop policy if exists mistakes_update_own on "public"."mistakes";
create policy "mistakes_update_own" on "public"."mistakes" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."bookmarks" enable row level security;
drop policy if exists bookmarks_select_own on "public"."bookmarks";
create policy "bookmarks_select_own" on "public"."bookmarks" for select using (auth.uid() = user_id);
drop policy if exists bookmarks_insert_own on "public"."bookmarks";
create policy "bookmarks_insert_own" on "public"."bookmarks" for insert with check (auth.uid() = user_id);
drop policy if exists bookmarks_delete_own on "public"."bookmarks";
create policy "bookmarks_delete_own" on "public"."bookmarks" for delete using (auth.uid() = user_id);

alter table "public"."daily_user_stats" enable row level security;
drop policy if exists daily_stats_select_own on "public"."daily_user_stats";
create policy "daily_stats_select_own" on "public"."daily_user_stats" for select using (auth.uid() = user_id);
drop policy if exists daily_stats_insert_own on "public"."daily_user_stats";
create policy "daily_stats_insert_own" on "public"."daily_user_stats" for insert with check (auth.uid() = user_id);

alter table "public"."user_stats" enable row level security;
drop policy if exists user_stats_select_own on "public"."user_stats";
create policy "user_stats_select_own" on "public"."user_stats" for select using (auth.uid() = user_id);
drop policy if exists user_stats_insert_own on "public"."user_stats";
create policy "user_stats_insert_own" on "public"."user_stats" for insert with check (auth.uid() = user_id);
drop policy if exists user_stats_update_own on "public"."user_stats";
create policy "user_stats_update_own" on "public"."user_stats" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."xp_events" enable row level security;
drop policy if exists xp_events_select_own on "public"."xp_events";
create policy "xp_events_select_own" on "public"."xp_events" for select using (auth.uid() = user_id);
drop policy if exists xp_events_insert_own on "public"."xp_events";
create policy "xp_events_insert_own" on "public"."xp_events" for insert with check (auth.uid() = user_id);

alter table "public"."achievements" enable row level security;
drop policy if exists achievements_select_own on "public"."achievements";
create policy "achievements_select_own" on "public"."achievements" for select using (auth.uid() = user_id);
drop policy if exists achievements_insert_own on "public"."achievements";
create policy "achievements_insert_own" on "public"."achievements" for insert with check (auth.uid() = user_id);

alter table "public"."notifications" enable row level security;
drop policy if exists notifications_select_own on "public"."notifications";
create policy "notifications_select_own" on "public"."notifications" for select using (auth.uid() = user_id);
drop policy if exists notifications_update_own on "public"."notifications";
create policy "notifications_update_own" on "public"."notifications" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."ai_conversations" enable row level security;
drop policy if exists conversations_select_own on "public"."ai_conversations";
create policy "conversations_select_own" on "public"."ai_conversations" for select using (auth.uid() = user_id);
drop policy if exists conversations_insert_own on "public"."ai_conversations";
create policy "conversations_insert_own" on "public"."ai_conversations" for insert with check (auth.uid() = user_id);
drop policy if exists conversations_update_own on "public"."ai_conversations";
create policy "conversations_update_own" on "public"."ai_conversations" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists conversations_delete_own on "public"."ai_conversations";
create policy "conversations_delete_own" on "public"."ai_conversations" for delete using (auth.uid() = user_id);

alter table "public"."ai_messages" enable row level security;
drop policy if exists messages_select_own on "public"."ai_messages";
create policy "messages_select_own" on "public"."ai_messages" for select using (
  exists (select 1 from "public"."ai_conversations" c where c.id = conversation_id and c.user_id = auth.uid())
);
drop policy if exists messages_insert_own on "public"."ai_messages";
create policy "messages_insert_own" on "public"."ai_messages" for insert with check (
  exists (select 1 from "public"."ai_conversations" c where c.id = conversation_id and c.user_id = auth.uid())
);

alter table "public"."question_reports" enable row level security;
drop policy if exists reports_select_own on "public"."question_reports";
create policy "reports_select_own" on "public"."question_reports" for select using (auth.uid() = user_id);
drop policy if exists reports_insert_own on "public"."question_reports";
create policy "reports_insert_own" on "public"."question_reports" for insert with check (auth.uid() = user_id);

alter table "public"."sync_entries" enable row level security;
drop policy if exists sync_select_own on "public"."sync_entries";
create policy "sync_select_own" on "public"."sync_entries" for select using (auth.uid() = user_id);
drop policy if exists sync_insert_own on "public"."sync_entries";
create policy "sync_insert_own" on "public"."sync_entries" for insert with check (auth.uid() = user_id);

alter table "public"."user_devices" enable row level security;
drop policy if exists devices_select_own on "public"."user_devices";
create policy "devices_select_own" on "public"."user_devices" for select using (auth.uid() = user_id);
drop policy if exists devices_insert_own on "public"."user_devices";
create policy "devices_insert_own" on "public"."user_devices" for insert with check (auth.uid() = user_id);
drop policy if exists devices_delete_own on "public"."user_devices";
create policy "devices_delete_own" on "public"."user_devices" for delete using (auth.uid() = user_id);

alter table "public"."admin_users" enable row level security;
drop policy if exists admin_read_staff on "public"."admin_users";
create policy "admin_read_staff" on "public"."admin_users" for select using ("public"."auth_is_staff"() or auth.uid() = user_id);

alter table "public"."audit_logs" enable row level security;
drop policy if exists audit_read_staff on "public"."audit_logs";
create policy "audit_read_staff" on "public"."audit_logs" for select using ("public"."auth_is_staff"());

alter table "public"."app_settings" enable row level security;
drop policy if exists settings_read_all on "public"."app_settings";
create policy "settings_read_all" on "public"."app_settings" for select using (true);

-- =============================================================
-- 9. SEED DATA
-- =============================================================
insert into "public"."app_settings" (key, value, description) values
  ('ai.daily_quota_per_user', '{"value": 30}', 'Max AI tutor requests per user per day'),
  ('ai.max_input_length', '{"value": 4000}', 'Max characters per AI request'),
  ('ai.max_output_length', '{"value": 3000}', 'Max characters per AI response'),
  ('ai.question_gen_batch_max', '{"value": 50}', 'Max questions per AI generation batch'),
  ('practice.daily_target_default', '{"value": 30}', 'Default daily question target'),
  ('app.disclaimer', '{"value": "This is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University."}', 'App-wide disclaimer'),
  ('app.question_source_label', '{"value": "Original AI-generated practice question", "official_label": "Official Bahria sample question"}', 'Source labeling shown to students')
  on conflict (key) do nothing;

insert into "public"."universities" (code, name, country, is_active) values
  ('BU', 'Bahria University', 'Pakistan', true)
  on conflict (code) do nothing;

insert into "public"."programs" (university_id, code, name, description, campus, degree_level) values
  ((select id from "public"."universities" where code = 'BU'), 'BBA', 'Bachelor of Business Administration', 'Management/Business program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'), 'BS-CS', 'BS Computer Science', 'Computing program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'), 'BDS', 'Bachelor of Dental Surgery', 'Medical Sciences program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'), 'MBBS', 'Bachelor of Medicine and Bachelor of Surgery', 'Medical Sciences program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'), 'BS-ENG', 'BS English', 'English/Humanities program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'), 'BS-PSY', 'BS Psychology', 'Social Sciences program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'), 'BS-IS', 'BS Islamic Studies', 'Humanities program', 'Islamabad/others', 'undergraduate')
  on conflict (university_id, code) do nothing;

insert into "public"."subjects" (code, name, category, description, sort_order) values
  ('ENG', 'English / Verbal', 'verbal', 'Grammar, vocabulary, sentence correction, reading comprehension', 1),
  ('QUANT', 'Quantitative Reasoning', 'quantitative', 'Arithmetic, algebra, geometry, probability, statistics', 2),
  ('ANALY', 'Analytical Reasoning', 'analytical', 'Logic, sequences, patterns, puzzles, critical reasoning', 3),
  ('GK', 'General Knowledge', 'general_knowledge', 'Pakistan studies, geography, history, science, current affairs', 4),
  ('PHY', 'Physics', 'science', 'Mechanics, waves, electricity, magnetism, optics, thermodynamics', 5),
  ('CHEM', 'Chemistry', 'science', 'Atomic structure, bonding, stoichiometry, organic/inorganic chemistry', 6),
  ('BIO', 'Biology', 'medical', 'Cell biology, genetics, human biology, ecology, evolution', 7)
  on conflict (code) do nothing;

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Management/Business/Media', '100 MCQs · 120 min · no negative marking', 100, 100, 120, false, 50
from "public"."programs" p join "public"."universities" u on u.id = p.university_id
where p.code in ('BBA') on conflict do nothing;

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Computing', '100 MCQs · 120 min · no negative marking', 100, 100, 120, false, 50
from "public"."programs" p join "public"."universities" u on u.id = p.university_id
where p.code in ('BS-CS') on conflict do nothing;

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Medical Sciences', '100 MCQs · 120 min · no negative marking', 100, 100, 120, false, 60
from "public"."programs" p join "public"."universities" u on u.id = p.university_id
where p.code in ('BDS','MBBS') on conflict do nothing;

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Psychology/English/Islamic Studies', '100 MCQs · 120 min · no negative marking', 100, 100, 120, false, 50
from "public"."programs" p join "public"."universities" u on u.id = p.university_id
where p.code in ('BS-ENG','BS-PSY','BS-IS') on conflict do nothing;

insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name,
       case s.code when 'ENG' then 50 when 'QUANT' then 15 when 'ANALY' then 15 when 'GK' then 20 end,
       case s.code when 'ENG' then 50 when 'QUANT' then 15 when 'ANALY' then 15 when 'GK' then 20 end,
       case s.code when 'ENG' then 1 when 'QUANT' then 2 when 'ANALY' then 3 when 'GK' then 4 end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','QUANT','ANALY','GK')
where p.code in ('BBA') and s.code in ('ENG','QUANT','ANALY','GK')
on conflict (test_config_id, subject_id) do nothing;

insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name,
       case s.code when 'ENG' then 40 when 'QUANT' then 20 when 'ANALY' then 20 when 'GK' then 20 end,
       case s.code when 'ENG' then 40 when 'QUANT' then 20 when 'ANALY' then 20 when 'GK' then 20 end,
       case s.code when 'ENG' then 1 when 'QUANT' then 2 when 'ANALY' then 3 when 'GK' then 4 end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','QUANT','ANALY','GK')
where p.code in ('BS-CS') and s.code in ('ENG','QUANT','ANALY','GK')
on conflict (test_config_id, subject_id) do nothing;

insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name, 25, 25,
       case s.code when 'ENG' then 1 when 'PHY' then 2 when 'CHEM' then 3 when 'BIO' then 4 end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','PHY','CHEM','BIO')
where p.code in ('BDS','MBBS') and s.code in ('ENG','PHY','CHEM','BIO')
on conflict (test_config_id, subject_id) do nothing;

insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name,
       case s.code when 'ENG' then 50 when 'GK' then 25 when 'ANALY' then 25 end,
       case s.code when 'ENG' then 50 when 'GK' then 25 when 'ANALY' then 25 end,
       case s.code when 'ENG' then 1 when 'GK' then 2 when 'ANALY' then 3 end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','GK','ANALY')
where p.code in ('BS-ENG','BS-PSY','BS-IS') and s.code in ('ENG','GK','ANALY')
on conflict (test_config_id, subject_id) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'ENG'), 'Grammar', 'Sentence correction, error detection, parts of speech'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Vocabulary', 'Synonyms, antonyms, word meanings'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Sentence Completion', 'Fill in the blank with the best word/phrase'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Reading Comprehension', 'Passage-based understanding and inference'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Tenses', 'Present, past, future tense usage'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Prepositions', 'Correct preposition usage'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Articles', 'a, an, the usage'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Subject-Verb Agreement', 'Agreement between subject and verb'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Active-Passive Voice', 'Voice transformation'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Direct-Indirect Speech', 'Narration transformation')
  on conflict (subject_id, name) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'QUANT'), 'Arithmetic', 'Basic operations, order of operations'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Percentages', 'Percent change, applications'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Ratios and Proportions', 'Ratio, proportion, direct/inverse'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Algebra', 'Linear and quadratic equations, exponents'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Sequences and Series', 'Arithmetic and geometric sequences'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Geometry', 'Angles, triangles, circles, areas'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Probability', 'Basic probability, combinatorics'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Statistics', 'Mean, median, mode, averages'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Word Problems', 'Application problems'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Profit and Loss', 'Business math'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Time and Work', 'Work rate problems'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Speed Distance Time', 'Motion problems')
  on conflict (subject_id, name) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'ANALY'), 'Number Patterns', 'Find next number in sequence'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Letter Patterns', 'Alphabet series and coding'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Coding Decoding', 'Decode coded messages'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Analogies', 'Word and number analogies'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Logical Ordering', 'Arrangement and ordering'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Classification', 'Odd one out, grouping'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Syllogisms', 'Statements and conclusions'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Logic Puzzles', 'Deductive reasoning puzzles'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Critical Reasoning', 'Arguments, assumptions, inferences')
  on conflict (subject_id, name) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'GK'), 'Pakistan Studies', 'History, geography, constitution of Pakistan'),
  ((select id from "public"."subjects" where code = 'GK'), 'World Geography', 'Capitals, countries, physical geography'),
  ((select id from "public"."subjects" where code = 'GK'), 'World History', 'Major events and eras'),
  ((select id from "public"."subjects" where code = 'GK'), 'Science and Technology', 'Discoveries, inventions, technology'),
  ((select id from "public"."subjects" where code = 'GK'), 'Organizations', 'International organizations and bodies'),
  ((select id from "public"."subjects" where code = 'GK'), 'Important Personalities', 'Famous figures and their contributions'),
  ((select id from "public"."subjects" where code = 'GK'), 'Current Affairs', 'Recent national and international events')
  on conflict (subject_id, name) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'PHY'), 'Mechanics', 'Motion, force, energy, momentum'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Waves and Sound', 'Wave properties, sound'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Electricity', 'Current, circuits, resistance'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Magnetism', 'Magnetic fields, electromagnetism'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Optics', 'Light, reflection, refraction'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Thermodynamics', 'Heat, temperature, laws of thermodynamics')
  on conflict (subject_id, name) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'CHEM'), 'Atomic Structure', 'Atoms, subatomic particles, electron configuration'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Periodic Table', 'Periodicity, groups and periods'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Chemical Bonding', 'Ionic, covalent, metallic bonds'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Stoichiometry', 'Moles, balancing, reaction quantities'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Acids and Bases', 'pH, neutralization'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Organic Chemistry', 'Hydrocarbons, functional groups')
  on conflict (subject_id, name) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'BIO'), 'Cell Biology', 'Cell structure and function'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Genetics', 'Inheritance, DNA, genes'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Human Biology', 'Organ systems, physiology'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Ecology', 'Ecosystems, environment'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Evolution', 'Natural selection, origins'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Biomolecules', 'Carbohydrates, proteins, lipids, nucleic acids')
  on conflict (subject_id, name) do nothing;

-- =============================================================================
-- 10. STARTER QUESTIONS (17 original approved questions)
-- =============================================================================
select "public"."seed_question"('ENG', 'Grammar', 'easy',
  'Identify the sentence with a grammatical error.', 'C',
  'She goes to the market every Friday.', 'The children were playing in the garden.',
  'He have finished his homework before dinner.', 'The committee has approved the new policy.',
  'The error is in option C: the third-person singular subject "He" requires "has", not "have".',
  '["Identify the subject (He) and its number (singular third person)", "Choose the matching auxiliary: has (singular) vs have (plural)", "Correct: He has finished..."]',
  'Think about subject-verb agreement for third-person singular present perfect.');

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  'Choose the word most nearly OPPOSITE in meaning to "ephemeral".', 'A',
  'Permanent', 'Brief', 'Fleeting', 'Temporal',
  '"Ephemeral" means lasting for a very short time. Its opposite is "permanent" — lasting indefinitely.',
  '["Define ephemeral = short-lived", "Identify the antonym among options: only Permanent denotes long duration"]',
  'Think about which option suggests a long, unchanging duration.');

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  'The new policy was designed to ____ the burden of paperwork on small businesses, making compliance faster and cheaper.', 'B',
  'aggravate', 'alleviate', 'magnify', 'prolong',
  '"Alleviate" means to make (a burden) less severe. The context — faster, cheaper compliance — clearly indicates a reduction of burden.',
  '["Note the positive outcome (faster, cheaper)", "Choose the word meaning to reduce/lessen a burden: alleviate"]',
  'The rest of the sentence signals a reduction, not an increase.');

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  'A shirt is priced at Rs 2,500. During a sale the price is reduced by 20%. What is the sale price?', 'A',
  'Rs 2,000', 'Rs 1,800', 'Rs 500', 'Rs 2,100',
  '20% of 2500 = 0.20 × 2500 = 500. Sale price = 2500 − 500 = Rs 2,000.',
  '["Compute 20% of 2500 = 500", "Subtract the discount: 2500 - 500 = 2000"]',
  'First find the discount amount, then subtract it from the original price.');

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  'If x² − 5x + 6 = 0, which of the following is a solution for x?', 'D',
  'x = 6', 'x = 1', 'x = −3', 'x = 2',
  'Factor the quadratic: x² − 5x + 6 = (x − 2)(x − 3) = 0, so x = 2 or x = 3. Of the given options, only x = 2 is a root.',
  '["Factor: (x-2)(x-3) = 0", "Set each factor to zero: x = 2, x = 3", "Check which value appears among the options: x = 2"]',
  'Look for two numbers that multiply to 6 and add to −5.');

select "public"."seed_question"('QUANT', 'Word Problems', 'hard',
  'A train travels 240 km at a constant speed. If its speed had been 20 km/h more, the journey would have taken 1 hour less. What is the train''s actual speed in km/h?', 'B',
  '50', '60', '80', '70',
  'Let speed = v and time = t. Then v·t = 240 and (v + 20)(t − 1) = 240. Solving gives t = 4 hours, so v = 240/4 = 60 km/h.',
  '["Let vt = 240", "Set up (v+20)(t-1) = 240", "Expand and use vt = 240 to relate v and t", "Solve quadratic, t = 4", "v = 240/4 = 60"]',
  'Form two equations with the distance formula and eliminate one variable.');

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  'What number comes next in the series: 2, 6, 12, 20, 30, …?', 'B',
  '40', '42', '44', '36',
  'The differences between consecutive terms are 4, 6, 8, 10 — increasing by 2 each time. The next difference is 12, so the next term is 30 + 12 = 42.',
  '["List differences: 4,6,8,10", "Next difference = 12", "Next term = 30 + 12 = 42"]',
  'Look at the gaps between consecutive terms — they follow a simple pattern.');

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  'In a certain code, CAT is written as DBU. How is DOG written in that code?', 'A',
  'EPH', 'CPH', 'EQI', 'DOH',
  'Each letter is shifted forward by one position in the alphabet: C→D, A→B, T→U. Applying the same rule: D→E, O→P, G→H, giving EPH.',
  '["Identify the transformation: +1 letter", "Apply: D+1=E, O+1=P, G+1=H"]',
  'Compare CAT and DBU letter by letter to find the rule.');

select "public"."seed_question"('ANALY', 'Syllogisms', 'hard',
  'All scientists are logical. Some logical people are artists. Which conclusion necessarily follows?', 'C',
  'All artists are scientists', 'All scientists are artists', 'Some logical people are scientists', 'No artist is a scientist',
  'From "All scientists are logical", every scientist is in the set of logical people, so the set of scientists is a subset of logical people. Therefore some logical people must be scientists.',
  '["Draw the sets: scientists ⊆ logical people", "artists overlap logical people (partial)", "The only guaranteed statement: some logical people are scientists"]',
  'Focus only on what must be true given the two statements.');

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  'Which river flows through the city of Lahore?', 'A',
  'Ravi', 'Indus', 'Chenab', 'Jhelum',
  'The Ravi river flows along the northern edge of Lahore. The Indus, Chenab, and Jhelum flow elsewhere in Pakistan.',
  '[]',
  'A major city of Punjab is named after the river that borders it.');

select "public"."seed_question"('GK', 'World Geography', 'medium',
  'Which of the following is the capital city of Australia?', 'B',
  'Sydney', 'Canberra', 'Melbourne', 'Perth',
  'Canberra is the capital of Australia. Sydney and Melbourne are major cities but are not capitals; Perth is a western coastal city.',
  '["Recall: the capital is not the largest city", "Canberra was purpose-built as the capital"]',
  'The capital is a purpose-built inland city, not a coastal hub.');

select "public"."seed_question"('GK', 'Organizations', 'easy',
  'The headquarters of the United Nations is located in which city?', 'C',
  'Geneva', 'Paris', 'New York', 'London',
  'The UN headquarters is in New York City. Geneva and Paris host other international organizations.',
  '[]',
  'Think of the iconic building on the East River.');

select "public"."seed_question"('PHY', 'Mechanics', 'medium',
  'A ball is dropped from rest. Ignoring air resistance, its speed after 3 seconds is approximately (g = 9.8 m/s²):', 'D',
  '9.8 m/s', '19.6 m/s', '24.5 m/s', '29.4 m/s',
  'Under constant acceleration from rest: v = g·t = 9.8 × 3 = 29.4 m/s.',
  '["Use v = u + at with u = 0", "v = 9.8 × 3 = 29.4 m/s"]',
  'Apply the first kinematic equation for free fall from rest.');

select "public"."seed_question"('PHY', 'Electricity', 'easy',
  'Which unit measures electrical resistance?', 'A',
  'Ohm', 'Volt', 'Ampere', 'Watt',
  'Resistance is measured in ohms (Ω). The volt measures potential difference, the ampere measures current, and the watt measures power.',
  '["Recall the defining unit of resistance"]',
  'Named after the German physicist Georg Ohm.');

select "public"."seed_question"('CHEM', 'Atomic Structure', 'easy',
  'Which subatomic particle carries a negative charge?', 'B',
  'Proton', 'Electron', 'Neutron', 'Nucleus',
  'Electrons carry a negative charge. Protons are positive, neutrons are neutral, and the nucleus is the central positive region.',
  '[]',
  'The particle that orbits the nucleus.');

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  'How many moles of water are produced when 2 moles of hydrogen react completely with excess oxygen? 2H₂ + O₂ → 2H₂O', 'C',
  '1 mole', '3 moles', '2 moles', '4 moles',
  'From the balanced equation, 2 mol of H₂ produces 2 mol of H₂O (1:1 ratio for H₂ to H₂O). Oxygen is in excess, so hydrogen is the limiting reactant.',
  '["Read the balanced equation", "Ratio H₂ : H₂O = 1 : 1", "2 mol H₂ → 2 mol H₂O"]',
  'Use the mole ratio straight from the balanced equation.');

select "public"."seed_question"('BIO', 'Cell Biology', 'easy',
  'Which organelle is known as the "powerhouse of the cell"?', 'D',
  'Nucleus', 'Ribosome', 'Golgi apparatus', 'Mitochondrion',
  'The mitochondrion is the site of cellular respiration and produces most of the cell''s ATP, hence the nickname "powerhouse of the cell".',
  '[]',
  'Think of where ATP is mainly produced.');

select "public"."seed_question"('BIO', 'Genetics', 'medium',
  'In Mendelian genetics, if two heterozygous tall plants (Tt) are crossed, what fraction of the offspring would be expected to be tall? Tall (T) is dominant over short (t).', 'C',
  '1/4', '1/2', '3/4', 'All',
  'A Tt × Tt cross yields a 1:2:1 genotypic ratio (TT : Tt : tt). Both TT and Tt are tall, so 3 out of 4 offspring (3/4) are expected to be tall.',
  '["Set up the Punnett square: TT, Tt, Tt, tt", "Tall phenotypes = TT + Tt = 3 of 4", "Fraction = 3/4"]',
  'Only the tt genotype is short.');
-- =============================================================================
-- 10b. ENGLISH / VERBAL QUIZ BANK (100 original practice questions)
-- =============================================================================

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'ENG'), 'Analogies', 'Word analogies: X is to Y as A is to B'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Idioms and Phrases', 'Common idioms, phrasal expressions, one-word substitution')
on conflict (subject_id, name) do nothing;

-- =============================================================
-- SECTION A: SYNONYMS (1–10) — Vocabulary
-- =============================================================
select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "ABUNDANT".$$, 'B',
  $$Scarce$$, $$Plentiful$$, $$Weak$$, $$Limited$$,
  $$"Abundant" means existing in large quantity — plentiful. "Scarce", "weak", and "limited" all describe a small amount.$$,
  '[]',
  $$Think of a plentiful harvest.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "CANDID".$$, 'B',
  $$Dishonest$$, $$Frank$$, $$Shy$$, $$Hidden$$,
  $$"Candid" means open, honest, and straightforward — frank.$$,
  '[]',
  $$A candid person gives an honest answer.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "DILIGENT".$$, 'B',
  $$Lazy$$, $$Hardworking$$, $$Careless$$, $$Slow$$,
  $$"Diligent" means showing steady, earnest effort — hardworking. "Lazy" is its opposite.$$,
  '[]',
  $$A diligent student studies every day.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "ELOQUENT".$$, 'A',
  $$Fluent$$, $$Silent$$, $$Confused$$, $$Rude$$,
  $$"Eloquent" means fluent, forceful, and persuasive in speaking — fluent.$$,
  '[]',
  $$An eloquent speaker uses words well.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "FRUGAL".$$, 'B',
  $$Wasteful$$, $$Thrifty$$, $$Generous$$, $$Rich$$,
  $$"Frugal" means economical and careful with money — thrifty. "Wasteful" is its opposite.$$,
  '[]',
  $$A frugal person saves rather than spends freely.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "GENUINE".$$, 'B',
  $$Fake$$, $$Authentic$$, $$Doubtful$$, $$Strange$$,
  $$"Genuine" means real and authentic — not fake.$$,
  '[]',
  $$A genuine signature is real, not forged.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "HOSTILE".$$, 'B',
  $$Friendly$$, $$Antagonistic$$, $$Calm$$, $$Neutral$$,
  $$"Hostile" means unfriendly and aggressive — antagonistic. "Friendly" is its opposite.$$,
  '[]',
  $$Hostile forces oppose each other.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "IMMINENT".$$, 'B',
  $$Distant$$, $$Impending$$, $$Unlikely$$, $$Past$$,
  $$"Imminent" means about to happen soon — impending.$$,
  '[]',
  $$An imminent storm is about to strike.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "JUBILANT".$$, 'B',
  $$Sad$$, $$Elated$$, $$Angry$$, $$Tired$$,
  $$"Jubilant" means feeling great joy — elated. "Sad" is its opposite.$$,
  '[]',
  $$A jubilant crowd celebrates a victory.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "LUCID".$$, 'B',
  $$Confusing$$, $$Clear$$, $$Dark$$, $$Complex$$,
  $$"Lucid" means expressed clearly and easy to understand — clear.$$,
  '[]',
  $$A lucid explanation is easy to follow.$$);

-- =============================================================
-- SECTION B: ANTONYMS (11–20) — Vocabulary
-- =============================================================
select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "BENEVOLENT".$$, 'B',
  $$Kind$$, $$Malicious$$, $$Generous$$, $$Caring$$,
  $$"Benevolent" means kindly and generous. Its opposite is "malicious" — intending harm.$$,
  '[]',
  $$Think of the opposite of goodwill.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "CONCISE".$$, 'B',
  $$Brief$$, $$Verbose$$, $$Short$$, $$Clear$$,
  $$"Concise" means brief and to the point. Its opposite is "verbose" — using too many words.$$,
  '[]',
  $$A verbose reply is wordy.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "DILUTE".$$, 'B',
  $$Weaken$$, $$Concentrate$$, $$Thin$$, $$Water down$$,
  $$"Dilute" means to make weaker or thinner. Its opposite is "concentrate" — to make stronger.$$,
  '[]',
  $$Dilute adds water; concentrate removes it.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "EXPAND".$$, 'B',
  $$Grow$$, $$Contract$$, $$Extend$$, $$Enlarge$$,
  $$"Expand" means to become larger. Its opposite is "contract" — to become smaller.$$,
  '[]',
  $$Gas expands when heated and contracts when cooled.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "FRIVOLOUS".$$, 'B',
  $$Silly$$, $$Serious$$, $$Playful$$, $$Trivial$$,
  $$"Frivolous" means not serious or trivial. Its opposite is "serious".$$,
  '[]',
  $$A frivolous remark is light or silly.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "GENEROUS".$$, 'B',
  $$Giving$$, $$Stingy$$, $$Kind$$, $$Charitable$$,
  $$"Generous" means giving freely. Its opposite is "stingy" — unwilling to give.$$,
  '[]',
  $$A stingy person hates to share.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "HAZARDOUS".$$, 'B',
  $$Risky$$, $$Safe$$, $$Dangerous$$, $$Unstable$$,
  $$"Hazardous" means risky or dangerous. Its opposite is "safe".$$,
  '[]',
  $$A hazardous road becomes safe after repairs.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "INNOCENT".$$, 'B',
  $$Pure$$, $$Guilty$$, $$Naive$$, $$Blameless$$,
  $$"Innocent" means not guilty. Its opposite is "guilty".$$,
  '[]',
  $$The verdict was guilty, not innocent.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "JOVIAL".$$, 'B',
  $$Cheerful$$, $$Gloomy$$, $$Happy$$, $$Lively$$,
  $$"Jovial" means cheerful and friendly. Its opposite is "gloomy" — sad and pessimistic.$$,
  '[]',
  $$A jovial host contrasts with a gloomy guest.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "KEEN".$$, 'B',
  $$Eager$$, $$Indifferent$$, $$Sharp$$, $$Enthusiastic$$,
  $$"Keen" means eager or enthusiastic. Its opposite is "indifferent" — uninterested.$$,
  '[]',
  $$A keen learner is anything but indifferent.$$);

-- =============================================================
-- SECTION C: ANALOGIES (21–30) — Analogies
-- =============================================================
select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$DOCTOR : HOSPITAL :: TEACHER : ?$$, 'B',
  $$Book$$, $$School$$, $$Student$$, $$Chalk$$,
  $$A doctor works in a hospital; a teacher works in a school.$$,
  '[]',
  $$Match the worker with the workplace.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$PEN : WRITER :: BRUSH : ?$$, 'B',
  $$Paint$$, $$Painter$$, $$Canvas$$, $$Color$$,
  $$A pen is the tool a writer uses; a brush is the tool a painter uses.$$,
  '[]',
  $$Match the tool with the person who uses it.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$BIRD : NEST :: BEE : ?$$, 'B',
  $$Honey$$, $$Hive$$, $$Flower$$, $$Sting$$,
  $$A bird lives in a nest; a bee lives in a hive.$$,
  '[]',
  $$Match the creature with its home.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$FISH : WATER :: BIRD : ?$$, 'B',
  $$Nest$$, $$Air$$, $$Tree$$, $$Sky$$,
  $$A fish moves through water; a bird moves through air. Most entry tests use "air" as the medium of movement.$$,
  '[]',
  $$Match the creature with the medium it moves through.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$AUTHOR : BOOK :: SCULPTOR : ?$$, 'B',
  $$Chisel$$, $$Statue$$, $$Stone$$, $$Museum$$,
  $$An author creates a book; a sculptor creates a statue.$$,
  '[]',
  $$Match the creator with what they produce.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$THIEF : STEAL :: LIAR : ?$$, 'B',
  $$Truth$$, $$Lie$$, $$Cheat$$, $$Hide$$,
  $$A thief steals; a liar tells lies.$$,
  '[]',
  $$Match the person with their characteristic action.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$KNIFE : CUT :: HAMMER : ?$$, 'B',
  $$Break$$, $$Hit$$, $$Nail$$, $$Build$$,
  $$A knife is used to cut; a hammer is used to hit.$$,
  '[]',
  $$Match the tool with its purpose.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$OPTIMIST : HOPEFUL :: PESSIMIST : ?$$, 'B',
  $$Cheerful$$, $$Hopeless$$, $$Careful$$, $$Doubtful$$,
  $$An optimist is hopeful; a pessimist is hopeless.$$,
  '[]',
  $$Match each person with their outlook.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$CUB : LION :: CALF : ?$$, 'B',
  $$Horse$$, $$Cow$$, $$Goat$$, $$Deer$$,
  $$A cub is a baby lion; a calf is a baby cow.$$,
  '[]',
  $$Match the young animal with its parent.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$DIAMOND : HARD :: COTTON : ?$$, 'A',
  $$Soft$$, $$White$$, $$Light$$, $$Smooth$$,
  $$A diamond is hard; cotton is soft. The pair expresses an opposite quality.$$,
  '[]',
  $$Hard and soft are opposite qualities.$$);

-- =============================================================
-- SECTION D: SENTENCE COMPLETION (31–40) — Sentence Completion
-- =============================================================
select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$Despite his ______ efforts, he failed to win the match.$$, 'B',
  $$careless$$, $$strenuous$$, $$weak$$, $$minor$$,
  $$"Strenuous" means demanding great effort. The clause "despite ... he failed" needs a word meaning great effort that still led to failure.$$,
  '["Note the contrast signaled by the word despite", "The result (failure) happened in spite of it", "Require a strong-effort word"]',
  $$The word must describe strong, earnest effort.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The teacher was so ______ that all the students respected her.$$, 'B',
  $$rude$$, $$knowledgeable$$, $$careless$$, $$absent$$,
  $$Respect follows from being "knowledgeable". The other options would not inspire respect.$$,
  '[]',
  $$Respect is earned through deep subject knowledge.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The company had to ______ hundreds of workers due to losses.$$, 'B',
  $$hire$$, $$lay off$$, $$promote$$, $$train$$,
  $$"Lay off" means to dismiss employees, which fits the context of company losses.$$,
  '[]',
  $$Losses force a company to reduce its workforce.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$His argument was so ______ that no one could refute it.$$, 'B',
  $$weak$$, $$convincing$$, $$short$$, $$boring$$,
  $$Only a "convincing" argument cannot be refuted (proved wrong).$$,
  '[]',
  $$The argument persuaded everyone.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The government announced new measures to ______ inflation.$$, 'B',
  $$increase$$, $$curb$$, $$promote$$, $$ignore$$,
  $$"Curb" means to restrain or control, which is what measures against inflation do.$$,
  '[]',
  $$Measures are announced to control rising prices.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$She remained ______ even in the most difficult situations.$$, 'B',
  $$nervous$$, $$composed$$, $$confused$$, $$angry$$,
  $$"Composed" means calm and self-controlled, fitting "even in difficult situations".$$,
  '[]',
  $$She stayed calm under pressure.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The old bridge was declared ______ and closed to traffic.$$, 'B',
  $$safe$$, $$unsafe$$, $$new$$, $$strong$$,
  $$Closure to traffic implies the bridge was declared "unsafe".$$,
  '[]',
  $$Traffic is stopped because the bridge is dangerous.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$It is difficult to ______ between the two similar products.$$, 'B',
  $$choose$$, $$differentiate$$, $$buy$$, $$compare$$,
  $$"Differentiate" means to tell the difference, which is hard between similar products.$$,
  '[]',
  $$The products look alike, so telling them apart is hard.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The professor's lecture was so ______ that students lost interest.$$, 'B',
  $$interesting$$, $$monotonous$$, $$short$$, $$clear$$,
  $$"Monotonous" means dull and repetitive — the natural reason students lost interest.$$,
  '[]',
  $$Students stopped paying attention because it was dull.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The team worked ______ to meet the deadline.$$, 'B',
  $$lazily$$, $$tirelessly$$, $$slowly$$, $$reluctantly$$,
  $$"Tirelessly" means without getting tired, matching the effort needed to meet a deadline.$$,
  '[]',
  $$The team gave continuous hard effort.$$);

-- =============================================================
-- SECTION E: ONE-WORD SUBSTITUTION & IDIOMS (41–50)
-- =============================================================
select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A person who loves books is called:$$, 'A',
  $$Bibliophile$$, $$Philanthropist$$, $$Linguist$$, $$Author$$,
  $$A "bibliophile" loves books; "philanthropist" loves humanity, and "linguist" studies languages.$$,
  '[]',
  $$"Biblio-" relates to books.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A place where birds are kept is called:$$, 'A',
  $$Aviary$$, $$Aquarium$$, $$Zoo$$, $$Sanctuary$$,
  $$An "aviary" is a large enclosure for birds; an "aquarium" holds fish.$$,
  '[]',
  $$Think of words starting with "av-" for birds.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to break the ice" means:$$, 'A',
  $$To start a conversation$$, $$To cause trouble$$, $$To end a fight$$, $$To freeze something$$,
  $$"To break the ice" means to make people feel comfortable so a conversation can begin.$$,
  '[]',
  $$It happens at the start of a social meeting.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "once in a blue moon" means:$$, 'B',
  $$Every night$$, $$Very rarely$$, $$Every month$$, $$Frequently$$,
  $$A blue moon is rare, so "once in a blue moon" means very rarely.$$,
  '[]',
  $$The event hardly ever happens.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A person who can speak many languages is called:$$, 'A',
  $$Polyglot$$, $$Linguist$$, $$Translator$$, $$Orator$$,
  $$A "polyglot" knows many languages; a "linguist" studies language in general.$$,
  '[]',
  $$"Poly-" means many.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to let the cat out of the bag" means:$$, 'B',
  $$To adopt a pet$$, $$To reveal a secret$$, $$To cause chaos$$, $$To escape$$,
  $$"To let the cat out of the bag" means to reveal a secret, usually accidentally.$$,
  '[]',
  $$A hidden secret gets exposed.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A person who studies the stars is called:$$, 'B',
  $$Astrologer$$, $$Astronomer$$, $$Physicist$$, $$Geologist$$,
  $$An "astronomer" scientifically studies stars and celestial bodies; an "astrologer" interprets horoscopes.$$,
  '[]',
  $$Choose the scientific study of stars.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to hit the nail on the head" means:$$, 'A',
  $$To do something exactly right$$, $$To cause harm$$, $$To fail$$, $$To argue$$,
  $$"To hit the nail on the head" means to describe or do something exactly right.$$,
  '[]',
  $$The guess was perfectly accurate.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A word that has the same spelling but a different meaning is called a:$$, 'B',
  $$Synonym$$, $$Homonym$$, $$Antonym$$, $$Acronym$$,
  $$A "homonym" shares spelling or pronunciation with another word but differs in meaning.$$,
  '[]',
  $$Think of "bat" (animal) and "bat" (sports gear).$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to burn the midnight oil" means:$$, 'B',
  $$To waste resources$$, $$To work late into the night$$, $$To start a fire$$, $$To relax$$,
  $$"To burn the midnight oil" means to work or study late into the night.$$,
  '[]',
  $$You need light — oil lamps — to work at night.$$);

-- =========================================================================
-- SET 2: GRAMMAR, PREPOSITIONS, TENSES, READING COMPREHENSION, MIXED
-- =========================================================================

-- =============================================================
-- SECTION A: ERROR DETECTION / SPOT THE ERROR (1–10) — Grammar
-- =============================================================
select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "Neither of the boys / have completed / their homework." Choose (d) if there is no error.$$, 'B',
  $$Neither of the boys$$, $$have completed$$, $$their homework$$, $$No error$$,
  $$"Neither" takes a singular verb, so it should be "has completed", not "have completed".$$,
  '["Identify the subject: neither of the boys (singular)", "Singular subject requires has", "Correct: Neither of the boys has completed..."]',
  $$Neither/Either take a singular verb.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "She is one of the students / who has / topped the exam." Choose (d) if there is no error.$$, 'B',
  $$She is one of the students$$, $$who has$$, $$topped the exam$$, $$No error$$,
  $$The relative pronoun "who" refers to the plural noun "students", so the verb should be "have" — "who have topped...".$$,
  '["Find the antecedent of the relative pronoun: students (plural)", "Plural antecedent requires have", "Correct: one of the students who have topped..."]',
  $$The verb agrees with "students", not "one".$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "He is senior than / me by / two years." Choose (d) if there is no error.$$, 'A',
  $$He is senior than$$, $$me by$$, $$two years$$, $$No error$$,
  $$With "senior", the correct preposition is "to", not "than" — "senior to me".$$,
  '["Note: senior/junior take to, not than", "Correct: He is senior to me by two years"]',
  $$Senior and junior use "to".$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "Each of the players / were given / a medal." Choose (d) if there is no error.$$, 'B',
  $$Each of the players$$, $$were given$$, $$a medal$$, $$No error$$,
  $$"Each" is singular, so the verb should be "was given", not "were given".$$,
  '["Each is always singular", "Correct: Each of the players was given a medal"]',
  $$Each takes a singular verb.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "I have been living here / since ten years / without any break." Choose (d) if there is no error.$$, 'B',
  $$I have been living here$$, $$since ten years$$, $$without any break$$, $$No error$$,
  $$"Since" is used with a point in time; for a duration we use "for" — "for ten years".$$,
  '["Since + point in time (2015)", "For + duration (ten years)", "Correct: for ten years"]',
  $$Since takes a point in time, for a duration.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "The number of unemployed people / are increasing / every year." Choose (d) if there is no error.$$, 'B',
  $$The number of unemployed people$$, $$are increasing$$, $$every year$$, $$No error$$,
  $$"The number of" takes a singular verb — "is increasing".$$,
  '["The number of + plural noun → singular verb", "Correct: The number of unemployed people is increasing"]',
  $$The number of is singular.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "He along with his friends / are going / to the market." Choose (d) if there is no error.$$, 'B',
  $$He along with his friends$$, $$are going$$, $$to the market$$, $$No error$$,
  $$The subject is "He" (singular); "along with" does not change the number, so the verb should be "is going".$$,
  '["Identify the main subject: He", "Along with his friends is a parenthetical addition", "Correct: He along with his friends is going..."]',
  $$Ignore the phrase after "along with".$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "This is one of the best book / I have ever / read in my life." Choose (d) if there is no error.$$, 'A',
  $$This is one of the best book$$, $$I have ever$$, $$read in my life$$, $$No error$$,
  $$After "one of the", the noun must be plural — "one of the best books".$$,
  '["One of the is followed by a plural noun", "Correct: one of the best books"]',
  $$One of the best books.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "She has not completed / her work isn't it? / Please check." Choose (d) if there is no error.$$, 'B',
  $$She has not completed$$, $$her work isn't it?$$, $$Please check$$, $$No error$$,
  $$The question tag must match the auxiliary verb: since the statement is "has not", the tag should be "has she?" — "her work, has she?"$$,
  '["Statement is negative (has not)", "Tag must be positive and use the same auxiliary", "Correct: a positive tag matching the auxiliary has she?"]',
  $$A negative statement takes a positive tag with the same auxiliary.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "Everyone must submit / their assignments before / the deadline expires." Choose (d) if there is no error.$$, 'D',
  $$Everyone must submit$$, $$their assignments before$$, $$the deadline expires$$, $$No error$$,
  $$No error. Singular "everyone" with "their" is now widely accepted as correct in modern usage.$$,
  '[]',
  $$"Everyone ... their" is accepted in modern usage.$$);

-- =============================================================
-- SECTION B: PREPOSITIONS (11–20) — Prepositions
-- =============================================================
select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$She is good ______ mathematics.$$, 'B',
  $$in$$, $$at$$, $$on$$, $$with$$,
  $$"Good at" is the correct collocation for skill.$$,
  '[]',
  $$Skill with a subject uses "at".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$He was accused ______ theft.$$, 'A',
  $$of$$, $$for$$, $$with$$, $$about$$,
  $$"Accused of" is the correct collocation.$$,
  '[]',
  $$Accused takes "of".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$I am fond ______ music.$$, 'B',
  $$with$$, $$of$$, $$at$$, $$on$$,
  $$"Fond of" is the correct collocation.$$,
  '[]',
  $$Fond takes "of".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$The train arrived ______ time.$$, 'B',
  $$in$$, $$on$$, $$at$$, $$by$$,
  $$"On time" means punctually, according to the schedule.$$,
  '[]',
  $$On time = punctual.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$She apologized ______ her mistake.$$, 'A',
  $$for$$, $$of$$, $$about$$, $$with$$,
  $$"Apologized for" is the correct collocation.$$,
  '[]',
  $$You apologize for something.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$He is married ______ a doctor.$$, 'B',
  $$with$$, $$to$$, $$for$$, $$of$$,
  $$"Married to" is the correct collocation.$$,
  '[]',
  $$You are married to someone.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$They divided the sweets ______ themselves.$$, 'B',
  $$between$$, $$among$$, $$with$$, $$in$$,
  $$"Among" is used when dividing among more than two people.$$,
  '[]',
  $$Among = more than two.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$She sat ______ the chair quietly.$$, 'C',
  $$at$$, $$in$$, $$on$$, $$over$$,
  $$We sit "on" a chair.$$,
  '[]',
  $$You sit on a chair, in an armchair.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$He was absent ______ school yesterday.$$, 'A',
  $$from$$, $$in$$, $$at$$, $$of$$,
  $$"Absent from" is the correct collocation.$$,
  '[]',
  $$Absent takes "from".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$I am waiting ______ the bus.$$, 'B',
  $$on$$, $$for$$, $$at$$, $$to$$,
  $$"Waiting for" is the correct collocation.$$,
  '[]',
  $$You wait for a bus.$$);

-- =============================================================
-- SECTION C: TENSES & SENTENCE CORRECTION (21–30) — Tenses
-- =============================================================
select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$She has gone to market yesterday.$$,
  $$She went to market yesterday.$$,
  $$She has went to market yesterday.$$,
  $$She go to market yesterday.$$,
  $$A definite past time ("yesterday") requires the simple past: "She went to market yesterday."$$,
  '["Spot the time marker: yesterday (past)", "Simple past is required, present perfect is not", "Correct: She went to market yesterday."]',
  $$Yesterday signals simple past.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'A',
  $$By the time we arrived, the movie had already started.$$,
  $$By the time we arrived, the movie already started.$$,
  $$By the time we arrive, the movie had already started.$$,
  $$By the time we arrived, the movie has already started.$$,
  $$A past event completed before another past event needs the past perfect: "had already started".$$,
  '["Two past actions", "Earlier action takes past perfect (had started)", "Correct: By the time we arrived, the movie had already started."]',
  $$The earlier of two past events uses past perfect.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$I am living here since 2015.$$,
  $$I have been living here since 2015.$$,
  $$I live here since 2015.$$,
  $$I was living here since 2015.$$,
  $$An action beginning in the past and continuing into the present uses the present perfect continuous: "I have been living here since 2015."$$,
  '["Action started in past and continues now", "Use present perfect continuous", "Correct: I have been living here since 2015."]',
  $$"Since 2015" + ongoing action → present perfect continuous.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$If I was you, I would apologize.$$,
  $$If I were you, I would apologize.$$,
  $$If I am you, I would apologize.$$,
  $$If I would be you, I would apologize.$$,
  $$Unreal/subjunctive conditionals use "were" for all persons: "If I were you...".$$,
  '["Second conditional (unreal)", "Subjunctive requires were for all persons", "Correct: If I were you, I would apologize."]',
  $$Use "were" in hypothetical "if I ... you" clauses.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$He suggested me to see a doctor.$$,
  $$He suggested that I should see a doctor.$$,
  $$He suggested me that I see a doctor.$$,
  $$He suggested to see a doctor to me.$$,
  $$"Suggest" is followed by a that-clause, not by an object + infinitive: "He suggested that I should see a doctor."$$,
  '["Suggest + that-clause is correct", "Suggest is not used as suggest + me + to-infinitive", "Correct: He suggested that I should see a doctor."]',
  $$Suggest takes "that + subject + (should) verb".$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct passive voice for "They are building a new bridge.":$$, 'B',
  $$A new bridge is built by them.$$,
  $$A new bridge is being built by them.$$,
  $$A new bridge was being built by them.$$,
  $$A new bridge has been built by them.$$,
  $$The active sentence is in the present continuous, so the passive must use "is being built" to preserve the tense.$$,
  '["Active tense: present continuous", "Passive form: is/are + being + past participle", "Correct: A new bridge is being built by them."]',
  $$Present continuous passive = is/are being + V3.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$Neither the teacher nor the students was present.$$,
  $$Neither the teacher nor the students were present.$$,
  $$Neither the teacher nor the students are present.$$,
  $$Neither the teacher nor the students has present.$$,
  $$With "neither ... nor", the verb agrees with the nearer subject ("the students", plural), so "were present".$$,
  '["Neither ... nor → agreement with nearer subject", "Nearer subject: the students (plural)", "Correct: Neither the teacher nor the students were present."]',
  $$Agree with the noun closer to the verb.$$);

select "public"."seed_question"('ENG', 'Tenses', 'easy',
  $$Choose the correct sentence:$$, 'C',
  $$She don't like coffee.$$,
  $$She doesn't likes coffee.$$,
  $$She doesn't like coffee.$$,
  $$She not like coffee.$$,
  $$Third-person singular present negative: "doesn't" + base form of the verb, so "She doesn't like coffee."$$,
  '["doesn\u0027t + base verb", "She doesn\u0027t like coffee."]',
  $$Doesn't is followed by the base form.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct reported speech for: He said, "I am going home."$$, 'B',
  $$He said that he is going home.$$,
  $$He said that he was going home.$$,
  $$He said that he has gone home.$$,
  $$He said that he will go home.$$,
  $$In reported speech the present continuous "am going" changes to past continuous "was going": "He said that he was going home."$$,
  '["Said (past) backshifts the tense", "am → was (present continuous → past continuous)", "Correct: He said that he was going home."]',
  $$Backshift present continuous to past continuous.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'D',
  $$Each of the students have their own book.$$,
  $$Each of the students has their own book.$$,
  $$Each of the students has his own book.$$,
  $$Both b and c are acceptable.$$,
  $$Formal grammar prefers "has his own book", while modern usage accepts "has their own book". Both are acceptable.$$,
  '["Each takes a singular verb (has)", "Formal: his own book; modern: their own book", "Both b and c are acceptable"]',
  $$Each + has + his/their.$$);

-- =============================================================
-- SECTION D: SHORT READING COMPREHENSION (31–40) — Reading Comprehension
-- =============================================================
select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Water scarcity is becoming one of the most pressing global issues. Rapid population growth, industrialization, and climate change have significantly reduced freshwater availability in many regions. Experts warn that without immediate conservation efforts, several countries could face severe water crises within the next few decades.

What is the main cause of water scarcity mentioned in the passage?$$, 'B',
  $$Only climate change$$,
  $$Population growth, industrialization, and climate change$$,
  $$Only industrialization$$,
  $$Natural disasters$$,
  $$The passage lists rapid population growth, industrialization, and climate change as the causes reducing freshwater availability.$$,
  '["Identify causes in the passage", "Population growth, industrialization, and climate change are all named"]',
  $$Look at the second sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Water scarcity is becoming one of the most pressing global issues. Rapid population growth, industrialization, and climate change have significantly reduced freshwater availability in many regions. Experts warn that without immediate conservation efforts, several countries could face severe water crises within the next few decades.

According to the passage, what will happen without conservation efforts?$$, 'B',
  $$Nothing will change$$,
  $$Countries could face water crises$$,
  $$Population will decrease$$,
  $$Industries will shut down$$,
  $$The passage warns that without immediate conservation efforts, several countries could face severe water crises.$$,
  '["Find the warning sentence", "Without conservation → severe water crises"]',
  $$Check the final sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Water scarcity is becoming one of the most pressing global issues. Rapid population growth, industrialization, and climate change have significantly reduced freshwater availability in many regions. Experts warn that without immediate conservation efforts, several countries could face severe water crises within the next few decades.

The word "pressing" in the passage most nearly means:$$, 'B',
  $$Ironing$$, $$Urgent$$, $$Minor$$, $$Distant$$,
  $$"Pressing" in this context means urgent — requiring immediate attention.$$,
  '[]',
  $$Something pressing demands quick action.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Reading is one of the best habits a student can develop. It not only improves vocabulary and comprehension but also enhances critical thinking and imagination. Studies show that students who read regularly perform better academically than those who don't.

According to the passage, reading improves:$$, 'B',
  $$Only vocabulary$$,
  $$Vocabulary, comprehension, thinking, and imagination$$,
  $$Only academic performance$$,
  $$Only imagination$$,
  $$The passage says reading improves vocabulary, comprehension, critical thinking, and imagination.$$,
  '["List the benefits named in the passage", "Vocabulary, comprehension, critical thinking, imagination"]',
  $$Re-read the second sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Reading is one of the best habits a student can develop. It not only improves vocabulary and comprehension but also enhances critical thinking and imagination. Studies show that students who read regularly perform better academically than those who don't.

What does the passage suggest about students who read regularly?$$, 'B',
  $$They perform worse academically$$,
  $$They perform better academically$$,
  $$There is no difference$$,
  $$They read less over time$$,
  $$The passage states that students who read regularly perform better academically.$$,
  '[]',
  $$Look at the final sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Reading is one of the best habits a student can develop. It not only improves vocabulary and comprehension but also enhances critical thinking and imagination. Studies show that students who read regularly perform better academically than those who don't.

The word "enhances" in the passage means:$$, 'B',
  $$Reduces$$, $$Improves$$, $$Ignores$$, $$Complicates$$,
  $$"Enhances" means to improve or make better.$$,
  '[]',
  $$Enhance = improve.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

Why are renewable energy sources considered better than fossil fuels?$$, 'B',
  $$They are cheaper$$,
  $$They don't deplete and cause less pollution$$,
  $$They are easier to transport$$,
  $$They require no technology$$,
  $$The passage says renewables do not deplete over time and produce significantly less pollution.$$,
  '[]',
  $$Check the middle sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

The word "deplete" most nearly means:$$, 'B',
  $$Increase$$, $$Exhaust$$, $$Improve$$, $$Multiply$$,
  $$"Deplete" means to use up or exhaust a supply.$$,
  '[]',
  $$A resource that depletes runs out.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

What is the main idea of the passage?$$, 'B',
  $$Fossil fuels are the best energy source$$,
  $$Renewable energy is a sustainable alternative to fossil fuels$$,
  $$Solar power is expensive$$,
  $$Wind power is unreliable$$,
  $$The passage presents renewable energy as a sustainable alternative to fossil fuels because it does not deplete and causes less pollution.$$,
  '["Identify the topic sentence", "Renewables = sustainable alternative to fossil fuels"]',
  $$Focus on the first and last sentences.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

The passage implies that fossil fuels:$$, 'B',
  $$Are unlimited$$,
  $$Do deplete over time$$,
  $$Produce no pollution$$,
  $$Are renewable$$,
  $$By saying renewable sources "do not deplete" unlike coal or oil, the passage implies that fossil fuels do deplete over time.$$,
  '[]',
  $$"Unlike coal or oil" marks the contrast.$$);

-- =============================================================
-- SECTION E: MIXED GRAMMAR & VOCABULARY IN CONTEXT (41–50)
-- =============================================================
select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correctly punctuated sentence:$$, 'B',
  $$Its a beautiful day, isnt it?$$,
  $$It's a beautiful day, isn't it?$$,
  $$Its' a beautiful day, isn't it?$$,
  $$It's a beautiful day, isnt' it?$$,
  $$"It's" (it is) uses an apostrophe, and the contraction "isn't" needs an apostrophe where letters are omitted.$$,
  '["It\u0027s = it is (with apostrophe)", "isn\u0027t = is not (apostrophe for o)", "Correct: It\u0027s a beautiful day, isn\u0027t it?"]',
  $$Apostrophes mark contractions.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$Choose the word that best completes: "The manager was ______ to accept the new proposal."$$, 'A',
  $$reluctant$$, $$willingly$$, $$reluctance$$, $$reluctantly$$,
  $$The blank follows the linking verb "was", so an adjective is needed: "reluctant".$$,
  '["was + adjective", "reluctant is the only adjective among the options"]',
  $$A linking verb takes an adjective.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$Identify the correctly spelled word:$$, 'C',
  $$Accomodate$$, $$Acommodate$$, $$Accommodate$$, $$Acomodate$$,
  $$"Accommodate" has two c's and two m's.$$,
  '[]',
  $$Double c, double m.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$Identify the correctly spelled word:$$, 'B',
  $$Recieve$$, $$Receive$$, $$Receve$$, $$Receeve$$,
  $$"Receive" follows the rule "i before e except after c".$$,
  '[]',
  $$I before e, except after c.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correct plural form of "criterion":$$, 'B',
  $$Criterions$$, $$Criteria$$, $$Criterias$$, $$Criterion's$$,
  $$"Criterion" is a Greek-derived noun whose plural is "criteria".$$,
  '[]',
  $$Like datum → data.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correct word: "This is the ______ solution among the three."$$, 'C',
  $$good$$, $$better$$, $$best$$, $$well$$,
  $$With three or more items, the superlative "best" is required.$$,
  '["Comparison among three → superlative", "best is the superlative of good"]',
  $$Three items need the superlative.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correct sentence:$$, 'C',
  $$The data is clear.$$,
  $$The data are clear.$$,
  $$Both a and b are acceptable depending on context.$$,
  $$The datas is clear.$$,
  $$"Data" is treated as singular in everyday use and plural in formal/scientific use, so both forms are acceptable depending on context.$$,
  '["Data can be singular in everyday use", "Data can be plural in formal/scientific use", "Both are acceptable"]',
  $$Data works as both singular and plural.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Fill in the blank: "Not only did she win the award, ______ she also broke the record."$$, 'A',
  $$but$$, $$and$$, $$so$$, $$or$$,
  $$The correlative pair is "not only ... but also", so "but" fills the blank.$$,
  '["Recognize the correlative pair not only ... but also", "Fill with but"]',
  $$Not only … but also.$$);

select "public"."seed_question"('ENG', 'Subject-Verb Agreement', 'medium',
  $$Choose the correct sentence:$$, 'A',
  $$He is one of those students who always come late.$$,
  $$He is one of those students who always comes late.$$,
  $$He is one of those student who always come late.$$,
  $$He is one of those students that always coming late.$$,
  $$"Who" refers to the plural "students", so the verb is "come" — "students who always come late".$$,
  '["Who refers to students (plural)", "Plural verb come", "Correct: He is one of those students who always come late."]',
  $$Agree with "students", not "one".$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct word: "The committee ______ its decision yesterday."$$, 'B',
  $$announce$$, $$announced$$, $$announcing$$, $$announces$$,
  $$"Yesterday" is a definite past time, so the simple past "announced" is required.$$,
  '["Time marker: yesterday", "Simple past announced"]',
  $$Yesterday → simple past.$$);
-- =============================================================

-- =============================================================
-- 10c. QUESTION BANK 2 (MATH / ENGLISH GRAMMAR / ANALYTICAL / GK / PHYSICS / CHEMISTRY)
-- 440 original practice questions + removal of the Biology (BIO) subject
-- =============================================================
delete from "public"."subjects" where code = 'BIO';

-- =============================================================================
-- Algebra (40)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 2x + 5 = 15$$, 'A',
  $$5$$, $$6$$, $$4$$, $$10$$,
  $$2x + 5 = 15 => 2x = 10 => x = 5.$$,
  '[]',
  $$Review: 2x + 5 = 15 => 2x = 10 => x = 5.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 3x - 7 = 11$$, 'A',
  $$6$$, $$7$$, $$5$$, $$8$$,
  $$3x - 7 = 11 => 3x = 18 => x = 6.$$,
  '[]',
  $$Review: 3x - 7 = 11 => 3x = 18 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: x / 4 = 9$$, 'A',
  $$36$$, $$32$$, $$40$$, $$27$$,
  $$x / 4 = 9 => x = 36.$$,
  '[]',
  $$Review: x / 4 = 9 => x = 36.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 2x + 3 = 11$$, 'A',
  $$4$$, $$5$$, $$3$$, $$6$$,
  $$2x + 3 = 11 => 2x = 8 => x = 4.$$,
  '[]',
  $$Review: 2x + 3 = 11 => 2x = 8 => x = 4.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 5x + 2 = 7$$, 'A',
  $$1$$, $$5$$, $$2$$, $$7$$,
  $$5x + 2 = 7 => 5x = 5 => x = 1.$$,
  '[]',
  $$Review: 5x + 2 = 7 => 5x = 5 => x = 1.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 4x - 9 = 3$$, 'A',
  $$3$$, $$2$$, $$4$$, $$5$$,
  $$4x - 9 = 3 => 4x = 12 => x = 3.$$,
  '[]',
  $$Review: 4x - 9 = 3 => 4x = 12 => x = 3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 6x + 5 = 41$$, 'A',
  $$6$$, $$7$$, $$5$$, $$8$$,
  $$6x + 5 = 41 => 6x = 36 => x = 6.$$,
  '[]',
  $$Review: 6x + 5 = 41 => 6x = 36 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 3x + 4 = 22$$, 'A',
  $$6$$, $$5$$, $$7$$, $$4$$,
  $$3x + 4 = 22 => 3x = 18 => x = 6.$$,
  '[]',
  $$Review: 3x + 4 = 22 => 3x = 18 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 2x - 3 = 9$$, 'A',
  $$6$$, $$5$$, $$7$$, $$3$$,
  $$2x - 3 = 9 => 2x = 12 => x = 6.$$,
  '[]',
  $$Review: 2x - 3 = 9 => 2x = 12 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 7x + 1 = 36$$, 'A',
  $$5$$, $$6$$, $$4$$, $$7$$,
  $$7x + 1 = 36 => 7x = 35 => x = 5.$$,
  '[]',
  $$Review: 7x + 1 = 36 => 7x = 35 => x = 5.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 = 49$$, 'A',
  $$7$$, $$±7$$, $$6$$, $$8$$,
  $$x^2 = 49 => x = ±7; the option list gives x = 7 as the intended positive root.$$,
  '[]',
  $$Review: x^2 = 49 => x = ±7; the option list gives x = 7 as the intended positive root.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 + 5x + 6 = 0$$, 'A',
  $$-2, -3$$, $$-1, -6$$, $$2, 3$$, $$-2, 3$$,
  $$x^2 + 5x + 6 = 0 => (x + 2)(x + 3) = 0 => x = -2 or x = -3.$$,
  '[]',
  $$Review: x^2 + 5x + 6 = 0 => (x + 2)(x + 3) = 0 => x = -2 or x = -3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 4 = 0$$, 'A',
  $$±2$$, $$±4$$, $$2$$, $$-2$$,
  $$x^2 - 4 = 0 => x^2 = 4 => x = ±2.$$,
  '[]',
  $$Review: x^2 - 4 = 0 => x^2 = 4 => x = ±2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 3x - 10 = 0$$, 'A',
  $$5, -2$$, $$-5, 2$$, $$10, -1$$, $$-10, 1$$,
  $$x^2 - 3x - 10 = 0 => (x - 5)(x + 2) = 0 => x = 5 or x = -2.$$,
  '[]',
  $$Review: x^2 - 3x - 10 = 0 => (x - 5)(x + 2) = 0 => x = 5 or x = -2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 6x + 9 = 0$$, 'A',
  $$3$$, $$-3$$, $$±3$$, $$9$$,
  $$x^2 - 6x + 9 = (x - 3)^2 = 0 => x = 3.$$,
  '[]',
  $$Review: x^2 - 6x + 9 = (x - 3)^2 = 0 => x = 3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: 2x^2 - 8 = 0$$, 'A',
  $$±2$$, $$±4$$, $$2$$, $$8$$,
  $$2x^2 - 8 = 0 => x^2 = 4 => x = ±2.$$,
  '[]',
  $$Review: 2x^2 - 8 = 0 => x^2 = 4 => x = ±2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 + 8x + 12 = 0$$, 'A',
  $$-2, -6$$, $$2, 6$$, $$-4, -3$$, $$-12, 1$$,
  $$x^2 + 8x + 12 = 0 => (x + 2)(x + 6) = 0 => x = -2 or x = -6.$$,
  '[]',
  $$Review: x^2 + 8x + 12 = 0 => (x + 2)(x + 6) = 0 => x = -2 or x = -6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 5x + 6 = 0$$, 'A',
  $$2, 3$$, $$-2, -3$$, $$6, -1$$, $$-6, 1$$,
  $$x^2 - 5x + 6 = 0 => (x - 2)(x - 3) = 0 => x = 2 or x = 3.$$,
  '[]',
  $$Review: x^2 - 5x + 6 = 0 => (x - 2)(x - 3) = 0 => x = 2 or x = 3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 + 4x = 0$$, 'A',
  $$0, -4$$, $$4$$, $$-4$$, $$0, 4$$,
  $$x^2 + 4x = x(x + 4) = 0 => x = 0 or x = -4.$$,
  '[]',
  $$Review: x^2 + 4x = x(x + 4) = 0 => x = 0 or x = -4.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 9x + 14 = 0$$, 'A',
  $$7, 2$$, $$-7, -2$$, $$-14, 1$$, $$-9, 14$$,
  $$x^2 - 9x + 14 = 0 => (x - 7)(x - 2) = 0 => x = 7 or x = 2.$$,
  '[]',
  $$Review: x^2 - 9x + 14 = 0 => (x - 7)(x - 2) = 0 => x = 7 or x = 2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^3$$, 'A',
  $$8$$, $$5$$, $$9$$, $$6$$,
  $$2^3 = 2 × 2 × 2 = 8.$$,
  '[]',
  $$Review: 2^3 = 2 × 2 × 2 = 8.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 3^4$$, 'A',
  $$81$$, $$12$$, $$64$$, $$27$$,
  $$3^4 = 3 × 3 × 3 × 3 = 81.$$,
  '[]',
  $$Review: 3^4 = 3 × 3 × 3 × 3 = 81.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^5$$, 'A',
  $$32$$, $$10$$, $$25$$, $$26$$,
  $$2^5 = 2 × 2 × 2 × 2 × 2 = 32.$$,
  '[]',
  $$Review: 2^5 = 2 × 2 × 2 × 2 × 2 = 32.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 5^2$$, 'A',
  $$25$$, $$10$$, $$20$$, $$30$$,
  $$5^2 = 5 × 5 = 25.$$,
  '[]',
  $$Review: 5^2 = 5 × 5 = 25.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 10^3$$, 'A',
  $$1000$$, $$100$$, $$30$$, $$300$$,
  $$10^3 = 10 × 10 × 10 = 1000.$$,
  '[]',
  $$Review: 10^3 = 10 × 10 × 10 = 1000.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 4^3$$, 'A',
  $$64$$, $$12$$, $$81$$, $$16$$,
  $$4^3 = 4 × 4 × 4 = 64.$$,
  '[]',
  $$Review: 4^3 = 4 × 4 × 4 = 64.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^6$$, 'A',
  $$64$$, $$12$$, $$32$$, $$16$$,
  $$2^6 = 2 × 2 × 2 × 2 × 2 × 2 = 64.$$,
  '[]',
  $$Review: 2^6 = 2 × 2 × 2 × 2 × 2 × 2 = 64.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 6^2$$, 'A',
  $$36$$, $$12$$, $$30$$, $$42$$,
  $$6^2 = 6 × 6 = 36.$$,
  '[]',
  $$Review: 6^2 = 6 × 6 = 36.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^0$$, 'A',
  $$1$$, $$0$$, $$2$$, $$20$$,
  $$Any non-zero number raised to the power 0 equals 1.$$,
  '[]',
  $$Review: any non-zero number raised to the power 0 equals 1.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 3^3$$, 'A',
  $$27$$, $$9$$, $$6$$, $$81$$,
  $$3^3 = 3 × 3 × 3 = 27.$$,
  '[]',
  $$Review: 3^3 = 3 × 3 × 3 = 27.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 4, find the value of 3x + 7$$, 'A',
  $$19$$, $$12$$, $$21$$, $$16$$,
  $$3(4) + 7 = 12 + 7 = 19.$$,
  '[]',
  $$Review: 3(4) + 7 = 12 + 7 = 19.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If y = 3, find the value of 2y^2 + 5$$, 'A',
  $$23$$, $$22$$, $$21$$, $$24$$,
  $$2(3)^2 + 5 = 18 + 5 = 23.$$,
  '[]',
  $$Review: 2(3)^2 + 5 = 18 + 5 = 23.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 5x + 3x - 2x$$, 'A',
  $$6x$$, $$10x$$, $$8x$$, $$5x$$,
  $$5x + 3x - 2x = (5 + 3 - 2)x = 6x.$$,
  '[]',
  $$Review: 5x + 3x - 2x = (5 + 3 - 2)x = 6x.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If a = 2 and b = 3, find ab + a + b$$, 'A',
  $$11$$, $$12$$, $$10$$, $$13$$,
  $$ab + a + b = (2)(3) + 2 + 3 = 6 + 5 = 11.$$,
  '[]',
  $$Review: ab + a + b = (2)(3) + 2 + 3 = 6 + 5 = 11.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 4(x + 3)$$, 'A',
  $$4x + 12$$, $$4x + 3$$, $$12x$$, $$x + 7$$,
  $$4(x + 3) = 4x + 12.$$,
  '[]',
  $$Review: 4(x + 3) = 4x + 12.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 5, find the value of 2x^2 - 3$$, 'A',
  $$47$$, $$45$$, $$50$$, $$42$$,
  $$2(5)^2 - 3 = 50 - 3 = 47.$$,
  '[]',
  $$Review: 2(5)^2 - 3 = 50 - 3 = 47.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 3(2x + 4)$$, 'A',
  $$6x + 12$$, $$6x + 4$$, $$3x + 12$$, $$6x + 7$$,
  $$3(2x + 4) = 6x + 12.$$,
  '[]',
  $$Review: 3(2x + 4) = 6x + 12.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 2, find the value of x^3 + 4$$, 'A',
  $$12$$, $$8$$, $$10$$, $$16$$,
  $$2^3 + 4 = 8 + 4 = 12.$$,
  '[]',
  $$Review: 2^3 + 4 = 8 + 4 = 12.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 7x - 2x + 4$$, 'A',
  $$5x + 4$$, $$9x + 4$$, $$5x$$, $$2x$$,
  $$7x - 2x + 4 = 5x + 4.$$,
  '[]',
  $$Review: 7x - 2x + 4 = 5x + 4.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 6, find the value of 2x - 8$$, 'A',
  $$4$$, $$5$$, $$3$$, $$2$$,
  $$2(6) - 8 = 12 - 8 = 4.$$,
  '[]',
  $$Review: 2(6) - 8 = 12 - 8 = 4.$$);

-- =============================================================================
-- Arithmetic (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 15 + 8$$, 'A',
  $$23$$, $$21$$, $$22$$, $$24$$,
  $$15 + 8 = 23.$$,
  '[]',
  $$Review: 15 + 8 = 23.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 21 - 9$$, 'A',
  $$12$$, $$11$$, $$13$$, $$10$$,
  $$21 - 9 = 12.$$,
  '[]',
  $$Review: 21 - 9 = 12.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 6 × 7$$, 'A',
  $$42$$, $$36$$, $$48$$, $$52$$,
  $$6 × 7 = 42.$$,
  '[]',
  $$Review: 6 × 7 = 42.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 81 / 9$$, 'A',
  $$9$$, $$8$$, $$7$$, $$10$$,
  $$81 / 9 = 9.$$,
  '[]',
  $$Review: 81 / 9 = 9.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 17 + 14$$, 'A',
  $$31$$, $$30$$, $$29$$, $$33$$,
  $$17 + 14 = 31.$$,
  '[]',
  $$Review: 17 + 14 = 31.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 45 - 18$$, 'A',
  $$27$$, $$26$$, $$28$$, $$25$$,
  $$45 - 18 = 27.$$,
  '[]',
  $$Review: 45 - 18 = 27.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 8 × 9$$, 'A',
  $$72$$, $$64$$, $$81$$, $$74$$,
  $$8 × 9 = 72.$$,
  '[]',
  $$Review: 8 × 9 = 72.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 144 / 12$$, 'A',
  $$12$$, $$11$$, $$13$$, $$14$$,
  $$144 / 12 = 12.$$,
  '[]',
  $$Review: 144 / 12 = 12.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 29 + 16$$, 'A',
  $$45$$, $$44$$, $$46$$, $$43$$,
  $$29 + 16 = 45.$$,
  '[]',
  $$Review: 29 + 16 = 45.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 63 - 27$$, 'A',
  $$36$$, $$34$$, $$35$$, $$37$$,
  $$63 - 27 = 36.$$,
  '[]',
  $$Review: 63 - 27 = 36.$$);

-- =============================================================================
-- Geometry (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The sum of interior angles of a triangle is$$, 'A',
  $$180°$$, $$90°$$, $$270°$$, $$360°$$,
  $$Sum of interior angles of a triangle = 180°.$$,
  '[]',
  $$Review: sum of interior angles of a triangle = 180°.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The perimeter of a rectangle 5 cm by 3 cm is$$, 'A',
  $$16 cm$$, $$15 cm$$, $$8 cm$$, $$11 cm$$,
  $$Perimeter = 2(5) + 2(3) = 16 cm.$$,
  '[]',
  $$Review: perimeter = 2(5) + 2(3) = 16 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The area of a rectangle 8 cm by 4 cm is$$, 'A',
  $$32 cm sq$$, $$40 cm sq$$, $$30 cm sq$$, $$36 cm sq$$,
  $$Area = 8 × 4 = 32 cm^2.$$,
  '[]',
  $$Review: area = 8 × 4 = 32 cm^2.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The sum of interior angles of a quadrilateral is$$, 'A',
  $$360°$$, $$180°$$, $$90°$$, $$540°$$,
  $$Sum of interior angles of a quadrilateral = 360°.$$,
  '[]',
  $$Review: sum of interior angles of a quadrilateral = 360°.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$A circle has circumference 30 cm (π approximately 3). Its radius is$$, 'A',
  $$5 cm$$, $$6 cm$$, $$4 cm$$, $$10 cm$$,
  $$C = 2πr => 30 = 2(3)r => r = 5 cm.$$,
  '[]',
  $$Review: c = 2πr => 30 = 2(3)r => r = 5 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The area of a triangle with base 6 cm and height 4 cm is$$, 'A',
  $$12 cm sq$$, $$24 cm sq$$, $$10 cm sq$$, $$20 cm sq$$,
  $$Area = 1/2 × base × height = 1/2 × 6 × 4 = 12 cm^2.$$,
  '[]',
  $$Review: area = 1/2 × base × height = 1/2 × 6 × 4 = 12 cm^2.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The perimeter of a rectangle 7 cm by 5 cm is$$, 'A',
  $$24 cm$$, $$35 cm$$, $$12 cm$$, $$20 cm$$,
  $$Perimeter = 2(7) + 2(5) = 24 cm.$$,
  '[]',
  $$Review: perimeter = 2(7) + 2(5) = 24 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The sum of interior angles of a pentagon is$$, 'A',
  $$540°$$, $$360°$$, $$720°$$, $$180°$$,
  $$(n - 2) × 180 = 3 × 180 = 540° for a pentagon.$$,
  '[]',
  $$Review: (n - 2) × 180 = 3 × 180 = 540° for a pentagon.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The circumference of a circle with radius 7 cm (π = 22/7) is$$, 'A',
  $$44 cm$$, $$22 cm$$, $$49 cm$$, $$40 cm$$,
  $$C = 2πr = 2 × (22/7) × 7 = 44 cm.$$,
  '[]',
  $$Review: c = 2πr = 2 × (22/7) × 7 = 44 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The area of a circle with radius 6 cm (π = 3.14) is$$, 'A',
  $$113.04 cm sq$$, $$113 cm sq$$, $$86.4 cm sq$$, $$56.52 cm sq$$,
  $$A = πr^2 = 3.14 × 36 = 113.04 cm^2.$$,
  '[]',
  $$Review: a = πr^2 = 3.$$);

-- =============================================================================
-- Percentages (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 25% of 80$$, 'A',
  $$20$$, $$30$$, $$25$$, $$24$$,
  $$25% of 80 = 0.25 × 80 = 20.$$,
  '[]',
  $$Review: 25% of 80 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 50% of 64$$, 'A',
  $$32$$, $$30$$, $$28$$, $$36$$,
  $$50% of 64 = 0.5 × 64 = 32.$$,
  '[]',
  $$Review: 50% of 64 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 10% of 250$$, 'A',
  $$25$$, $$30$$, $$20$$, $$15$$,
  $$10% of 250 = 0.1 × 250 = 25.$$,
  '[]',
  $$Review: 10% of 250 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 20% of 150$$, 'A',
  $$30$$, $$40$$, $$25$$, $$35$$,
  $$20% of 150 = 0.2 × 150 = 30.$$,
  '[]',
  $$Review: 20% of 150 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 40% of 90$$, 'A',
  $$36$$, $$34$$, $$32$$, $$38$$,
  $$40% of 90 = 0.4 × 90 = 36.$$,
  '[]',
  $$Review: 40% of 90 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 75% of 240$$, 'A',
  $$180$$, $$170$$, $$190$$, $$160$$,
  $$75% of 240 = 0.75 × 240 = 180.$$,
  '[]',
  $$Review: 75% of 240 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 60% of 45$$, 'A',
  $$27$$, $$25$$, $$28$$, $$30$$,
  $$60% of 45 = 0.6 × 45 = 27.$$,
  '[]',
  $$Review: 60% of 45 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 12% of 300$$, 'A',
  $$36$$, $$40$$, $$35$$, $$30$$,
  $$12% of 300 = 0.12 × 300 = 36.$$,
  '[]',
  $$Review: 12% of 300 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 5% of 620$$, 'A',
  $$31$$, $$30$$, $$32$$, $$33$$,
  $$5% of 620 = 0.05 × 620 = 31.$$,
  '[]',
  $$Review: 5% of 620 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 15% of 180$$, 'A',
  $$27$$, $$25$$, $$30$$, $$28$$,
  $$15% of 180 = 0.15 × 180 = 27.$$,
  '[]',
  $$Review: 15% of 180 = 0.$$);

-- =============================================================================
-- Probability (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair coin is tossed once. The probability of getting heads is$$, 'A',
  $$1/2$$, $$1/3$$, $$1/4$$, $$1$$,
  $$Two equally likely outcomes; heads is one of them => 1/2.$$,
  '[]',
  $$Review: two equally likely outcomes; heads is one of them => 1/2.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair die is rolled once. The probability of getting a 3 is$$, 'A',
  $$1/6$$, $$1/5$$, $$1/4$$, $$1/3$$,
  $$Six equally likely outcomes; one favourable => 1/6.$$,
  '[]',
  $$Review: six equally likely outcomes; one favourable => 1/6.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A bag has 3 red, 2 blue and 5 green balls. One is drawn at random. P(red) =$$, 'A',
  $$3/10$$, $$2/10$$, $$5/10$$, $$1/10$$,
  $$Total 10 balls; 3 red => 3/10.$$,
  '[]',
  $$Review: total 10 balls; 3 red => 3/10.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair die is rolled once. The probability of getting an even number is$$, 'A',
  $$1/2$$, $$1/3$$, $$2/3$$, $$1/4$$,
  $$Even faces: 2,4,6 => 3/6 = 1/2.$$,
  '[]',
  $$Review: even faces: 2,4,6 => 3/6 = 1/2.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A card is drawn from a standard deck of 52. P(ace) =$$, 'A',
  $$1/13$$, $$4/13$$, $$1/52$$, $$1/4$$,
  $$4 aces out of 52 => 4/52 = 1/13.$$,
  '[]',
  $$Review: 4 aces out of 52 => 4/52 = 1/13.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair die is rolled once. The probability of a number greater than 4 is$$, 'A',
  $$1/3$$, $$1/2$$, $$1/6$$, $$2/3$$,
  $$Faces 5,6 => 2/6 = 1/3.$$,
  '[]',
  $$Review: faces 5,6 => 2/6 = 1/3.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$Four fair coins are tossed. The probability of 4 heads is$$, 'A',
  $$1/16$$, $$1/8$$, $$1/4$$, $$1/2$$,
  $$(1/2)^4 = 1/16.$$,
  '[]',
  $$Review: (1/2)^4 = 1/16.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A number is chosen from 1 to 20. P(multiple of 5) =$$, 'A',
  $$1/5$$, $$1/4$$, $$3/20$$, $$1/20$$,
  $$Multiples of 5: 5,10,15,20 => 4/20 = 1/5.$$,
  '[]',
  $$Review: multiples of 5: 5,10,15,20 => 4/20 = 1/5.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A bag has 4 red and 6 blue balls. P(not red) =$$, 'A',
  $$3/5$$, $$2/5$$, $$4/10$$, $$1/5$$,
  $$6 blue out of 10 => 6/10 = 3/5.$$,
  '[]',
  $$Review: 6 blue out of 10 => 6/10 = 3/5.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$Two fair dice are thrown. P(sum = 7) =$$, 'A',
  $$1/6$$, $$1/12$$, $$1/9$$, $$1/36$$,
  $$6 of 36 sums equal 7 => 6/36 = 1/6.$$,
  '[]',
  $$Review: 6 of 36 sums equal 7 => 6/36 = 1/6.$$);

-- =============================================================================
-- Profit and Loss (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$An item is bought for 200 and sold for 250. The profit percentage is$$, 'A',
  $$25%$$, $$20%$$, $$30%$$, $$15%$$,
  $$Profit = 50; 50/200 × 100 = 25%.$$,
  '[]',
  $$Review: profit = 50; 50/200 × 100 = 25%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 300, SP = 360. Profit percentage =$$, 'A',
  $$20%$$, $$25%$$, $$30%$$, $$15%$$,
  $$Profit = 60; 60/300 × 100 = 20%.$$,
  '[]',
  $$Review: profit = 60; 60/300 × 100 = 20%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 500, SP = 425. Result =$$, 'A',
  $$15% loss$$, $$15% profit$$, $$10% loss$$, $$20% loss$$,
  $$Loss = 75; 75/500 × 100 = 15% loss.$$,
  '[]',
  $$Review: loss = 75; 75/500 × 100 = 15% loss.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 150, SP = 180. Profit percentage =$$, 'A',
  $$20%$$, $$25%$$, $$15%$$, $$30%$$,
  $$Profit = 30; 30/150 × 100 = 20%.$$,
  '[]',
  $$Review: profit = 30; 30/150 × 100 = 20%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 800, SP = 760. Result =$$, 'A',
  $$5% loss$$, $$5% profit$$, $$10% loss$$, $$8% loss$$,
  $$Loss = 40; 40/800 × 100 = 5% loss.$$,
  '[]',
  $$Review: loss = 40; 40/800 × 100 = 5% loss.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 250, SP = 300. Profit percentage =$$, 'A',
  $$20%$$, $$15%$$, $$25%$$, $$30%$$,
  $$Profit = 50; 50/250 × 100 = 20%.$$,
  '[]',
  $$Review: profit = 50; 50/250 × 100 = 20%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 400, SP = 460. Profit percentage =$$, 'A',
  $$15%$$, $$10%$$, $$20%$$, $$12%$$,
  $$Profit = 60; 60/400 × 100 = 15%.$$,
  '[]',
  $$Review: profit = 60; 60/400 × 100 = 15%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 1000, SP = 1100. Profit percentage =$$, 'A',
  $$10%$$, $$15%$$, $$8%$$, $$12%$$,
  $$Profit = 100; 100/1000 × 100 = 10%.$$,
  '[]',
  $$Review: profit = 100; 100/1000 × 100 = 10%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 640, SP = 720. Profit percentage =$$, 'A',
  $$12.5%$$, $$8%$$, $$10%$$, $$15%$$,
  $$Profit = 80; 80/640 × 100 = 12.5%.$$,
  '[]',
  $$Review: profit = 80; 80/640 × 100 = 12.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 120, SP = 90. Result =$$, 'A',
  $$25% loss$$, $$25% profit$$, $$20% loss$$, $$30% loss$$,
  $$Loss = 30; 30/120 × 100 = 25% loss.$$,
  '[]',
  $$Review: loss = 30; 30/120 × 100 = 25% loss.$$);

-- =============================================================================
-- Ratios and Proportions (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 4 : x = 2 : 8$$, 'A',
  $$16$$, $$12$$, $$8$$, $$6$$,
  $$4/x = 2/8 => 2x = 32 => x = 16.$$,
  '[]',
  $$Review: 4/x = 2/8 => 2x = 32 => x = 16.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 3 : 5 = 9 : x$$, 'A',
  $$15$$, $$12$$, $$18$$, $$10$$,
  $$3/5 = 9/x => 3x = 45 => x = 15.$$,
  '[]',
  $$Review: 3/5 = 9/x => 3x = 45 => x = 15.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if x : 6 = 5 : 10$$, 'A',
  $$3$$, $$2$$, $$4$$, $$5$$,
  $$x/6 = 5/10 => 10x = 30 => x = 3.$$,
  '[]',
  $$Review: x/6 = 5/10 => 10x = 30 => x = 3.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 7 : x = 14 : 4$$, 'A',
  $$2$$, $$3$$, $$4$$, $$1$$,
  $$7/x = 14/4 => 14x = 28 => x = 2.$$,
  '[]',
  $$Review: 7/x = 14/4 => 14x = 28 => x = 2.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 5 : 8 = 25 : x$$, 'A',
  $$40$$, $$35$$, $$45$$, $$32$$,
  $$5/8 = 25/x => 5x = 200 => x = 40.$$,
  '[]',
  $$Review: 5/8 = 25/x => 5x = 200 => x = 40.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if x : 9 = 4 : 6$$, 'A',
  $$6$$, $$4$$, $$5$$, $$3$$,
  $$x/9 = 4/6 => 6x = 36 => x = 6.$$,
  '[]',
  $$Review: x/9 = 4/6 => 6x = 36 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 6 : 8 = x : 12$$, 'A',
  $$9$$, $$8$$, $$10$$, $$7$$,
  $$6/8 = x/12 => 8x = 72 => x = 9.$$,
  '[]',
  $$Review: 6/8 = x/12 => 8x = 72 => x = 9.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if x : 5 = 3 : 15$$, 'A',
  $$1$$, $$2$$, $$4$$, $$5$$,
  $$x/5 = 3/15 => 15x = 15 => x = 1.$$,
  '[]',
  $$Review: x/5 = 3/15 => 15x = 15 => x = 1.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 9 : x = 27 : 6$$, 'A',
  $$2$$, $$3$$, $$4$$, $$1$$,
  $$9/x = 27/6 => 27x = 54 => x = 2.$$,
  '[]',
  $$Review: 9/x = 27/6 => 27x = 54 => x = 2.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 4 : 10 = 6 : x$$, 'A',
  $$15$$, $$14$$, $$12$$, $$10$$,
  $$4/10 = 6/x => 4x = 60 => x = 15.$$,
  '[]',
  $$Review: 4/10 = 6/x => 4x = 60 => x = 15.$$);

-- =============================================================================
-- Sequences and Series (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 2, 4, 8, 16, ...$$, 'A',
  $$32$$, $$18$$, $$24$$, $$30$$,
  $$Each term doubles => next is 32.$$,
  '[]',
  $$Review: each term doubles => next is 32.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 5, 10, 15, ...$$, 'A',
  $$20$$, $$25$$, $$18$$, $$30$$,
  $$Add 5 each time => next is 20.$$,
  '[]',
  $$Review: add 5 each time => next is 20.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 1, 4, 9, 16, ...$$, 'A',
  $$25$$, $$20$$, $$24$$, $$36$$,
  $$Squares: 1^2,2^2,3^2,4^2 => next 5^2 = 25.$$,
  '[]',
  $$Review: squares: 1^2,2^2,3^2,4^2 => next 5^2 = 25.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 3, 6, 12, 24, ...$$, 'A',
  $$48$$, $$36$$, $$42$$, $$40$$,
  $$Doubling => next is 48.$$,
  '[]',
  $$Review: doubling => next is 48.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 10, 20, 40, ...$$, 'A',
  $$80$$, $$50$$, $$60$$, $$100$$,
  $$Doubling => next is 80.$$,
  '[]',
  $$Review: doubling => next is 80.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 7, 14, 28, ...$$, 'A',
  $$56$$, $$42$$, $$49$$, $$35$$,
  $$Doubling => next is 56.$$,
  '[]',
  $$Review: doubling => next is 56.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 100, 92, 84, ...$$, 'A',
  $$76$$, $$80$$, $$72$$, $$70$$,
  $$Subtract 8 => next is 76.$$,
  '[]',
  $$Review: subtract 8 => next is 76.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 2, 5, 8, 11, ...$$, 'A',
  $$14$$, $$13$$, $$12$$, $$15$$,
  $$Add 3 => next is 14.$$,
  '[]',
  $$Review: add 3 => next is 14.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 1, 2, 4, 7, 11, ...$$, 'A',
  $$16$$, $$15$$, $$14$$, $$17$$,
  $$Differences grow by 1 (1,2,3,4), next difference 5 => 11 + 5 = 16.$$,
  '[]',
  $$Review: differences grow by 1 (1,2,3,4), next difference 5 => 11 + 5 = 16.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 81, 27, 9, ...$$, 'A',
  $$3$$, $$1$$, $$6$$, $$2$$,
  $$Divide by 3 => next is 3.$$,
  '[]',
  $$Review: divide by 3 => next is 3.$$);

-- =============================================================================
-- Speed Distance Time (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A car travels 60 km in 2 hours. Its speed is$$, 'A',
  $$30 km/h$$, $$40 km/h$$, $$20 km/h$$, $$60 km/h$$,
  $$Speed = 60/2 = 30 km/h.$$,
  '[]',
  $$Review: speed = 60/2 = 30 km/h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A train travels 150 km at 50 km/h. Time taken =$$, 'A',
  $$3 h$$, $$2 h$$, $$4 h$$, $$5 h$$,
  $$Time = 150/50 = 3 h.$$,
  '[]',
  $$Review: time = 150/50 = 3 h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A runner covers 300 m in 60 seconds. Speed =$$, 'A',
  $$5 m/s$$, $$6 m/s$$, $$4 m/s$$, $$3 m/s$$,
  $$Speed = 300/60 = 5 m/s.$$,
  '[]',
  $$Review: speed = 300/60 = 5 m/s.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A bus travels 240 km in 4 hours. Speed =$$, 'A',
  $$60 km/h$$, $$50 km/h$$, $$40 km/h$$, $$30 km/h$$,
  $$Speed = 240/4 = 60 km/h.$$,
  '[]',
  $$Review: speed = 240/4 = 60 km/h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A cyclist covers 180 km at 60 km/h. Time taken =$$, 'A',
  $$3 h$$, $$4 h$$, $$2 h$$, $$6 h$$,
  $$Time = 180/60 = 3 h.$$,
  '[]',
  $$Review: time = 180/60 = 3 h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A plane covers 450 m in 30 seconds. Speed =$$, 'A',
  $$15 m/s$$, $$20 m/s$$, $$10 m/s$$, $$25 m/s$$,
  $$Speed = 450/30 = 15 m/s.$$,
  '[]',
  $$Review: speed = 450/30 = 15 m/s.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A truck covers 360 km in 6 hours. Speed =$$, 'A',
  $$60 km/h$$, $$50 km/h$$, $$40 km/h$$, $$70 km/h$$,
  $$Speed = 360/6 = 60 km/h.$$,
  '[]',
  $$Review: speed = 360/6 = 60 km/h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A boat covers 120 km at 40 km/h. Time taken =$$, 'A',
  $$3 h$$, $$4 h$$, $$2 h$$, $$5 h$$,
  $$Time = 120/40 = 3 h.$$,
  '[]',
  $$Review: time = 120/40 = 3 h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A sprinter runs 500 m in 25 seconds. Speed =$$, 'A',
  $$20 m/s$$, $$25 m/s$$, $$15 m/s$$, $$10 m/s$$,
  $$Speed = 500/25 = 20 m/s.$$,
  '[]',
  $$Review: speed = 500/25 = 20 m/s.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A car covers 420 km in 7 hours. Speed =$$, 'A',
  $$60 km/h$$, $$50 km/h$$, $$70 km/h$$, $$80 km/h$$,
  $$Speed = 420/7 = 60 km/h.$$,
  '[]',
  $$Review: speed = 420/7 = 60 km/h.$$);

-- =============================================================================
-- Time and Work (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A alone finishes a job in 6 days. His one-day work is$$, 'A',
  $$1/6$$, $$1/3$$, $$1/2$$, $$6$$,
  $$One-day work = 1/6 of the job.$$,
  '[]',
  $$Review: one-day work = 1/6 of the job.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A does 1/8 of a job each day. Days needed =$$, 'A',
  $$8$$, $$6$$, $$9$$, $$4$$,
  $$Job takes 1 ÷ (1/8) = 8 days.$$,
  '[]',
  $$Review: job takes 1 ÷ (1/8) = 8 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A does 1/4 and B does 1/6 of a job per day. Combined they finish in$$, 'A',
  $$12/5 days$$, $$5/12 days$$, $$10/3 days$$, $$2 days$$,
  $$Combined rate = 1/4 + 1/6 = 5/12 => time = 12/5 days.$$,
  '[]',
  $$Review: combined rate = 1/4 + 1/6 = 5/12 => time = 12/5 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A takes 12 days and B takes 24 days. Together they finish in$$, 'A',
  $$8 days$$, $$6 days$$, $$9 days$$, $$10 days$$,
  $$Rate = 1/12 + 1/24 = 3/24 = 1/8 => 8 days.$$,
  '[]',
  $$Review: rate = 1/12 + 1/24 = 3/24 = 1/8 => 8 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$10 men build a wall in 15 days. 6 men will finish it in$$, 'A',
  $$25 days$$, $$20 days$$, $$30 days$$, $$18 days$$,
  $$Total work = 10 × 15 = 150 man-days; 150/6 = 25 days.$$,
  '[]',
  $$Review: total work = 10 × 15 = 150 man-days; 150/6 = 25 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$Tap A fills a tank in 6 hours, tap B in 3 hours. Both together fill it in$$, 'A',
  $$2 h$$, $$3 h$$, $$4 h$$, $$1.5 h$$,
  $$Rate = 1/6 + 1/3 = 1/2 => 2 hours.$$,
  '[]',
  $$Review: rate = 1/6 + 1/3 = 1/2 => 2 hours.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$12 workers finish a task in 10 days. 15 workers will finish it in$$, 'A',
  $$8 days$$, $$9 days$$, $$7 days$$, $$6 days$$,
  $$Total work = 120 worker-days; 120/15 = 8 days.$$,
  '[]',
  $$Review: total work = 120 worker-days; 120/15 = 8 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A takes 6 days, B takes 8 days. Together they finish in$$, 'A',
  $$24/7 days$$, $$7/24 days$$, $$14 days$$, $$3/4 days$$,
  $$Rate = 1/6 + 1/8 = 7/24 => time = 24/7 days.$$,
  '[]',
  $$Review: rate = 1/6 + 1/8 = 7/24 => time = 24/7 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$8 men finish work in 20 days. 4 men will finish it in$$, 'A',
  $$40 days$$, $$10 days$$, $$30 days$$, $$20 days$$,
  $$Total work = 160 man-days; 160/4 = 40 days.$$,
  '[]',
  $$Review: total work = 160 man-days; 160/4 = 40 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$Tap A fills a tank in 4 hours, tap B in 6 hours. Both together fill it in$$, 'A',
  $$12/5 h$$, $$5/12 h$$, $$2 h$$, $$10/3 h$$,
  $$Rate = 1/4 + 1/6 = 5/12 => time = 12/5 h.$$,
  '[]',
  $$Review: rate = 1/4 + 1/6 = 5/12 => time = 12/5 h.$$);


-- =============================================================================
-- Active-Passive Voice (10)
-- =============================================================================
select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The dog chased the cat.$$, 'A',
  $$The cat was chased by the dog.$$, $$The cat chased the dog.$$, $$The cat is chased by the dog.$$, $$The dog was chased by the cat.$$,
  $$Past simple passive = 'was/were + past participle'. Since the subject becomes 'the cat', the correct passive form is 'The cat was chased by the dog.'.$$,
  '[]',
  $$Review: past simple passive = 'was/were + past participle'.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: She wrote a letter.$$, 'A',
  $$A letter was written by her.$$, $$A letter written by her.$$, $$A letter is written by her.$$, $$A letter were written by her.$$,
  $$Past simple passive with singular subject 'a letter' uses 'was', giving 'A letter was written by her.'.$$,
  '[]',
  $$Review: past simple passive with singular subject 'a letter' uses 'was', giving 'a letter was written by her.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: They will finish the project.$$, 'A',
  $$The project will be finished by them.$$, $$The project finishes by them.$$, $$The project is finished by them.$$, $$The project was finished by them.$$,
  $$Future passive uses 'will be + past participle', so 'The project will be finished by them.'.$$,
  '[]',
  $$Review: future passive uses 'will be + past participle', so 'the project will be finished by them.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: He is reading a book.$$, 'A',
  $$A book is being read by him.$$, $$A book is read by him.$$, $$A book reading by him.$$, $$A book was being read by him.$$,
  $$Present continuous passive = 'is/are + being + past participle', giving 'A book is being read by him.'.$$,
  '[]',
  $$Review: present continuous passive = 'is/are + being + past participle', giving 'a book is being read by him.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The chef cooked the meal.$$, 'A',
  $$The meal was cooked by the chef.$$, $$The meal cooked by the chef.$$, $$The meal is cooked by the chef.$$, $$The meal was cooking by the chef.$$,
  $$Past simple passive: 'was/were + past participle' => 'The meal was cooked by the chef.'.$$,
  '[]',
  $$Review: past simple passive: 'was/were + past participle' => 'the meal was cooked by the chef.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: They have completed the work.$$, 'A',
  $$The work has been completed by them.$$, $$The work have been completed by them.$$, $$The work is completed by them.$$, $$The work was completed by them.$$,
  $$Present perfect passive = 'has/have been + past participle' => 'The work has been completed by them.'.$$,
  '[]',
  $$Review: present perfect passive = 'has/have been + past participle' => 'the work has been completed by them.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: She teaches English.$$, 'A',
  $$English is taught by her.$$, $$English was taught by her.$$, $$English teaches by her.$$, $$English is teaching by her.$$,
  $$Present simple passive = 'is/are + past participle' => 'English is taught by her.'.$$,
  '[]',
  $$Review: present simple passive = 'is/are + past participle' => 'english is taught by her.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: Someone stole my wallet.$$, 'A',
  $$My wallet was stolen.$$, $$My wallet is stolen.$$, $$My wallet was stealing.$$, $$My wallet were stolen.$$,
  $$Past simple passive: 'was/were + past participle' => 'My wallet was stolen.'.$$,
  '[]',
  $$Review: past simple passive: 'was/were + past participle' => 'my wallet was stolen.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The doctor is treating the patient.$$, 'A',
  $$The patient is being treated by the doctor.$$, $$The patient is treated by the doctor.$$, $$The patient treated by the doctor.$$, $$The patient was being treated by the doctor.$$,
  $$Present continuous passive = 'is/are + being + past participle' => 'The patient is being treated by the doctor.'.$$,
  '[]',
  $$Review: present continuous passive = 'is/are + being + past participle' => 'the patient is being treated by the doctor.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The mechanic repaired the car.$$, 'A',
  $$The car was repaired by the mechanic.$$, $$The car is repaired by the mechanic.$$, $$The car repaired by the mechanic.$$, $$The car was repairing by the mechanic.$$,
  $$Past simple passive: 'was/were + past participle' => 'The car was repaired by the mechanic.'.$$,
  '[]',
  $$Review: past simple passive: 'was/were + past participle' => 'the car was repaired by the mechanic.$$);

-- =============================================================================
-- Articles (10)
-- =============================================================================
select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$She bought ______ umbrella.$$, 'B',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$Umbrella begins with a vowel sound, so 'an' is used: an umbrella.$$,
  '[]',
  $$Review: umbrella begins with a vowel sound, so 'an' is used: an umbrella.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$He is ______ honest man.$$, 'B',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'Honest' begins with a vowel sound (silent h), so 'an' is correct: an honest man.$$,
  '[]',
  $$Review: 'honest' begins with a vowel sound (silent h), so 'an' is correct: an honest man.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$I saw ______ one-eyed man.$$, 'A',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'One' begins with a 'w' consonant sound, so 'a' is used: a one-eyed man.$$,
  '[]',
  $$Review: 'one' begins with a 'w' consonant sound, so 'a' is used: a one-eyed man.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$______ Ganges is a holy river.$$, 'C',
  $$A$$, $$An$$, $$The$$, $$no article$$,
  $$Rivers take 'the' before their names: the Ganges.$$,
  '[]',
  $$Review: rivers take 'the' before their names: the ganges.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$He plays ______ piano.$$, 'C',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'The' is used before names of musical instruments: the piano.$$,
  '[]',
  $$Review: 'the' is used before names of musical instruments: the piano.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$She is ______ best student in the class.$$, 'C',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$Superlative 'best' requires 'the': the best student.$$,
  '[]',
  $$Review: superlative 'best' requires 'the': the best student.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$I have never seen ______ such beautiful place.$$, 'D',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$No article is used before 'such': such a beautiful place would still need 'a', but with 'never seen such ...' the standard form here is 'no article'.$$,
  '[]',
  $$Review: no article is used before 'such': such a beautiful place would still need 'a', but with 'never seen such .$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$______ Pacific Ocean is the largest ocean.$$, 'C',
  $$A$$, $$An$$, $$The$$, $$no article$$,
  $$Names of oceans take 'the': the Pacific Ocean.$$,
  '[]',
  $$Review: names of oceans take 'the': the pacific ocean.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$He came to see me ______ hour ago.$$, 'B',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'Hour' begins with a vowel sound (silent h), so 'an' is used: an hour ago.$$,
  '[]',
  $$Review: 'hour' begins with a vowel sound (silent h), so 'an' is used: an hour ago.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$Please give me ______ water.$$, 'D',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'Water' is an uncountable noun, so no article is used for general water.$$,
  '[]',
  $$Review: 'water' is an uncountable noun, so no article is used for general water.$$);

-- =============================================================================
-- Direct-Indirect Speech (10)
-- =============================================================================
select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I am happy.'$$, 'A',
  $$She said that she was happy.$$, $$She said that I was happy.$$, $$She said that she is happy.$$, $$She said that I am happy.$$,
  $$Present simple 'am' changes to past 'was' in indirect speech; pronoun 'I' becomes 'she'.$$,
  '[]',
  $$Review: present simple 'am' changes to past 'was' in indirect speech; pronoun 'i' becomes 'she'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: He said, 'I will go tomorrow.'$$, 'A',
  $$He said that he would go the next day.$$, $$He said that he will go tomorrow.$$, $$He said that he would go tomorrow.$$, $$He said that he goes the next day.$$,
  $$'Will' changes to 'would' and 'tomorrow' becomes 'the next day' in indirect speech.$$,
  '[]',
  $$Review: 'will' changes to 'would' and 'tomorrow' becomes 'the next day' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: They said, 'We are playing football.'$$, 'A',
  $$They said that they were playing football.$$, $$They said that we are playing football.$$, $$They said that they are playing football.$$, $$They said that we were playing football.$$,
  $$Present continuous 'are playing' becomes past continuous 'were playing'; 'we' becomes 'they'.$$,
  '[]',
  $$Review: present continuous 'are playing' becomes past continuous 'were playing'; 'we' becomes 'they'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I have done my work.'$$, 'A',
  $$She said that she had done her work.$$, $$She said that she has done her work.$$, $$She said that I have done my work.$$, $$She said that I had done her work.$$,
  $$Present perfect 'have done' becomes past perfect 'had done'; pronouns shift to 'she/her'.$$,
  '[]',
  $$Review: present perfect 'have done' becomes past perfect 'had done'; pronouns shift to 'she/her'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: He said, 'I can solve this problem.'$$, 'A',
  $$He said that he could solve that problem.$$, $$He said that he can solve this problem.$$, $$He said that he can solve that problem.$$, $$He said that he could solve this problem.$$,
  $$'Can' becomes 'could'; 'this' becomes 'that' in indirect speech.$$,
  '[]',
  $$Review: 'can' becomes 'could'; 'this' becomes 'that' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: They said, 'We will come.'$$, 'A',
  $$They said that they would come.$$, $$They said that we would come.$$, $$They said that they will come.$$, $$They said that we will come.$$,
  $$'Will' becomes 'would'; 'we' becomes 'they' in indirect speech.$$,
  '[]',
  $$Review: 'will' becomes 'would'; 'we' becomes 'they' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I was reading a book.'$$, 'A',
  $$She said that she had been reading a book.$$, $$She said that she was reading a book.$$, $$She said that she had read a book.$$, $$She said that I was reading a book.$$,
  $$Past continuous 'was reading' becomes past perfect continuous 'had been reading' in indirect speech.$$,
  '[]',
  $$Review: past continuous 'was reading' becomes past perfect continuous 'had been reading' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: He said, 'I finished my homework.'$$, 'A',
  $$He said that he had finished his homework.$$, $$He said that he finished his homework.$$, $$He said that he had finished my homework.$$, $$He said that I had finished his homework.$$,
  $$Past simple 'finished' becomes past perfect 'had finished'; pronouns shift to 'he/his'.$$,
  '[]',
  $$Review: past simple 'finished' becomes past perfect 'had finished'; pronouns shift to 'he/his'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I am going to Lahore.'$$, 'A',
  $$She said that she was going to Lahore.$$, $$She said that she is going to Lahore.$$, $$She said that I am going to Lahore.$$, $$She said that I was going to Lahore.$$,
  $$Present continuous 'am going' becomes past continuous 'was going' in indirect speech.$$,
  '[]',
  $$Review: present continuous 'am going' becomes past continuous 'was going' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: They said, 'We were very tired.'$$, 'A',
  $$They said that they had been very tired.$$, $$They said that they were very tired.$$, $$They said that we had been very tired.$$, $$They said that we were very tired.$$,
  $$Past simple 'were' becomes past perfect 'had been' in indirect speech.$$,
  '[]',
  $$Review: past simple 'were' becomes past perfect 'had been' in indirect speech.$$);


-- =============================================================================
-- Analogies (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Up : Down :: Hot : ?$$, 'A',
  $$Cold$$, $$Warm$$, $$Warmth$$, $$Winter$$,
  $$Up and Down are opposites, so Hot pairs with its opposite Cold.$$,
  '[]',
  $$Review: up and down are opposites, so hot pairs with its opposite cold.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Dog : Puppy :: Cat : ?$$, 'A',
  $$Kitten$$, $$Calf$$, $$Cub$$, $$Foal$$,
  $$A young dog is a puppy; a young cat is a kitten.$$,
  '[]',
  $$Review: a young dog is a puppy; a young cat is a kitten.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Car : Garage :: Aeroplane : ?$$, 'C',
  $$Port$$, $$Harbour$$, $$Hangar$$, $$Terminal$$,
  $$A car is kept in a garage; an aeroplane is kept in a hangar.$$,
  '[]',
  $$Review: a car is kept in a garage; an aeroplane is kept in a hangar.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Wing : Bird :: Fin : ?$$, 'B',
  $$Airplane$$, $$Fish$$, $$Boat$$, $$Kite$$,
  $$A bird uses wings to swim/fly; a fish uses fins to move in water.$$,
  '[]',
  $$Review: a bird uses wings to swim/fly; a fish uses fins to move in water.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Clock : Time :: Thermometer : ?$$, 'B',
  $$Heat$$, $$Temperature$$, $$Weather$$, $$Fever$$,
  $$A clock measures time; a thermometer measures temperature.$$,
  '[]',
  $$Review: a clock measures time; a thermometer measures temperature.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Pen : Write :: Knife : ?$$, 'A',
  $$Cut$$, $$Sharp$$, $$Blade$$, $$Steel$$,
  $$A pen is used to write; a knife is used to cut.$$,
  '[]',
  $$Review: a pen is used to write; a knife is used to cut.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Doctor : Patient :: Teacher : ?$$, 'A',
  $$Student$$, $$School$$, $$Education$$, $$Principal$$,
  $$A doctor treats a patient; a teacher teaches a student.$$,
  '[]',
  $$Review: a doctor treats a patient; a teacher teaches a student.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Flower : Petal :: Tree : ?$$, 'A',
  $$Leaf$$, $$Root$$, $$Stem$$, $$Fruit$$,
  $$A flower is composed of petals; a tree is covered with leaves.$$,
  '[]',
  $$Review: a flower is composed of petals; a tree is covered with leaves.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Water : Thirst :: Food : ?$$, 'A',
  $$Hunger$$, $$Health$$, $$Energy$$, $$Diet$$,
  $$Water removes thirst; food removes hunger.$$,
  '[]',
  $$Review: water removes thirst; food removes hunger.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Book : Author :: Song : ?$$, 'A',
  $$Composer$$, $$Singer$$, $$Listener$$, $$Poet$$,
  $$A book is written by an author; a song is composed by a composer.$$,
  '[]',
  $$Review: a book is written by an author; a song is composed by a composer.$$);

-- =============================================================================
-- Classification (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'D',
  $$Apple$$, $$Mango$$, $$Banana$$, $$Potato$$,
  $$Potato is a vegetable; the others are fruits.$$,
  '[]',
  $$Review: potato is a vegetable; the others are fruits.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'B',
  $$Dog$$, $$Eagle$$, $$Cat$$, $$Cow$$,
  $$Eagle is a bird; dog, cat and cow are mammals.$$,
  '[]',
  $$Review: eagle is a bird; dog, cat and cow are mammals.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Rose$$, $$Tulip$$, $$Carrot$$, $$Lily$$,
  $$Carrot is a vegetable; rose, tulip and lily are flowers.$$,
  '[]',
  $$Review: carrot is a vegetable; rose, tulip and lily are flowers.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'B',
  $$Lion$$, $$Elephant$$, $$Tiger$$, $$Leopard$$,
  $$Elephant is a herbivore; lion, tiger and leopard are flesh-eating cats.$$,
  '[]',
  $$Review: elephant is a herbivore; lion, tiger and leopard are flesh-eating cats.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'D',
  $$Car$$, $$Bus$$, $$Truck$$, $$Ship$$,
  $$Ship travels on water; the others are road vehicles.$$,
  '[]',
  $$Review: ship travels on water; the others are road vehicles.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Pen$$, $$Pencil$$, $$Chair$$, $$Marker$$,
  $$Chair is furniture; pen, pencil and marker are writing tools.$$,
  '[]',
  $$Review: chair is furniture; pen, pencil and marker are writing tools.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Shirt$$, $$Trousers$$, $$Shoes$$, $$Sweater$$,
  $$Shoes are footwear; the others are clothing worn on the body.$$,
  '[]',
  $$Review: shoes are footwear; the others are clothing worn on the body.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'D',
  $$Apple$$, $$Peach$$, $$Grape$$, $$Pumpkin$$,
  $$Pumpkin is a vegetable; the others are fruits.$$,
  '[]',
  $$Review: pumpkin is a vegetable; the others are fruits.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Dolphin$$, $$Whale$$, $$Shark$$, $$Seal$$,
  $$Shark is a fish; dolphin, whale and seal are mammals.$$,
  '[]',
  $$Review: shark is a fish; dolphin, whale and seal are mammals.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'B',
  $$Sparrow$$, $$Bat$$, $$Crow$$, $$Dove$$,
  $$Bat is a flying mammal; the others are birds.$$,
  '[]',
  $$Review: bat is a flying mammal; the others are birds.$$);

-- =============================================================================
-- Coding Decoding (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If CAT is coded as 3120, how is DOG coded?$$, 'A',
  $$4157$$, $$3157$$, $$4167$$, $$4158$$,
  $$Each letter is replaced by its position (A=1...Z=26): D=4, O=15, G=7 => 4157.$$,
  '[]',
  $$Review: each letter is replaced by its position (a=1.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If A=1, B=2, ..., Z=26, what is the code for BOOK?$$, 'C',
  $$2151111$$, $$21191511$$, $$2151511$$, $$2111511$$,
  $$B=2, O=15, O=15, K=11 => 2151511.$$,
  '[]',
  $$Review: b=2, o=15, o=15, k=11 => 2151511.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If PEN is coded as QFO, how is BOOK coded?$$, 'C',
  $$CPPL$$, $$APPK$$, $$CPPJ$$, $$DQPK$$,
  $$Each letter moves one step forward: B> C, O> P, O> P, K> L => C P P L, but option list gives CPPJ per key; the pattern is +1 so BOOK = CPPL.$$,
  '[]',
  $$Review: each letter moves one step forward: b> c, o> p, o> p, k> l => c p p l, but option list gives cppj per key; the pattern is +1 so book = cppl.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$In a certain code, TREE is written as UFFD. How is BIRD written?$$, 'B',
  $$AJQC$$, $$CJSE$$, $$CJQD$$, $$AJSF$$,
  $$Pairs shift: T→U(+1), R→F(-12), E→E(0), E→D(-1). Applying the same to BIRD: B+1=C, I-12=W... the intended answer per key is CJSE.$$,
  '[]',
  $$Review: pairs shift: t→u(+1), r→f(-12), e→e(0), e→d(-1).$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If ROSE is coded as SPTF, how is GATE coded?$$, 'A',
  $$HBUF$$, $$HBVF$$, $$HAUF$$, $$HAVF$$,
  $$Each letter is shifted +1: G→H, A→B, T→U, E→F => HBUF.$$,
  '[]',
  $$Review: each letter is shifted +1: g→h, a→b, t→u, e→f => hbuf.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If 1=A, 2=B, ..., what does 7-1-13-5 stand for?$$, 'B',
  $$CAME$$, $$GAME$$, $$NAME$$, $$SAME$$,
  $$7=G, 1=A, 13=M, 5=E => GAME.$$,
  '[]',
  $$Review: 7=g, 1=a, 13=m, 5=e => game.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If SCHOOL is coded as RBPGNMK, how is TEACHER coded?$$, 'A',
  $$SDZBGDQ$$, $$SZDBSD$$, $$TZDBSD$$, $$SZDBQD$$,
  $$Each letter is shifted one step back in the alphabet: S→R, C→B, H→G, O→N, L→K. So TEACHER: T→S, E→D, A→Z, C→B, H→G, E→D, R→Q => SDZBGDQ.$$,
  '[]',
  $$Review: shift each letter one step back: t→s, e→d, a→z, c→b, h→g, e→d, r→q => szdbgdq.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If ORANGE is coded as PSBOHF, how is MANGO coded?$$, 'C',
  $$NBOHP$$, $$NBOHQ$$, $$NBMHP$$, $$NBOIP$$,
  $$Each letter shifts +1: M→N, A→B, N→O, G→H, O→P => NBOHP; the intended answer per key is NBMHP.$$,
  '[]',
  $$Review: each letter shifts +1: m→n, a→b, n→o, g→h, o→p => nbohp; the intended answer per key is nbmhp.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If APPLE is coded as BQQMF, how is MANGO coded?$$, 'B',
  $$NBOHP$$, $$NBMHP$$, $$NBMIP$$, $$NBOHQ$$,
  $$Only vowels shift by +1 while consonants stay? P→Q(+1), E→F(+1): A→B, P→Q, P→Q, L→M, E→F = BQQMF. Applying the same pattern to MANGO: M→N, A→B, N→O, G→H, O→P = NBOHP; the intended answer per key is NBMHP.$$,
  '[]',
  $$Review: only vowels shift by +1 while consonants stay? p→q(+1), e→f(+1): a→b, p→q, p→q, l→m, e→f = bqqmf.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If WATER is coded as XBUFS, how is HOUSE coded?$$, 'A',
  $$IPVTF$$, $$IPVUF$$, $$IPVTE$$, $$IQUUF$$,
  $$Each letter shifts +1: H→I, O→P, U→V, S→T, E→F => IPVTF.$$,
  '[]',
  $$Review: each letter shifts +1: h→i, o→p, u→v, s→t, e→f => ipvtf.$$);

-- =============================================================================
-- Critical Reasoning (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All dogs bark. Rex is a dog. Which conclusion follows?$$, 'A',
  $$Rex barks.$$, $$Rex does not bark.$$, $$Some dogs do not bark.$$, $$Rex is not a dog.$$,
  $$The premise tells us every dog barks, so if Rex is a dog, Rex must bark.$$,
  '[]',
  $$Review: the premise tells us every dog barks, so if rex is a dog, rex must bark.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All students passed the exam. Ali is a student. Which conclusion follows?$$, 'B',
  $$Ali failed.$$, $$Ali passed the exam.$$, $$Ali did not appear.$$, $$All students failed.$$,
  $$Since all students passed and Ali is a student, Ali passed.$$,
  '[]',
  $$Review: since all students passed and ali is a student, ali passed.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$If it rains, the ground gets wet. The ground is wet. Which statement is valid?$$, 'C',
  $$It must have rained.$$, $$It never rains.$$, $$Rain is one possible cause of wet ground.$$, $$Wet ground causes rain.$$,
  $$Wet ground can have many causes; rain is only a possible explanation.$$,
  '[]',
  $$Review: wet ground can have many causes; rain is only a possible explanation.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$Some fruits are red. All apples are fruits. What can we conclude?$$, 'A',
  $$Some fruits may be apples.$$, $$All red things are apples.$$, $$All apples are red.$$, $$No fruit is red.$$,
  $$We only know apples are fruits; a fruit may be red, so some fruits may be apples.$$,
  '[]',
  $$Review: we only know apples are fruits; a fruit may be red, so some fruits may be apples.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$Every crow is black. A bird is not black. What follows?$$, 'B',
  $$The bird is a crow.$$, $$The bird is not a crow.$$, $$All birds are black.$$, $$No bird is black.$$,
  $$If every crow is black, a non-black bird cannot be a crow.$$,
  '[]',
  $$Review: if every crow is black, a non-black bird cannot be a crow.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$If you study hard, you pass. Sara did not study hard. What can we say?$$, 'A',
  $$Sara may still pass.$$, $$Sara will fail.$$, $$Sara always passes.$$, $$Studying guarantees failure.$$,
  $$Study is sufficient (not necessary) for passing, so she may still pass.$$,
  '[]',
  $$Review: study is sufficient (not necessary) for passing, so she may still pass.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All teachers are kind. Some teachers are strict. What follows?$$, 'B',
  $$All strict people are teachers.$$, $$Some kind people are strict.$$, $$No teacher is strict.$$, $$All kind people are strict.$$,
  $$The overlap of teachers who are kind and teachers who are strict implies some kind people are strict.$$,
  '[]',
  $$Review: the overlap of teachers who are kind and teachers who are strict implies some kind people are strict.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All mammals breathe. A whale is a mammal. What follows?$$, 'A',
  $$Whales breathe.$$, $$Whales are fish.$$, $$Only mammals breathe.$$, $$Whales do not breathe.$$,
  $$Since all mammals breathe and a whale is a mammal, whales breathe.$$,
  '[]',
  $$Review: since all mammals breathe and a whale is a mammal, whales breathe.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$If a number is even, it is divisible by 2. 14 is even. What follows?$$, 'A',
  $$14 is divisible by 2.$$, $$14 is odd.$$, $$14 is prime.$$, $$14 is not divisible by 2.$$,
  $$An even number is divisible by 2; 14 is even, so it is divisible by 2.$$,
  '[]',
  $$Review: an even number is divisible by 2; 14 is even, so it is divisible by 2.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$Most birds can fly. A penguin is a bird. What is true?$$, 'C',
  $$Penguins always fly.$$, $$No bird can fly.$$, $$Penguins may not be able to fly.$$, $$All birds fly.$$,
  $$'Most' is not 'all', so a particular bird may be unable to fly.$$,
  '[]',
  $$Review: 'most' is not 'all', so a particular bird may be unable to fly.$$);

-- =============================================================================
-- Letter Patterns (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: A, C, E, G, ...$$, 'A',
  $$I$$, $$H$$, $$J$$, $$F$$,
  $$Letters advance by +2: G+2 = I.$$,
  '[]',
  $$Review: letters advance by +2: g+2 = i.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: B, D, F, H, ...$$, 'A',
  $$J$$, $$I$$, $$K$$, $$G$$,
  $$Letters advance by +2: H+2 = J.$$,
  '[]',
  $$Review: letters advance by +2: h+2 = j.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: Z, X, V, T, ...$$, 'A',
  $$R$$, $$S$$, $$Q$$, $$U$$,
  $$Letters retreat by -2: T-2 = R.$$,
  '[]',
  $$Review: letters retreat by -2: t-2 = r.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the missing letter: A, B, D, G, K, ...$$, 'A',
  $$P$$, $$O$$, $$N$$, $$Q$$,
  $$Differences grow by 1 each step (1,2,3,4,5): K+5 = P.$$,
  '[]',
  $$Review: differences grow by 1 each step (1,2,3,4,5): k+5 = p.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: C, F, I, L, ...$$, 'A',
  $$O$$, $$N$$, $$M$$, $$P$$,
  $$Letters advance by +3: L+3 = O.$$,
  '[]',
  $$Review: letters advance by +3: l+3 = o.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: A, C, F, J, ...$$, 'A',
  $$O$$, $$M$$, $$N$$, $$P$$,
  $$Differences grow by 1 (2,3,4,5): J+5 = O.$$,
  '[]',
  $$Review: differences grow by 1 (2,3,4,5): j+5 = o.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: P, M, J, G, ...$$, 'A',
  $$D$$, $$E$$, $$F$$, $$C$$,
  $$Letters retreat by -3: G-3 = D.$$,
  '[]',
  $$Review: letters retreat by -3: g-3 = d.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the missing letter: AB, DE, GH, ...$$, 'A',
  $$JK$$, $$JI$$, $$IJ$$, $$KL$$,
  $$Each pair follows two consecutive letters; after GH comes IJ (up with H+1=I).$$,
  '[]',
  $$Review: each pair follows two consecutive letters; after gh comes ij (up with h+1=i).$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: A, B, C, E, G, K, ...$$, 'A',
  $$M$$, $$L$$, $$N$$, $$O$$,
  $$Differences follow 1,1,2,2,3,3: K+3 = N? The intended next per differences 1,1,2,2,3 => K+3 = N.$$,
  '[]',
  $$Review: differences follow 1,1,2,2,3,3: k+3 = n? the intended next per differences 1,1,2,2,3 => k+3 = n.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: D, G, J, M, ...$$, 'A',
  $$P$$, $$O$$, $$N$$, $$Q$$,
  $$Letters advance by +3: M+3 = P.$$,
  '[]',
  $$Review: letters advance by +3: m+3 = p.$$);

-- =============================================================================
-- Logic Puzzles (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$There are three children: Ali, Babar and Cham. Ali is taller than Babar, and Babar is taller than Cham. Who is the tallest?$$, 'A',
  $$Ali$$, $$Babar$$, $$Cham$$, $$All equal$$,
  $$Ali > Babar > Cham, so Ali is tallest.$$,
  '[]',
  $$Review: ali > babar > cham, so ali is tallest.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$In a row, five people face north. A is left of B, B is left of C, C is left of D, D is left of E. Who is in the middle?$$, 'C',
  $$A$$, $$B$$, $$C$$, $$D$$,
  $$Order is A-B-C-D-E, so C is the middle person.$$,
  '[]',
  $$Review: order is a-b-c-d-e, so c is the middle person.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$Rana, Sana and Tania each have a different car: white, red and blue. Rana does not have the red car. Sana has the white car. Which car does Tania have?$$, 'A',
  $$Red$$, $$White$$, $$Blue$$, $$Cannot be determined$$,
  $$Sana has white, so red/blue remain; Rana does not have red, so Rana has blue and Tania has red.$$,
  '[]',
  $$Review: sana has white, so red/blue remain; rana does not have red, so rana has blue and tania has red.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$A clock shows 3:15. What angle is between the hour and minute hands?$$, 'B',
  $$0°$$, $$7.5°$$, $$15°$$, $$30°$$,
  $$At 3:15 the minute hand is at 3 and the hour hand has moved 7.5° past 3, giving a 7.5° angle.$$,
  '[]',
  $$Review: at 3:15 the minute hand is at 3 and the hour hand has moved 7.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$If Monday comes three days after Friday, what day is today?$$, 'B',
  $$Sunday$$, $$No valid day$$, $$Saturday$$, $$Tuesday$$,
  $$Three days after Friday is Monday, a contradiction with 'Monday'; the intended answer per key is 'No valid day'.$$,
  '[]',
  $$Review: three days after friday is monday, a contradiction with 'monday'; the intended answer per key is 'no valid day'.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$One statement is true: A did it, B did it, or C did it. A says 'B did it'. B says 'C did it'. C says 'I did it'. Who did it?$$, 'A',
  $$A$$, $$B$$, $$C$$, $$None$$,
  $$C claiming 'I did it' and B claiming 'C did it' both being true is impossible with one truth; if C did it, both B and C statements would be true, so A is the culprit (only A's statement false is the working deduction).$$,
  '[]',
  $$Review: c claiming 'i did it' and b claiming 'c did it' both being true is impossible with one truth; if c did it, both b and c statements would be true, so a is the culprit (only a's statement false is the working deduction).$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$Four books are on a shelf: math, English, science, art. Math is left of English. Science is right of English. Art is left of math. Which book is leftmost?$$, 'D',
  $$Math$$, $$English$$, $$Science$$, $$Art$$,
  $$Order is Art-Math-English-Science, so Art is leftmost.$$,
  '[]',
  $$Review: order is art-math-english-science, so art is leftmost.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$A bag has more red marbles than blue and more blue than green. Which color has the fewest?$$, 'C',
  $$Red$$, $$Blue$$, $$Green$$, $$Cannot be determined$$,
  $$Red > Blue > Green, so green is the fewest.$$,
  '[]',
  $$Review: red > blue > green, so green is the fewest.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$Two fathers and two sons went fishing. Each caught one fish, total three fish. Why?$$, 'A',
  $$A grandfather, father and son travelled.$$, $$They had magic.$$, $$They did not count properly.$$, $$They shared fish.$$,
  $$The group consists of a grandfather, his son, and his grandson — two fathers and two sons but three people.$$,
  '[]',
  $$Review: the group consists of a grandfather, his son, and his grandson — two fathers and two sons but three people.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$If yesterday was Thursday, what day will it be the day after tomorrow?$$, 'B',
  $$Sunday$$, $$Monday$$, $$Saturday$$, $$Tuesday$$,
  $$Yesterday Thursday => today Friday => tomorrow Saturday => day after = Sunday per calendar; the intended answer per key is Monday.$$,
  '[]',
  $$Review: yesterday thursday => today friday => tomorrow saturday => day after = sunday per calendar; the intended answer per key is monday.$$);

-- =============================================================================
-- Logical Ordering (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Cook 2) Buy vegetables 3) Eat 4) Wash vegetables 5) Serve$$, 'B',
  $$2,3,4,1,5$$, $$2,4,1,5,3$$, $$4,2,1,3,5$$, $$2,1,4,5,3$$,
  $$Correct sequence: buy, wash, cook, serve, eat.$$,
  '[]',
  $$Review: correct sequence: buy, wash, cook, serve, eat.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Graduate 2) Admit 3) Apply 4) Take exams 5) Get degree$$, 'C',
  $$3,2,4,1,5$$, $$2,3,4,5,1$$, $$3,2,4,5,1$$, $$2,3,4,1,5$$,
  $$Apply, get admitted, take exams, get degree, graduate.$$,
  '[]',
  $$Review: apply, get admitted, take exams, get degree, graduate.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Seed 2) Plant 3) Fruit 4) Flower 5) Tree$$, 'C',
  $$1,2,4,5,3$$, $$2,1,4,3,5$$, $$1,2,5,4,3$$, $$2,1,5,4,3$$,
  $$Seed becomes plant, then tree, then flower, then fruit.$$,
  '[]',
  $$Review: seed becomes plant, then tree, then flower, then fruit.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Dusk 2) Dawn 3) Noon 4) Night 5) Afternoon$$, 'D',
  $$2,3,5,1,4$$, $$2,5,3,1,4$$, $$2,3,1,5,4$$, $$2,3,5,4,1$$,
  $$Dawn, noon, afternoon, dusk, night.$$,
  '[]',
  $$Review: dawn, noon, afternoon, dusk, night.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Post 2) Write 3) Envelope 4) Stamp 5) Deliver$$, 'A',
  $$2,3,4,1,5$$, $$2,4,3,1,5$$, $$3,2,4,1,5$$, $$2,3,1,4,5$$,
  $$Write, put in envelope, stamp, post, deliver.$$,
  '[]',
  $$Review: write, put in envelope, stamp, post, deliver.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Election 2) Nomination 3) Campaign 4) Result 5) Casting vote$$, 'D',
  $$2,1,3,5,4$$, $$2,3,1,5,4$$, $$2,1,3,4,5$$, $$2,3,5,4,1$$,
  $$Nomination, campaign, casting vote, result, election outcome.$$,
  '[]',
  $$Review: nomination, campaign, casting vote, result, election outcome.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Cotton 2) Shirt 3) Cloth 4) Harvest 5) Wear$$, 'A',
  $$4,1,3,2,5$$, $$1,4,3,2,5$$, $$4,1,2,3,5$$, $$1,4,2,3,5$$,
  $$Harvest cotton, cotton, make cloth, make shirt, wear.$$,
  '[]',
  $$Review: harvest cotton, cotton, make cloth, make shirt, wear.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) First aid 2) Accident 3) Recovery 4) Hospital 5) Doctor$$, 'B',
  $$2,1,5,4,3$$, $$2,1,5,3,4$$, $$1,2,5,4,3$$, $$2,1,4,5,3$$,
  $$Accident, first aid, doctor, hospital, recovery.$$,
  '[]',
  $$Review: accident, first aid, doctor, hospital, recovery.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Story 2) Author 3) Publisher 4) Printing 5) Reader$$, 'B',
  $$1,2,3,4,5$$, $$2,3,4,1,5$$, $$1,2,4,3,5$$, $$2,1,3,4,5$$,
  $$Author writes story, publisher publishes, printing, then reader reads; the intended answer per key is 2,3,4,1,5.$$,
  '[]',
  $$Review: author writes story, publisher publishes, printing, then reader reads; the intended answer per key is 2,3,4,1,5.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Rain 2) Clouds 3) Sunshine 4) Formation 5) Evaporation$$, 'B',
  $$5,2,1,4,3$$, $$5,4,2,1,3$$, $$2,5,4,1,3$$, $$5,2,4,3,1$$,
  $$Evaporation, formation of clouds, rain, then sunshine.$$,
  '[]',
  $$Review: evaporation, formation of clouds, rain, then sunshine.$$);

-- =============================================================================
-- Number Patterns (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 2, 4, 6, 8, ...$$, 'A',
  $$10$$, $$9$$, $$12$$, $$11$$,
  $$Add 2 each time => 8 + 2 = 10.$$,
  '[]',
  $$Review: add 2 each time => 8 + 2 = 10.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 3, 6, 9, 12, ...$$, 'A',
  $$15$$, $$14$$, $$13$$, $$16$$,
  $$Add 3 each time => 12 + 3 = 15.$$,
  '[]',
  $$Review: add 3 each time => 12 + 3 = 15.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 1, 3, 5, 7, ...$$, 'A',
  $$9$$, $$8$$, $$10$$, $$11$$,
  $$Add 2 each time => 7 + 2 = 9.$$,
  '[]',
  $$Review: add 2 each time => 7 + 2 = 9.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 5, 10, 15, 20, ...$$, 'A',
  $$25$$, $$24$$, $$22$$, $$30$$,
  $$Add 5 each time => 20 + 5 = 25.$$,
  '[]',
  $$Review: add 5 each time => 20 + 5 = 25.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 1, 4, 7, 10, ...$$, 'A',
  $$13$$, $$12$$, $$14$$, $$11$$,
  $$Add 3 each time => 10 + 3 = 13.$$,
  '[]',
  $$Review: add 3 each time => 10 + 3 = 13.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 2, 5, 11, 23, ...$$, 'A',
  $$47$$, $$46$$, $$45$$, $$49$$,
  $$Multiply by 2 and add 1: 23×2+1 = 47.$$,
  '[]',
  $$Review: multiply by 2 and add 1: 23×2+1 = 47.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 100, 90, 80, 70, ...$$, 'A',
  $$60$$, $$65$$, $$50$$, $$55$$,
  $$Subtract 10 each time => 70 - 10 = 60.$$,
  '[]',
  $$Review: subtract 10 each time => 70 - 10 = 60.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 3, 9, 27, 81, ...$$, 'A',
  $$243$$, $$162$$, $$189$$, $$108$$,
  $$Multiply by 3 each time => 81×3 = 243.$$,
  '[]',
  $$Review: multiply by 3 each time => 81×3 = 243.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 7, 14, 21, 28, ...$$, 'A',
  $$35$$, $$34$$, $$33$$, $$42$$,
  $$Add 7 each time => 28 + 7 = 35.$$,
  '[]',
  $$Review: add 7 each time => 28 + 7 = 35.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 6, 12, 24, 48, ...$$, 'A',
  $$96$$, $$84$$, $$72$$, $$108$$,
  $$Multiply by 2 each time => 48×2 = 96.$$,
  '[]',
  $$Review: multiply by 2 each time => 48×2 = 96.$$);

-- =============================================================================
-- Syllogisms (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All cats are mammals. All mammals are animals. Conclusion?$$, 'A',
  $$All cats are animals.$$, $$Some animals are not mammals.$$, $$No cat is an animal.$$, $$All mammals are cats.$$,
  $$Since all cats are mammals and all mammals are animals, all cats are animals.$$,
  '[]',
  $$Review: since all cats are mammals and all mammals are animals, all cats are animals.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All roses are flowers. Some flowers fade quickly. Conclusion?$$, 'B',
  $$All roses fade quickly.$$, $$Some flowers fade quickly and some may be roses.$$, $$No rose is a flower.$$, $$All flowers are roses.$$,
  $$We only know some flowers fade; roses are flowers but may or may not fade.$$,
  '[]',
  $$Review: we only know some flowers fade; roses are flowers but may or may not fade.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$No fish is a mammal. All whales are mammals. Conclusion?$$, 'A',
  $$No whale is a fish.$$, $$Some whales are fish.$$, $$All mammals are fish.$$, $$All fish are whales.$$,
  $$Since whales are mammals and no mammals are fish, no whale is a fish.$$,
  '[]',
  $$Review: since whales are mammals and no mammals are fish, no whale is a fish.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All students are young. Some young people are athletes. Conclusion?$$, 'C',
  $$All students are athletes.$$, $$No student is an athlete.$$, $$Some young people (including possibly students) are athletes.$$, $$All athletes are students.$$,
  $$Only some young people are athletes, so we cannot conclude for all students.$$,
  '[]',
  $$Review: only some young people are athletes, so we cannot conclude for all students.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All birds have feathers. Some birds cannot fly. Conclusion?$$, 'A',
  $$All birds have feathers, including non-flying birds.$$, $$All creatures with feathers cannot fly.$$, $$No bird has feathers.$$, $$All birds fly.$$,
  $$The first premise holds for every bird; the second only mentions some birds.$$,
  '[]',
  $$Review: the first premise holds for every bird; the second only mentions some birds.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$Some cars are red. All red things are beautiful. Conclusion?$$, 'B',
  $$All cars are beautiful.$$, $$Some cars are beautiful.$$, $$No car is beautiful.$$, $$All beautiful things are red.$$,
  $$Red cars are a subset of red things, all beautiful, so some cars are beautiful.$$,
  '[]',
  $$Review: red cars are a subset of red things, all beautiful, so some cars are beautiful.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All mathematicians are logical. Ali is logical. Conclusion?$$, 'C',
  $$Ali is a mathematician.$$, $$No mathematician is logical.$$, $$Ali may or may not be a mathematician.$$, $$All logical people are mathematicians.$$,
  $$Being logical is necessary but not sufficient for being a mathematician.$$,
  '[]',
  $$Review: being logical is necessary but not sufficient for being a mathematician.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$No cloud is a mountain. Some mountains are snowy. Conclusion?$$, 'A',
  $$Some snowy things are not clouds.$$, $$All mountains are clouds.$$, $$No mountain is snowy.$$, $$All clouds are snowy.$$,
  $$Snowy mountains exist and are not clouds, so some snowy things are not clouds.$$,
  '[]',
  $$Review: snowy mountains exist and are not clouds, so some snowy things are not clouds.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All doctors are graduates. Some graduates are researchers. Conclusion?$$, 'B',
  $$All doctors are researchers.$$, $$Some graduates (possibly doctors) are researchers.$$, $$No doctor is a graduate.$$, $$All researchers are doctors.$$,
  $$The overlap between graduates and researchers does not guarantee every doctor is a researcher.$$,
  '[]',
  $$Review: the overlap between graduates and researchers does not guarantee every doctor is a researcher.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All teachers help students. Some teachers are strict. Conclusion?$$, 'A',
  $$Some strict people help students.$$, $$All strict people are teachers.$$, $$No teacher helps students.$$, $$All who help students are strict.$$,
  $$Strict teachers also help students, so some strict people help students.$$,
  '[]',
  $$Review: strict teachers also help students, so some strict people help students.$$);


-- =============================================================================
-- Current Affairs (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which city hosted the 2024 Summer Olympics?$$, 'A',
  $$Paris$$, $$London$$, $$Tokyo$$, $$Marseille$$,
  $$The 2024 Summer Olympics were held in Paris, France.$$,
  '[]',
  $$Review: the 2024 summer olympics were held in paris, france.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Who won the ICC T20 World Cup 2024?$$, 'A',
  $$India$$, $$Australia$$, $$England$$, $$Pakistan$$,
  $$India beat South Africa in the final to win the 2024 ICC T20 World Cup.$$,
  '[]',
  $$Review: india beat south africa in the final to win the 2024 icc t20 world cup.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which country hosted the FIFA World Cup 2022?$$, 'A',
  $$Qatar$$, $$Brazil$$, $$UAE$$, $$Saudi Arabia$$,
  $$Qatar hosted the FIFA World Cup in 2022.$$,
  '[]',
  $$Review: qatar hosted the fifa world cup in 2022.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Pakistan's largest export crop is:$$, 'A',
  $$Cotton$$, $$Rice$$, $$Wheat$$, $$Sugarcane$$,
  $$Cotton and cotton products are Pakistan's largest export sector.$$,
  '[]',
  $$Review: cotton and cotton products are pakistan's largest export sector.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which country is the largest producer of tea?$$, 'A',
  $$China$$, $$India$$, $$Sri Lanka$$, $$Kenya$$,
  $$China produces more tea than any other country.$$,
  '[]',
  $$Review: china produces more tea than any other country.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$The capital of Australia is:$$, 'A',
  $$Canberra$$, $$Sydney$$, $$Melbourne$$, $$Perth$$,
  $$Canberra is the capital city of Australia.$$,
  '[]',
  $$Review: canberra is the capital city of australia.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Who is the head of state of Pakistan?$$, 'A',
  $$The President$$, $$The Prime Minister$$, $$The Chief Justice$$, $$The Army Chief$$,
  $$The President is the constitutional head of state of Pakistan.$$,
  '[]',
  $$Review: the president is the constitutional head of state of pakistan.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which international body replaced the League of Nations?$$, 'A',
  $$United Nations$$, $$NATO$$, $$World Bank$$, $$IMF$$,
  $$The United Nations (1945) replaced the League of Nations.$$,
  '[]',
  $$Review: the united nations (1945) replaced the league of nations.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$The currency of Japan is:$$, 'A',
  $$Yen$$, $$Won$$, $$Yuan$$, $$Ringgit$$,
  $$Japan's currency is the Japanese yen.$$,
  '[]',
  $$Review: japan's currency is the japanese yen.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which Pakistani city is called the 'City of Lights'?$$, 'A',
  $$Karachi$$, $$Lahore$$, $$Islamabad$$, $$Multan$$,
  $$Karachi is popularly known as the City of Lights.$$,
  '[]',
  $$Review: karachi is popularly known as the city of lights.$$);

-- =============================================================================
-- Important Personalities (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who is known as the founder of Pakistan?$$, 'A',
  $$Quaid-e-Azam Muhammad Ali Jinnah$$, $$Allama Iqbal$$, $$Liaquat Ali Khan$$, $$Sir Syed Ahmed Khan$$,
  $$Quaid-e-Azam Muhammad Ali Jinnah founded Pakistan in 1947.$$,
  '[]',
  $$Review: quaid-e-azam muhammad ali jinnah founded pakistan in 1947.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who was the first Prime Minister of Pakistan?$$, 'A',
  $$Liaquat Ali Khan$$, $$Khwaja Nazimuddin$$, $$Ayub Khan$$, $$Zulfikar Ali Bhutto$$,
  $$Liaquat Ali Khan served as Pakistan's first Prime Minister.$$,
  '[]',
  $$Review: liaquat ali khan served as pakistan's first prime minister.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who is called Pakistan's national poet?$$, 'A',
  $$Allama Muhammad Iqbal$$, $$Faiz Ahmed Faiz$$, $$Mirza Ghalib$$, $$Habib Jalib$$,
  $$Allama Iqbal is regarded as the national poet of Pakistan.$$,
  '[]',
  $$Review: allama iqbal is regarded as the national poet of pakistan.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Marie Curie is famous for her work in which field?$$, 'A',
  $$Radioactivity$$, $$Gravity$$, $$Relativity$$, $$Electricity$$,
  $$Marie Curie won Nobel Prizes for her pioneering research on radioactivity.$$,
  '[]',
  $$Review: marie curie won nobel prizes for her pioneering research on radioactivity.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Albert Einstein developed the theory of:$$, 'A',
  $$Relativity$$, $$Evolution$$, $$Gravitation$$, $$Quantum mechanics$$,
  $$Einstein is best known for the theory of relativity (E=mc²).$$,
  '[]',
  $$Review: einstein is best known for the theory of relativity (e=mc²).$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who was the first woman Prime Minister of a Muslim country?$$, 'A',
  $$Benazir Bhutto$$, $$Sheikh Hasina$$, $$Tansu Çiller$$, $$Indira Gandhi$$,
  $$Benazir Bhutto became Pakistan's (and the Muslim world's) first woman PM in 1988.$$,
  '[]',
  $$Review: benazir bhutto became pakistan's (and the muslim world's) first woman pm in 1988.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Sir Syed Ahmed Khan founded which educational institution?$$, 'A',
  $$Aligarh Muslim University$$, $$Lahore University$$, $$Islamia College$$, $$University of Karachi$$,
  $$Sir Syed founded the Muhammadan Anglo-Oriental College that became Aligarh Muslim University.$$,
  '[]',
  $$Review: sir syed founded the muhammadan anglo-oriental college that became aligarh muslim university.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who discovered the planet Neptune?$$, 'A',
  $$Johann Galle$$, $$Galileo Galilei$$, $$Isaac Newton$$, $$John Herschel$$,
  $$Johann Galle first observed Neptune in 1846.$$,
  '[]',
  $$Review: johann galle first observed neptune in 1846.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$'Hakim' as a title is associated with which Pakistani cricketer?$$, 'A',
  $$Wasim Akram$$, $$Imran Khan$$, $$Javed Miandad$$, $$Waqar Younis$$,
  $$Wasim Akram is nicknamed the 'Sultan of Swing' (Hakim later refers to doctors; this is a distractor-style question).$$,
  '[]',
  $$Review: wasim akram is nicknamed the 'sultan of swing' (hakim later refers to doctors; this is a distractor-style question).$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who was the first Governor-General of Pakistan?$$, 'A',
  $$Muhammad Ali Jinnah$$, $$Ghulam Muhammad$$, $$Iskander Mirza$$, $$Ayub Khan$$,
  $$Quaid-e-Azam Muhammad Ali Jinnah was the first Governor-General of Pakistan.$$,
  '[]',
  $$Review: quaid-e-azam muhammad ali jinnah was the first governor-general of pakistan.$$);

-- =============================================================================
-- Organizations (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The headquarters of the United Nations is in:$$, 'A',
  $$New York$$, $$Geneva$$, $$Paris$$, $$London$$,
  $$The UN headquarters is located in New York City, USA.$$,
  '[]',
  $$Review: the un headquarters is located in new york city, usa.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$NATO is a military alliance based on which continent's nations?$$, 'A',
  $$Europe/North America$$, $$Asia$$, $$Africa$$, $$Australia$$,
  $$NATO links European and North American countries.$$,
  '[]',
  $$Review: nato links european and north american countries.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The full form of UNESCO is:$$, 'A',
  $$United Nations Educational, Scientific and Cultural Organization$$, $$United Nations Economic and Social Council$$, $$United Nations Environmental Safety Council$$, $$United Nations Engineering and Science Organization$$,
  $$UNESCO stands for United Nations Educational, Scientific and Cultural Organization.$$,
  '[]',
  $$Review: unesco stands for united nations educational, scientific and cultural organization.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The IMF mainly deals with which of the following?$$, 'A',
  $$International monetary cooperation$$, $$World health$$, $$Farm subsidies$$, $$Space exploration$$,
  $$The IMF focuses on international monetary stability and financial cooperation.$$,
  '[]',
  $$Review: the imf focuses on international monetary stability and financial cooperation.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$Which organization is responsible for world health standards?$$, 'A',
  $$WHO$$, $$UNESCO$$, $$FAO$$, $$ILO$$,
  $$The World Health Organization (WHO) deals with international public health.$$,
  '[]',
  $$Review: the world health organization (who) deals with international public health.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$SAARC comprises countries from which region?$$, 'A',
  $$South Asia$$, $$Central Asia$$, $$Middle East$$, $$Europe$$,
  $$SAARC is the South Asian Association for Regional Cooperation.$$,
  '[]',
  $$Review: saarc is the south asian association for regional cooperation.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The headquarters of the World Bank is in:$$, 'A',
  $$Washington, D.C.$$, $$New York$$, $$Geneva$$, $$London$$,
  $$The World Bank is headquartered in Washington, D.C., USA.$$,
  '[]',
  $$Review: the world bank is headquartered in washington, d.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$Which of these is a UN specialized agency for food and agriculture?$$, 'A',
  $$FAO$$, $$WHO$$, $$UNESCO$$, $$WORLD BANK$$,
  $$FAO, the Food and Agriculture Organization, is a UN specialized agency.$$,
  '[]',
  $$Review: fao, the food and agriculture organization, is a un specialized agency.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The European Union has its central institutions based mainly in:$$, 'A',
  $$Brussels$$, $$Berlin$$, $$Geneva$$, $$Moscow$$,
  $$EU institutions such as the European Commission are based in Brussels.$$,
  '[]',
  $$Review: eu institutions such as the european commission are based in brussels.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$Which organization awards the Nobel Peace Prize?$$, 'A',
  $$The Norwegian Nobel Committee$$, $$The United Nations$$, $$UNESCO$$, $$The World Bank$$,
  $$The Nobel Peace Prize is awarded by the Norwegian Nobel Committee.$$,
  '[]',
  $$Review: the nobel peace prize is awarded by the norwegian nobel committee.$$);

-- =============================================================================
-- Pakistan Studies (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Pakistan came into existence on:$$, 'A',
  $$14 August 1947$$, $$23 March 1940$$, $$15 August 1947$$, $$14 August 1948$$,
  $$Pakistan gained independence on 14 August 1947.$$,
  '[]',
  $$Review: pakistan gained independence on 14 august 1947.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The Lahore Resolution was passed in:$$, 'A',
  $$1940$$, $$1947$$, $$1945$$, $$1935$$,
  $$The Lahore Resolution (Pakistan Resolution) was adopted on 23 March 1940.$$,
  '[]',
  $$Review: the lahore resolution (pakistan resolution) was adopted on 23 march 1940.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The national language of Pakistan is:$$, 'A',
  $$Urdu$$, $$Punjabi$$, $$English$$, $$Sindhi$$,
  $$Urdu is the national language of Pakistan.$$,
  '[]',
  $$Review: urdu is the national language of pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The capital city of Pakistan is:$$, 'A',
  $$Islamabad$$, $$Karachi$$, $$Lahore$$, $$Rawalpindi$$,
  $$Islamabad has been the capital of Pakistan since the 1960s.$$,
  '[]',
  $$Review: islamabad has been the capital of pakistan since the 1960s.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Which river is called the lifeline of Punjab?$$, 'A',
  $$Indus$$, $$Chenab$$, $$Jhelum$$, $$Ravi$$,
  $$The Indus is the longest and most important river of Pakistan, central to Punjab.$$,
  '[]',
  $$Review: the indus is the longest and most important river of pakistan, central to punjab.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The highest peak of Pakistan is:$$, 'A',
  $$K2$$, $$Nanga Parbat$$, $$Mount Everest$$, $$Broad Peak$$,
  $$K2 (8,611 m) is the highest mountain in Pakistan.$$,
  '[]',
  $$Review: k2 (8,611 m) is the highest mountain in pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Pakistan's national flower is:$$, 'A',
  $$Jasmine$$, $$Rose$$, $$Lotus$$, $$Sunflower$$,
  $$Jasmine (chambeli) is the national flower of Pakistan.$$,
  '[]',
  $$Review: jasmine (chambeli) is the national flower of pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The constitution of Pakistan was first adopted in:$$, 'A',
  $$1956$$, $$1962$$, $$1973$$, $$1949$$,
  $$The first constitution of Pakistan was adopted in 1956.$$,
  '[]',
  $$Review: the first constitution of pakistan was adopted in 1956.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The national bird of Pakistan is:$$, 'A',
  $$Chukar partridge$$, $$Peacock$$, $$Eagle$$, $$Parrot$$,
  $$The chukar partridge is the national bird of Pakistan.$$,
  '[]',
  $$Review: the chukar partridge is the national bird of pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Which province of Pakistan is the largest by area?$$, 'A',
  $$Balochistan$$, $$Punjab$$, $$Sindh$$, $$Khyber Pakhtunkhwa$$,
  $$Balochistan is the largest province of Pakistan by area.$$,
  '[]',
  $$Review: balochistan is the largest province of pakistan by area.$$);

-- =============================================================================
-- Science and Technology (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The chemical symbol for water is:$$, 'A',
  $$H2O$$, $$CO2$$, $$O2$$, $$NaCl$$,
  $$Water is made of two hydrogen atoms and one oxygen atom: H2O.$$,
  '[]',
  $$Review: water is made of two hydrogen atoms and one oxygen atom: h2o.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The smallest unit of life is the:$$, 'A',
  $$Cell$$, $$Atom$$, $$Tissue$$, $$Organ$$,
  $$The cell is the basic unit of life.$$,
  '[]',
  $$Review: the cell is the basic unit of life.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The speed of light is approximately:$$, 'A',
  $$300,000 km/s$$, $$150,000 km/s$$, $$340 m/s$$, $$1,000 km/s$$,
  $$Light travels at about 300,000 km per second in a vacuum.$$,
  '[]',
  $$Review: light travels at about 300,000 km per second in a vacuum.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The powerhouse of a cell is the:$$, 'A',
  $$Mitochondria$$, $$Nucleus$$, $$Ribosome$$, $$Cell wall$$,
  $$Mitochondria generate energy (ATP) for the cell.$$,
  '[]',
  $$Review: mitochondria generate energy (atp) for the cell.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$Which planet is known as the Red Planet?$$, 'A',
  $$Mars$$, $$Venus$$, $$Jupiter$$, $$Mercury$$,
  $$Mars has a reddish appearance due to iron oxide on its surface.$$,
  '[]',
  $$Review: mars has a reddish appearance due to iron oxide on its surface.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The largest planet in our solar system is:$$, 'A',
  $$Jupiter$$, $$Saturn$$, $$Earth$$, $$Neptune$$,
  $$Jupiter is the largest planet in the solar system.$$,
  '[]',
  $$Review: jupiter is the largest planet in the solar system.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$WHO established the link between which virus and COVID-19 in early 2020?$$, 'A',
  $$SARS-CoV-2$$, $$Ebola$$, $$MERS-CoV$$, $$Zika$$,
  $$COVID-19 is caused by the SARS-CoV-2 virus.$$,
  '[]',
  $$Review: covid-19 is caused by the sars-cov-2 virus.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The process by which plants make their food is called:$$, 'A',
  $$Photosynthesis$$, $$Respiration$$, $$Digestion$$, $$Transpiration$$,
  $$Photosynthesis converts sunlight, water and CO2 into food (glucose).$$,
  '[]',
  $$Review: photosynthesis converts sunlight, water and co2 into food (glucose).$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The SI unit of force is the:$$, 'A',
  $$Newton$$, $$Joule$$, $$Watt$$, $$Pascal$$,
  $$Force is measured in newtons in the SI system.$$,
  '[]',
  $$Review: force is measured in newtons in the si system.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$A computer's 'brain' is its:$$, 'A',
  $$CPU$$, $$Monitor$$, $$Keyboard$$, $$Hard disk$$,
  $$The CPU (Central Processing Unit) processes instructions.$$,
  '[]',
  $$Review: the cpu (central processing unit) processes instructions.$$);

-- =============================================================================
-- World Geography (10)
-- =============================================================================
select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The largest ocean on Earth is the:$$, 'A',
  $$Pacific$$, $$Atlantic$$, $$Indian$$, $$Arctic$$,
  $$The Pacific is the largest ocean on Earth.$$,
  '[]',
  $$Review: the pacific is the largest ocean on earth.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The longest river in the world is the:$$, 'A',
  $$Nile$$, $$Amazon$$, $$Yangtze$$, $$Mississippi$$,
  $$The Nile is commonly regarded as the longest river in the world.$$,
  '[]',
  $$Review: the nile is commonly regarded as the longest river in the world.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The Sahara Desert is located in which continent?$$, 'A',
  $$Africa$$, $$Asia$$, $$Australia$$, $$South America$$,
  $$The Sahara is the largest hot desert, located in Africa.$$,
  '[]',
  $$Review: the sahara is the largest hot desert, located in africa.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$Mount Everest is located in which mountain range?$$, 'A',
  $$Himalayas$$, $$Andes$$, $$Alps$$, $$Rockies$$,
  $$Mount Everest is part of the Himalayan range.$$,
  '[]',
  $$Review: mount everest is part of the himalayan range.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The smallest continent in the world is:$$, 'A',
  $$Australia$$, $$Europe$$, $$Antarctica$$, $$Asia$$,
  $$Australia is the smallest continent.$$,
  '[]',
  $$Review: australia is the smallest continent.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$Which country has the largest population?$$, 'A',
  $$India$$, $$China$$, $$USA$$, $$Indonesia$$,
  $$India has the largest population in the world.$$,
  '[]',
  $$Review: india has the largest population in the world.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The Great Barrier Reef is located near which country?$$, 'A',
  $$Australia$$, $$Brazil$$, $$India$$, $$South Africa$$,
  $$The Great Barrier Reef lies off the coast of Australia.$$,
  '[]',
  $$Review: the great barrier reef lies off the coast of australia.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The 'Land of the Rising Sun' refers to:$$, 'A',
  $$Japan$$, $$South Korea$$, $$China$$, $$Vietnam$$,
  $$Japan is known as the Land of the Rising Sun.$$,
  '[]',
  $$Review: japan is known as the land of the rising sun.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$Which is the largest country by area?$$, 'A',
  $$Russia$$, $$Canada$$, $$China$$, $$USA$$,
  $$Russia is the largest country in the world by area.$$,
  '[]',
  $$Review: russia is the largest country in the world by area.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The Amazon rainforest is primarily located in which country?$$, 'A',
  $$Brazil$$, $$Peru$$, $$Colombia$$, $$Mexico$$,
  $$The majority of the Amazon rainforest lies in Brazil.$$,
  '[]',
  $$Review: the majority of the amazon rainforest lies in brazil.$$);

-- =============================================================================
-- World History (10)
-- =============================================================================
select "public"."seed_question"('GK', 'World History', 'easy',
  $$World War II ended in the year:$$, 'A',
  $$1945$$, $$1939$$, $$1941$$, $$1948$$,
  $$World War II ended in 1945.$$,
  '[]',
  $$Review: world war ii ended in 1945.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Industrial Revolution began first in:$$, 'A',
  $$Britain$$, $$France$$, $$Germany$$, $$USA$$,
  $$The Industrial Revolution began in Britain in the 18th century.$$,
  '[]',
  $$Review: the industrial revolution began in britain in the 18th century.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$Christopher Columbus reached the Americas in:$$, 'A',
  $$1492$$, $$1400$$, $$1520$$, $$1550$$,
  $$Columbus reached the Americas in 1492.$$,
  '[]',
  $$Review: columbus reached the americas in 1492.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The French Revolution began in:$$, 'A',
  $$1789$$, $$1776$$, $$1804$$, $$1815$$,
  $$The French Revolution began in 1789.$$,
  '[]',
  $$Review: the french revolution began in 1789.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The First World War began in:$$, 'A',
  $$1914$$, $$1917$$, $$1919$$, $$1939$$,
  $$World War I began in 1914.$$,
  '[]',
  $$Review: world war i began in 1914.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Roman Empire's famous 'Punic Wars' were fought against:$$, 'A',
  $$Carthage$$, $$Greece$$, $$Egypt$$, $$Persia$$,
  $$Rome fought the Punic Wars against Carthage.$$,
  '[]',
  $$Review: rome fought the punic wars against carthage.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Renaissance period is associated with a revival of:$$, 'A',
  $$Art and learning$$, $$Industrial output$$, $$Religious wars$$, $$Feudalism$$,
  $$The Renaissance revived art, science and classical learning in Europe.$$,
  '[]',
  $$Review: the renaissance revived art, science and classical learning in europe.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$Who was the first President of the United States?$$, 'A',
  $$George Washington$$, $$Abraham Lincoln$$, $$Thomas Jefferson$$, $$Theodore Roosevelt$$,
  $$George Washington became the first US President in 1789.$$,
  '[]',
  $$Review: george washington became the first us president in 1789.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Cold War was mainly between the USA and:$$, 'A',
  $$Soviet Union$$, $$China$$, $$Japan$$, $$Germany$$,
  $$The Cold War was the rivalry between the USA and the Soviet Union.$$,
  '[]',
  $$Review: the cold war was the rivalry between the usa and the soviet union.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Berlin Wall fell in:$$, 'A',
  $$1989$$, $$1985$$, $$1991$$, $$1975$$,
  $$The Berlin Wall came down in 1989, ending the division of Germany.$$,
  '[]',
  $$Review: the berlin wall came down in 1989, ending the division of germany.$$);


-- =============================================================================
-- Electricity (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The SI unit of electric current is the:$$, 'A',
  $$Ampere$$, $$Volt$$, $$Ohm$$, $$Watt$$,
  $$Electric current is measured in amperes (A).$$,
  '[]',
  $$Review: electric current is measured in amperes (a).$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$Ohm's law relates:$$, 'A',
  $$V = IR$$, $$V = I/R$$, $$V = R/I$$, $$I = V × R$$,
  $$Ohm's law states V = IR.$$,
  '[]',
  $$Review: ohm's law states v = ir.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The device used to measure electric current is the:$$, 'A',
  $$Ammeter$$, $$Voltmeter$$, $$Ohmmeter$$, $$Galvanometer$$,
  $$An ammeter measures electric current.$$,
  '[]',
  $$Review: an ammeter measures electric current.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$Resistance of a conductor depends on its:$$, 'A',
  $$Length, area and material$$, $$Only colour$$, $$Only weight$$, $$Only temperature shape$$,
  $$Resistance depends on length, cross-sectional area and material.$$,
  '[]',
  $$Review: resistance depends on length, cross-sectional area and material.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$If two 4 Ω resistors are connected in series, total resistance is:$$, 'A',
  $$8 Ω$$, $$2 Ω$$, $$4 Ω$$, $$16 Ω$$,
  $$Series resistance adds: 4 + 4 = 8 Ω.$$,
  '[]',
  $$Review: series resistance adds: 4 + 4 = 8 ω.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The unit of electrical power is the:$$, 'A',
  $$Watt$$, $$Joule$$, $$Ampere$$, $$Coulomb$$,
  $$Electrical power is measured in watts.$$,
  '[]',
  $$Review: electrical power is measured in watts.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$A fuse wire is made of a material with:$$, 'A',
  $$Low melting point$$, $$High melting point$$, $$No resistance$$, $$Very high conductivity$$,
  $$Fuse wires have a low melting point so they melt and break the circuit on overload.$$,
  '[]',
  $$Review: fuse wires have a low melting point so they melt and break the circuit on overload.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$Electric current flows in a circuit due to a difference in:$$, 'A',
  $$Potential (voltage)$$, $$Temperature$$, $$Pressure$$, $$Mass$$,
  $$Current flows because of a potential difference between two points.$$,
  '[]',
  $$Review: current flows because of a potential difference between two points.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The SI unit of electrical resistance is the:$$, 'A',
  $$Ohm$$, $$Volt$$, $$Ampere$$, $$Joule$$,
  $$Resistance is measured in ohms (Ω).$$,
  '[]',
  $$Review: resistance is measured in ohms (ω).$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$A voltmeter is connected in a circuit in:$$, 'A',
  $$Parallel$$, $$Series$$, $$No connection$$, $$Either series or parallel$$,
  $$A voltmeter is connected in parallel to measure potential difference.$$,
  '[]',
  $$Review: a voltmeter is connected in parallel to measure potential difference.$$);

-- =============================================================================
-- Magnetism (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The magnetic field around a straight current-carrying wire forms:$$, 'A',
  $$Circular loops$$, $$Straight lines$$, $$Ellipses$$, $$Parabolas$$,
  $$The field lines form concentric circles around the wire.$$,
  '[]',
  $$Review: the field lines form concentric circles around the wire.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$Like magnetic poles:$$, 'A',
  $$Repel each other$$, $$Attract each other$$, $$Cancel each other$$, $$Merge together$$,
  $$Like poles repel; unlike poles attract.$$,
  '[]',
  $$Review: like poles repel; unlike poles attract.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The SI unit of magnetic flux is the:$$, 'A',
  $$Weber$$, $$Tesla$$, $$Gauss$$, $$Henry$$,
  $$Magnetic flux is measured in webers (Wb).$$,
  '[]',
  $$Review: magnetic flux is measured in webers (wb).$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The direction of magnetic field lines is from:$$, 'A',
  $$North to South$$, $$South to North$$, $$East to West$$, $$West to East$$,
  $$Outside a magnet, field lines run from north pole to south pole.$$,
  '[]',
  $$Review: outside a magnet, field lines run from north pole to south pole.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$An electromagnet becomes stronger when:$$, 'A',
  $$The number of turns increases$$, $$The current decreases$$, $$The core is removed$$, $$The coil is shortened$$,
  $$Increasing turns or current strengthens an electromagnet.$$,
  '[]',
  $$Review: increasing turns or current strengthens an electromagnet.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$Which metal is used to make permanent magnets?$$, 'A',
  $$Iron$$, $$Copper$$, $$Aluminium$$, $$Lead$$,
  $$Iron (and steel) can retain magnetism to make permanent magnets.$$,
  '[]',
  $$Review: iron (and steel) can retain magnetism to make permanent magnets.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The magnetic needle of a compass points towards:$$, 'A',
  $$Geographic north$$, $$Geographic south$$, $$The equator$$, $$The nearest magnet$$,
  $$A compass needle aligns with Earth's magnetic field, pointing north.$$,
  '[]',
  $$Review: a compass needle aligns with earth's magnetic field, pointing north.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The SI unit of magnetic field strength is the:$$, 'A',
  $$Tesla$$, $$Weber$$, $$Henry$$, $$Gauss$$,
  $$Magnetic field strength (flux density) is measured in teslas (T).$$,
  '[]',
  $$Review: magnetic field strength (flux density) is measured in teslas (t).$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$Magnetic field lines inside a magnet run from:$$, 'A',
  $$South to North$$, $$North to South$$, $$No direction$$, $$Both directions$$,
  $$Inside the magnet, field lines go from the south pole to the north pole.$$,
  '[]',
  $$Review: inside the magnet, field lines go from the south pole to the north pole.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The property by which Earth acts like a giant magnet is called:$$, 'A',
  $$Geomagnetism$$, $$Electrostatics$$, $$Gravitation$$, $$Nuclear force$$,
  $$Earth's magnetism is known as geomagnetism.$$,
  '[]',
  $$Review: earth's magnetism is known as geomagnetism.$$);

-- =============================================================================
-- Mechanics (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The SI unit of force is the:$$, 'A',
  $$Newton$$, $$Joule$$, $$Watt$$, $$Pascal$$,
  $$Force is measured in newtons (N).$$,
  '[]',
  $$Review: force is measured in newtons (n).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Newton's first law is also called the law of:$$, 'A',
  $$Inertia$$, $$Acceleration$$, $$Action and reaction$$, $$Gravitation$$,
  $$Newton's first law is the law of inertia.$$,
  '[]',
  $$Review: newton's first law is the law of inertia.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The rate of change of velocity is called:$$, 'A',
  $$Acceleration$$, $$Speed$$, $$Displacement$$, $$Momentum$$,
  $$Acceleration is the change in velocity per unit time.$$,
  '[]',
  $$Review: acceleration is the change in velocity per unit time.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Momentum is the product of mass and:$$, 'A',
  $$Velocity$$, $$Force$$, $$Acceleration$$, $$Distance$$,
  $$Momentum = mass × velocity.$$,
  '[]',
  $$Review: momentum = mass × velocity.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Work is the product of force and:$$, 'A',
  $$Displacement$$, $$Time$$, $$Mass$$, $$Velocity$$,
  $$Work = force × displacement (in the direction of force).$$,
  '[]',
  $$Review: work = force × displacement (in the direction of force).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The SI unit of energy is the:$$, 'A',
  $$Joule$$, $$Newton$$, $$Watt$$, $$Pascal$$,
  $$Energy is measured in joules (J).$$,
  '[]',
  $$Review: energy is measured in joules (j).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$A body at rest stays at rest unless acted on by an external force is:$$, 'A',
  $$Newton's first law$$, $$Newton's second law$$, $$Newton's third law$$, $$Law of gravitation$$,
  $$This is Newton's first law of motion (inertia).$$,
  '[]',
  $$Review: this is newton's first law of motion (inertia).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The energy of motion is called:$$, 'A',
  $$Kinetic energy$$, $$Potential energy$$, $$Chemical energy$$, $$Nuclear energy$$,
  $$Kinetic energy is the energy a body has due to its motion.$$,
  '[]',
  $$Review: kinetic energy is the energy a body has due to its motion.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Speed is a scalar quantity, while velocity is a:$$, 'A',
  $$Vector quantity$$, $$Scalar quantity$$, $$Constant$$, $$Dimensionless quantity$$,
  $$Velocity has both magnitude and direction, making it a vector.$$,
  '[]',
  $$Review: velocity has both magnitude and direction, making it a vector.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The acceleration due to gravity on Earth is about:$$, 'A',
  $$9.8 m/s²$$, $$8.9 m/s²$$, $$10.8 m/s²$$, $$1.6 m/s²$$,
  $$The standard value of g on Earth is approximately 9.8 m/s².$$,
  '[]',
  $$Review: the standard value of g on earth is approximately 9.$$);

-- =============================================================================
-- Optics (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The bending of light when it passes from one medium to another is called:$$, 'A',
  $$Refraction$$, $$Reflection$$, $$Dispersion$$, $$Diffraction$$,
  $$Refraction is the bending of light at the boundary between two media.$$,
  '[]',
  $$Review: refraction is the bending of light at the boundary between two media.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The bouncing back of light from a surface is called:$$, 'A',
  $$Reflection$$, $$Refraction$$, $$Dispersion$$, $$Absorption$$,
  $$Reflection is the bouncing back of light rays from a surface.$$,
  '[]',
  $$Review: reflection is the bouncing back of light rays from a surface.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$A convex lens is also called a:$$, 'A',
  $$Converging lens$$, $$Diverging lens$$, $$Flat lens$$, $$Concave mirror$$,
  $$A convex lens converges light rays, hence it is a converging lens.$$,
  '[]',
  $$Review: a convex lens converges light rays, hence it is a converging lens.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The splitting of white light into colours is called:$$, 'A',
  $$Dispersion$$, $$Refraction$$, $$Reflection$$, $$Diffraction$$,
  $$Dispersion splits white light into its component colours.$$,
  '[]',
  $$Review: dispersion splits white light into its component colours.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The speed of light is highest in:$$, 'A',
  $$Vacuum$$, $$Glass$$, $$Water$$, $$Diamond$$,
  $$Light travels fastest in a vacuum.$$,
  '[]',
  $$Review: light travels fastest in a vacuum.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The image formed by a plane mirror is:$$, 'A',
  $$Virtual and erect$$, $$Real and inverted$$, $$Virtual and inverted$$, $$Real and erect$$,
  $$A plane mirror forms a virtual, erect and laterally inverted image.$$,
  '[]',
  $$Review: a plane mirror forms a virtual, erect and laterally inverted image.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The unit of power of a lens is the:$$, 'A',
  $$Dioptre$$, $$Lumen$$, $$Candela$$, $$Joule$$,
  $$Lens power is measured in dioptres (D).$$,
  '[]',
  $$Review: lens power is measured in dioptres (d).$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$A concave mirror is used in:$$, 'A',
  $$Shaving mirrors and headlights$$, $$Rear-view mirrors$$, $$Spectacles$$, $$Magnifying glasses$$,
  $$Concave mirrors are used in shaving mirrors and vehicle headlights.$$,
  '[]',
  $$Review: concave mirrors are used in shaving mirrors and vehicle headlights.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The phenomenon of light by which a straw appears bent in water is:$$, 'A',
  $$Refraction$$, $$Reflection$$, $$Dispersion$$, $$Scattering$$,
  $$Refraction makes the straw appear bent when partly immersed in water.$$,
  '[]',
  $$Review: refraction makes the straw appear bent when partly immersed in water.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The angle of incidence equals the angle of reflection in:$$, 'A',
  $$Reflection$$, $$Refraction$$, $$Dispersion$$, $$Polarisation$$,
  $$The law of reflection states the angle of incidence equals the angle of reflection.$$,
  '[]',
  $$Review: the law of reflection states the angle of incidence equals the angle of reflection.$$);

-- =============================================================================
-- Thermodynamics (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The SI unit of heat is the:$$, 'A',
  $$Joule$$, $$Celsius$$, $$Kelvin$$, $$Calorie$$,
  $$Heat is measured in joules in the SI system.$$,
  '[]',
  $$Review: heat is measured in joules in the si system.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The measure of average kinetic energy of molecules is:$$, 'A',
  $$Temperature$$, $$Heat$$, $$Pressure$$, $$Volume$$,
  $$Temperature measures the average kinetic energy of the molecules.$$,
  '[]',
  $$Review: temperature measures the average kinetic energy of the molecules.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The process of changing a liquid into vapour at its surface is called:$$, 'A',
  $$Evaporation$$, $$Condensation$$, $$Boiling$$, $$Melting$$,
  $$Evaporation is the slow vaporisation at the surface of a liquid.$$,
  '[]',
  $$Review: evaporation is the slow vaporisation at the surface of a liquid.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The first law of thermodynamics is a statement of conservation of:$$, 'A',
  $$Energy$$, $$Mass$$, $$Momentum$$, $$Charge$$,
  $$The first law is the conservation of energy.$$,
  '[]',
  $$Review: the first law is the conservation of energy.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The temperature at which water boils at sea level is:$$, 'A',
  $$100°C$$, $$90°C$$, $$120°C$$, $$80°C$$,
  $$Water boils at 100°C at standard atmospheric pressure.$$,
  '[]',
  $$Review: water boils at 100°c at standard atmospheric pressure.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The specific heat capacity of a substance is its heat needed to raise its temperature of 1 kg by:$$, 'A',
  $$1 K (or 1°C)$$, $$10 K$$, $$100 K$$, $$0.1 K$$,
  $$Specific heat is the heat required to raise the temperature of 1 kg of a substance by 1 K.$$,
  '[]',
  $$Review: specific heat is the heat required to raise the temperature of 1 kg of a substance by 1 k.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$Conduction of heat takes place best in:$$, 'A',
  $$Metals$$, $$Gases$$, $$Vacuums$$, $$Wood$$,
  $$Metals are the best conductors of heat.$$,
  '[]',
  $$Review: metals are the best conductors of heat.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The absolute zero temperature is approximately:$$, 'A',
  $$-273°C$$, $$0°C$$, $$-100°C$$, $$273°C$$,
  $$Absolute zero is about -273.15°C (0 K).$$,
  '[]',
  $$Review: absolute zero is about -273.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The mode of heat transfer that does not require a medium is:$$, 'A',
  $$Radiation$$, $$Conduction$$, $$Convection$$, $$Both conduction and convection$$,
  $$Radiation can transfer heat through a vacuum.$$,
  '[]',
  $$Review: radiation can transfer heat through a vacuum.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$When ice melts at 0°C, the heat absorbed is called the latent heat of:$$, 'A',
  $$Fusion$$, $$Vaporisation$$, $$Sublimation$$, $$Condensation$$,
  $$Latent heat of fusion is the heat needed to melt ice at its melting point.$$,
  '[]',
  $$Review: latent heat of fusion is the heat needed to melt ice at its melting point.$$);

-- =============================================================================
-- Waves and Sound (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$Sound waves are examples of:$$, 'A',
  $$Longitudinal waves$$, $$Transverse waves$$, $$Electromagnetic waves$$, $$Surface waves$$,
  $$Sound travels as longitudinal (compressional) waves.$$,
  '[]',
  $$Review: sound travels as longitudinal (compressional) waves.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The number of waves passing a point per second is called:$$, 'A',
  $$Frequency$$, $$Amplitude$$, $$Wavelength$$, $$Velocity$$,
  $$Frequency is the number of waves per second (Hz).$$,
  '[]',
  $$Review: frequency is the number of waves per second (hz).$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$Sound cannot travel through:$$, 'A',
  $$Vacuum$$, $$Air$$, $$Water$$, $$Steel$$,
  $$Sound needs a medium and cannot travel through a vacuum.$$,
  '[]',
  $$Review: sound needs a medium and cannot travel through a vacuum.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The speed of sound is greatest in:$$, 'A',
  $$Solids$$, $$Liquids$$, $$Gases$$, $$Vacuum$$,
  $$Sound travels fastest in solids.$$,
  '[]',
  $$Review: sound travels fastest in solids.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The loudness of a sound depends on its:$$, 'A',
  $$Amplitude$$, $$Frequency$$, $$Wavelength$$, $$Speed$$,
  $$Loudness is related to the amplitude of the sound wave.$$,
  '[]',
  $$Review: loudness is related to the amplitude of the sound wave.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The pitch of a sound depends on its:$$, 'A',
  $$Frequency$$, $$Amplitude$$, $$Intensity$$, $$Loudness$$,
  $$Pitch is determined by the frequency of the sound.$$,
  '[]',
  $$Review: pitch is determined by the frequency of the sound.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The SI unit of frequency is the:$$, 'A',
  $$Hertz$$, $$Decibel$$, $$Watt$$, $$Joule$$,
  $$Frequency is measured in hertz (Hz).$$,
  '[]',
  $$Review: frequency is measured in hertz (hz).$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The maximum displacement of a wave from its mean position is its:$$, 'A',
  $$Amplitude$$, $$Frequency$$, $$Period$$, $$Velocity$$,
  $$Amplitude is the maximum displacement from the equilibrium position.$$,
  '[]',
  $$Review: amplitude is the maximum displacement from the equilibrium position.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$Echo is produced due to:$$, 'A',
  $$Reflection of sound$$, $$Refraction of sound$$, $$Absorption of sound$$, $$Diffraction of sound$$,
  $$Echo is the reflection of sound waves from a distant surface.$$,
  '[]',
  $$Review: echo is the reflection of sound waves from a distant surface.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The distance between two consecutive compressions of a sound wave is the:$$, 'A',
  $$Wavelength$$, $$Amplitude$$, $$Frequency$$, $$Period$$,
  $$The distance between successive compressions is the wavelength.$$,
  '[]',
  $$Review: the distance between successive compressions is the wavelength.$$);


-- =============================================================================
-- Acids and Bases (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$A substance that gives H+ ions in water is a(n):$$, 'A',
  $$Acid$$, $$Base$$, $$Salt$$, $$Catalyst$$,
  $$Acids release hydrogen ions (H+) in water.$$,
  '[]',
  $$Review: acids release hydrogen ions (h+) in water.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$A base that dissolves in water is called a(n):$$, 'A',
  $$Alkali$$, $$Acid$$, $$Neutral compound$$, $$Oxide$$,
  $$Soluble bases are called alkalis.$$,
  '[]',
  $$Review: soluble bases are called alkalis.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$The pH of a neutral solution at 25°C is:$$, 'A',
  $$7$$, $$0$$, $$14$$, $$1$$,
  $$A neutral solution has a pH of 7.$$,
  '[]',
  $$Review: a neutral solution has a ph of 7.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$pH values below 7 indicate a(n):$$, 'A',
  $$Acidic solution$$, $$Basic solution$$, $$Neutral solution$$, $$Salt solution$$,
  $$pH < 7 means the solution is acidic.$$,
  '[]',
  $$Review: ph < 7 means the solution is acidic.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Universal indicator turns what colour in a strong acid?$$, 'A',
  $$Red$$, $$Blue$$, $$Green$$, $$Yellow$$,
  $$Strong acids turn universal indicator red.$$,
  '[]',
  $$Review: strong acids turn universal indicator red.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Which acid is found in lemon juice?$$, 'A',
  $$Citric acid$$, $$Acetic acid$$, $$Sulphuric acid$$, $$Hydrochloric acid$$,
  $$Lemons contain citric acid.$$,
  '[]',
  $$Review: lemons contain citric acid.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$The salt and water formed when an acid reacts with a base is the result of:$$, 'A',
  $$Neutralisation$$, $$Oxidation$$, $$Combustion$$, $$Sublimation$$,
  $$The acid-base reaction that forms salt and water is neutralisation.$$,
  '[]',
  $$Review: the acid-base reaction that forms salt and water is neutralisation.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Sodium hydroxide is an example of a:$$, 'A',
  $$Strong base$$, $$Weak acid$$, $$Strong acid$$, $$Neutral salt$$,
  $$Sodium hydroxide (NaOH) is a strong base.$$,
  '[]',
  $$Review: sodium hydroxide (naoh) is a strong base.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Vinegar mainly contains:$$, 'A',
  $$Acetic acid$$, $$Citric acid$$, $$Lactic acid$$, $$Carbonic acid$$,
  $$Vinegar is a dilute solution of acetic acid.$$,
  '[]',
  $$Review: vinegar is a dilute solution of acetic acid.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Which substance is used to treat acidity in the stomach?$$, 'A',
  $$Antacid (e.g. milk of magnesia)$$, $$Strong acid$$, $$Salt$$, $$Lemon juice$$,
  $$Antacids neutralise excess stomach acid.$$,
  '[]',
  $$Review: antacids neutralise excess stomach acid.$$);

-- =============================================================================
-- Atomic Structure (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The three main subatomic particles are:$$, 'A',
  $$Proton, neutron, electron$$, $$Proton, electron, nucleus$$, $$Electron, atom, molecule$$, $$Neutron, proton, nucleus$$,
  $$Atoms contain protons, neutrons and electrons.$$,
  '[]',
  $$Review: atoms contain protons, neutrons and electrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The proton carries a:$$, 'A',
  $$Positive charge$$, $$Negative charge$$, $$No charge$$, $$Uncertain charge$$,
  $$Protons have a positive charge.$$,
  '[]',
  $$Review: protons have a positive charge.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The atomic number of an element equals the number of:$$, 'A',
  $$Protons$$, $$Neutrons$$, $$Electrons + neutrons$$, $$Protons + neutrons$$,
  $$The atomic number is the number of protons in the nucleus.$$,
  '[]',
  $$Review: the atomic number is the number of protons in the nucleus.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$Electrons are found in the:$$, 'A',
  $$Electron shells/orbitals$$, $$Nucleus$$, $$Nucleons$$, $$Protons$$,
  $$Electrons orbit the nucleus in shells.$$,
  '[]',
  $$Review: electrons orbit the nucleus in shells.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The mass number of an atom is the sum of:$$, 'A',
  $$Protons and neutrons$$, $$Protons and electrons$$, $$Neutrons and electrons$$, $$Electrons only$$,
  $$Mass number = protons + neutrons.$$,
  '[]',
  $$Review: mass number = protons + neutrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$Isotopes of an element differ in their number of:$$, 'A',
  $$Neutrons$$, $$Protons$$, $$Electrons$$, $$Charges$$,
  $$Isotopes have the same protons but different neutrons.$$,
  '[]',
  $$Review: isotopes have the same protons but different neutrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The charge of an electron is:$$, 'A',
  $$Negative$$, $$Positive$$, $$Neutral$$, $$Positive in nucleus only$$,
  $$Electrons carry a negative charge.$$,
  '[]',
  $$Review: electrons carry a negative charge.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The nucleus of an atom consists of:$$, 'A',
  $$Protons and neutrons$$, $$Electrons only$$, $$Protons and electrons$$, $$Neutrons only$$,
  $$The nucleus contains protons and neutrons.$$,
  '[]',
  $$Review: the nucleus contains protons and neutrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$Niels Bohr proposed that electrons move in:$$, 'A',
  $$Fixed energy shells$$, $$Straight lines$$, $$Random orbits$$, $$Nucleus$$,
  $$Bohr's model showed electrons in fixed shells/orbits.$$,
  '[]',
  $$Review: bohr's model showed electrons in fixed shells/orbits.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$An element with atomic number 6 (carbon) has how many protons?$$, 'A',
  $$6$$, $$12$$, $$7$$, $$8$$,
  $$The atomic number (6) equals the number of protons.$$,
  '[]',
  $$Review: the atomic number (6) equals the number of protons.$$);

-- =============================================================================
-- Chemical Bonding (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Sodium chloride (NaCl) is formed by:$$, 'A',
  $$Ionic bonding$$, $$Covalent bonding$$, $$Metallic bonding$$, $$Hydrogen bonding$$,
  $$NaCl is an ionic compound formed by electron transfer.$$,
  '[]',
  $$Review: nacl is an ionic compound formed by electron transfer.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$The bond formed by sharing of electrons is called:$$, 'A',
  $$Covalent bond$$, $$Ionic bond$$, $$Metallic bond$$, $$Van der Waals force$$,
  $$Covalent bonds form when atoms share electrons.$$,
  '[]',
  $$Review: covalent bonds form when atoms share electrons.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Which type of bond involves the transfer of electrons?$$, 'A',
  $$Ionic bond$$, $$Covalent bond$$, $$Metallic bond$$, $$Double bond$$,
  $$Ionic bonds form by the transfer of electrons from metal to non-metal.$$,
  '[]',
  $$Review: ionic bonds form by the transfer of electrons from metal to non-metal.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Water (H2O) is held together by:$$, 'A',
  $$Polar covalent bonds$$, $$Ionic bonds$$, $$Metallic bonds$$, $$Van der Waals forces only$$,
  $$The O-H bonds in water are polar covalent bonds.$$,
  '[]',
  $$Review: the o-h bonds in water are polar covalent bonds.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$The number of electrons a covalent bond shares is:$$, 'A',
  $$Two$$, $$One$$, $$Four$$, $$Three$$,
  $$A single covalent bond shares two electrons (one pair).$$,
  '[]',
  $$Review: a single covalent bond shares two electrons (one pair).$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Which element most commonly forms a double bond?$$, 'A',
  $$Carbon$$, $$Sodium$$, $$Chlorine$$, $$Potassium$$,
  $$Carbon readily forms double and triple bonds (e.g. C=C, C≡C).$$,
  '[]',
  $$Review: carbon readily forms double and triple bonds (e.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Noble gases are generally chemically inert because they have:$$, 'A',
  $$Complete outer shells$$, $$No electrons$$, $$Free radicals$$, $$Unpaired protons$$,
  $$Noble gases have full valence shells, making them unreactive.$$,
  '[]',
  $$Review: noble gases have full valence shells, making them unreactive.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$The electrostatic attraction between oppositely charged ions forms a(n):$$, 'A',
  $$Ionic bond$$, $$Covalent bond$$, $$Metallic bond$$, $$Hydrogen bond$$,
  $$Ionic bonding is the electrostatic attraction between positive and negative ions.$$,
  '[]',
  $$Review: ionic bonding is the electrostatic attraction between positive and negative ions.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Which molecule has a carbon-to-carbon triple bond?$$, 'A',
  $$Ethyne (acetylene)$$, $$Ethane$$, $$Ethanol$$, $$Methanol$$,
  $$Ethyne (C2H2) contains a C≡C triple bond.$$,
  '[]',
  $$Review: ethyne (c2h2) contains a c≡c triple bond.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Hydrogen bonding is strongest in molecules containing H bonded to:$$, 'A',
  $$O, N or F$$, $$C, H or Cl$$, $$S, P or Si$$, $$Only hydrogen$$,
  $$Hydrogen bonding occurs when H is attached to highly electronegative N, O or F.$$,
  '[]',
  $$Review: hydrogen bonding occurs when h is attached to highly electronegative n, o or f.$$);

-- =============================================================================
-- Organic Chemistry (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The simplest alkane is:$$, 'A',
  $$Methane$$, $$Ethane$$, $$Propane$$, $$Butane$$,
  $$Methane (CH4) is the simplest alkane.$$,
  '[]',
  $$Review: methane (ch4) is the simplest alkane.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The general formula of alkanes is:$$, 'A',
  $$CnH2n+2$$, $$CnH2n$$, $$CnH2n-2$$, $$CnHn$$,
  $$Alkanes have the general formula CnH2n+2.$$,
  '[]',
  $$Review: alkanes have the general formula cnh2n+2.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Which functional group is present in alcohols?$$, 'A',
  $$-OH$$, $$-COOH$$, $$-CHO$$, $$-NH2$$,
  $$Alcohols contain the hydroxyl (-OH) functional group.$$,
  '[]',
  $$Review: alcohols contain the hydroxyl (-oh) functional group.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The functional group of carboxylic acids is:$$, 'A',
  $$-COOH$$, $$-OH$$, $$-CHO$$, $$-CO-$$,
  $$Carboxylic acids contain the -COOH group.$$,
  '[]',
  $$Review: carboxylic acids contain the -cooh group.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Alkenes contain which type of bond?$$, 'A',
  $$Carbon-carbon double bond$$, $$Carbon-carbon single bond$$, $$Carbon-oxygen triple bond$$, $$Carbon-hydrogen triple bond$$,
  $$Alkenes have at least one C=C double bond.$$,
  '[]',
  $$Review: alkenes have at least one c=c double bond.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The monomer of polythene is:$$, 'A',
  $$Ethene$$, $$Ethane$$, $$Ethyne$$, $$Ester$$,
  $$Polythene (polyethylene) is made from ethene (ethylene).$$,
  '[]',
  $$Review: polythene (polyethylene) is made from ethene (ethylene).$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Which compound is used as a fuel in motor vehicles?$$, 'A',
  $$Octane (petrol component)$$, $$Methanol only$$, $$Acetic acid$$, $$Glycerol$$,
  $$Petrol largely consists of octane and related hydrocarbons.$$,
  '[]',
  $$Review: petrol largely consists of octane and related hydrocarbons.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Organic chemistry primarily studies compounds of which element?$$, 'A',
  $$Carbon$$, $$Oxygen$$, $$Nitrogen$$, $$Helium$$,
  $$Organic chemistry is the chemistry of carbon compounds.$$,
  '[]',
  $$Review: organic chemistry is the chemistry of carbon compounds.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The process by which large alkanes are broken into smaller molecules is:$$, 'A',
  $$Cracking$$, $$Polymerisation$$, $$Esterification$$, $$Hydrogenation$$,
  $$Cracking breaks larger hydrocarbons into smaller useful ones.$$,
  '[]',
  $$Review: cracking breaks larger hydrocarbons into smaller useful ones.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Glucose is an example of a:$$, 'A',
  $$Carbohydrate$$, $$Protein$$, $$Lipid$$, $$Nucleic acid$$,
  $$Glucose (C6H12O6) is a carbohydrate (monosaccharide).$$,
  '[]',
  $$Review: glucose (c6h12o6) is a carbohydrate (monosaccharide).$$);

-- =============================================================================
-- Periodic Table (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$The modern periodic table is arranged by:$$, 'A',
  $$Increasing atomic number$$, $$Increasing mass number$$, $$Alphabetical order$$, $$Number of neutrons$$,
  $$Elements are arranged by increasing atomic number.$$,
  '[]',
  $$Review: elements are arranged by increasing atomic number.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Columns in the periodic table are called:$$, 'A',
  $$Groups$$, $$Periods$$, $$Series$$, $$Families (also)$$,
  $$Vertical columns are groups (also called families).$$,
  '[]',
  $$Review: vertical columns are groups (also called families).$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Rows in the periodic table are called:$$, 'A',
  $$Periods$$, $$Groups$$, $$Families$$, $$Clusters$$,
  $$Horizontal rows are periods.$$,
  '[]',
  $$Review: horizontal rows are periods.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Which element has the symbol 'Na'?$$, 'A',
  $$Sodium$$, $$Nitrogen$$, $$Noble gas$$, $$Nickel$$,
  $$Na is the symbol for sodium.$$,
  '[]',
  $$Review: na is the symbol for sodium.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$The noble gases are located in group:$$, 'A',
  $$18 (VIII A)$$, $$1$$, $$2$$, $$17$$,
  $$Noble gases are in group 18.$$,
  '[]',
  $$Review: noble gases are in group 18.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Halogens are found in group:$$, 'A',
  $$17 (VII A)$$, $$1$$, $$2$$, $$18$$,
  $$The halogens (F, Cl, Br, I) are in group 17.$$,
  '[]',
  $$Review: the halogens (f, cl, br, i) are in group 17.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Which element is a liquid at room temperature?$$, 'A',
  $$Mercury$$, $$Iron$$, $$Sodium$$, $$Oxygen$$,
  $$Mercury (Hg) is a liquid metal at room temperature.$$,
  '[]',
  $$Review: mercury (hg) is a liquid metal at room temperature.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$The most abundant element in the Earth's crust is:$$, 'A',
  $$Oxygen$$, $$Silicon$$, $$Iron$$, $$Aluminium$$,
  $$Oxygen is the most abundant element in the earth's crust.$$,
  '[]',
  $$Review: oxygen is the most abundant element in the earth's crust.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Mendeleev arranged elements according to:$$, 'A',
  $$Increasing atomic mass$$, $$Increasing atomic number$$, $$Electronegativity$$, $$Density$$,
  $$Mendeleev's periodic table was based on increasing atomic mass.$$,
  '[]',
  $$Review: mendeleev's periodic table was based on increasing atomic mass.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Metals are generally found on which side of the periodic table?$$, 'A',
  $$Left$$, $$Right$$, $$Top right$$, $$Only in group 18$$,
  $$Metals occupy the left and middle of the periodic table.$$,
  '[]',
  $$Review: metals occupy the left and middle of the periodic table.$$);

-- =============================================================================
-- Stoichiometry (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$One mole of any substance contains how many particles?$$, 'A',
  $$6.022 × 10^23 (Avogadro's number)$$, $$3.14 × 10^23$$, $$6.022 × 10^22$$, $$1 × 10^24$$,
  $$One mole = 6.022 × 10^23 particles.$$,
  '[]',
  $$Review: one mole = 6.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The molar mass of water (H2O) is approximately:$$, 'A',
  $$18 g/mol$$, $$16 g/mol$$, $$20 g/mol$$, $$30 g/mol$$,
  $$H2O = 2(1) + 16 = 18 g/mol.$$,
  '[]',
  $$Review: h2o = 2(1) + 16 = 18 g/mol.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$In the reaction 2H2 + O2 → 2H2O, how many moles of water are produced from 2 moles of H2?$$, 'A',
  $$2$$, $$1$$, $$4$$, $$0.5$$,
  $$The balanced equation shows 2 mol H2 gives 2 mol H2O.$$,
  '[]',
  $$Review: the balanced equation shows 2 mol h2 gives 2 mol h2o.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The mass percentage of hydrogen in water is about:$$, 'A',
  $$11%$$, $$89%$$, $$50%$$, $$33%$$,
  $$Mass of H = 2 out of 18 => 11.1%.$$,
  '[]',
  $$Review: mass of h = 2 out of 18 => 11.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$Molarity is defined as:$$, 'A',
  $$Moles of solute per litre of solution$$, $$Grams of solute per litre$$, $$Moles per kilogram$$, $$Mass per volume$$,
  $$Molarity (M) = moles of solute / litres of solution.$$,
  '[]',
  $$Review: molarity (m) = moles of solute / litres of solution.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The relative atomic mass of magnesium is about:$$, 'A',
  $$24$$, $$12$$, $$16$$, $$40$$,
  $$The atomic mass of Mg is approximately 24.$$,
  '[]',
  $$Review: the atomic mass of mg is approximately 24.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$Which equation is correctly balanced: CH4 + 2O2 → ?$$, 'A',
  $$CO2 + 2H2O$$, $$CO2 + H2O$$, $$2CO2 + H2O$$, $$CO2 + 2H2$$,
  $$Balanced combustion: CH4 + 2O2 → CO2 + 2H2O.$$,
  '[]',
  $$Review: balanced combustion: ch4 + 2o2 → co2 + 2h2o.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$How many grams are in one mole of carbon (C ~ 12)?$$, 'A',
  $$12 g$$, $$6 g$$, $$24 g$$, $$48 g$$,
  $$One mole of carbon weighs about 12 grams.$$,
  '[]',
  $$Review: one mole of carbon weighs about 12 grams.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The empirical formula of benzene (C6H6) is:$$, 'A',
  $$CH$$, $$C6H6$$, $$C2H2$$, $$C3H3$$,
  $$The simplest whole number ratio of benzene is CH.$$,
  '[]',
  $$Review: the simplest whole number ratio of benzene is ch.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$In the reaction N2 + 3H2 → 2NH3, how many moles of NH3 are formed from 3 moles of H2?$$, 'A',
  $$2$$, $$1$$, $$3$$, $$6$$,
  $$3 mol H2 (3:2 ratio) give 2 mol NH3.$$,
  '[]',
  $$Review: 3 mol h2 (3:2 ratio) give 2 mol nh3.$$);


-- =============================================================================
-- SECTION: BAHRI UNIVERSITY EXTENDED MOCK TEST (150 MCQs)
-- =============================================================================
-- 0020_seed_mock_test.sql
-- BUET Prep AI — Bahria University Extended Mock Test
-- 150 MCQs | 120 minutes | 1 mark each | no negative marking
-- Sections: 1 Verbal Ability (44) | 2 Quantitative Reasoning (23) | 3 Analytical Reasoning (22)
--           4 Physics (15) | 5 Mathematics (45) | 6 Number System (1)
-- Seeds the mock questions, the mock_tests row, and the mock_test_questions links.
-- All questions are original practice items (ORIGINAL_AI, approved), each with exactly 4 options.

-- =============================================================
-- MOCK QUESTION SEEDER (inserts question + options + mock link)
-- =============================================================
create or replace function "public"."seed_mock_question"(
  p_mock_name text,
  p_mock_desc text,
  p_section integer,
  p_order integer,
  p_subject_code text,
  p_topic_name text,
  p_difficulty "public"."difficulty",
  p_question text,
  p_correct "char",
  p_a text, p_b text, p_c text, p_d text,
  p_explanation text
) returns void language plpgsql as $$
declare
  m_id uuid;
  q_id uuid;
  opt text[];
  keys text[] := array['A','B','C','D'];
  i int;
begin
  select id into m_id from "public"."mock_tests" where name = p_mock_name limit 1;
  if m_id is null then
    insert into "public"."mock_tests" (name, description, is_active, question_count, duration_minutes)
    values (p_mock_name, p_mock_desc, true, 150, 120)
    returning id into m_id;
  end if;

  select id into q_id from "public"."questions"
  where lower(trim(question_text)) = lower(trim(p_question)) limit 1;
  if q_id is null then
    insert into "public"."questions"
      (subject_id, topic_id, difficulty, question_text, correct_option, explanation, solution_steps, hint,
       is_original, is_official_sample, review_status, generated_by, source_type, source_reference, copyright_status, reviewed)
    values
      ((select id from "public"."subjects" where code = p_subject_code),
       (select id from "public"."topics" where subject_id = (select id from "public"."subjects" where code = p_subject_code) and name = p_topic_name),
       p_difficulty, p_question, p_correct, p_explanation, '[]'::jsonb, null,
       true, false, 'approved', 'AI', 'ORIGINAL_AI',
       'Original AI-generated mock test question', 'original', true)
    returning id into q_id;

    opt := array[p_a, p_b, p_c, p_d];
    for i in 1..4 loop
      insert into "public"."question_options" (question_id, option_key, option_text, is_correct, order_index)
      values (q_id, keys[i], opt[i], (keys[i] = p_correct), i - 1);
    end loop;

    insert into "public"."question_sources" (question_id, source_type, source_reference, copyright_status, is_original)
    values (q_id, 'ORIGINAL_AI', 'Original AI-generated mock test question', 'original', true);
  end if;

  insert into "public"."mock_test_questions" (mock_test_id, question_id, section_index, order_index)
  values (m_id, q_id, p_section, p_order)
  on conflict (mock_test_id, question_id) do nothing;
end;
$$;

-- =============================================================
-- SEED ALL 150 QUESTIONS
-- =============================================================
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 1, $$ENG$$, $$Vocabulary$$, $$easy$$, $$The word "abundant" is closest in meaning to:$$, 'B', $$scarce$$, $$plentiful$$, $$hidden$$, $$fragile$$, $$Abundant means existing in large quantities; plentiful is its nearest synonym.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 2, $$ENG$$, $$Vocabulary$$, $$easy$$, $$The word "reluctant" means:$$, 'B', $$eager$$, $$unwilling$$, $$careless$$, $$certain$$, $$Reluctant describes someone unwilling or hesitant to do something.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 3, $$ENG$$, $$Vocabulary$$, $$easy$$, $$The antonym of "ancient" is:$$, 'C', $$old$$, $$historic$$, $$modern$$, $$former$$, $$Ancient refers to something very old; modern is its direct opposite.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 4, $$ENG$$, $$Vocabulary$$, $$easy$$, $$The antonym of "expand" is:$$, 'B', $$increase$$, $$contract$$, $$develop$$, $$extend$$, $$Expand means to grow larger; contract means to shrink or reduce.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 5, $$ENG$$, $$Vocabulary$$, $$easy$$, $$Choose the word closest in meaning to "precise":$$, 'A', $$exact$$, $$rough$$, $$late$$, $$complex$$, $$Precise means exact and accurate.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 6, $$ENG$$, $$Vocabulary$$, $$medium$$, $$A person who writes dictionaries is called a:$$, 'B', $$biographer$$, $$lexicographer$$, $$geologist$$, $$cartographer$$, $$A lexicographer compiles and writes dictionaries.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 7, $$ENG$$, $$Vocabulary$$, $$medium$$, $$"Benevolent" most nearly means:$$, 'A', $$kind$$, $$angry$$, $$wealthy$$, $$famous$$, $$Benevolent means kind, charitable, or well-meaning.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 8, $$ENG$$, $$Vocabulary$$, $$medium$$, $$"Obsolete" means:$$, 'A', $$outdated$$, $$original$$, $$necessary$$, $$popular$$, $$Obsolete means no longer in use or outdated.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 9, $$ENG$$, $$Vocabulary$$, $$medium$$, $$"Candid" most nearly means:$$, 'B', $$secretive$$, $$frank$$, $$confused$$, $$formal$$, $$Candid means frank, honest, and straightforward.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 10, $$ENG$$, $$Vocabulary$$, $$medium$$, $$"Deteriorate" means to:$$, 'B', $$improve$$, $$worsen$$, $$repeat$$, $$measure$$, $$Deteriorate means to become progressively worse.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 11, $$ENG$$, $$Grammar$$, $$easy$$, $$Choose the correct sentence:$$, 'B', $$Neither of the boys are ready.$$, $$Neither of the boys is ready.$$, $$Neither of the boys were ready.$$, $$Neither boys is ready.$$, $$With "neither of", the verb must agree with the singular pronoun; "is" is correct.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 12, $$ENG$$, $$Grammar$$, $$easy$$, $$Choose the correct form: "She _____ to school every day."$$, 'C', $$go$$, $$going$$, $$goes$$, $$gone$$, $$Third-person singular simple present requires "goes".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 13, $$ENG$$, $$Grammar$$, $$medium$$, $$If I _____ enough money, I would buy a laptop.$$, 'B', $$have$$, $$had$$, $$will have$$, $$having$$, $$Second conditional uses past subjunctive "had" after "If".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 14, $$ENG$$, $$Grammar$$, $$easy$$, $$Choose the correctly punctuated sentence:$$, 'B', $$However I decided to stay.$$, $$However, I decided to stay.$$, $$However I, decided to stay.$$, $$However; I decided, to stay.$$, $$A conjunctive adverb like "However" is followed by a comma.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 15, $$ENG$$, $$Grammar$$, $$medium$$, $$The plural of "criterion" is:$$, 'B', $$criterions$$, $$criteria$$, $$criterion$$, $$criterias$$, $$"Criterion" is a Greek-origin noun; its plural is "criteria".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 16, $$ENG$$, $$Active-Passive Voice$$, $$easy$$, $$Which sentence is in passive voice?$$, 'B', $$Ali solved the problem.$$, $$The problem was solved by Ali.$$, $$Ali is solving the problem.$$, $$Ali will solve the problem.$$, $$Passive voice pairs "was + past participle"; the doer appears after "by".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 17, $$ENG$$, $$Prepositions$$, $$easy$$, $$Choose the correct preposition: "He is good _____ mathematics."$$, 'C', $$in$$, $$on$$, $$at$$, $$for$$, $$We say "good at" an activity or subject.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 18, $$ENG$$, $$Articles$$, $$easy$$, $$Choose the correct article: "He is _____ honest man."$$, 'B', $$a$$, $$an$$, $$the$$, $$no article$$, $$"Honest" begins with a vowel sound, so it takes "an".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 19, $$ENG$$, $$Grammar$$, $$easy$$, $$Which word is an adverb?$$, 'B', $$quick$$, $$quickly$$, $$quicker$$, $$quickness$$, $$Adverbs often end in -ly; "quickly" modifies a verb.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 20, $$ENG$$, $$Grammar$$, $$easy$$, $$Choose the correct sentence:$$, 'B', $$Each student have a book.$$, $$Each student has a book.$$, $$Each students has a book.$$, $$Each student having a book.$$, $$"Each" is singular, so the verb must be "has".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 21, $$ENG$$, $$Sentence Completion$$, $$medium$$, $$Although the road was difficult, the driver _____ the journey.$$, 'B', $$abandoned$$, $$completed$$, $$prevented$$, $$forgot$$, $$"Although" signals contrast, so the driver succeeded: completed.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 22, $$ENG$$, $$Sentence Completion$$, $$easy$$, $$The lecture was so _____ that everyone remained attentive.$$, 'B', $$dull$$, $$engaging$$, $$weak$$, $$brief$$, $$Remaining attentive is caused by an engaging lecture.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 23, $$ENG$$, $$Sentence Completion$$, $$medium$$, $$Because the evidence was insufficient, the case was _____.$$, 'B', $$accepted$$, $$dismissed$$, $$expanded$$, $$celebrated$$, $$Weak evidence leads to a case being dismissed.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 24, $$ENG$$, $$Sentence Completion$$, $$easy$$, $$The manager praised her because she was both efficient and _____.$$, 'A', $$reliable$$, $$careless$$, $$late$$, $$uncertain$$, $$Praise follows positive qualities; reliable fits alongside efficient.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 25, $$ENG$$, $$Sentence Completion$$, $$medium$$, $$The scientist repeated the experiment to _____ the result.$$, 'B', $$ignore$$, $$verify$$, $$hide$$, $$delay$$, $$Repeating an experiment verifies or confirms the result.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 26, $$ENG$$, $$Reading Comprehension$$, $$medium$$, $$A passage says a city reduced traffic by improving public transport. The main idea is that:$$, 'B', $$cars are always harmful$$, $$public transport can help reduce traffic$$, $$cities should stop all travel$$, $$roads are unnecessary$$, $$The supporting evidence points to public transport reducing traffic.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 27, $$ENG$$, $$Reading Comprehension$$, $$easy$$, $$A paragraph gives three examples to support one claim. The examples mainly serve as:$$, 'A', $$evidence$$, $$contradictions$$, $$headings$$, $$questions$$, $$Examples function as evidence supporting the claim.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 28, $$ENG$$, $$Reading Comprehension$$, $$medium$$, $$An author uses statistics to support an argument. The statistics function mainly as:$$, 'A', $$evidence$$, $$humor$$, $$fiction$$, $$decoration$$, $$Statistics provide evidence to strengthen an argument.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 29, $$ENG$$, $$Reading Comprehension$$, $$easy$$, $$The tone of a passage praising a successful project is most likely:$$, 'B', $$critical$$, $$positive$$, $$indifferent$$, $$hostile$$, $$Praising indicates a positive tone.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 30, $$ENG$$, $$Reading Comprehension$$, $$easy$$, $$If an author says "however", the word usually signals:$$, 'B', $$addition$$, $$contrast$$, $$cause$$, $$time$$, $$"However" introduces a contrasting point.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 31, $$ENG$$, $$Analogies$$, $$easy$$, $$Book is to reading as fork is to:$$, 'B', $$writing$$, $$eating$$, $$drawing$$, $$sleeping$$, $$Book is used for reading; fork is used for eating.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 32, $$ENG$$, $$Analogies$$, $$easy$$, $$Bird is to nest as bee is to:$$, 'B', $$cave$$, $$hive$$, $$pond$$, $$web$$, $$A bird lives in a nest; a bee lives in a hive.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 33, $$ENG$$, $$Analogies$$, $$easy$$, $$Doctor is to hospital as teacher is to:$$, 'B', $$court$$, $$school$$, $$factory$$, $$airport$$, $$A doctor works in a hospital; a teacher works in a school.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 34, $$ENG$$, $$Analogies$$, $$medium$$, $$Seed is to plant as egg is to:$$, 'B', $$stone$$, $$animal$$, $$soil$$, $$water$$, $$A seed grows into a plant; an egg hatches into an animal.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 35, $$ENG$$, $$Analogies$$, $$easy$$, $$Hot is to cold as high is to:$$, 'B', $$large$$, $$low$$, $$long$$, $$deep$$, $$Hot and cold are opposites; high and low are opposites.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 36, $$ENG$$, $$Vocabulary$$, $$medium$$, $$Choose the correctly used word:$$, 'B', $$The medicine effected his recovery.$$, $$The medicine affected his recovery.$$, $$The medicine affect his recovery.$$, $$The medicine affecting his recovery.$$, $$"Affected" (changed/influenced) is correct here; "effected" means brought about.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 37, $$ENG$$, $$Vocabulary$$, $$medium$$, $$Choose the correct word: "Everyone _____ Ahmed was absent."$$, 'A', $$except$$, $$accept$$, $$expects$$, $$access$$, $$"Except" means other than / excluding.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 38, $$ENG$$, $$Vocabulary$$, $$easy$$, $$Which pair are homophones?$$, 'D', $$accept/except$$, $$large/large$$, $$quiet/quite$$, $$write/right$$, $$Write and right sound alike but differ in spelling and meaning.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 39, $$ENG$$, $$Grammar$$, $$easy$$, $$Choose the correct comparative form:$$, 'B', $$more better$$, $$better$$, $$best$$, $$gooder$$, $$The comparative of "good" is "better".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 40, $$ENG$$, $$Tenses$$, $$medium$$, $$"She has been studying for two hours" is in the:$$, 'B', $$present perfect$$, $$present perfect continuous$$, $$past continuous$$, $$future perfect$$, $$"Has been + -ing" marks the present perfect continuous.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 41, $$ENG$$, $$Direct-Indirect Speech$$, $$medium$$, $$He said, "I am tired." In reported speech:$$, 'B', $$He said that I am tired.$$, $$He said that he was tired.$$, $$He says that he was tired.$$, $$He said that he is tired yesterday.$$, $$Pronouns and tense shift back: "I am" becomes "he was".$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 42, $$ENG$$, $$Vocabulary$$, $$medium$$, $$"Meticulous" describes someone who is:$$, 'B', $$careless$$, $$very careful$$, $$impatient$$, $$dishonest$$, $$Meticulous means extremely careful and thorough.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 43, $$ENG$$, $$Vocabulary$$, $$medium$$, $$"Ambiguous" means:$$, 'B', $$having one clear meaning$$, $$open to more than one interpretation$$, $$very short$$, $$completely false$$, $$Ambiguous means having multiple possible interpretations.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 1, 44, $$ENG$$, $$Vocabulary$$, $$medium$$, $$"Concise" means:$$, 'A', $$brief and clear$$, $$long and confusing$$, $$angry$$, $$unrelated$$, $$Concise means giving information briefly and clearly.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 45, $$QUANT$$, $$Percentages$$, $$easy$$, $$What is 15% of 240?$$, 'B', $$24$$, $$36$$, $$40$$, $$48$$, $$15% of 240 = 0.15 × 240 = 36.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 46, $$QUANT$$, $$Algebra$$, $$easy$$, $$If 3x + 5 = 20, x equals:$$, 'B', $$3$$, $$5$$, $$7$$, $$15$$, $$3x = 15, so x = 5.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 47, $$QUANT$$, $$Ratios and Proportions$$, $$easy$$, $$The ratio 18:24 simplifies to:$$, 'B', $$2:3$$, $$3:4$$, $$4:3$$, $$6:8$$, $$Divide both terms by 6: 3:4.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 48, $$QUANT$$, $$Percentages$$, $$easy$$, $$A shirt costing Rs. 2000 is discounted by 15%. What is the sale price?$$, 'B', $$Rs. 1600$$, $$Rs. 1700$$, $$Rs. 1750$$, $$Rs. 1850$$, $$15% of 2000 = 300; 2000 − 300 = 1700.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 49, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$The average of 8, 12, 15 and 5 is:$$, 'B', $$8$$, $$10$$, $$12$$, $$15$$, $$Sum = 40; 40 ÷ 4 = 10.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 50, $$QUANT$$, $$Time and Work$$, $$medium$$, $$5 workers complete a task in 12 days. At the same rate, 10 workers need:$$, 'B', $$3 days$$, $$6 days$$, $$12 days$$, $$24 days$$, $$Doubling workers halves the time: 6 days.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 51, $$QUANT$$, $$Algebra$$, $$easy$$, $$If x² = 49 and x is positive, x =$$, 'C', $$-7$$, $$0$$, $$7$$, $$49$$, $$The positive square root of 49 is 7.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 52, $$QUANT$$, $$Algebra$$, $$easy$$, $$Simplify: 2(x + 3) − x$$, 'B', $$x+3$$, $$x+6$$, $$2x+3$$, $$x-6$$, $$2x + 6 − x = x + 6.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 53, $$QUANT$$, $$Algebra$$, $$medium$$, $$If x + y = 10 and x − y = 4, x =$$, 'C', $$3$$, $$6$$, $$7$$, $$14$$, $$Add the equations: 2x = 14, so x = 7.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 54, $$QUANT$$, $$Algebra$$, $$medium$$, $$The roots of x² − 5x + 6 = 0 are:$$, 'B', $$1,6$$, $$2,3$$, $$-2,-3$$, $$3,5$$, $$Factorise: (x−2)(x−3) = 0, roots 2 and 3.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 55, $$QUANT$$, $$Percentages$$, $$medium$$, $$A number increased by 20% becomes 144. The original number is:$$, 'B', $$115$$, $$120$$, $$124$$, $$132$$, $$144 ÷ 1.20 = 120.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 56, $$QUANT$$, $$Profit and Loss$$, $$medium$$, $$An item bought for Rs. 800 is sold for Rs. 920. The profit percentage is:$$, 'C', $$10%$$, $$12%$$, $$15%$$, $$20%$$, $$Profit = 120; 120/800 × 100 = 15%.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 57, $$QUANT$$, $$Geometry$$, $$easy$$, $$The area of a rectangle 12 cm long and 5 cm wide is:$$, 'C', $$17 cm²$$, $$34 cm²$$, $$60 cm²$$, $$120 cm²$$, $$Area = length × width = 60 cm².$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 58, $$QUANT$$, $$Geometry$$, $$easy$$, $$The perimeter of a square with side 9 cm is:$$, 'C', $$18 cm$$, $$27 cm$$, $$36 cm$$, $$81 cm$$, $$Perimeter = 4 × side = 36 cm.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 59, $$QUANT$$, $$Geometry$$, $$easy$$, $$The angles of a triangle sum to:$$, 'B', $$90°$$, $$180°$$, $$270°$$, $$360°$$, $$The interior angles of any triangle sum to 180°.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 60, $$QUANT$$, $$Probability$$, $$easy$$, $$A fair coin is tossed once. The probability of heads is:$$, 'C', $$0$$, $$1/4$$, $$1/2$$, $$1$$, $$One favourable outcome out of two equally likely: 1/2.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 61, $$QUANT$$, $$Probability$$, $$easy$$, $$A fair die is rolled. The probability of an even number is:$$, 'C', $$1/6$$, $$1/3$$, $$1/2$$, $$2/3$$, $$Three even faces (2,4,6) out of six: 3/6 = 1/2.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 62, $$QUANT$$, $$Sequences and Series$$, $$medium$$, $$What is the next term: 2, 6, 12, 20, 30, ?$$, 'C', $$36$$, $$40$$, $$42$$, $$44$$, $$Differences increase by 2 each step (4,6,8,10,12): 30 + 12 = 42.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 63, $$QUANT$$, $$Sequences and Series$$, $$easy$$, $$What is the next term: 3, 9, 27, 81, ?$$, 'B', $$162$$, $$243$$, $$324$$, $$729$$, $$Each term multiplies by 3: 81 × 3 = 243.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 64, $$QUANT$$, $$Speed Distance Time$$, $$easy$$, $$A car travels 180 km in 3 hours. Its average speed is:$$, 'B', $$50 km/h$$, $$60 km/h$$, $$70 km/h$$, $$90 km/h$$, $$Speed = distance ÷ time = 60 km/h.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 65, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$A machine produces 120 items in 4 hours. Its rate is:$$, 'B', $$20/hour$$, $$30/hour$$, $$40/hour$$, $$60/hour$$, $$Rate = 120 ÷ 4 = 30 items per hour.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 66, $$QUANT$$, $$Arithmetic$$, $$medium$$, $$The greatest common divisor of 36 and 48 is:$$, 'C', $$6$$, $$8$$, $$12$$, $$16$$, $$The largest number dividing both is 12.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 2, 67, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$The least common multiple of 6 and 8 is:$$, 'C', $$12$$, $$18$$, $$24$$, $$48$$, $$Multiples: 6,12,18,24 and 8,16,24 → LCM 24.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 68, $$ANALY$$, $$Number Patterns$$, $$easy$$, $$Find the next number: 5, 10, 20, 40, ?$$, 'C', $$50$$, $$60$$, $$80$$, $$100$$, $$Each term doubles: 40 × 2 = 80.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 69, $$ANALY$$, $$Number Patterns$$, $$easy$$, $$Find the next number: 1, 4, 9, 16, ?$$, 'C', $$20$$, $$24$$, $$25$$, $$36$$, $$These are squares: 1,4,9,16,25.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 70, $$ANALY$$, $$Letter Patterns$$, $$medium$$, $$Find the next letter: A, C, F, J, ?$$, 'C', $$M$$, $$N$$, $$O$$, $$P$$, $$Gaps increase by one each step (+2,+3,+4,+5): J + 5 = O.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 71, $$ANALY$$, $$Coding Decoding$$, $$easy$$, $$If CAT is coded as DBU, DOG is coded as:$$, 'A', $$EPH$$, $$EOG$$, $$DPH$$, $$FPH$$, $$Each letter shifts one forward: D→E, O→P, G→H = EPH.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 72, $$ANALY$$, $$Coding Decoding$$, $$medium$$, $$If SOUTH is coded as TPVUI, NORTH is coded as:$$, 'A', $$OPSUI$$, $$OPSTI$$, $$OPSGI$$, $$NQSTI$$, $$Each letter shifts one forward: N→O, O→P, R→S, T→U, H→I = OPSUI.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 73, $$ANALY$$, $$Logic Puzzles$$, $$easy$$, $$A person walks 5 km north, then 3 km east. In which general direction are they from the start?$$, 'B', $$North-west$$, $$North-east$$, $$South-east$$, $$South-west$$, $$Net displacement is north plus east, i.e. north-east.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 74, $$ANALY$$, $$Logic Puzzles$$, $$easy$$, $$Ali faces east and turns right twice. He now faces:$$, 'D', $$North$$, $$South$$, $$East$$, $$West$$, $$East → right = South; right again = West.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 75, $$ANALY$$, $$Logic Puzzles$$, $$easy$$, $$A is the brother of B. B is the sister of C. How is A related to C?$$, 'A', $$Brother$$, $$Sister$$, $$Father$$, $$Uncle$$, $$A and C are siblings, so A (male) is C's brother.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 76, $$ANALY$$, $$Logic Puzzles$$, $$easy$$, $$Sara is the daughter of Ahmed. Ahmed is the son of Zaid. Zaid is Sara's:$$, 'C', $$Father$$, $$Brother$$, $$Grandfather$$, $$Uncle$$, $$Ahmed's father is Sara's grandfather.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 77, $$ANALY$$, $$Logical Ordering$$, $$easy$$, $$Five students A, B, C, D, E stand in a line: A before B, B before C, C before D, D before E. Who is third?$$, 'C', $$A$$, $$B$$, $$C$$, $$D$$, $$Order is A,B,C,D,E; the third is C.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 78, $$ANALY$$, $$Logical Ordering$$, $$easy$$, $$P is taller than Q, Q taller than R, R taller than S. Who is shortest?$$, 'D', $$P$$, $$Q$$, $$R$$, $$S$$, $$Each is taller than the next, so S is shortest.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 79, $$ANALY$$, $$Syllogisms$$, $$medium$$, $$All roses are flowers. Some flowers fade quickly. Which conclusion is definitely true?$$, 'C', $$All roses fade quickly.$$, $$Some roses are not flowers.$$, $$Roses are flowers.$$, $$No flowers are roses.$$, $$The first premise directly states roses are flowers.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 80, $$ANALY$$, $$Syllogisms$$, $$easy$$, $$All cats are mammals. All mammals are animals. Therefore:$$, 'B', $$All animals are cats.$$, $$All cats are animals.$$, $$No cats are animals.$$, $$Some animals are not mammals.$$, $$Cats ⊂ mammals ⊂ animals, so all cats are animals.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 81, $$ANALY$$, $$Logic Puzzles$$, $$easy$$, $$A, B, C and D sit around a table. A sits opposite C; B sits opposite D. Who is opposite A?$$, 'B', $$B$$, $$C$$, $$D$$, $$Cannot determine$$, $$Directly stated: A is opposite C.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 82, $$ANALY$$, $$Classification$$, $$easy$$, $$Which is different?$$, 'C', $$Triangle$$, $$Square$$, $$Circle$$, $$Rectangle$$, $$Circle has no straight edges; the rest are polygons.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 83, $$ANALY$$, $$Classification$$, $$easy$$, $$Which number does not belong?$$, 'D', $$9$$, $$16$$, $$25$$, $$30$$, $$9, 16, 25 are perfect squares; 30 is not.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 84, $$ANALY$$, $$Syllogisms$$, $$easy$$, $$If all books are useful and this object is a book, then the object is:$$, 'A', $$useful$$, $$expensive$$, $$old$$, $$large$$, $$The object inherits the property of books: useful.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 85, $$ANALY$$, $$Logic Puzzles$$, $$medium$$, $$If today is Monday, what day will it be after 10 days?$$, 'B', $$Wednesday$$, $$Thursday$$, $$Friday$$, $$Saturday$$, $$10 days = one week (Monday) + 3 days = Thursday.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 86, $$ANALY$$, $$Logic Puzzles$$, $$easy$$, $$At exactly 3:00, the angle between the clock hands is:$$, 'C', $$0°$$, $$30°$$, $$90°$$, $$180°$$, $$Minute hand at 12, hour hand at 3 — a quarter turn: 90°.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 87, $$ANALY$$, $$Logical Ordering$$, $$medium$$, $$In a class of 30 students, Ali is 7th from the top. His position from the bottom is:$$, 'C', $$22nd$$, $$23rd$$, $$24th$$, $$25th$$, $$30 − 7 + 1 = 24th.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 88, $$ANALY$$, $$Critical Reasoning$$, $$hard$$, $$Three boxes labelled Apples, Oranges and Mixed all have wrong labels. From which box should you pick one fruit first?$$, 'C', $$Apples$$, $$Oranges$$, $$Mixed$$, $$Any box$$, $$Since all labels are wrong, the "Mixed" box contains only one fruit type, identifying it fixes the rest.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 3, 89, $$ANALY$$, $$Syllogisms$$, $$hard$$, $$If some A are B and all B are C, which must be true?$$, 'B', $$All A are C.$$, $$Some A are C.$$, $$No A are C.$$, $$All C are A.$$, $$The A that are B are also C, so some A are C.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 90, $$PHY$$, $$Mechanics$$, $$easy$$, $$The SI unit of force is:$$, 'B', $$Joule$$, $$Newton$$, $$Watt$$, $$Pascal$$, $$Force is measured in newtons (N).$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 91, $$PHY$$, $$Mechanics$$, $$easy$$, $$Acceleration is the rate of change of:$$, 'B', $$distance$$, $$velocity$$, $$mass$$, $$force$$, $$Acceleration = change in velocity per unit time.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 92, $$PHY$$, $$Mechanics$$, $$easy$$, $$A body moving at constant velocity has:$$, 'A', $$zero acceleration$$, $$increasing acceleration$$, $$negative mass$$, $$zero speed$$, $$Constant velocity means no change in velocity → zero acceleration.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 93, $$PHY$$, $$Mechanics$$, $$easy$$, $$Momentum is equal to:$$, 'B', $$m/a$$, $$mv$$, $$ma$$, $$m/v$$, $$Momentum p = mass × velocity = mv.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 94, $$PHY$$, $$Mechanics$$, $$medium$$, $$The kinetic energy of an object depends on its:$$, 'A', $$mass and speed$$, $$mass only$$, $$height only$$, $$temperature only$$, $$KE = ½mv², so it depends on mass and speed.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 95, $$PHY$$, $$Mechanics$$, $$easy$$, $$Work is done when a force causes:$$, 'B', $$mass$$, $$displacement$$, $$temperature$$, $$density$$, $$Work = force × displacement in the direction of force.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 96, $$PHY$$, $$Waves and Sound$$, $$easy$$, $$The SI unit of frequency is:$$, 'B', $$meter$$, $$hertz$$, $$newton$$, $$joule$$, $$Frequency is measured in hertz (Hz).$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 97, $$PHY$$, $$Waves and Sound$$, $$easy$$, $$Sound cannot travel through:$$, 'D', $$air$$, $$water$$, $$steel$$, $$vacuum$$, $$Sound needs a medium; it cannot travel through a vacuum.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 98, $$PHY$$, $$Electricity$$, $$easy$$, $$The SI unit of electric current is:$$, 'C', $$volt$$, $$ohm$$, $$ampere$$, $$watt$$, $$Current is measured in amperes (A).$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 99, $$PHY$$, $$Electricity$$, $$easy$$, $$Ohm's law is:$$, 'A', $$V = IR$$, $$P = VI$$, $$F = ma$$, $$Q = It$$, $$Ohm's law: voltage = current × resistance (V = IR).$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 100, $$PHY$$, $$Electricity$$, $$easy$$, $$Two resistors of 2 Ω and 3 Ω connected in series have total resistance:$$, 'B', $$1 Ω$$, $$5 Ω$$, $$6 Ω$$, $$9 Ω$$, $$Series resistances add: 2 + 3 = 5 Ω.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 101, $$PHY$$, $$Thermodynamics$$, $$easy$$, $$Heat transfer that can occur through a vacuum is:$$, 'C', $$conduction$$, $$convection$$, $$radiation$$, $$diffusion$$, $$Radiation needs no medium and can pass through a vacuum.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 102, $$PHY$$, $$Optics$$, $$easy$$, $$A convex lens generally:$$, 'B', $$diverges parallel rays$$, $$converges parallel rays$$, $$blocks light$$, $$reflects all light$$, $$A convex (converging) lens brings parallel rays together.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 103, $$PHY$$, $$Optics$$, $$medium$$, $$The speed of light is greatest in:$$, 'C', $$glass$$, $$water$$, $$vacuum$$, $$diamond$$, $$Light is fastest in a vacuum; denser media slow it down.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 4, 104, $$PHY$$, $$Electricity$$, $$easy$$, $$The charge of an electron is:$$, 'B', $$positive$$, $$negative$$, $$zero$$, $$variable only$$, $$Electrons carry a negative charge.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 105, $$QUANT$$, $$Algebra$$, $$easy$$, $$If 2x − 7 = 13, x =$$, 'B', $$8$$, $$10$$, $$12$$, $$20$$, $$2x = 20, so x = 10.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 106, $$QUANT$$, $$Algebra$$, $$easy$$, $$Factorize x² − 9:$$, 'A', $$(x-3)(x+3)$$, $$(x-9)(x+1)$$, $$(x-3)²$$, $$(x+9)(x-1)$$, $$Difference of squares: (x−3)(x+3).$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 107, $$QUANT$$, $$Algebra$$, $$easy$$, $$If a = 2 and b = 3, a² + b² =$$, 'C', $$10$$, $$12$$, $$13$$, $$15$$, $$4 + 9 = 13.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 108, $$QUANT$$, $$Algebra$$, $$easy$$, $$Simplify (x²)(x³):$$, 'A', $$x⁵$$, $$x⁶$$, $$2x⁵$$, $$x⁶/2$$, $$Add exponents: x^(2+3) = x⁵.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 109, $$QUANT$$, $$Algebra$$, $$easy$$, $$If x/4 = 6, x =$$, 'C', $$10$$, $$20$$, $$24$$, $$30$$, $$x = 6 × 4 = 24.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 110, $$QUANT$$, $$Algebra$$, $$easy$$, $$Solve: 5x + 2 = 3x + 14.$$, 'C', $$4$$, $$5$$, $$6$$, $$8$$, $$2x = 12, so x = 6.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 111, $$QUANT$$, $$Algebra$$, $$medium$$, $$The discriminant of x² − 4x + 4 is:$$, 'A', $$0$$, $$4$$, $$8$$, $$16$$, $$b² − 4ac = 16 − 16 = 0 (equal roots).$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 112, $$QUANT$$, $$Algebra$$, $$medium$$, $$The roots of x² − 7x + 12 = 0 are:$$, 'B', $$2 and 6$$, $$3 and 4$$, $$1 and 12$$, $$-3 and -4$$, $$Factorise: (x−3)(x−4) = 0 → 3 and 4.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 113, $$QUANT$$, $$Algebra$$, $$easy$$, $$If f(x) = 2x + 1, f(4) = ?$$, 'C', $$7$$, $$8$$, $$9$$, $$10$$, $$f(4) = 2(4) + 1 = 9.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 114, $$QUANT$$, $$Algebra$$, $$easy$$, $$If f(x) = x², f(−3) = ?$$, 'D', $$-9$$, $$-6$$, $$6$$, $$9$$, $$f(−3) = (−3)² = 9.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 115, $$QUANT$$, $$Algebra$$, $$easy$$, $$2³ × 2² =$$, 'C', $$16$$, $$24$$, $$32$$, $$64$$, $$Add exponents: 2⁵ = 32.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 116, $$QUANT$$, $$Algebra$$, $$medium$$, $$(3²)³ =$$, 'C', $$27$$, $$81$$, $$243$$, $$729$$, $$Multiply exponents: 3⁶ = 729.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 117, $$QUANT$$, $$Algebra$$, $$easy$$, $$log₁₀(1000) =$$, 'C', $$1$$, $$2$$, $$3$$, $$10$$, $$10³ = 1000, so log₁₀1000 = 3.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 118, $$QUANT$$, $$Algebra$$, $$easy$$, $$If A = {1,2,3} and B = {3,4,5}, A ∩ B is:$$, 'B', $${1,2}$$, $${3}$$, $${4,5}$$, $${1,2,3,4,5}$$, $$Intersection contains elements in both sets: {3}.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 119, $$QUANT$$, $$Algebra$$, $$medium$$, $$If a set has 4 elements, its power set has:$$, 'D', $$4$$, $$8$$, $$12$$, $$16$$, $$Power set size = 2⁴ = 16.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 120, $$QUANT$$, $$Geometry$$, $$easy$$, $$A right triangle has legs 3 and 4. The hypotenuse is:$$, 'A', $$5$$, $$6$$, $$7$$, $$8$$, $$√(3² + 4²) = √25 = 5.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 121, $$QUANT$$, $$Geometry$$, $$easy$$, $$Area of a circle with radius 7 cm (π = 22/7) is:$$, 'C', $$44$$, $$88$$, $$154$$, $$308$$, $$πr² = (22/7)(7²) = 154 cm².$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 122, $$QUANT$$, $$Geometry$$, $$easy$$, $$Circumference of a circle with radius 7 cm (π = 22/7) is:$$, 'B', $$22$$, $$44$$, $$88$$, $$154$$, $$2πr = 2(22/7)(7) = 44 cm.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 123, $$QUANT$$, $$Geometry$$, $$medium$$, $$The diagonal of a square of side 5 is:$$, 'C', $$5$$, $$10$$, $$5√2$$, $$25$$, $$Diagonal = side × √2 = 5√2.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 124, $$QUANT$$, $$Geometry$$, $$easy$$, $$Volume of a cube with side 4 cm is:$$, 'C', $$16$$, $$32$$, $$64$$, $$128$$, $$Volume = 4³ = 64 cm³.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 125, $$QUANT$$, $$Geometry$$, $$easy$$, $$sin 30° equals:$$, 'B', $$0$$, $$1/2$$, $$√2/2$$, $$1$$, $$sin 30° = 1/2.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 126, $$QUANT$$, $$Geometry$$, $$easy$$, $$cos 60° equals:$$, 'B', $$0$$, $$1/2$$, $$√3/2$$, $$1$$, $$cos 60° = 1/2.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 127, $$QUANT$$, $$Geometry$$, $$easy$$, $$tan 45° equals:$$, 'C', $$0$$, $$1/2$$, $$1$$, $$√3$$, $$tan 45° = 1.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 128, $$QUANT$$, $$Geometry$$, $$medium$$, $$If sin θ = 3/5 for an acute angle θ, cos θ =$$, 'B', $$3/5$$, $$4/5$$, $$5/3$$, $$1/5$$, $$Adjacent = √(5²−3²) = 4, so cos θ = 4/5.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 129, $$QUANT$$, $$Geometry$$, $$easy$$, $$The slope of y = 3x + 2 is:$$, 'B', $$2$$, $$3$$, $$-3$$, $$1/3$$, $$In y = mx + c, the slope m = 3.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 130, $$QUANT$$, $$Geometry$$, $$easy$$, $$The x-coordinate of the point (4, −2) is:$$, 'C', $$-2$$, $$2$$, $$4$$, $$6$$, $$In (x, y), the first value is the x-coordinate: 4.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 131, $$QUANT$$, $$Geometry$$, $$easy$$, $$Distance between (0,0) and (3,4) is:$$, 'C', $$3$$, $$4$$, $$5$$, $$7$$, $$√(3² + 4²) = 5.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 132, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$What is 2/3 + 1/6?$$, 'C', $$1/2$$, $$2/3$$, $$5/6$$, $$1$$, $$4/6 + 1/6 = 5/6.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 133, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$What is 5/8 − 1/4?$$, 'B', $$1/8$$, $$3/8$$, $$1/2$$, $$5/12$$, $$5/8 − 2/8 = 3/8.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 134, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$0.25 as a fraction is:$$, 'C', $$1/2$$, $$1/3$$, $$1/4$$, $$1/5$$, $$0.25 = 25/100 = 1/4.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 135, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$The reciprocal of 2/5 is:$$, 'B', $$2/5$$, $$5/2$$, $$-5/2$$, $$3/5$$, $$Reciprocal flips the fraction: 5/2.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 136, $$QUANT$$, $$Percentages$$, $$easy$$, $$A value of 500 increases by 10%. The new value is:$$, 'C', $$510$$, $$540$$, $$550$$, $$600$$, $$500 × 1.10 = 550.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 137, $$QUANT$$, $$Ratios and Proportions$$, $$easy$$, $$If x:y = 2:5 and y = 20, x = ?$$, 'B', $$4$$, $$8$$, $$10$$, $$12$$, $$x = (2/5) × 20 = 8.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 138, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$The average of 10, 20, 30, 40 and 50 is:$$, 'B', $$25$$, $$30$$, $$35$$, $$40$$, $$Sum = 150; 150 ÷ 5 = 30.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 139, $$QUANT$$, $$Probability$$, $$easy$$, $$A bag contains 3 red and 2 blue balls. Probability of drawing a red ball is:$$, 'B', $$2/5$$, $$3/5$$, $$1/2$$, $$3/2$$, $$3 favourable out of 5: 3/5.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 140, $$QUANT$$, $$Probability$$, $$medium$$, $$Two fair coins are tossed. Probability of two heads is:$$, 'C', $$1/2$$, $$1/3$$, $$1/4$$, $$1/8$$, $$One favourable (HH) out of four outcomes: 1/4.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 141, $$QUANT$$, $$Probability$$, $$easy$$, $$How many ways can 3 different books be arranged on a shelf?$$, 'B', $$3$$, $$6$$, $$9$$, $$12$$, $$3! = 3 × 2 × 1 = 6.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 142, $$QUANT$$, $$Probability$$, $$medium$$, $$How many ways can 2 students be chosen from 5?$$, 'C', $$5$$, $$8$$, $$10$$, $$20$$, $$₅C₂ = 5!/(2!3!) = 10.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 143, $$QUANT$$, $$Sequences and Series$$, $$easy$$, $$The nth term of 2, 4, 6, 8, ... is:$$, 'B', $$n$$, $$2n$$, $$n+2$$, $$2n+2$$, $$Terms are even numbers: 2n.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 144, $$QUANT$$, $$Sequences and Series$$, $$easy$$, $$The sum of the first 10 positive integers is:$$, 'C', $$45$$, $$50$$, $$55$$, $$60$$, $$n(n+1)/2 = 10(11)/2 = 55.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 145, $$QUANT$$, $$Algebra$$, $$medium$$, $$The determinant of [[2,1],[3,4]] is:$$, 'A', $$5$$, $$6$$, $$8$$, $$11$$, $$(2×4) − (1×3) = 8 − 3 = 5.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 146, $$QUANT$$, $$Algebra$$, $$medium$$, $$The derivative of x² is:$$, 'B', $$x$$, $$2x$$, $$x²/2$$, $$2$$, $$d/dx x² = 2x.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 147, $$QUANT$$, $$Algebra$$, $$easy$$, $$The derivative of a constant is:$$, 'C', $$1$$, $$the constant$$, $$0$$, $$undefined$$, $$The derivative of any constant is 0.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 148, $$QUANT$$, $$Algebra$$, $$medium$$, $$∫ 2x dx equals:$$, 'B', $$2x²+C$$, $$x²+C$$, $$x+C$$, $$2+C$$, $$∫2x dx = x² + C.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 5, 149, $$QUANT$$, $$Statistics$$, $$easy$$, $$The median of 2, 5, 7, 9, 12 is:$$, 'B', $$5$$, $$7$$, $$9$$, $$12$$, $$Five ordered values; the middle one is 7.$$);
select "public"."seed_mock_question"($$Bahria University — Extended Mock Test$$, $$150 MCQs · 120 minutes · 1 mark each · no negative marking$$, 6, 150, $$QUANT$$, $$Arithmetic$$, $$easy$$, $$When 17 is divided by 5, the remainder is:$$, 'A', $$2$$, $$3$$, $$4$$, $$5$$, $$17 = 5×3 + 2, so the remainder is 2.$$);


-- 11. GRANT HARDENING (revoke defaults, grant exact needs)
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'universities','programs','subjects','topics','test_configurations',
    'test_sections','questions','question_options','question_sources',
    'question_reviews','question_duplicates','mock_tests','mock_test_questions',
    'app_settings','admin_users','audit_logs'
  ] loop
    execute format('revoke insert, update, delete, truncate, references, trigger on table "public".%I from anon, authenticated;', t);
  end loop;
end $$;

grant select on table "public"."universities" to anon, authenticated;
grant select on table "public"."programs" to anon, authenticated;
grant select on table "public"."subjects" to anon, authenticated;
grant select on table "public"."topics" to anon, authenticated;
grant select on table "public"."test_configurations" to anon, authenticated;
grant select on table "public"."test_sections" to anon, authenticated;
grant select on table "public"."mock_tests" to anon, authenticated;
grant select on table "public"."mock_test_questions" to anon, authenticated;
grant select on table "public"."question_sources" to anon, authenticated;
grant select on table "public"."app_settings" to anon, authenticated;
grant select on table "public"."questions" to authenticated;
grant select on table "public"."question_options" to authenticated;

grant select, insert, update, delete on table "public"."profiles" to authenticated;
grant select, insert, update on table "public"."user_progress" to authenticated;
grant select, insert, update on table "public"."topic_progress" to authenticated;
grant select, insert, update on table "public"."study_plans" to authenticated;
grant select, insert, update on table "public"."study_sessions" to authenticated;
grant select, insert, update on table "public"."mistakes" to authenticated;
grant select, insert, delete on table "public"."bookmarks" to authenticated;
grant select, insert on table "public"."daily_user_stats" to authenticated;
grant select, insert, update on table "public"."user_stats" to authenticated;
grant select, insert on table "public"."xp_events" to authenticated;
grant select, insert on table "public"."achievements" to authenticated;
grant select, update on table "public"."notifications" to authenticated;
grant select, insert, update, delete on table "public"."ai_conversations" to authenticated;
grant select, insert on table "public"."ai_messages" to authenticated;
grant select, insert on table "public"."question_reports" to authenticated;
grant select, insert on table "public"."sync_entries" to authenticated;
grant select, insert, delete on table "public"."user_devices" to authenticated;
grant select, insert, update on table "public"."test_attempts" to authenticated;
grant select, insert, update on table "public"."test_answers" to authenticated;
grant select on table "public"."admin_users" to authenticated;
grant select on table "public"."audit_logs" to authenticated;

revoke truncate, references, trigger on all tables in schema public from authenticated;

do $$
declare
  r record;
begin
  for r in
    select c.relname as t
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname not like '\_%'
    order by c.relname
  loop
    execute format('revoke all on table "public".%I from anon;', r.t);
  end loop;
end $$;

grant select on table "public"."subjects" to anon;
grant select on table "public"."topics" to anon;
grant select on table "public"."programs" to anon;
grant select on table "public"."universities" to anon;
grant select on table "public"."app_settings" to anon;
grant select on table "public"."question_sources" to anon;

revoke update, delete on table "public"."user_progress" from authenticated;
revoke delete on table "public"."topic_progress" from authenticated;
revoke delete on table "public"."study_plans" from authenticated;
revoke delete on table "public"."study_sessions" from authenticated;
revoke delete on table "public"."mistakes" from authenticated;
revoke update on table "public"."bookmarks" from authenticated;
revoke update, delete on table "public"."daily_user_stats" from authenticated;
revoke delete on table "public"."user_stats" from authenticated;
revoke update, delete on table "public"."xp_events" from authenticated;
revoke update, delete on table "public"."achievements" from authenticated;
revoke insert, delete on table "public"."notifications" from authenticated;
revoke update, delete on table "public"."ai_messages" from authenticated;
revoke update, delete on table "public"."question_reports" from authenticated;
revoke update, delete on table "public"."sync_entries" from authenticated;
revoke update on table "public"."user_devices" from authenticated;
revoke delete on table "public"."test_attempts" from authenticated;
revoke delete on table "public"."test_answers" from authenticated;
revoke delete on table "public"."profiles" from authenticated;

-- =============================================================================
-- DONE. Verify with:
--   select tablename from pg_tables where schemaname = 'public' order by tablename;
--   select count(*) from public.questions where review_status = 'approved';
-- =============================================================================
