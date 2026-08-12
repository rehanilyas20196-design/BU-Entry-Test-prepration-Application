-- 0017_align_grants_to_rls.sql
-- BUET Prep AI — remove excess client DML on user-owned tables so the grant
-- surface exactly matches the RLS policies declared in 0010.
--
-- RLS remains the enforcement layer; these revokes are defense-in-depth so a
-- future permissive policy cannot silently widen client write access.

revoke update, delete on table "public"."user_progress" from authenticated;
revoke delete on table "public"."topic_progress" from authenticated;
revoke delete on table "public"."study_plans" from authenticated;
revoke delete on table "public"."study_sessions" from authenticated;
revoke delete on table "public"."mistakes" from authenticated;
revoke update on table "public"."bookmarks" from authenticated;
revoke update, delete on table "public"."daily_user_stats" from authenticated;
revoke delete on table "public"."user_stats" from authenticated;
revoke update, delete on table "public"."xp_events" from authenticated;
revoke update, delete on table "public"."achievements" from authenticated;
revoke insert, delete on table "public"."notifications" from authenticated;
revoke update, delete on table "public"."ai_messages" from authenticated;
revoke update, delete on table "public"."question_reports" from authenticated;
revoke update, delete on table "public"."sync_entries" from authenticated;
revoke update on table "public"."user_devices" from authenticated;
revoke delete on table "public"."test_attempts" from authenticated;
revoke delete on table "public"."test_answers" from authenticated;
revoke delete on table "public"."profiles" from authenticated;
