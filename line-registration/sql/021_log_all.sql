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
