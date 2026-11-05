-- Quotas are private, atomic across Edge instances, and callable only by the API.
create schema if not exists tk7_private;
revoke all on schema tk7_private from public,anon,authenticated;
create table if not exists tk7_private.api_quota (
 subject_hash bytea not null,
 mutation boolean not null,
 window_start timestamptz not null,
 used integer not null check(used>0),
 primary key(subject_hash,mutation,window_start)
);
alter table tk7_private.api_quota enable row level security;
revoke all on tk7_private.api_quota from public,anon,authenticated;
create index if not exists api_quota_expiry on tk7_private.api_quota(window_start);
create or replace function public.tk7_security_quota(p_subject text,p_mutation boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare n integer; cap integer; bucket timestamptz:=date_trunc('minute',clock_timestamp());
begin
 if p_subject is null or length(p_subject) not between 1 and 128 or p_mutation is null then raise exception 'Invalid quota subject'; end if;
 cap=case when p_mutation then 30 else 120 end;
 delete from tk7_private.api_quota where ctid in (select ctid from tk7_private.api_quota where window_start<bucket-interval '10 minutes' limit 100);
 insert into tk7_private.api_quota(subject_hash,mutation,window_start,used)
 values(sha256(convert_to(p_subject,'UTF8')),p_mutation,bucket,1)
 on conflict(subject_hash,mutation,window_start) do update set used=least(tk7_private.api_quota.used+1,1000000)
 returning used into n;
 return jsonb_build_object('allowed',n<=cap,'retry_after',greatest(1,ceil(extract(epoch from bucket+interval '1 minute'-clock_timestamp()))::integer));
end $$;
revoke all on function public.tk7_security_quota(text,boolean) from public,anon,authenticated;
grant execute on function public.tk7_security_quota(text,boolean) to service_role;

-- Trigger/event-trigger functions are not public RPCs. Their existing triggers remain.
revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.protect_last_superadmin() from public,anon,authenticated;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
revoke execute on function public.update_updated_at_column() from public,anon,authenticated;
revoke execute on function public.tk7_registration_revision() from public,anon,authenticated;
revoke execute on function public.tk7_snapshot_summary() from public,anon,authenticated;
revoke create on schema public from public,anon,authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public,anon,authenticated;
