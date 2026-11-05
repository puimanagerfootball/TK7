begin;
do $$
declare uid uuid:=gen_random_uuid();
begin
 insert into auth.users(id,email,raw_user_meta_data) values(uid,'security-test-'||uid::text||'@example.invalid','{"display_name":"Security fixture","role":"superadmin","status":"approved"}');
 if not exists(select 1 from public.profiles where id=uid and role='admin' and status='pending') then raise exception 'TEST: trigger trusted user role metadata'; end if;
 perform set_config('request.jwt.claim.sub',uid::text,true);
end $$;
set local role authenticated;
do $$
declare n integer;
begin
 if public.is_approved_admin() or public.is_superadmin() then raise exception 'TEST: pending user elevated'; end if;
 update public.profiles set role='superadmin',status='approved' where id=auth.uid();get diagnostics n=row_count;
 if n<>0 then raise exception 'TEST: user changed their own role'; end if;
 begin
  insert into public.match_days(match_date,settings,schedule) values('2199-01-01','{}','[]');raise exception 'TEST: pending user wrote schedule';
 exception when insufficient_privilege then null; end;
 begin perform public.tk7_security_quota('spoofed',true);raise exception 'TEST: user called quota';exception when insufficient_privilege then null;end;
 begin perform public.tk7_admin_overview();raise exception 'TEST: pending user read admin overview';exception when others then if sqlerrm<>'Admin required' then raise;end if;end;
end $$;
set local role anon;
do $$
begin
 if exists(select 1 from public.profiles) then raise exception 'TEST: anonymous profile leak'; end if;
 begin perform public.tk7_read_roster(gen_random_uuid());raise exception 'TEST: anonymous roster access';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$
declare subject text:='security-'||gen_random_uuid()::text; bucket timestamptz:=date_trunc('minute',clock_timestamp());
 cfg public.tk7_line_settings; sid uuid; request uuid:=gen_random_uuid(); failed_request uuid:=gen_random_uuid(); args jsonb; result_data jsonb; entry uuid; rev bigint; count_before integer; d date:='2199-02-01';
begin
 insert into tk7_private.api_quota values(sha256(convert_to(subject,'UTF8')),true,bucket,29);
 if not (public.tk7_security_quota(subject,true)->>'allowed')::boolean then raise exception 'TEST: quota denied before cap';end if;
 if (public.tk7_security_quota(subject,true)->>'allowed')::boolean then raise exception 'TEST: write quota bypass';end if;
 if not (public.tk7_security_quota(subject,false)->>'allowed')::boolean then raise exception 'TEST: read and write quotas coupled';end if;
 if not (public.tk7_security_quota(subject||'-other',true)->>'allowed')::boolean then raise exception 'TEST: quota identities coupled';end if;
 select * into cfg from public.tk7_line_settings where id;
 while exists(select 1 from public.tk7_signup_sessions where group_id=cfg.group_id and environment=cfg.environment and match_date=d) loop d=d+1;end loop;
 insert into public.tk7_signup_sessions(match_date,group_id,environment,is_open) values(d,cfg.group_id,cfg.environment,true) returning id into sid;
 args=jsonb_build_object('p_session',sid,'p_request',request,'p_owner','forged','p_team','green','p_names',jsonb_build_array('Security fixture'));
 result_data=public.tk7_secure_mutation('tk7_signup_batch',args,subject,'Verified LINE','register','ลงชื่อทดสอบ');
 if (result_data->>'replayed')::boolean then raise exception 'TEST: first call is replay';end if;
 if not exists(select 1 from public.tk7_signup_batches where id=request and owner_id=subject) then raise exception 'TEST: actor spoofing';end if;
 perform public.tk7_secure_mutation('tk7_signup_batch',args,subject,'Verified LINE','register','ลงชื่อทดสอบ');
 if (select count(*) from public.tk7_signup_log where session_id=sid)<>1 then raise exception 'TEST: replay duplicated audit';end if;
 select id into entry from public.tk7_signup_entries where session_id=sid;
 select revision into rev from public.tk7_signup_sessions where id=sid;
 args=jsonb_build_object('p_session',sid,'p_request',gen_random_uuid(),'p_revision',rev,'p_action','move','p_entry',entry,'p_team','red');
 perform public.tk7_secure_mutation('tk7_change_entry',args,subject,'Verified LINE','move','ย้ายสีทดสอบ');
 result_data=public.tk7_secure_mutation('tk7_change_entry',args,subject,'Verified LINE','move','ย้ายสีทดสอบ');
 if not (result_data->>'replayed')::boolean or (select count(*) from public.tk7_signup_log where session_id=sid)<>2 then raise exception 'TEST: change replay duplicated audit';end if;
 select count(*) into count_before from public.tk7_signup_entries where session_id=sid;
 begin
  perform public.tk7_secure_mutation('tk7_signup_batch',jsonb_build_object('p_session',sid,'p_request',failed_request,'p_team','blue','p_names',jsonb_build_array('Must rollback')),subject,'Verified LINE',null,'Audit must reject null action');
  raise exception 'TEST: invalid audit was accepted';
 exception when not_null_violation then null;end;
 if (select count(*) from public.tk7_signup_entries where session_id=sid)<>count_before or exists(select 1 from public.tk7_signup_batches where id=failed_request) then raise exception 'TEST: mutation committed without audit';end if;
end $$;
select 'PASS: role escalation denied, anonymous private data denied, triggers work, quota enforcement, verified actor, atomic audit, replay deduplication' as result;
rollback;
