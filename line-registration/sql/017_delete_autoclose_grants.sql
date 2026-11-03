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
