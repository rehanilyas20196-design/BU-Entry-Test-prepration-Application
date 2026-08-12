-- 0004_mock_tests.sql
-- BUET Prep AI — mock tests, attempts, answers

-- =============================================================
-- MOCK TESTS
-- =============================================================
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

create index if not exists idx_mock_tests_program on "public"."mock_tests"(program_id);
create index if not exists idx_mock_tests_active on "public"."mock_tests"(is_active);

create trigger trg_mock_tests_updated_at before update on "public"."mock_tests"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- MOCK TEST QUESTIONS
-- =============================================================
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

create index if not exists idx_mock_test_q_test on "public"."mock_test_questions"(mock_test_id);
create index if not exists idx_mock_test_q_question on "public"."mock_test_questions"(question_id);

-- =============================================================
-- TEST ATTEMPTS
-- =============================================================
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

create index if not exists idx_attempts_user on "public"."test_attempts"(user_id);
create index if not exists idx_attempts_user_status on "public"."test_attempts"(user_id, status);
create index if not exists idx_attempts_mock_test on "public"."test_attempts"(mock_test_id);
create index if not exists idx_attempts_created on "public"."test_attempts"(created_at desc);

create trigger trg_test_attempts_updated_at before update on "public"."test_attempts"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- TEST ANSWERS
-- =============================================================
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

create index if not exists idx_test_answers_attempt on "public"."test_answers"(attempt_id);
create index if not exists idx_test_answers_question on "public"."test_answers"(question_id);

-- =============================================================
-- SCORING IS SERVER-SIDE ONLY
-- Score is computed by the API when the attempt is submitted.
-- This table stores the canonical per-answer correctness snapshot.
-- =============================================================
