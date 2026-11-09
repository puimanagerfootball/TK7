begin;
do $$
declare
 sid uuid;
 request_id uuid:=gen_random_uuid();
 test_group text:='kickoff-test-'||gen_random_uuid()::text;
 bangkok_now timestamp:=clock_timestamp() at time zone 'Asia/Bangkok';
 kickoff timestamp;
begin
 insert into public.tk7_signup_sessions(match_date,start_time,group_id,environment,is_open)
 values(bangkok_now::date+1,'20:15',test_group,'test',true) returning id into sid;
 perform public.tk7_secure_mutation(
  'tk7_signup_batch',jsonb_build_object('p_session',sid,'p_request',request_id,'p_team','green','p_names',jsonb_build_array('Before kickoff')),
  'kickoff-test','Fixture','register','Before kickoff'
 );

 -- Cross kickoff while the row is still open, before the minute job can run.
 kickoff:=date_trunc('second',clock_timestamp() at time zone 'Asia/Bangkok')+interval '3 seconds';
 update public.tk7_signup_sessions
 set match_date=kickoff::date,start_time=kickoff::time
 where id=sid;
 perform pg_sleep_until(kickoff at time zone 'Asia/Bangkok');
 begin
  insert into public.tk7_signup_entries(session_id,batch_id,team,slot,name,name_key)
  values(sid,request_id,'green',2,'After kickoff','after kickoff');
  raise exception 'TEST: signup after kickoff was accepted';
 exception when raise_exception then
  if sqlerrm<>'Registration closed' then raise; end if;
 end;
 update public.tk7_signup_sessions set is_open=false where id=sid;
 begin
  update public.tk7_signup_sessions set is_open=true where id=sid;
  raise exception 'TEST: past kickoff can be reopened';
 exception when raise_exception then
  if sqlerrm<>'Registration closed' then raise; end if;
 end;
 if (select count(*) from public.tk7_signup_entries where session_id=sid)<>1 then
  raise exception 'TEST: pre-kickoff roster was changed';
 end if;
 if not exists(select 1 from cron.job where jobname='tk7-close-at-kickoff' and active) then
  raise exception 'TEST: auto-close job is inactive';
 end if;
end $$;
rollback;
