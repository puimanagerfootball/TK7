-- TK7 012: ผู้เล่นเลือกสีเอง (10 สี สีละ 7), วันแข่งเก็บ นาที/แมตช์ + เวลาเริ่ม,
-- ย้ายกลุ่ม LINE จากเว็บ, และรวมข้อความสรุปเข้ากลุ่ม (ลดโควต้า push)
-- รันครั้งเดียวหลัง 005–011 (ใช้ create or replace / if not exists จึงรันซ้ำได้)
begin;

-- 1) ข้อมูลวันแข่งเพิ่ม
alter table public.tk7_signup_sessions add column if not exists time_per_match int not null default 8 check (time_per_match between 1 and 60);
alter table public.tk7_signup_sessions add column if not exists start_time time not null default '20:00';
alter table public.tk7_signup_sessions alter column teams set default array['green','red','white','blue','black','yellow','pink','orange','navy','purple'];
-- วันที่ยังไม่ถึง: เปิดให้เลือกได้ทุกสี (เป็น superset ของเดิม ผู้เล่นที่ลงไว้ไม่กระทบ)
update public.tk7_signup_sessions set teams=array['green','red','white','blue','black','yellow','pink','orange','navy','purple'],revision=revision+1
 where match_date>=(now() at time zone 'Asia/Bangkok')::date;

-- 2) ตั้งค่ากลุ่มที่ใช้งาน (แถวเดียว) — ย้ายกลุ่มได้จากเว็บ ไม่ต้องแก้ Secrets
create table if not exists public.tk7_line_settings (
 id boolean primary key default true check (id),
 group_id text,
 environment text not null default 'test' check (environment in ('test','production')),
 push_summary boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.tk7_line_settings enable row level security;
revoke all on public.tk7_line_settings from public,anon,authenticated;
grant all on public.tk7_line_settings to service_role;
insert into public.tk7_line_settings(id,group_id,environment)
 values (true,'C80b375230f0ab711fed86f11f88dcda7','test') on conflict (id) do nothing;

-- 3) อ่านรายชื่อพร้อมข้อมูลวัน
create or replace function public.tk7_read_roster(p_session uuid) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('revision',s.revision,'teams',s.teams,'isOpen',s.is_open,
 'matchDate',s.match_date,'startTime',to_char(s.start_time,'HH24:MI'),'timePerMatch',s.time_per_match,
 'entries',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'team',e.team,'slot',e.slot,'name',e.name) order by e.team,e.slot)
 from tk7_signup_entries e where e.session_id=s.id),'[]'::jsonb))
 from tk7_signup_sessions s where s.id=p_session
$$;

-- 4) สรุปเข้ากลุ่ม: รอ 60 วินาทีหลังการเปลี่ยนแปลงล่าสุด แล้วส่งเฉพาะฉบับล่าสุด
create or replace function public.tk7_snapshot_summary() returns trigger language plpgsql set search_path=public as $$
begin
 new.snapshot=jsonb_build_object('session',(select to_jsonb(s) from tk7_signup_sessions s where s.id=new.session_id),
 'entries',coalesce((select jsonb_agg(jsonb_build_object('team',team,'slot',slot,'name',name)) from tk7_signup_entries where session_id=new.session_id),'[]'::jsonb));
 if new.batch_id is not null or new.change_id is not null then
  new.retry_after=now()+interval '60 seconds';
 end if;
 return new;
end $$;

create or replace function public.tk7_claim_summary() returns setof public.tk7_signup_outbox language plpgsql security definer set search_path=public as $$
declare job uuid; push_on boolean;
begin
 select coalesce((select push_summary from tk7_line_settings where id),true) into push_on;
 -- ปิดสรุปอัตโนมัติ: งานจากผู้เล่นไม่ต้องส่ง (งานที่แอดมินกดส่งเองยังส่ง)
 if not push_on then
  update tk7_signup_outbox set sent_at=now(),last_error='auto summary off'
  where sent_at is null and (batch_id is not null or change_id is not null) and (lease_until is null or lease_until<now());
 end if;
 -- มีฉบับใหม่กว่าแล้ว → ข้ามฉบับเก่า
 update tk7_signup_outbox o set sent_at=now(),last_error='superseded',lease_until=null,lease_token=null
 where o.sent_at is null and (o.lease_until is null or o.lease_until<now())
 and exists(select 1 from tk7_signup_outbox n where n.session_id=o.session_id and n.sent_at is null and (n.created_at,n.id)>(o.created_at,o.id));
 select o.id into job from tk7_signup_outbox o
 where o.sent_at is null and o.snapshot is not null and o.attempts<20
 and o.retry_after<=now() and (o.lease_until is null or o.lease_until<now())
 and not exists(select 1 from tk7_signup_outbox earlier where earlier.session_id=o.session_id and earlier.sent_at is null and (earlier.created_at,earlier.id)<(o.created_at,o.id))
 order by o.created_at,o.id for update skip locked limit 1;
 if job is null then return; end if;
 return query update tk7_signup_outbox set lease_until=now()+interval '60 seconds',lease_token=gen_random_uuid(),attempts=attempts+1 where id=job returning *;
