-- Run only as a rollback test. Uses synthetic names and an unused future date.
begin;
do $$
declare
 cfg public.tk7_line_settings;
 admin_id uuid;
 sid uuid;
 foreign_sid uuid;
 d date:='2199-11-09';
 revision_before bigint;
 request_id uuid:=gen_random_uuid();
 keep_id uuid;
 other_team_id uuid;
 result jsonb;
 blocks jsonb:='[{"team":"green","slots":["Keep","Duplicate","Duplicate",null,null,null,null]}]';
begin
 select * into strict cfg from public.tk7_line_settings where id;
 select id into admin_id from public.profiles where status='approved' and role in ('admin','superadmin') limit 1;
 if admin_id is null then raise exception 'No approved admin fixture'; end if;
 while exists(select 1 from public.tk7_signup_sessions where match_date=d) loop d=d+1; end loop;
 insert into public.tk7_signup_sessions(match_date,group_id,environment,is_open)
 values(d,cfg.group_id,cfg.environment,true) returning id into sid;
 insert into public.tk7_signup_sessions(match_date,group_id,environment,is_open)
 values(d,'tk7-import-test-other-dataset','test',true) returning id into foreign_sid;

 if has_function_privilege('anon','public.tk7_admin_import_roster(uuid,uuid,bigint,date,jsonb)','EXECUTE')
 or not has_function_privilege('authenticated','public.tk7_admin_import_roster(uuid,uuid,bigint,date,jsonb)','EXECUTE') then
  raise exception 'TEST: incorrect grants';
 end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform public.tk7_admin_import_roster(sid,request_id,0,d,blocks);
  raise exception 'TEST: missing admin accepted';
 exception when others then if sqlerrm<>'Admin required' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 begin
  perform public.tk7_admin_import_roster(foreign_sid,request_id,0,d,blocks);
  raise exception 'TEST: wrong dataset accepted';
 exception when others then if sqlerrm<>'Session unavailable' then raise; end if; end;

 perform public.tk7_admin_roster_edit(sid,gen_random_uuid(),0,'add','green',null,array['Keep','Change','Duplicate','Delete']);
 select revision into revision_before from public.tk7_signup_sessions where id=sid;
 perform public.tk7_admin_roster_edit(sid,gen_random_uuid(),revision_before,'add','red',null,array['Other']);
 select revision into revision_before from public.tk7_signup_sessions where id=sid;
 select id into strict keep_id from public.tk7_signup_entries where session_id=sid and team='green' and slot=1;
 select id into strict other_team_id from public.tk7_signup_entries where session_id=sid and team='red' and slot=1;

 begin
  perform public.tk7_admin_import_roster(sid,request_id,revision_before,d+1,blocks);
  raise exception 'TEST: wrong date accepted';
 exception when others then if sqlerrm<>'Invalid import date' then raise; end if; end;
 begin
  perform public.tk7_admin_import_roster(sid,request_id,revision_before,d,blocks||'[{"team":"red","slots":[]}]'::jsonb);
  raise exception 'TEST: truncated block accepted';
 exception when others then if sqlerrm<>'Import requires seven slots' then raise; end if; end;
 if not exists(select 1 from public.tk7_signup_entries where session_id=sid and team='green' and slot=4 and name='Delete') then
  raise exception 'TEST: invalid import changed a valid block';
 end if;

 result=public.tk7_admin_import_roster(sid,request_id,revision_before,d,blocks);
 if (result->>'added')::int<>0 or (result->>'changed')::int<>1 or (result->>'deleted')::int<>1
 or (result->>'revision')::bigint<=revision_before then raise exception 'TEST: wrong import result'; end if;
 if not exists(select 1 from public.tk7_signup_entries where id=keep_id)
 or not exists(select 1 from public.tk7_signup_entries where id=other_team_id)
 or (select count(*) from public.tk7_signup_entries where session_id=sid and team='green' and name='Duplicate')<>2
 or exists(select 1 from public.tk7_signup_entries where session_id=sid and team='green' and slot=4) then
  raise exception 'TEST: wrong roster after import';
 end if;
 if public.tk7_admin_import_roster(sid,request_id,revision_before,d,blocks) is distinct from result
 or (select count(*) from public.tk7_signup_log where session_id=sid and action='import')<>1 then
  raise exception 'TEST: replay was not idempotent';
 end if;
 begin
  perform public.tk7_admin_import_roster(sid,gen_random_uuid(),revision_before,d,blocks);
  raise exception 'TEST: stale revision accepted';
 exception when others then if sqlerrm<>'Roster changed; refresh first' then raise; end if; end;
 update public.tk7_signup_sessions set is_open=false where id=sid;
 begin
  perform public.tk7_admin_import_roster(sid,gen_random_uuid(),(result->>'revision')::bigint,d,blocks);
  raise exception 'TEST: closed session accepted';
 exception when others then if sqlerrm<>'Registration closed' then raise; end if; end;
end $$;
rollback;
select 'roster import smoke passed; fixtures rolled back' as result;
