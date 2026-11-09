begin;

create or replace function public.tk7_close_past_sessions() returns int
language plpgsql security definer set search_path=pg_catalog,public as $$
declare closed_count int;
begin
 update public.tk7_signup_sessions
 set is_open=false, revision=revision+1
 where is_open
   and match_date + coalesce(start_time, time '20:00') <= (statement_timestamp() at time zone 'Asia/Bangkok');
 get diagnostics closed_count=row_count;
 return closed_count;
end $$;
revoke all on function public.tk7_close_past_sessions() from public,anon,authenticated;

create or replace function public.tk7_require_future_kickoff() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
begin
 if new.is_open and new.match_date + coalesce(new.start_time, time '20:00')
      <= (clock_timestamp() at time zone 'Asia/Bangkok') then
  raise exception 'Registration closed';
 end if;
 return new;
end $$;
revoke all on function public.tk7_require_future_kickoff() from public,anon,authenticated;
drop trigger if exists tk7_require_future_kickoff on public.tk7_signup_sessions;
create trigger tk7_require_future_kickoff
 before insert or update of is_open,match_date,start_time on public.tk7_signup_sessions
 for each row execute function public.tk7_require_future_kickoff();

create or replace function public.tk7_require_open_signup() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
declare session_row public.tk7_signup_sessions;
begin
 select * into session_row from public.tk7_signup_sessions where id=new.session_id for share;
 if not found or not session_row.is_open
    or session_row.match_date + coalesce(session_row.start_time, time '20:00')
        <= (clock_timestamp() at time zone 'Asia/Bangkok') then
  raise exception 'Registration closed';
 end if;
 return new;
end $$;
revoke all on function public.tk7_require_open_signup() from public,anon,authenticated;
drop trigger if exists tk7_require_open_signup on public.tk7_signup_entries;
create trigger tk7_require_open_signup before insert on public.tk7_signup_entries
 for each row execute function public.tk7_require_open_signup();

-- Separate from the retired Bot job. Run once now, then once per minute.
select public.tk7_close_past_sessions();
select cron.schedule('tk7-close-at-kickoff','* * * * *','select public.tk7_close_past_sessions();');
commit;
