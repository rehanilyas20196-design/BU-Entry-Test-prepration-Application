-- 0025_leaderboard_opt_in.sql
-- BUET Prep AI — opt-in toggle for the public weekly leaderboard.
-- The leaderboard itself is computed server-side from xp_events (service role),
-- so no client grants on leaderboard_entries are required.

alter table "public"."user_stats"
  add column if not exists "leaderboard_opt_in" boolean not null default false;

create index if not exists idx_user_stats_opt_in on "public"."user_stats"(leaderboard_opt_in);