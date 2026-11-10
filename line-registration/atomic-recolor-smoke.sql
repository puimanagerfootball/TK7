begin;
do $$
declare
 cfg public.tk7_line_settings;
 admin_id uuid;
 sid uuid;
 d date:=date '2199-12-01';
 v timestamptz;
 rev bigint;
 original jsonb:='[{"home":"green","away":"blue","homeScore":3,"awayScore":2}]';
 changed jsonb:='[{"home":"red","away":"blue","homeScore":3,"awayScore":2}]';
begin
 select * into cfg from public.tk7_line_settings where id;
 select id into admin_id from public.profiles where status='approved' and role in ('admin','superadmin') limit 1;
 if admin_id is null then raise exception 'Missing approved admin fixture'; end if;
 while exists(select 1 from public.match_days where match_date=d)
    or exists(select 1 from public.tk7_signup_sessions where match_date=d) loop d=d+1; end loop;
 insert into public.tk7_signup_sessions(match_date,group_id,environment,is_open)
 values(d,cfg.group_id,cfg.environment,true) returning id into sid;
 insert into public.match_days(match_date,settings,schedule) values(d,'{}',original) returning updated_at into v;
 perform public.tk7_secure_mutation('tk7_signup_batch',
  jsonb_build_object('p_session',sid,'p_request',gen_random_uuid(),'p_team','green','p_names',jsonb_build_array('Fixture')),
  'recolor-test','Fixture','register','Fixture');
 select revision into rev from public.tk7_signup_sessions where id=sid;
 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform public.tk7_admin_recolor_fixture(sid,'green','red',rev,v,changed,'{}');
  raise exception 'TEST: unauthenticated recolor succeeded';
 exception when raise_exception then if sqlerrm<>'Admin required' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 begin
  perform public.tk7_admin_recolor_fixture(sid,'green','red',rev,v-interval '1 second',changed,'{}');
  raise exception 'TEST: stale fixture was overwritten';
 exception when raise_exception then if sqlerrm<>'Fixture changed; refresh first' then raise; end if; end;
 if not exists(select 1 from public.tk7_signup_entries where session_id=sid and team='green') then
  raise exception 'TEST: stale fixture still changed roster';
 end if;
 if not public.tk7_admin_recolor_fixture(sid,'green','red',rev,v,changed,'{}') then
  raise exception 'TEST: fixture update was skipped';
 end if;
 if not exists(select 1 from public.tk7_signup_entries where session_id=sid and team='red')
    or not exists(select 1 from public.match_days where match_date=d and schedule=changed)
    or not exists(select 1 from public.tk7_signup_log where session_id=sid and action='recolor') then
  raise exception 'TEST: atomic recolor did not save both parts and audit';
 end if;
end $$;
rollback;
