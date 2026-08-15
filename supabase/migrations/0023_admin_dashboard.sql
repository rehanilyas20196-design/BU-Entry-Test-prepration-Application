-- 0023_admin_dashboard.sql
-- BUET Prep AI — admin dashboard backend tables
-- Admin credentials (email + hashed password) and admin activity log.
-- RLS is enabled on both tables with NO policies for anon/authenticated,
-- so regular users can never read or write them even if they hit the
-- Supabase REST API directly. Only the server-side admin API (service_role)
-- can access them.

-- =============================================================
-- ADMIN CREDENTIALS
-- =============================================================
create table if not exists "public"."admin_credentials" (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_credentials_email on "public"."admin_credentials"(email);

alter table "public"."admin_credentials" enable row level security;

-- No policies: anon + authenticated are blocked. service_role bypasses RLS.

grant all on "public"."admin_credentials" to service_role;

-- =============================================================
-- ADMIN ACTIVITY LOG
-- =============================================================
create table if not exists "public"."admin_activity_log" (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_log_admin on "public"."admin_activity_log"(admin_email, created_at desc);
create index if not exists idx_admin_activity_log_entity on "public"."admin_activity_log"(entity_type, entity_id);
create index if not exists idx_admin_activity_log_created on "public"."admin_activity_log"(created_at desc);

alter table "public"."admin_activity_log" enable row level security;

-- No policies: anon + authenticated are blocked. service_role bypasses RLS.

grant all on "public"."admin_activity_log" to service_role;

-- =============================================================
-- DEFAULT ADMIN SEED
-- Email:    admin@buetprep.ai
-- Password: Admin@123   (CHANGE THIS after first login!)
-- =============================================================
insert into "public"."admin_credentials" (email, password_hash, display_name, is_active)
values (
  'admin@buetprep.ai',
  '$2b$10$XJUujrhFTj4UfBF31VflpeB6017Z23oAQ40EOTgwMhZW.g5w/vIru',
  'BUET Prep Admin',
  true
)
on conflict (email) do nothing;
