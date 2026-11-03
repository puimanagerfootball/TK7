-- TK7 013: เปลี่ยนสีทั้งทีม (สลับกันถ้าสีปลายทางมีคน) + ล้างรายชื่อของวัน
-- รันซ้ำได้
begin;

create or replace function public.tk7_admin_recolor(p_session uuid,p_from text,p_to text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare colors text[]:=array['green','red','white','blue','black','yellow','pink','orange','navy','purple']; n_from int; n_to int;
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 if p_from is null or p_to is null or p_from=p_to or not p_from=any(colors) or not p_to=any(colors) then raise exception 'Invalid colour'; end if;
 perform 1 from tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found'; end if;
 select count(*) filter (where team=p_from),count(*) filter (where team=p_to) into n_from,n_to from tk7_signup_entries where session_id=p_session;
 set constraints tk7_signup_seat_unique deferred;
 update tk7_signup_entries set team=case when team=p_from then p_to else p_from end
  where session_id=p_session and team in (p_from,p_to);
 set constraints tk7_signup_seat_unique immediate;
 update tk7_signup_sessions set revision=revision+1 where id=p_session;
 return jsonb_build_object('moved',n_from,'swapped',n_to);
end $$;

create or replace function public.tk7_admin_clear_session(p_session uuid) returns int
language plpgsql security definer set search_path=public as $$
declare n int;
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 perform 1 from tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found'; end if;
 delete from tk7_signup_entries where session_id=p_session;
 get diagnostics n=row_count;
 update tk7_signup_sessions set revision=revision+1 where id=p_session;
 return n;
end $$;

revoke all on function public.tk7_admin_recolor(uuid,text,text),public.tk7_admin_clear_session(uuid) from public,anon;
grant execute on function public.tk7_admin_recolor(uuid,text,text),public.tk7_admin_clear_session(uuid) to authenticated;
commit;

-- TK7 014: เปิดสีไว้ล่วงหน้า (แสดงในสรุป/หน้าลงชื่อแม้ยังไม่มีคน)
-- รันซ้ำได้
begin;
alter table public.tk7_signup_sessions add column if not exists preset_teams text[] not null default '{}';

create or replace function public.tk7_admin_set_preset(p_session uuid,p_teams text[]) returns void
language plpgsql security definer set search_path=public as $$
declare colors text[]:=array['green','red','white','blue','black','yellow','pink','orange','navy','purple'];
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 if exists(select 1 from unnest(coalesce(p_teams,'{}')) t where not t=any(colors)) then raise exception 'Invalid colour'; end if;
 update tk7_signup_sessions set preset_teams=(select coalesce(array_agg(distinct t),'{}') from unnest(coalesce(p_teams,'{}')) t),revision=revision+1 where id=p_session;
 if not found then raise exception 'Session not found'; end if;
end $$;

create or replace function public.tk7_read_roster(p_session uuid) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('revision',s.revision,'teams',s.teams,'presetTeams',s.preset_teams,'isOpen',s.is_open,
 'matchDate',s.match_date,'startTime',to_char(s.start_time,'HH24:MI'),'timePerMatch',s.time_per_match,
 'entries',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'team',e.team,'slot',e.slot,'name',e.name) order by e.team,e.slot)
 from tk7_signup_entries e where e.session_id=s.id),'[]'::jsonb))
 from tk7_signup_sessions s where s.id=p_session
$$;

revoke all on function public.tk7_admin_set_preset(uuid,text[]) from public,anon;
grant execute on function public.tk7_admin_set_preset(uuid,text[]) to authenticated;
revoke all on function public.tk7_read_roster(uuid) from public,anon,authenticated;
grant execute on function public.tk7_read_roster(uuid) to service_role;
commit;

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

-- TK7 017: ลบวันลงทะเบียน, ปิดรับอัตโนมัติเมื่อเลยวัน, แก้สิทธิ์เรียกฟังก์ชันผู้ดูแล
-- รันซ้ำได้
begin;

