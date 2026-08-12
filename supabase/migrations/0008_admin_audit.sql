-- 0008_admin_audit.sql
-- BUET Prep AI — admin users, audit logs, profiles

-- =============================================================
-- PROFILES (student profile extension of auth.users)
-- =============================================================
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user on "public"."profiles"(user_id);

create trigger trg_profiles_updated_at before update on "public"."profiles"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- ADMIN USERS
-- =============================================================
create table if not exists "public"."admin_users" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role "public"."user_role" not null default 'content_editor',
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_admin_users_updated_at before update on "public"."admin_users"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- AUDIT LOGS
-- =============================================================
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

create index if not exists idx_audit_logs_actor on "public"."audit_logs"(actor_user_id, created_at desc);
create index if not exists idx_audit_logs_entity on "public"."audit_logs"(entity_type, entity_id);
create index if not exists idx_audit_logs_action on "public"."audit_logs"(action);

-- =============================================================
-- USER DEVICES (for push notifications / offline sync)
-- =============================================================
create table if not exists "public"."user_devices" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_token text not null,
  platform text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_token)
);

create index if not exists idx_user_devices_user on "public"."user_devices"(user_id);

-- =============================================================
-- OFFLINE SYNC QUEUE (client syncs local answers here)
-- =============================================================
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

create index if not exists idx_sync_entries_user on "public"."sync_entries"(user_id, synced_at);
