-- 0007_ai.sql
-- BUET Prep AI — AI tutor conversations, messages, usage, app settings

-- =============================================================
-- AI CONVERSATIONS
-- =============================================================
create table if not exists "public"."ai_conversations" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  context_question_id uuid references "public"."questions"(id) on delete set null,
  subject_id uuid references "public"."subjects"(id) on delete set null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_user on "public"."ai_conversations"(user_id, updated_at desc);

create trigger trg_ai_conversations_updated_at before update on "public"."ai_conversations"
  for each row execute function "public"."set_updated_at"();

-- =============================================================
-- AI MESSAGES
-- =============================================================
create table if not exists "public"."ai_messages" (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references "public"."ai_conversations"(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_conversation on "public"."ai_messages"(conversation_id, created_at);

-- =============================================================
-- AI USAGE (quotas & abuse monitoring)
-- =============================================================
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

create index if not exists idx_ai_usage_user on "public"."ai_usage"(user_id, created_at desc);
create index if not exists idx_ai_usage_feature on "public"."ai_usage"(feature, created_at desc);

-- =============================================================
-- APP SETTINGS (feature flags, quotas — editable by admins)
-- =============================================================
create table if not exists "public"."app_settings" (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- Seed sensible defaults. Values editable via admin panel without code changes.
insert into "public"."app_settings" (key, value, description) values
  ('ai.daily_quota_per_user', '{"value": 30}', 'Max AI tutor requests per user per day'),
  ('ai.max_input_length', '{"value": 4000}', 'Max characters per AI request'),
  ('ai.max_output_length', '{"value": 3000}', 'Max characters per AI response'),
  ('ai.question_gen_batch_max', '{"value": 50}', 'Max questions per AI generation batch'),
  ('practice.daily_target_default', '{"value": 30}', 'Default daily question target'),
  ('app.disclaimer', '{"value": "This is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University."}', 'App-wide disclaimer'),
  ('app.question_source_label', '{"value": "Original AI-generated practice question", "official_label": "Official Bahria sample question"}', 'Source labeling shown to students')
  on conflict (key) do nothing;
