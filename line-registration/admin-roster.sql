-- Admin-only roster editing; same data and audit history as LIFF, no bot delivery.
create or replace function public.tk7_admin_roster_edit(
 p_session uuid,p_request uuid,p_revision bigint,p_action text,p_team text,
 p_entries uuid[] default null,p_names text[] default null,p_target text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare s tk7_signup_sessions; prior tk7_signup_changes; payload jsonb; result_data jsonb;
 actor text; normalized text[]; chosen uuid[]; slots int[]; i int; n int; detail text;
 labels jsonb:='{"green":"เขียว","red":"แดง","white":"ขาว","blue":"ฟ้า","black":"ดำ","yellow":"เหลือง","pink":"ชมพู","orange":"ส้ม","navy":"น้ำเงิน","purple":"ม่วง"}';
begin
 if auth.uid() is null or not public.is_approved_admin() then raise exception 'Admin required'; end if;
 actor=auth.uid()::text;
 select * into s from tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found'; end if;
 if not exists(select 1 from tk7_line_settings c where c.id and c.group_id=s.group_id and c.environment=s.environment) then raise exception 'Session unavailable'; end if;
 if p_request is null then raise exception 'Invalid request'; end if;
 payload=jsonb_build_object('action',p_action,'team',p_team,'entries',p_entries,'names',p_names,'target',p_target,'revision',p_revision);
 select * into prior from tk7_signup_changes where request_id=p_request;
 if found then
  if prior.session_id<>p_session or prior.actor_id<>actor or prior.payload<>payload then raise exception 'Request conflict'; end if;
  return prior.result;
 end if;
 if not s.is_open then raise exception 'Registration closed'; end if;
 if p_revision is null or p_revision<>s.revision then raise exception 'Roster changed; refresh first'; end if;
 if p_team is null or not p_team=any(s.teams) then raise exception 'Team unavailable'; end if;
 if p_action='add' then
  select array_agg(btrim(regexp_replace(x,'\s+',' ','g')) order by ord) into normalized from unnest(p_names) with ordinality u(x,ord);
  if coalesce(cardinality(normalized),0) not between 1 and 7 or exists(select 1 from unnest(normalized) x where x is null or length(x) not between 1 and 40) then raise exception 'Invalid names'; end if;
  select array_agg(x order by x) into slots from generate_series(1,7) x where not exists(select 1 from tk7_signup_entries e where e.session_id=s.id and e.team=p_team and e.slot=x);
  n=cardinality(normalized);
  if coalesce(cardinality(slots),0)<n then raise exception 'Not enough seats'; end if;
  insert into tk7_signup_batches(id,session_id,owner_id,payload) values(p_request,s.id,actor,payload);
  for i in 1..n loop
   insert into tk7_signup_entries(session_id,batch_id,team,slot,name,name_key) values(s.id,p_request,p_team,slots[i],normalized[i],lower(normalized[i]));
  end loop;
  detail='ลงสี'||(labels->>p_team)||': '||array_to_string(normalized,', ');
 elsif p_action in ('delete','clear','move') then
  if p_action='clear' then
   select array_agg(id order by slot) into chosen from tk7_signup_entries where session_id=s.id and team=p_team;
  else
   if coalesce(cardinality(p_entries),0) not between 1 and 7 or array_position(p_entries,null) is not null then raise exception 'Select players'; end if;
   select array_agg(id order by slot) into chosen from tk7_signup_entries where session_id=s.id and team=p_team and id=any(p_entries);
   if coalesce(cardinality(chosen),0)<>(select count(distinct x) from unnest(p_entries) x) then raise exception 'Player not found'; end if;
  end if;
  n=coalesce(cardinality(chosen),0);
  if n=0 then raise exception 'Select players'; end if;
  select string_agg(name,', ' order by slot) into detail from tk7_signup_entries where id=any(chosen);
  if p_action='move' then
   if p_target is null or p_target=p_team or not p_target=any(s.teams) then raise exception 'Invalid destination'; end if;
   select array_agg(x order by x) into slots from generate_series(1,7) x where not exists(select 1 from tk7_signup_entries e where e.session_id=s.id and e.team=p_target and e.slot=x);
   if coalesce(cardinality(slots),0)<n then raise exception 'Not enough seats'; end if;
   for i in 1..n loop update tk7_signup_entries set team=p_target,slot=slots[i] where id=chosen[i]; end loop;
   detail='ย้ายไปสี'||(labels->>p_target)||': '||detail;
  else
   delete from tk7_signup_entries where session_id=s.id and id=any(chosen);
   detail='ยกเลิกสี'||(labels->>p_team)||': '||detail;
  end if;
 else raise exception 'Invalid action';
 end if;
 update tk7_signup_sessions set revision=revision+1 where id=s.id;
 perform public.tk7_admin_log(s.id,case when p_action='add' then 'register' when p_action='move' then 'bulk_move' else 'bulk_cancel' end,detail);
 result_data=jsonb_build_object('ok',true,'count',n,'revision',s.revision+1);
 insert into tk7_signup_changes(request_id,session_id,actor_id,payload,result) values(p_request,s.id,actor,payload,result_data);
 return result_data;
end $$;
revoke all on function public.tk7_admin_roster_edit(uuid,uuid,bigint,text,text,uuid[],text[],text) from public,anon;
grant execute on function public.tk7_admin_roster_edit(uuid,uuid,bigint,text,text,uuid[],text[],text) to authenticated;
