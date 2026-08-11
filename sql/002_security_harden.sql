-- TK7 Security harden (รันหลังมี Superadmin แล้ว)
-- 1) ปิด claim_superadmin กันแย่งสิทธิ์
-- 2) กันลดสิทธิ์ Superadmin คนสุดท้าย

-- ปิดการ claim ถาวร (มี Superadmin แล้ว)
create or replace function public.claim_superadmin()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Claim Superadmin ถูกปิดแล้ว กรุณาติดต่อ Superadmin คนปัจจุบัน';
end;
$$;

revoke all on function public.claim_superadmin() from public;
revoke all on function public.claim_superadmin() from anon;
revoke all on function public.claim_superadmin() from authenticated;

-- กันไม่ให้ลบ/ลด role Superadmin คนสุดท้าย
create or replace function public.protect_last_superadmin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if old.role = 'superadmin'
       and (new.role is distinct from 'superadmin' or new.status is distinct from 'approved') then
      if (select count(*) from public.profiles where role = 'superadmin' and status = 'approved') <= 1 then
        raise exception 'ไม่สามารถลดสิทธิ์ Superadmin คนสุดท้ายได้';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_last_superadmin on public.profiles;
create trigger trg_protect_last_superadmin
  before update on public.profiles
  for each row execute function public.protect_last_superadmin();
