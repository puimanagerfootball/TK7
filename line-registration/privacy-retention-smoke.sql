begin;
do $$
declare old_id uuid; fresh_id uuid; grp text:='retention-test-'||gen_random_uuid()::text;
 day_zero date:=(current_timestamp at time zone 'Asia/Bangkok')::date;
 fixture_request uuid:=gen_random_uuid(); old_count bigint; after_count bigint;
begin
 select count(*) into old_count from public.match_days;
 insert into public.tk7_signup_sessions(match_date,group_id,environment,is_open)
 values(day_zero+1,grp,'test',true) returning id into old_id;
 insert into public.tk7_signup_sessions(match_date,group_id,environment,is_open)
 values(day_zero-29,grp,'test',false) returning id into fresh_id;
 perform public.tk7_secure_mutation('tk7_signup_batch',jsonb_build_object('p_session',old_id,'p_request',fixture_request,'p_team','green','p_names',jsonb_build_array('Retention fixture')),'retention-test','Fixture','register','Retention fixture');
 update public.tk7_signup_sessions set match_date=day_zero-30,is_open=false where id=old_id;
 if exists(select 1 from public.tk7_signup_outbox where session_id=old_id) then raise exception 'TEST: retired bot still stores a snapshot';end if;
 if not exists(select 1 from public.tk7_signup_log where session_id=old_id) then raise exception 'TEST: history missing before retention';end if;
 perform public.tk7_purge_expired_registrations();
 if exists(select 1 from public.tk7_signup_sessions where id=old_id)
 or exists(select 1 from public.tk7_signup_entries where session_id=old_id)
 or exists(select 1 from public.tk7_signup_batches where session_id=old_id)
 or exists(select 1 from public.tk7_signup_log where session_id=old_id)
 then raise exception 'TEST: expired personal data remains';end if;
 if not exists(select 1 from public.tk7_signup_sessions where id=fresh_id) then raise exception 'TEST: retained data deleted early';end if;
 select count(*) into after_count from public.match_days;
 if old_count<>after_count then raise exception 'TEST: fixtures changed';end if;
end $$;
set local role authenticated;
do $$ begin
 begin perform public.tk7_purge_expired_registrations();raise exception 'TEST: browser can run retention';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: exact 30-day boundary, dependent personal data removed, fresh data and fixtures preserved, no new bot snapshots, browser execution denied' result;
rollback;
