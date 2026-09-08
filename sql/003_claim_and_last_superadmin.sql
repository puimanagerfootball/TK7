-- TK7 003: กัน race ตอน claim + กันลบ Superadmin คนสุดท้าย
-- รันใน Supabase SQL Editor หลัง 001/002

-- 1) Unique partial index: approved superadmin หนึ่งคน
create unique index if not exists profiles_one_approved_superadmin_idx
  on public.profiles (role)
  where role = 'superadmin' and status = 'approved';

-- 2) claim_superadmin แบบ atomic ขึ้น (ถ้ายังไม่ปิดด้วย 002)
create or replace function public.claim_superadmin()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  perform 1 from public.profiles where role = 'superadmin' for update;
  if found then
    raise exception 'Superadmin already exists';
  end if;

  if exists (select 1 from public.profiles where role = 'superadmin' and status = 'approved') then
    raise exception 'Superadmin already exists';
  end if;

  update public.profiles
  set role = 'superadmin',
      status = 'approved',
      approved_at = coalesce(approved_at, now()),
      approved_by = auth.uid()
  where id = auth.uid()
  returning * into result;

  if result.id is null then
    insert into public.profiles (id, email, display_name, role, status, approved_at, approved_by)
    values (
      auth.uid(),
      (select email from auth.users where id = auth.uid()),
      'Superadmin',
      'superadmin',
      'approved',
      now(),
      auth.uid()
    )
    returning * into result;
  end if;

  return result;
exception
  when unique_violation then
    raise exception 'Superadmin already exists';
end;
$$;

-- ถ้ารัน 002 ไปแล้ว: รัน 002 ซ้ำหลังไฟล์นี้เพื่อปิด claim อีกครั้ง

-- 3) กันลบ/ลดสิทธิ์ Superadmin คนสุดท้าย (UPDATE + DELETE)
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
    return new;
  elsif tg_op = 'DELETE' then
    if old.role = 'superadmin' and old.status = 'approved' then
      if (select count(*) from public.profiles where role = 'superadmin' and status = 'approved') <= 1 then
        raise exception 'ไม่สามารถลบ Superadmin คนสุดท้ายได้';
      end if;
    end if;
    return old;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_protect_last_superadmin on public.profiles;
drop trigger if exists trg_protect_last_superadmin_del on public.profiles;

create trigger trg_protect_last_superadmin
  before update on public.profiles
  for each row execute function public.protect_last_superadmin();

create trigger trg_protect_last_superadmin_del
  before delete on public.profiles
  for each row execute function public.protect_last_superadmin();
