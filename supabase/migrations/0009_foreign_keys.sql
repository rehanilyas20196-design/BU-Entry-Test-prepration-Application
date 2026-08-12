-- 0009_foreign_keys.sql
-- BUET Prep AI — resolve foreign keys referencing auth.users and admin tables

-- Reviewer
alter table "public"."questions"
  drop constraint if exists questions_reviewer_fk;
alter table "public"."questions"
  add constraint questions_reviewer_fk
  foreign key (reviewer_id) references "public"."admin_users"(id) on delete set null;

alter table "public"."question_reviews"
  drop constraint if exists question_reviews_reviewer_fk;
alter table "public"."question_reviews"
  add constraint question_reviews_reviewer_fk
  foreign key (reviewer_id) references "public"."admin_users"(id) on delete set null;

-- All user-owned tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'test_attempts', 'user_progress', 'topic_progress',
    'study_plans', 'study_sessions', 'mistakes', 'bookmarks',
    'daily_user_stats', 'achievements', 'user_stats', 'xp_events',
    'leaderboard_entries', 'notifications', 'ai_conversations',
    'ai_usage', 'question_reports', 'user_devices', 'sync_entries',
    'admin_users'
  ]
  loop
    execute format(
      'alter table "public".%I drop constraint if exists %I_fk;',
      t, 'user_' || t
    );
    execute format(
      'alter table "public".%I add constraint %I_fk foreign key (user_id) references auth.users(id) on delete cascade;',
      t, 'user_' || t
    );
  end loop;
end $$;
