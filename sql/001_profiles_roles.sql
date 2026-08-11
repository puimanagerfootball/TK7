-- TK7: Superadmin + Admin (ต้องอนุมัติ)
-- รันใน Supabase Dashboard > SQL Editor ครั้งเดียว
-- จากนั้นล็อกอินด้วยบัญชีเดิม แล้วกด "ตั้งเป็น Superadmin" ในแอป (ครั้งแรกเท่านั้น)

-- 1) ตารางโปรไฟล์
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'admin' check (role in ('superadmin', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id)
);

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- 2) ฟังก์ชันเช็คสิทธิ์ (security definer — ใช้ใน RLS ได้โดยไม่วนลูป)
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'superadmin'
      and p.status = 'approved'
  );
$$;

create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and p.role in ('admin', 'superadmin')
  );
$$;

create or replace function public.superadmin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where role = 'superadmin' and status = 'approved'
  );
$$;

revoke all on function public.is_superadmin() from public;
revoke all on function public.is_approved_admin() from public;
revoke all on function public.superadmin_exists() from public;
grant execute on function public.is_superadmin() to authenticated, anon;
grant execute on function public.is_approved_admin() to authenticated, anon;
grant execute on function public.superadmin_exists() to authenticated, anon;

-- 3) สร้างโปรไฟล์อัตโนมัติเมื่อสมัคร
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'admin',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Backfill ผู้ใช้เดิม → Admin ที่อนุมัติแล้ว (ไม่พังของเดิม)
insert into public.profiles (id, email, display_name, role, status, approved_at)
select
  u.id,
  u.email,
  split_part(coalesce(u.email, 'user'), '@', 1),
  'admin',
  'approved',
  now()
from auth.users u
on conflict (id) do nothing;

-- 5) RLS บน profiles
drop policy if exists "profiles_select_own_or_superadmin" on public.profiles;
drop policy if exists "profiles_insert_own_pending" on public.profiles;
drop policy if exists "profiles_update_superadmin" on public.profiles;

create policy "profiles_select_own_or_superadmin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_superadmin());

create policy "profiles_insert_own_pending"
  on public.profiles for insert to authenticated
  with check (
    id = auth.uid()
    and role = 'admin'
    and status = 'pending'
  );

create policy "profiles_update_superadmin"
  on public.profiles for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- 6) Claim Superadmin ครั้งแรก (เมื่อยังไม่มีใครเป็น superadmin)
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

  if exists (select 1 from public.profiles where role = 'superadmin') then
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
end;
$$;

revoke all on function public.claim_superadmin() from public;
grant execute on function public.claim_superadmin() to authenticated;

-- 7) ล็อกการเขียน match_days / match_templates ให้เฉพาะ Admin ที่อนุมัติแล้ว
do $$
declare r record;
begin
  if to_regclass('public.match_days') is not null then
    alter table public.match_days enable row level security;
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'match_days'
    loop
      execute format('drop policy if exists %I on public.match_days', r.policyname);
    end loop;

    execute $p$
      create policy "tk7_public_read_match_days"
        on public.match_days for select
        to anon, authenticated
        using (true)
    $p$;
    execute $p$
      create policy "tk7_approved_admin_insert_match_days"
        on public.match_days for insert
        to authenticated
        with check (public.is_approved_admin())
    $p$;
    execute $p$
      create policy "tk7_approved_admin_update_match_days"
        on public.match_days for update
        to authenticated
        using (public.is_approved_admin())
        with check (public.is_approved_admin())
    $p$;
    execute $p$
      create policy "tk7_approved_admin_delete_match_days"
        on public.match_days for delete
        to authenticated
        using (public.is_approved_admin())
    $p$;
  end if;

  if to_regclass('public.match_templates') is not null then
    alter table public.match_templates enable row level security;
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'match_templates'
    loop
      execute format('drop policy if exists %I on public.match_templates', r.policyname);
    end loop;

    execute $p$
      create policy "tk7_public_read_match_templates"
        on public.match_templates for select
        to anon, authenticated
        using (true)
    $p$;
    execute $p$
      create policy "tk7_approved_admin_insert_match_templates"
        on public.match_templates for insert
        to authenticated
        with check (public.is_approved_admin())
    $p$;
    execute $p$
      create policy "tk7_approved_admin_update_match_templates"
        on public.match_templates for update
        to authenticated
        using (public.is_approved_admin())
        with check (public.is_approved_admin())
    $p$;
    execute $p$
      create policy "tk7_approved_admin_delete_match_templates"
        on public.match_templates for delete
        to authenticated
        using (public.is_approved_admin())
    $p$;
  end if;
end $$;