-- ลบวันลงทะเบียน (รายชื่อ/ประวัติของวันนั้นหายทั้งหมด)
create or replace function public.tk7_admin_delete_session(p_session uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 perform 1 from tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found'; end if;
 delete from tk7_signup_outbox where session_id=p_session;
 delete from tk7_signup_changes where session_id=p_session;
 delete from tk7_signup_entries where session_id=p_session;
 delete from tk7_signup_batches where session_id=p_session;
 delete from tk7_signup_sessions where id=p_session;
end $$;

-- ปิดรับอัตโนมัติเมื่อเลยวันแข่ง (เวลาไทย) — ทำงานทุกนาทีผ่าน cron เดิม
create or replace function public.tk7_close_past_sessions() returns int
language plpgsql security definer set search_path=public as $$
declare n int;
begin
 update tk7_signup_sessions set is_open=false,revision=revision+1
  where is_open and match_date<(now() at time zone 'Asia/Bangkok')::date;
 get diagnostics n=row_count;
 return n;
end $$;
select public.tk7_close_past_sessions();

create or replace function public.tk7_dispatch_pending() returns void language plpgsql security definer set search_path=public as $$
declare job public.tk7_signup_outbox;
begin
 perform public.tk7_close_past_sessions();
 for job in select * from public.tk7_claim_summary() loop
  perform net.http_post(url:='https://rwsyiiulfbolymxppvmy.supabase.co/functions/v1/tk7-signup/worker',
   headers:='{"Content-Type":"application/json"}'::jsonb,
   body:=jsonb_build_object('jobId',job.id,'lease',job.lease_token),timeout_milliseconds:=25000);
 end loop;
end $$;
revoke all on function public.tk7_dispatch_pending(),public.tk7_close_past_sessions() from public,anon,authenticated;

-- สิทธิ์: ผู้ใช้ที่ล็อกอิน (ตรวจแอดมินในฟังก์ชันอีกชั้น) เรียกฟังก์ชันผู้ดูแลได้
revoke all on function public.tk7_admin_delete_session(uuid) from public,anon;
grant execute on function
 public.tk7_admin_overview(),
 public.tk7_admin_open_session(date,int,time,boolean),
 public.tk7_admin_set_open(uuid,boolean),
 public.tk7_admin_set_group(text,text,boolean),
 public.tk7_admin_set_push(boolean),
 public.tk7_admin_push_summary(uuid),
 public.tk7_admin_recolor(uuid,text,text),
 public.tk7_admin_clear_session(uuid),
 public.tk7_admin_set_preset(uuid,text[]),
 public.tk7_admin_set_teams(uuid,text[]),
 public.tk7_admin_delete_session(uuid)
to authenticated;
grant execute on function public.is_approved_admin() to authenticated;
commit;

-- TK7 018: ประวัติการแก้ไข (ใครลง/ย้าย/ยกเลิก/เปลี่ยนสี เมื่อไหร่) · รันซ้ำได้
begin;
create table if not exists public.tk7_signup_log (
 id bigserial primary key,
 session_id uuid not null references public.tk7_signup_sessions(id) on delete cascade,
 actor_id text,
 actor_name text not null default '',
 source text not null default 'line' check (source in ('line','web')),
 action text not null,
 detail text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists tk7_signup_log_session_idx on public.tk7_signup_log(session_id,created_at desc);
alter table public.tk7_signup_log enable row level security;
revoke all on public.tk7_signup_log from public,anon,authenticated;
grant all on public.tk7_signup_log to service_role;
grant usage,select on sequence public.tk7_signup_log_id_seq to service_role;

-- แอดมินบนเว็บบันทึกประวัติ (ชื่อจากโปรไฟล์ผู้ดูแล)
create or replace function public.tk7_admin_log(p_session uuid,p_action text,p_detail text) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 insert into tk7_signup_log(session_id,actor_id,actor_name,source,action,detail)
 select p_session,auth.uid()::text,coalesce(nullif(p.display_name,''),p.email,'แอดมิน'),'web',left(p_action,40),left(coalesce(p_detail,''),300)
 from (select 1) x left join profiles p on p.id=auth.uid();
end $$;
revoke all on function public.tk7_admin_log(uuid,text,text) from public,anon;
grant execute on function public.tk7_admin_log(uuid,text,text) to authenticated;

-- ภาพรวมแอดมิน: แนบประวัติล่าสุด 40 รายการต่อวัน
create or replace function public.tk7_admin_overview() returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 return jsonb_build_object(
  'settings',(select to_jsonb(x)||jsonb_build_object('group_name',(select group_name from tk7_line_groups g where g.group_id=x.group_id)) from tk7_line_settings x where x.id),
  'groups',coalesce((select jsonb_agg(g order by g.seen_at desc) from tk7_line_groups g),'[]'::jsonb),
  'sessions',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('roster',tk7_read_roster(s.id),
    'log',coalesce((select jsonb_agg(l order by l.created_at desc) from (select actor_name,source,action,detail,created_at from tk7_signup_log where session_id=s.id order by created_at desc limit 40) l),'[]'::jsonb)
   ) order by s.match_date desc) from tk7_signup_sessions s),'[]'::jsonb));
end $$;
grant execute on function public.tk7_admin_overview() to authenticated;

-- ลบวัน: ลบประวัติด้วย (cascade อยู่แล้ว)
commit;

-- TK7 019: เลิกส่งสรุปเข้ากลุ่มอัตโนมัติ (ดูรายชื่อในหน้าลงชื่อแทน) · รันซ้ำได้
begin;
update public.tk7_line_settings set push_summary=false,updated_at=now() where id;
alter table public.tk7_line_settings alter column push_summary set default false;
-- งานที่ค้างในคิวไม่ต้องส่ง
update public.tk7_signup_outbox set sent_at=now(),last_error='auto summary removed' where sent_at is null;
commit;

-- TK7 020: ประวัติแสดงแค่ 3 รายการล่าสุดต่อวัน · รันซ้ำได้
begin;
create or replace function public.tk7_admin_overview() returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 return jsonb_build_object(
  'settings',(select to_jsonb(x)||jsonb_build_object('group_name',(select group_name from tk7_line_groups g where g.group_id=x.group_id)) from tk7_line_settings x where x.id),
  'groups',coalesce((select jsonb_agg(g order by g.seen_at desc) from tk7_line_groups g),'[]'::jsonb),
  'sessions',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('roster',tk7_read_roster(s.id),
    'log',coalesce((select jsonb_agg(l order by l.created_at desc) from (select actor_name,source,action,detail,created_at from tk7_signup_log where session_id=s.id order by created_at desc limit 3) l),'[]'::jsonb)
   ) order by s.match_date desc) from tk7_signup_sessions s),'[]'::jsonb));
end $$;
grant execute on function public.tk7_admin_overview() to authenticated;
commit;

-- TK7 021: ดูประวัติทั้งหมดของวัน (ผู้ดูแล) · รันซ้ำได้
begin;
create or replace function public.tk7_admin_session_log(p_session uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 return coalesce((select jsonb_agg(l order by l.created_at desc) from
  (select actor_name,source,action,detail,created_at from tk7_signup_log where session_id=p_session order by created_at desc limit 500) l),'[]'::jsonb);
end $$;
revoke all on function public.tk7_admin_session_log(uuid) from public,anon;
grant execute on function public.tk7_admin_session_log(uuid) to authenticated;
commit;

