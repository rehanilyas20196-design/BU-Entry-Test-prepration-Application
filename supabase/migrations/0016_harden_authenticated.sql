-- 0016_harden_authenticated.sql
-- BUET Prep AI — tighten authenticated grants to exactly match RLS policy needs.
--
-- The authenticated role inherits Supabase's default "all on all tables"
-- grants. RLS is the enforcement layer, but this migration removes privileged
-- operations (TRUNCATE, REFERENCES, TRIGGER) and DML the client never needs,
-- so the grants surface exactly matches the RLS policies declared in 0010.

-- 1) No client role ever needs these administrative privileges.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- 2) User-owned tables: grant exactly the DML that 0010's RLS policies permit.
grant select, insert, update on table "public"."profiles" to authenticated;            -- own select/insert/update
grant select, insert on table "public"."user_progress" to authenticated;               -- own select/insert
grant select, insert, update on table "public"."topic_progress" to authenticated;      -- own select/insert/update
grant select, insert, update on table "public"."study_plans" to authenticated;         -- own select/insert/update
grant select, insert, update on table "public"."study_sessions" to authenticated;      -- own select/insert/update
grant select, insert, update on table "public"."mistakes" to authenticated;            -- own select/insert/update
grant select, insert, delete on table "public"."bookmarks" to authenticated;           -- own select/insert/delete
grant select, insert on table "public"."daily_user_stats" to authenticated;            -- own select/insert
grant select, insert, update on table "public"."user_stats" to authenticated;          -- own select/insert/update
grant select, insert on table "public"."xp_events" to authenticated;                   -- own select/insert
grant select, insert on table "public"."achievements" to authenticated;                -- own select/insert
grant select, update on table "public"."notifications" to authenticated;               -- own select/update
grant select, insert, update, delete on table "public"."ai_conversations" to authenticated; -- own all
grant select, insert on table "public"."ai_messages" to authenticated;                 -- via own conversation
grant select, insert on table "public"."question_reports" to authenticated;            -- own select/insert
grant select, insert on table "public"."sync_entries" to authenticated;                -- own select/insert
grant select, insert, delete on table "public"."user_devices" to authenticated;        -- own select/insert/delete
grant select, insert, update on table "public"."test_attempts" to authenticated;       -- own select/insert/update
grant select, insert, update on table "public"."test_answers" to authenticated;        -- via own attempt

-- 3) Tables with NO client-facing RLS policy: deny entirely from the client.
revoke all on table
  "public"."leaderboard_entries",
  "public"."ai_usage",
  "public"."question_duplicates",
  "public"."question_reviews"
  from authenticated;
