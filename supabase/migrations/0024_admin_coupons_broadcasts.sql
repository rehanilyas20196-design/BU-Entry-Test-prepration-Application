-- 0024_admin_coupons_broadcasts.sql
-- Premium coupon codes + broadcast announcements for the admin console.
-- Both tables are service-role only (RLS enabled, no policies) so regular
-- users can never touch them directly.

-- =============================================================
-- PREMIUM COUPONS
-- =============================================================
create table if not exists "public"."premium_coupons" (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- full = free premium, percent = % off, flat = fixed amount off
  discount_type text not null default 'full' check (discount_type in ('full', 'percent', 'flat')),
  discount_value numeric(10, 2) not null default 0,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_premium_coupons_code on "public"."premium_coupons"(code);
create index if not exists idx_premium_coupons_active on "public"."premium_coupons"(is_active);

alter table "public"."premium_coupons" enable row level security;
grant all on "public"."premium_coupons" to service_role;

-- =============================================================
-- BROADCAST ANNOUNCEMENTS (record of admin -> all-user messages)
-- =============================================================
create table if not exists "public"."broadcasts" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  type text not null default 'info',
  recipient_count integer not null default 0,
  created_by text,
  created_at timestamptz not null default now()
);

alter table "public"."broadcasts" enable row level security;
grant all on "public"."broadcasts" to service_role;
