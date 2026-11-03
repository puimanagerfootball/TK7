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
