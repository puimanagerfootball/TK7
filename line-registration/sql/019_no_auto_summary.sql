-- TK7 019: เลิกส่งสรุปเข้ากลุ่มอัตโนมัติ (ดูรายชื่อในหน้าลงชื่อแทน) · รันซ้ำได้
begin;
update public.tk7_line_settings set push_summary=false,updated_at=now() where id;
alter table public.tk7_line_settings alter column push_summary set default false;
-- งานที่ค้างในคิวไม่ต้องส่ง
update public.tk7_signup_outbox set sent_at=now(),last_error='auto summary removed' where sent_at is null;
commit;
