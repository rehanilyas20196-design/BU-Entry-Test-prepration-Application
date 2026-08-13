-- 0003_questions.sql
-- BUET Prep AI — question bank core tables

-- =============================================================
-- QUESTIONS
-- =============================================================
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
  reviewer_id uuid, -- resolved after admin_users
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table "public"."questions" is 'Question bank. Only approved questions are exposed to students.';

create index if not exists idx_questions_subject on "public"."questions"(subject_id);
create index if not exists idx_questions_topic on "public"."questions"(topic_id);
create index if not exists idx_questions_difficulty on "public"."questions"(difficulty);
create index if not exists idx_questions_review_status on "public"."questions"(review_status);
create index if not exists idx_questions_validity on "public"."questions"(valid_from, valid_until);
create index if not exists idx_questions_updated on "public"."questions"(updated_at desc);

-- GIN index powers pg_trgm fuzzy duplicate detection
create index if not exists idx_questions_text_trgm on "public"."questions"
  using gin (question_text gin_trgm_ops);

create trigger trg_questions_updated_at before update on "public"."questions"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- QUESTION OPTIONS
-- =============================================================
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

create index if not exists idx_options_question on "public"."question_options"(question_id);

-- Constraint: exactly one correct option per question
-- Enforced via trigger because Postgres cannot express this as a plain constraint.

create or replace function "public"."validate_question_options"()
returns trigger
language plpgsql
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

create trigger trg_validate_options_aiud
  after insert or update or delete on "public"."question_options"
  for each row execute function "public"."validate_question_options"();

-- =============================================================
-- QUESTION SOURCES (provenance ledger)
-- =============================================================
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

create index if not exists idx_sources_question on "public"."question_sources"(question_id);

-- =============================================================
-- QUESTION REVIEWS (admin review ledger)
-- =============================================================
create table if not exists "public"."question_reviews" (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references "public"."questions"(id) on delete cascade,
  reviewer_id uuid,
  status "public"."review_status" not null,
  comment text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_question on "public"."question_reviews"(question_id);
create index if not exists idx_reviews_status on "public"."question_reviews"(status);

-- =============================================================
-- QUESTION EMBEDDINGS (pgvector — optional)
-- =============================================================
-- Enables semantic duplicate detection.
-- create table if not exists "public"."question_embeddings" (
--   id uuid primary key default gen_random_uuid(),
--   question_id uuid not null references "public"."questions"(id) on delete cascade,
--   embedding vector(1536),
--   model text not null default 'text-embedding-3-small',
--   created_at timestamptz not null default now()
-- );
-- create index if not exists idx_embeddings_question on "public"."question_embeddings"(question_id);

-- =============================================================
-- QUESTION REPORTS (student-reported issues)
-- =============================================================
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

create index if not exists idx_reports_question on "public"."question_reports"(question_id);
create index if not exists idx_reports_status on "public"."question_reports"(status);
create index if not exists idx_reports_user on "public"."question_reports"(user_id);

create trigger trg_question_reports_updated_at before update on "public"."question_reports"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- DUPLICATE FLAGS (candidate duplicates detected by pipeline)
-- =============================================================
create table if not exists "public"."question_duplicates" (
  id uuid primary key default gen_random_uuid(),
  question_id_a uuid not null references "public"."questions"(id) on delete cascade,
  question_id_b uuid not null references "public"."questions"(id) on delete cascade,
  similarity numeric(5,4),
  method text not null,
  status text not null default 'flagged' check (status in ('flagged', 'confirmed', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (question_id_a, question_id_b)
);

create index if not exists idx_duplicates_status on "public"."question_duplicates"(status);
