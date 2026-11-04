begin;
do $$
declare sid uuid; other_sid uuid; cfg tk7_line_settings; admin_id uuid; req uuid;
 ids uuid[]; rev bigint; d date:='2199-11-04'; outbox_before bigint; log_before bigint; r jsonb;
begin
 select * into cfg from tk7_line_settings where id;
 select id into admin_id from profiles where status='approved' and role in ('admin','superadmin') limit 1;
 if admin_id is null then raise exception 'No approved admin fixture'; end if;
 while exists(select 1 from tk7_signup_sessions where match_date=d and group_id=cfg.group_id and environment=cfg.environment) loop d=d+1; end loop;
 insert into tk7_signup_sessions(match_date,group_id,environment,is_open) values(d,cfg.group_id,cfg.environment,true) returning id into sid;
 insert into tk7_signup_sessions(match_date,group_id,environment,is_open) values(d,'tk7-admin-test-other-dataset','test',true) returning id into other_sid;
 select count(*) into outbox_before from tk7_signup_outbox;
 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform tk7_admin_roster_edit(sid,gen_random_uuid(),0,'add','green',null,array['Denied']);
  raise exception 'TEST: missing admin accepted';
 exception when others then if sqlerrm<>'Admin required' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 begin
  perform tk7_admin_roster_edit(other_sid,gen_random_uuid(),0,'add','green',null,array['Denied']);
  raise exception 'TEST: wrong dataset accepted';
 exception when others then if sqlerrm<>'Session unavailable' then raise; end if; end;
 req=gen_random_uuid();
 r=tk7_admin_roster_edit(sid,req,0,'add','green',null,array[' A ','B','C']);
 if (r->>'count')::int<>3 then raise exception 'TEST: add failed'; end if;
 perform tk7_admin_roster_edit(sid,req,0,'add','green',null,array[' A ','B','C']);
 if (select count(*) from tk7_signup_entries where session_id=sid)<>3 then raise exception 'TEST: replay duplicated players'; end if;
 if (select count(*) from tk7_signup_log where session_id=sid)<>1 then raise exception 'TEST: replay duplicated history'; end if;
 begin
  perform tk7_admin_roster_edit(sid,gen_random_uuid(),0,'clear','green');
  raise exception 'TEST: stale revision accepted';
 exception when others then if sqlerrm<>'Roster changed; refresh first' then raise; end if; end;
 select revision into rev from tk7_signup_sessions where id=sid;
 perform tk7_admin_roster_edit(sid,gen_random_uuid(),rev,'add','red',null,array['1','2','3','4','5','6','7']);
 select revision into rev from tk7_signup_sessions where id=sid;
 select array_agg(id order by slot) into ids from tk7_signup_entries where session_id=sid and team='green';
 begin
  perform tk7_admin_roster_edit(sid,gen_random_uuid(),rev,'move','green',ids,null,'red');
  raise exception 'TEST: move into full team accepted';
 exception when others then if sqlerrm<>'Not enough seats' then raise; end if; end;
 begin
  perform tk7_admin_roster_edit(sid,gen_random_uuid(),rev,'delete','red',ids);
  raise exception 'TEST: wrong source team accepted';
 exception when others then if sqlerrm<>'Player not found' then raise; end if; end;
 perform tk7_admin_roster_edit(sid,gen_random_uuid(),rev,'delete','green',ids[1:1]);
 if (select count(*) from tk7_signup_entries where session_id=sid and team='green')<>2 then raise exception 'TEST: selected deletion failed'; end if;
 select revision into rev from tk7_signup_sessions where id=sid;
 perform tk7_admin_roster_edit(sid,gen_random_uuid(),rev,'move','green',ids[2:3],null,'blue');
 if (select count(*) from tk7_signup_entries where session_id=sid and team='blue')<>2 then raise exception 'TEST: selected move failed'; end if;
 select revision into rev from tk7_signup_sessions where id=sid;
 perform tk7_admin_roster_edit(sid,gen_random_uuid(),rev,'clear','red');
 if exists(select 1 from tk7_signup_entries where session_id=sid and team='red') then raise exception 'TEST: clear failed'; end if;
 if (select count(*) from tk7_signup_entries where session_id=sid and team='blue')<>2 then raise exception 'TEST: clear affected other team'; end if;
 if (select count(*) from tk7_signup_log where session_id=sid)<>5 then raise exception 'TEST: audit missing'; end if;
 if (select count(*) from tk7_signup_outbox)<>outbox_before then raise exception 'TEST: bot delivery queued'; end if;
 update tk7_signup_sessions set is_open=false where id=sid;
 select revision into rev from tk7_signup_sessions where id=sid;
 begin
  perform tk7_admin_roster_edit(sid,gen_random_uuid(),rev,'add','green',null,array['Denied']);
  raise exception 'TEST: closed session accepted';
 exception when others then if sqlerrm<>'Registration closed' then raise; end if; end;
end $$;
select 'PASS: admin auth, dataset isolation, add, idempotency, stale revision, capacity, selected deletion, selected move, team clear, audit, no bot delivery, closed registration' as result;
rollback;
