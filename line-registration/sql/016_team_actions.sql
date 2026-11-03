-- TK7 016: ในหน้าลงชื่อ (LINE) — เปลี่ยนสีทั้งทีม, ย้าย/ยกเลิกหลายคนพร้อมกัน
-- และผู้ดูแลปิดสีที่ไม่ใช้ได้ · รันซ้ำได้
begin;

create or replace function public.tk7_team_action(
 p_session uuid,p_request uuid,p_actor text,p_revision bigint,
 p_action text,p_entries uuid[] default null,p_team text default null,p_from text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s tk7_signup_sessions; previous tk7_signup_changes; data jsonb; result_data jsonb;
 colors text[]:=array['green','red','white','blue','black','yellow','pink','orange','navy','purple'];
 n int; moving uuid[]; free_slots int[]; i int;
begin
 if p_actor is null or p_actor='' then raise exception 'Missing identity'; end if;
 data=jsonb_build_object('action',p_action,'entries',to_jsonb(p_entries),'team',p_team,'from',p_from,'revision',p_revision);
 select * into s from tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found'; end if;
 select * into previous from tk7_signup_changes where request_id=p_request;
 if found then
  if previous.session_id<>p_session or previous.actor_id<>p_actor or previous.payload<>data then raise exception 'Request conflict'; end if;
  return previous.result;
 end if;
 if not s.is_open then raise exception 'Session closed'; end if;
 if p_revision is null or s.revision<>p_revision then raise exception 'Roster changed; refresh first'; end if;

 if p_action='recolor' then
  if p_from is null or p_team is null or p_from=p_team or not p_from=any(colors) or not p_team=any(colors) or not p_team=any(s.teams) then raise exception 'Invalid destination'; end if;
  set constraints tk7_signup_seat_unique deferred;
  update tk7_signup_entries set team=case when team=p_from then p_team else p_from end where session_id=p_session and team in (p_from,p_team);
  set constraints tk7_signup_seat_unique immediate;
  -- สีที่เปิดไว้ล่วงหน้าตามไปด้วย
  update tk7_signup_sessions set preset_teams=array(select case when t=p_from then p_team when t=p_team then p_from else t end from unnest(preset_teams) t) where id=p_session;
 elsif p_action in ('bulk_cancel','bulk_move') then
  if coalesce(cardinality(p_entries),0) not between 1 and 70 then raise exception 'Select players'; end if;
  select count(*) into n from tk7_signup_entries where session_id=p_session and id=any(p_entries);
  if n<>(select count(distinct x) from unnest(p_entries) x) then raise exception 'Player not found'; end if;
  if p_action='bulk_cancel' then
   delete from tk7_signup_entries where session_id=p_session and id=any(p_entries);
  else
   if p_team is null or not p_team=any(s.teams) then raise exception 'Invalid destination'; end if;
   select array_agg(id order by team,slot) into moving from tk7_signup_entries where session_id=p_session and id=any(p_entries) and team<>p_team;
   if moving is not null then
    select array_agg(x order by x) into free_slots from generate_series(1,7) x where not exists(select 1 from tk7_signup_entries where session_id=p_session and team=p_team and slot=x);
    if coalesce(cardinality(free_slots),0)<cardinality(moving) then raise exception 'Not enough seats'; end if;
    for i in 1..cardinality(moving) loop
     update tk7_signup_entries set team=p_team,slot=free_slots[i] where id=moving[i];
    end loop;
   end if;
  end if;
 else raise exception 'Invalid action';
 end if;

 update tk7_signup_sessions set revision=revision+1 where id=p_session;
 result_data=jsonb_build_object('ok',true,'revision',s.revision+1);
 insert into tk7_signup_changes values(p_request,p_session,p_actor,data,result_data,now());
 insert into tk7_signup_outbox(session_id,change_id) values(p_session,p_request);
 return result_data;
end $$;
revoke all on function public.tk7_team_action(uuid,uuid,text,bigint,text,uuid[],text,text) from public,anon,authenticated;
grant execute on function public.tk7_team_action(uuid,uuid,text,bigint,text,uuid[],text,text) to service_role;

-- ผู้ดูแล: เลือกสีที่เปิดให้ลง (ปิดสีที่ไม่ใช้) — สีที่มีคนลงอยู่ปิดไม่ได้
create or replace function public.tk7_admin_set_teams(p_session uuid,p_teams text[]) returns void
language plpgsql security definer set search_path=public as $$
declare colors text[]:=array['green','red','white','blue','black','yellow','pink','orange','navy','purple']; keep text[];
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 if exists(select 1 from unnest(coalesce(p_teams,'{}')) t where not t=any(colors)) then raise exception 'Invalid colour'; end if;
 select array(select c from unnest(colors) with ordinality u(c,o) where c=any(p_teams) or exists(select 1 from tk7_signup_entries e where e.session_id=p_session and e.team=c) order by o) into keep;
 update tk7_signup_sessions set teams=keep,preset_teams=array(select t from unnest(preset_teams) t where t=any(keep)),revision=revision+1 where id=p_session;
 if not found then raise exception 'Session not found'; end if;
end $$;
revoke all on function public.tk7_admin_set_teams(uuid,text[]) from public,anon;
grant execute on function public.tk7_admin_set_teams(uuid,text[]) to authenticated;

-- อัปเดตเวลา/เปิดวันซ้ำ: ไม่รีเซ็ตสีที่ผู้ดูแลปิดไว้
create or replace function public.tk7_admin_open_session(p_date date,p_time_per_match int,p_start_time time,p_open boolean default true) returns uuid
language plpgsql security definer set search_path=public as $$
declare cfg tk7_line_settings; sid uuid;
 all_colors text[]:=array['green','red','white','blue','black','yellow','pink','orange','navy','purple'];
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 select * into cfg from tk7_line_settings where id;
 if cfg.group_id is null then raise exception 'Choose a LINE group first'; end if;
 if p_date is null or p_time_per_match is null or p_time_per_match not between 1 and 60 or p_start_time is null then raise exception 'Invalid session'; end if;
 perform pg_advisory_xact_lock(hashtextextended(cfg.group_id||p_date::text||cfg.environment,0));
 update tk7_signup_sessions set time_per_match=p_time_per_match,start_time=p_start_time,is_open=coalesce(p_open,true),revision=revision+1
  where group_id=cfg.group_id and match_date=p_date and environment=cfg.environment returning id into sid;
 if sid is null then
  insert into tk7_signup_sessions(match_date,group_id,environment,is_open,teams,time_per_match,start_time)
  values(p_date,cfg.group_id,cfg.environment,coalesce(p_open,true),all_colors,p_time_per_match,p_start_time) returning id into sid;
 end if;
 return sid;
end $$;
commit;
