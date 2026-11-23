insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tk7-tactics-media','tk7-tactics-media',false,26214400,array['video/mp4','image/jpeg'])
on conflict(id) do nothing;

create policy tk7_media_owner_insert on storage.objects for insert to authenticated
with check (bucket_id='tk7-tactics-media' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select public.is_approved_admin()));
create policy tk7_media_owner_read on storage.objects for select to authenticated
using (bucket_id='tk7-tactics-media' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select public.is_approved_admin()));
create policy tk7_media_owner_delete on storage.objects for delete to authenticated
using (bucket_id='tk7-tactics-media' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select public.is_approved_admin()));

create table tk7_private.media_cleanup_secret(
 id boolean primary key default true check(id),
 token text not null default gen_random_uuid()::text
);
alter table tk7_private.media_cleanup_secret enable row level security;
revoke all on tk7_private.media_cleanup_secret from public,anon,authenticated;
insert into tk7_private.media_cleanup_secret(id) values(true);

create function public.tk7_expired_media(p_token text) returns table(name text)
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if not exists(select 1 from tk7_private.media_cleanup_secret s where s.id and s.token=p_token) then
  raise exception 'Invalid cleanup token';
 end if;
 return query select o.name from storage.objects o
  where o.bucket_id='tk7-tactics-media' and o.created_at<statement_timestamp()-interval '7 days'
  order by o.created_at limit 100;
end $$;
revoke all on function public.tk7_expired_media(text) from public,anon,authenticated;
grant execute on function public.tk7_expired_media(text) to service_role;

create function public.tk7_dispatch_media_cleanup() returns bigint
language sql security definer set search_path=pg_catalog as $$
 select net.http_post(
  url:='https://rwsyiiulfbolymxppvmy.supabase.co/functions/v1/tk7-media-cleanup',
  headers:='{"Content-Type":"application/json"}'::jsonb,
  body:=jsonb_build_object('token',(select token from tk7_private.media_cleanup_secret where id)),
  timeout_milliseconds:=20000);
$$;
revoke all on function public.tk7_dispatch_media_cleanup() from public,anon,authenticated;
select cron.schedule('tk7-tactics-media-cleanup','15 * * * *','select public.tk7_dispatch_media_cleanup();');
