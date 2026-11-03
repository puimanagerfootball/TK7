-- TK7 015: อนุญาตชื่อซ้ำ (เช่น "ตอง" 2 คนคนละสี, "เพื่อนมะเดื่อ" หลายคน)
-- รันซ้ำได้
begin;
alter table public.tk7_signup_entries drop constraint if exists tk7_signup_entries_session_id_name_key_key;
create or replace function public.tk7_signup_batch(p_session uuid,p_request uuid,p_owner text,p_team text,p_names text[])
returns jsonb language plpgsql security definer set search_path=public as $$
declare s tk7_signup_sessions; prior tk7_signup_batches; normalized text[]; available int[]; i int; payload jsonb;
begin
 if p_owner is null or length(p_owner)<1 then raise exception 'Missing identity'; end if;
 select * into s from tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found'; end if;
 select array_agg(btrim(regexp_replace(n,'\s+',' ','g')) order by ord) into normalized from unnest(p_names) with ordinality as x(n,ord);
 if coalesce(cardinality(normalized),0) not between 1 and 7 then raise exception 'Enter 1 to 7 names'; end if;
 if exists(select 1 from unnest(normalized) n where n is null or length(n) not between 1 and 40) then raise exception 'Invalid name'; end if;
 payload=jsonb_build_object('team',p_team,'names',normalized);
 select * into prior from tk7_signup_batches where id=p_request;
 if found then
  if prior.owner_id<>p_owner or prior.session_id<>p_session or prior.payload<>payload then raise exception 'Request conflict'; end if;
  return jsonb_build_object('batchId',p_request,'replayed',true);
 end if;
 if not s.is_open then raise exception 'Registration closed'; end if;
 if p_team is null or not p_team=any(s.teams) then raise exception 'Team unavailable'; end if;
 select array_agg(n order by n) into available from generate_series(1,7) n where not exists(select 1 from tk7_signup_entries e where e.session_id=p_session and e.team=p_team and e.slot=n);
 if coalesce(cardinality(available),0)<cardinality(normalized) then raise exception 'Not enough seats'; end if;
 insert into tk7_signup_batches(id,session_id,owner_id,payload) values(p_request,p_session,p_owner,payload);
 for i in 1..cardinality(normalized) loop
  insert into tk7_signup_entries(session_id,batch_id,team,slot,name,name_key) values(p_session,p_request,p_team,available[i],normalized[i],lower(normalized[i]));
 end loop;
 insert into tk7_signup_outbox(batch_id,session_id) values(p_request,p_session);
 return jsonb_build_object('batchId',p_request,'replayed',false,'count',cardinality(normalized));
end $$;
revoke all on function public.tk7_signup_batch(uuid,uuid,text,text,text[]) from public,anon,authenticated;
grant execute on function public.tk7_signup_batch(uuid,uuid,text,text,text[]) to service_role;
commit;
