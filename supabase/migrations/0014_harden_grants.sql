-- 0014_harden_grants.sql
-- BUET Prep AI — defense-in-depth grant hardening.
--
-- 0010 already revoked writes on `questions` and enabled RLS everywhere.
-- This migration removes the Supabase default "grant all on all tables"
-- write privileges for anon/authenticated on every READ-ONLY content table,
-- so that no accidental or future RLS policy can allow client-side writes to
-- catalog/content/admin data. Content mutation must go through the backend
-- API (service role / postgres).

-- ------------------------------------------------------------------
-- READ-ONLY CONTENT TABLES
-- The student role only ever needs SELECT on these. Writes are performed
-- exclusively by the backend (service role) or staff via the dashboard.
-- ------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'universities',
    'programs',
    'subjects',
    'topics',
    'test_configurations',
    'test_sections',
    'questions',
    'question_options',
    'question_sources',
    'question_reviews',
    'question_duplicates',
    'mock_tests',
    'mock_test_questions',
    'app_settings',
    'admin_users',
    'audit_logs'
  ] loop
    execute format('revoke insert, update, delete, truncate, references, trigger on table "public".%I from anon, authenticated;', t);
  end loop;
end $$;

-- ------------------------------------------------------------------
-- GRANTS: public catalog (anyone, including anonymous visitors)
-- ------------------------------------------------------------------
grant select on table "public"."universities" to anon, authenticated;
grant select on table "public"."programs" to anon, authenticated;
grant select on table "public"."subjects" to anon, authenticated;
grant select on table "public"."topics" to anon, authenticated;
grant select on table "public"."test_configurations" to anon, authenticated;
grant select on table "public"."test_sections" to anon, authenticated;
grant select on table "public"."mock_tests" to anon, authenticated;
grant select on table "public"."mock_test_questions" to anon, authenticated;
grant select on table "public"."question_sources" to anon, authenticated;
grant select on table "public"."app_settings" to anon, authenticated;

-- ------------------------------------------------------------------
-- GRANTS: approved questions require an authenticated session
-- (anon is deliberately excluded — see 0010)
-- ------------------------------------------------------------------
grant select on table "public"."questions" to authenticated;
grant select on table "public"."question_options" to authenticated;

-- ------------------------------------------------------------------
-- USER-OWNED TABLES: keep the exact DML the client legitimately needs;
-- RLS (`auth.uid() = user_id`) continues to enforce row ownership.
-- ------------------------------------------------------------------
grant select, insert, update, delete on table "public"."profiles" to authenticated;
grant select, insert, update on table "public"."user_progress" to authenticated;
grant select, insert, update on table "public"."topic_progress" to authenticated;
grant select, insert, update on table "public"."study_plans" to authenticated;
grant select, insert, update on table "public"."study_sessions" to authenticated;
grant select, insert, update on table "public"."mistakes" to authenticated;
grant select, insert, delete on table "public"."bookmarks" to authenticated;
grant select, insert on table "public"."daily_user_stats" to authenticated;
grant select, insert, update on table "public"."user_stats" to authenticated;
grant select, insert on table "public"."xp_events" to authenticated;
grant select, insert on table "public"."achievements" to authenticated;
grant select, update on table "public"."notifications" to authenticated;
grant select, insert, update, delete on table "public"."ai_conversations" to authenticated;
grant select, insert on table "public"."ai_messages" to authenticated;
grant select, insert on table "public"."question_reports" to authenticated;
grant select, insert on table "public"."sync_entries" to authenticated;
grant select, insert, delete on table "public"."user_devices" to authenticated;
grant select, insert, update on table "public"."test_attempts" to authenticated;
grant select, insert, update on table "public"."test_answers" to authenticated;

-- ------------------------------------------------------------------
-- ADMIN/AUDIT: staff SELECT only (write via backend/dashboard)
-- ------------------------------------------------------------------
grant select on table "public"."admin_users" to authenticated;
grant select on table "public"."audit_logs" to authenticated;

-- ------------------------------------------------------------------
-- Hardening for tables without any client-facing RLS write path
-- ------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger on table
  "public"."leaderboard_entries",
  "public"."ai_usage",
  "public"."question_duplicates",
  "public"."question_reviews"
  from anon, authenticated;