end $$;

-- 5) ฟังก์ชันผู้ดูแล
create or replace function public.tk7_admin_overview() returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 return jsonb_build_object(
  'settings',(select to_jsonb(x)||jsonb_build_object('group_name',(select group_name from tk7_line_groups g where g.group_id=x.group_id)) from tk7_line_settings x where x.id),
  'groups',coalesce((select jsonb_agg(g order by g.seen_at desc) from tk7_line_groups g),'[]'::jsonb),
  'sessions',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('roster',tk7_read_roster(s.id)) order by s.match_date desc) from tk7_signup_sessions s),'[]'::jsonb));
end $$;

-- เปิด/อัปเดตวันลงชื่อ: แค่ วันที่ + นาที/แมตช์ + เวลาเริ่ม (ทุกสีเปิดให้เลือก)
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
 update tk7_signup_sessions set time_per_match=p_time_per_match,start_time=p_start_time,is_open=coalesce(p_open,true),teams=all_colors,revision=revision+1
  where group_id=cfg.group_id and match_date=p_date and environment=cfg.environment returning id into sid;
 if sid is null then
  insert into tk7_signup_sessions(match_date,group_id,environment,is_open,teams,time_per_match,start_time)
  values(p_date,cfg.group_id,cfg.environment,coalesce(p_open,true),all_colors,p_time_per_match,p_start_time) returning id into sid;
 end if;
 return sid;
end $$;

create or replace function public.tk7_admin_set_open(p_session uuid,p_open boolean) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 update tk7_signup_sessions set is_open=p_open,revision=revision+1 where id=p_session;
 if not found then raise exception 'Session not found'; end if;
end $$;

-- ย้ายกลุ่ม: เลือกกลุ่มใหม่ (ต้องเชิญบอทเข้ากลุ่มนั้นก่อน) + ย้ายนัดที่ยังไม่ถึงไปด้วย
create or replace function public.tk7_admin_set_group(p_group text,p_environment text,p_move_upcoming boolean default true) returns jsonb
language plpgsql security definer set search_path=public as $$
declare old_cfg tk7_line_settings; moved int:=0; today date:=(now() at time zone 'Asia/Bangkok')::date;
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 if not exists(select 1 from tk7_line_groups where group_id=p_group) then raise exception 'Group not verified'; end if;
 if p_environment not in ('test','production') then raise exception 'Invalid environment'; end if;
 select * into old_cfg from tk7_line_settings where id for update;
 if p_move_upcoming and old_cfg.group_id is not null and (old_cfg.group_id<>p_group or old_cfg.environment<>p_environment) then
  if exists(select 1 from tk7_signup_sessions a join tk7_signup_sessions b on b.match_date=a.match_date
   where a.group_id=old_cfg.group_id and a.environment=old_cfg.environment and a.match_date>=today
   and b.group_id=p_group and b.environment=p_environment) then
   raise exception 'Target group already has one of these dates';
  end if;
  update tk7_signup_sessions set group_id=p_group,environment=p_environment,revision=revision+1
   where group_id=old_cfg.group_id and environment=old_cfg.environment and match_date>=today;
  get diagnostics moved=row_count;
 end if;
 update tk7_line_settings set group_id=p_group,environment=p_environment,updated_at=now() where id;
 return jsonb_build_object('moved',moved);
end $$;

create or replace function public.tk7_admin_set_push(p_on boolean) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 update tk7_line_settings set push_summary=p_on,updated_at=now() where id;
end $$;

-- แอดมินกด "ส่งสรุปเข้ากลุ่มตอนนี้"
create or replace function public.tk7_admin_push_summary(p_session uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 if not exists(select 1 from tk7_signup_sessions where id=p_session) then raise exception 'Session not found'; end if;
 insert into tk7_signup_outbox(session_id) values(p_session);
end $$;

revoke all on function public.tk7_admin_overview(),public.tk7_admin_open_session(date,int,time,boolean),public.tk7_admin_set_open(uuid,boolean),
 public.tk7_admin_set_group(text,text,boolean),public.tk7_admin_set_push(boolean),public.tk7_admin_push_summary(uuid) from public,anon;
grant execute on function public.tk7_admin_overview(),public.tk7_admin_open_session(date,int,time,boolean),public.tk7_admin_set_open(uuid,boolean),
 public.tk7_admin_set_group(text,text,boolean),public.tk7_admin_set_push(boolean),public.tk7_admin_push_summary(uuid) to authenticated;
revoke all on function public.tk7_read_roster(uuid),public.tk7_claim_summary() from public,anon,authenticated;
grant execute on function public.tk7_read_roster(uuid),public.tk7_claim_summary() to service_role;
commit;
