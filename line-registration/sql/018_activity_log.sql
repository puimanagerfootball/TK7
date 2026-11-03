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
