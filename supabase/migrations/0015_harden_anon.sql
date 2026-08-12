-- 0015_harden_anon.sql
-- BUET Prep AI — revoke ALL privileges for the anonymous role.
--
-- The anon role has no identity (auth.uid() is NULL), so every RLS policy
-- already denies it on user-owned tables. This migration removes the Supabase
-- default table grants from anon entirely, as defense-in-depth so a future
-- permissive policy or grant cannot accidentally expose user data.

do $$
declare
  r record;
begin
  for r in
    select c.relname as t
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname not like '\_%'
    order by c.relname
  loop
    execute format('revoke all on table "public".%I from anon;', r.t);
  end loop;
end $$;

-- The only data anonymous visitors may read is the public catalog and
-- non-sensitive app settings (approved-practice browse is authenticated).
grant select on table "public"."subjects" to anon;
grant select on table "public"."topics" to anon;
grant select on table "public"."programs" to anon;
grant select on table "public"."universities" to anon;
grant select on table "public"."app_settings" to anon;
grant select on table "public"."question_sources" to anon;
