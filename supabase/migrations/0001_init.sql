-- 0001_init.sql
-- BUET Prep AI — initial schema
-- Extensions and core reference tables

-- =============================================================
-- EXTENSIONS
-- =============================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- pg_trgm powers fuzzy duplicate detection on question text
create extension if not exists "pg_trgm";

-- vector extension (pgvector) for embedding-based duplicate detection.
-- Keep optional: enabling requires the pgvector extension to be installed.
-- create extension if not exists "vector";

-- =============================================================
-- ENUMS
-- =============================================================

-- ensure idempotent creation
do $$
begin
  create type "public"."difficulty" as enum ('easy', 'medium', 'hard', 'expert');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."review_status" as enum ('draft', 'ai_generated', 'needs_review', 'approved', 'rejected', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."source_type" as enum ('OFFICIAL_BU_SOURCE', 'ORIGINAL_AI', 'HUMAN_CREATED', 'OPEN_EDUCATIONAL_RESOURCE', 'USER_SUBMITTED', 'THIRD_PARTY_REFERENCE');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."copyright_status" as enum ('original', 'official_sample', 'reference_based');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."user_role" as enum ('student', 'admin', 'content_editor');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."preparation_level" as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."test_mode" as enum ('practice', 'timed_practice', 'full_mock');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."attempt_status" as enum ('in_progress', 'submitted', 'expired', 'abandoned');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."plan_status" as enum ('active', 'completed', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."report_status" as enum ('open', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type "public"."subject_category" as enum ('verbal', 'quantitative', 'analytical', 'general_knowledge', 'science', 'medical');
exception when duplicate_object then null;
end $$;
