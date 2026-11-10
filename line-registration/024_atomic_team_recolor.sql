create or replace function public.tk7_admin_recolor_fixture(
 p_session uuid,p_from text,p_to text,p_revision bigint,p_updated_at timestamptz,
 p_schedule jsonb,p_settings jsonb
) returns boolean
language plpgsql security definer set search_path=pg_catalog,public as $$
declare s public.tk7_signup_sessions;
begin
 if auth.uid() is null or not public.is_approved_admin() then raise exception 'Admin required'; end if;
 select * into s from public.tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found'; end if;
 if not exists(select 1 from public.tk7_line_settings c where c.id and c.group_id=s.group_id and c.environment=s.environment) then
  raise exception 'Session unavailable';
 end if;
 if not s.is_open then raise exception 'Registration closed'; end if;
 if s.revision is distinct from p_revision then raise exception 'Roster changed; refresh first'; end if;
 if p_updated_at is null then
  if exists(select 1 from public.match_days where match_date=s.match_date) then
   raise exception 'Fixture changed; refresh first';
  end if;
 else
  update public.match_days set schedule=p_schedule,settings=p_settings
   where match_date=s.match_date and updated_at=p_updated_at;
  if not found then raise exception 'Fixture changed; refresh first'; end if;
 end if;
 perform public.tk7_admin_recolor(p_session,p_from,p_to);
 perform public.tk7_admin_log(s.id,'recolor','เปลี่ยนสีทั้งทีม: '||p_from||' → '||p_to);
 return p_updated_at is not null;
end $$;
revoke all on function public.tk7_admin_recolor_fixture(uuid,text,text,bigint,timestamptz,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.tk7_admin_recolor_fixture(uuid,text,text,bigint,timestamptz,jsonb,jsonb) to authenticated;
