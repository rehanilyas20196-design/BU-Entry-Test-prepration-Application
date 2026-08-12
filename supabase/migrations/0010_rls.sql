-- 0010_rls.sql
-- BUET Prep AI — Row Level Security policies
-- Principle: students may only access their own data and approved public questions.
-- Content mutation happens ONLY through the backend API using the service role.

-- =============================================================
-- HELPER: is_admin / is_content_editor
-- =============================================================
create or replace function "public"."auth_is_admin"()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from "public"."admin_users"
    where user_id = auth.uid() and is_active = true and role in ('admin')
  );
$$;

create or replace function "public"."auth_is_content_editor"()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from "public"."admin_users"
    where user_id = auth.uid() and is_active = true and role in ('admin','content_editor')
  );
$$;

create or replace function "public"."auth_is_staff"()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from "public"."admin_users"
    where user_id = auth.uid() and is_active = true
  );
$$;

-- =============================================================
-- PROFILES
-- =============================================================
alter table "public"."profiles" enable row level security;
create policy "profiles_select_own" on "public"."profiles"
  for select using (auth.uid() = user_id or "public"."auth_is_staff"());
create policy "profiles_insert_own" on "public"."profiles"
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on "public"."profiles"
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- PUBLIC CONTENT (approved questions only)
-- =============================================================
alter table "public"."universities" enable row level security;
create policy "universities_read" on "public"."universities" for select using (true);

alter table "public"."programs" enable row level security;
create policy "programs_read" on "public"."programs" for select using (true or "public"."auth_is_staff"());

alter table "public"."subjects" enable row level security;
create policy "subjects_read" on "public"."subjects" for select using (true or "public"."auth_is_staff"());

alter table "public"."topics" enable row level security;
create policy "topics_read" on "public"."topics" for select using (true or "public"."auth_is_staff"());

alter table "public"."test_configurations" enable row level security;
create policy "test_config_read" on "public"."test_configurations" for select using (true or "public"."auth_is_staff"());

alter table "public"."test_sections" enable row level security;
create policy "test_sections_read" on "public"."test_sections" for select using (true or "public"."auth_is_staff"());

-- Questions: students only ever see APPROVED questions.
alter table "public"."questions" enable row level security;
create policy "questions_read_approved" on "public"."questions"
  for select using (review_status = 'approved');
create policy "questions_read_staff" on "public"."questions"
  for select using ("public"."auth_is_staff"() or "public"."auth_is_content_editor"());

alter table "public"."question_options" enable row level security;
create policy "options_read_approved" on "public"."question_options"
  for select using (
    exists (
      select 1 from "public"."questions" q
      where q.id = question_id and q.review_status = 'approved'
    )
  );
create policy "options_read_staff" on "public"."question_options"
  for select using ("public"."auth_is_staff"() or "public"."auth_is_content_editor"());

-- Sources metadata (read by anyone to satisfy provenance labeling)
alter table "public"."question_sources" enable row level security;
create policy "sources_read" on "public"."question_sources" for select using (true);

-- =============================================================
-- TEST CONFIG / MOCK TESTS (readable, attempts owned)
-- =============================================================
alter table "public"."mock_tests" enable row level security;
create policy "mock_tests_read" on "public"."mock_tests" for select using (is_active = true or "public"."auth_is_staff"());

alter table "public"."mock_test_questions" enable row level security;
create policy "mock_test_q_read" on "public"."mock_test_questions"
  for select using (
    exists (select 1 from "public"."mock_tests" m where m.id = mock_test_id and m.is_active = true)
    or "public"."auth_is_staff"()
  );

alter table "public"."test_attempts" enable row level security;
create policy "attempts_select_own" on "public"."test_attempts"
  for select using (auth.uid() = user_id or "public"."auth_is_staff"());
create policy "attempts_insert_own" on "public"."test_attempts"
  for insert with check (auth.uid() = user_id);
create policy "attempts_update_own" on "public"."test_attempts"
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."test_answers" enable row level security;
create policy "answers_select_own" on "public"."test_answers"
  for select using (
    exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and (a.user_id = auth.uid() or "public"."auth_is_staff"()))
  );
create policy "answers_insert_own" on "public"."test_answers"
  for insert with check (
    exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and a.user_id = auth.uid())
  );
create policy "answers_update_own" on "public"."test_answers"
  for update using (
    exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from "public"."test_attempts" a where a.id = attempt_id and a.user_id = auth.uid())
  );

-- =============================================================
-- USER-OWNED ENGAGEMENT TABLES
-- =============================================================
alter table "public"."user_progress" enable row level security;
create policy "progress_select_own" on "public"."user_progress" for select using (auth.uid() = user_id);
create policy "progress_insert_own" on "public"."user_progress" for insert with check (auth.uid() = user_id);

