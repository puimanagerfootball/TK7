-- Owner-approved retention: registration personal data, 30 days after match date.
-- Fixtures/scores in match_days and administrator profiles are not deleted.
create or replace function public.tk7_purge_expired_registrations()
returns integer language plpgsql security definer set search_path=pg_catalog
as $$
declare ids uuid[]; removed integer;
begin
 select array_agg(id) into ids from (
  select id from public.tk7_signup_sessions
  where match_date <= (current_timestamp at time zone 'Asia/Bangkok')::date - 30
  order by match_date,id limit 500 for update skip locked
 ) expired;
 if ids is null then return 0; end if;
 delete from public.tk7_signup_outbox where session_id=any(ids);
 delete from public.tk7_signup_entries where session_id=any(ids);
 delete from public.tk7_signup_changes where session_id=any(ids);
 delete from public.tk7_signup_batches where session_id=any(ids);
 delete from public.tk7_signup_log where session_id=any(ids);
 delete from public.tk7_signup_sessions where id=any(ids);
 get diagnostics removed=row_count;
 return removed;
end $$;
revoke all on function public.tk7_purge_expired_registrations() from public,anon,authenticated;
grant execute on function public.tk7_purge_expired_registrations() to service_role;

-- Retired bot: skip queue inserts instead of keeping fresh roster snapshots.
create or replace function public.tk7_snapshot_summary()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin return null; end $$;
revoke all on function public.tk7_snapshot_summary() from public,anon,authenticated;

-- UTC 17:15 = 00:15 Asia/Bangkok. Existing named job is updated, not duplicated.
select cron.schedule('tk7-registration-retention-30-days','15 17 * * *',
 'select public.tk7_purge_expired_registrations();');
