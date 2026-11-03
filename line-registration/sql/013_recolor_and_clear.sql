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