alter table "public"."topic_progress" enable row level security;
create policy "topic_progress_select_own" on "public"."topic_progress" for select using (auth.uid() = user_id);
create policy "topic_progress_insert_own" on "public"."topic_progress" for insert with check (auth.uid() = user_id);
create policy "topic_progress_update_own" on "public"."topic_progress" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."study_plans" enable row level security;
create policy "plans_select_own" on "public"."study_plans" for select using (auth.uid() = user_id);
create policy "plans_insert_own" on "public"."study_plans" for insert with check (auth.uid() = user_id);
create policy "plans_update_own" on "public"."study_plans" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."study_sessions" enable row level security;
create policy "sessions_select_own" on "public"."study_sessions" for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on "public"."study_sessions" for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on "public"."study_sessions" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."mistakes" enable row level security;
create policy "mistakes_select_own" on "public"."mistakes" for select using (auth.uid() = user_id);
create policy "mistakes_insert_own" on "public"."mistakes" for insert with check (auth.uid() = user_id);
create policy "mistakes_update_own" on "public"."mistakes" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."bookmarks" enable row level security;
create policy "bookmarks_select_own" on "public"."bookmarks" for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on "public"."bookmarks" for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on "public"."bookmarks" for delete using (auth.uid() = user_id);

alter table "public"."daily_user_stats" enable row level security;
create policy "daily_stats_select_own" on "public"."daily_user_stats" for select using (auth.uid() = user_id);
create policy "daily_stats_insert_own" on "public"."daily_user_stats" for insert with check (auth.uid() = user_id);

alter table "public"."user_stats" enable row level security;
create policy "user_stats_select_own" on "public"."user_stats" for select using (auth.uid() = user_id);
create policy "user_stats_insert_own" on "public"."user_stats" for insert with check (auth.uid() = user_id);
create policy "user_stats_update_own" on "public"."user_stats" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table "public"."xp_events" enable row level security;
create policy "xp_events_select_own" on "public"."xp_events" for select using (auth.uid() = user_id);
create policy "xp_events_insert_own" on "public"."xp_events" for insert with check (auth.uid() = user_id);

-- Achievements: read own (earned records)
alter table "public"."achievements" enable row level security;
create policy "achievements_select_own" on "public"."achievements" for select using (auth.uid() = user_id);
create policy "achievements_insert_own" on "public"."achievements" for insert with check (auth.uid() = user_id);

-- Notifications
alter table "public"."notifications" enable row level security;
create policy "notifications_select_own" on "public"."notifications" for select using (auth.uid() = user_id);
create policy "notifications_update_own" on "public"."notifications" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- AI TABLES (own only)
-- =============================================================
alter table "public"."ai_conversations" enable row level security;
create policy "conversations_select_own" on "public"."ai_conversations" for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on "public"."ai_conversations" for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on "public"."ai_conversations" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on "public"."ai_conversations" for delete using (auth.uid() = user_id);

alter table "public"."ai_messages" enable row level security;
create policy "messages_select_own" on "public"."ai_messages"
  for select using (
    exists (select 1 from "public"."ai_conversations" c where c.id = conversation_id and c.user_id = auth.uid())
  );
create policy "messages_insert_own" on "public"."ai_messages"
  for insert with check (
    exists (select 1 from "public"."ai_conversations" c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- =============================================================
-- REPORTS / SYNC / DEVICES (own only)
-- =============================================================
alter table "public"."question_reports" enable row level security;
create policy "reports_select_own" on "public"."question_reports" for select using (auth.uid() = user_id);
create policy "reports_insert_own" on "public"."question_reports" for insert with check (auth.uid() = user_id);

alter table "public"."sync_entries" enable row level security;
create policy "sync_select_own" on "public"."sync_entries" for select using (auth.uid() = user_id);
create policy "sync_insert_own" on "public"."sync_entries" for insert with check (auth.uid() = user_id);

alter table "public"."user_devices" enable row level security;
create policy "devices_select_own" on "public"."user_devices" for select using (auth.uid() = user_id);
create policy "devices_insert_own" on "public"."user_devices" for insert with check (auth.uid() = user_id);
create policy "devices_delete_own" on "public"."user_devices" for delete using (auth.uid() = user_id);

-- =============================================================
-- ADMIN-ONLY TABLES (staff read/write)
-- =============================================================
alter table "public"."admin_users" enable row level security;
create policy "admin_read_staff" on "public"."admin_users" for select using ("public"."auth_is_staff"() or auth.uid() = user_id);

alter table "public"."audit_logs" enable row level security;
create policy "audit_read_staff" on "public"."audit_logs" for select using ("public"."auth_is_staff"());

alter table "public"."app_settings" enable row level security;
create policy "settings_read_all" on "public"."app_settings" for select using (true);

-- =============================================================
-- QUESTIONS/OPTIONS/TOPICS WRITE IS ADMIN-ONLY (service role / staff)
-- The student role has NO insert/update/delete on content tables.
-- =============================================================

-- Deny-by-default safety: revoke all public schema privileges except what's needed
revoke all on table "public"."questions" from anon, authenticated;
grant select on table "public"."questions" to authenticated;
grant select on table "public"."question_options" to authenticated;
grant select on table "public"."question_sources" to authenticated;
grant select on table "public"."subjects", "public"."topics", "public"."programs",
  "public"."universities", "public"."test_configurations", "public"."test_sections",
  "public"."mock_tests", "public"."mock_test_questions", "public"."app_settings" to authenticated, anon;
