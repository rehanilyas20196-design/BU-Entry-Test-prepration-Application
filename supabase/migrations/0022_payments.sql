-- 0022_payments.sql
-- JazzCash / Raast Payment & Premium Activation for REHAN Shop

create table if not exists "public"."payments" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trx_id text not null,
  sender_phone text,
  amount numeric(10, 2) not null default 5000.00,
  till_id text not null default '984180825',
  shop_name text not null default 'REHAN Shop',
  payment_method text not null default 'JazzCash / Raast',
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user_id on "public"."payments"(user_id);
create index if not exists idx_payments_trx_id on "public"."payments"(trx_id);

-- Enable Row Level Security
alter table "public"."payments" enable row level security;

-- RLS Policies
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'payments' and policyname = 'Users can view their own payments'
  ) then
    create policy "Users can view their own payments"
      on "public"."payments"
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'payments' and policyname = 'Users can insert their own payments'
  ) then
    create policy "Users can insert their own payments"
      on "public"."payments"
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Grant permissions to authenticated and service_role
grant select, insert on "public"."payments" to authenticated;
grant all on "public"."payments" to service_role;
