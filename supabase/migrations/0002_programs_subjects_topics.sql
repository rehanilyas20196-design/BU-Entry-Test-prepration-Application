-- 0002_programs_subjects_topics.sql
-- BUET Prep AI — content taxonomy: universities, programs, test configs, subjects, topics

-- =============================================================
-- UNIVERSITIES
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

comment on table "public"."universities" is 'Universities supported by the platform (multi-university ready).';

-- =============================================================
-- PROGRAMS
-- =============================================================
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

comment on table "public"."programs" is 'Degree programs a student can target (e.g. BBA, BS CS, BDS).';

-- =============================================================
-- TEST CONFIGURATIONS (database-driven, NOT hard-coded)
-- =============================================================
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

comment on table "public"."test_configurations" is 'Per-program test structure (question count, marks, duration). Editable by admins without code changes.';

-- =============================================================
-- TEST SECTIONS (subject distribution per program)
-- =============================================================
create table if not exists "public"."test_sections" (
  id uuid primary key default gen_random_uuid(),
  test_config_id uuid not null references "public"."test_configurations"(id) on delete cascade,
  subject_id uuid not null, -- resolved after subjects table
  name text not null,
  question_count integer not null check (question_count >= 0),
  marks integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (test_config_id, subject_id)
);

-- =============================================================
-- SUBJECTS
-- =============================================================
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

comment on table "public"."subjects" is 'Subjects such as English/Verbal, Quantitative, Analytical Reasoning, General Knowledge, Physics, Chemistry, Biology.';

-- =============================================================
-- TOPICS
-- =============================================================
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

comment on table "public"."topics" is 'Topics within subjects (e.g. subject: Quantitative → topic: Algebra).';

-- =============================================================
-- Fix FK for test_sections (forward reference)
-- =============================================================
alter table "public"."test_sections"
  add constraint test_sections_subject_fk
  foreign key (subject_id) references "public"."subjects"(id) on delete cascade;

-- =============================================================
-- INDEXES
-- =============================================================
create index if not exists idx_programs_university on "public"."programs"(university_id);
create index if not exists idx_test_config_program on "public"."test_configurations"(program_id);
create index if not exists idx_test_config_university on "public"."test_configurations"(university_id);
create index if not exists idx_test_sections_config on "public"."test_sections"(test_config_id);
create index if not exists idx_topics_subject on "public"."topics"(subject_id);
create index if not exists idx_subjects_active on "public"."subjects"(is_active);

-- =============================================================
-- UPDATED_AT TRIGGER helper
-- =============================================================
create or replace function "public"."set_updated_at"()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_programs_updated_at before update on "public"."programs"
  for each row execute function "public"."set_updated_at"();
create trigger trg_universities_updated_at before update on "public"."universities"
  for each row execute function "public"."set_updated_at"();
create trigger trg_test_configurations_updated_at before update on "public"."test_configurations"
  for each row execute function "public"."set_updated_at"();
create trigger trg_subjects_updated_at before update on "public"."subjects"
  for each row execute function "public"."set_updated_at"();
create trigger trg_topics_updated_at before update on "public"."topics"
  for each row execute function "public"."set_updated_at"();
