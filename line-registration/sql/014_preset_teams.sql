-- TK7 014: เปิดสีไว้ล่วงหน้า (แสดงในสรุป/หน้าลงชื่อแม้ยังไม่มีคน)
-- รันซ้ำได้
begin;
alter table public.tk7_signup_sessions add column if not exists preset_teams text[] not null default '{}';

create or replace function public.tk7_admin_set_preset(p_session uuid,p_teams text[]) returns void
language plpgsql security definer set search_path=public as $$
declare colors text[]:=array['green','red','white','blue','black','yellow','pink','orange','navy','purple'];
begin
 if not public.is_approved_admin() then raise exception 'Admin required'; end if;
 if exists(select 1 from unnest(coalesce(p_teams,'{}')) t where not t=any(colors)) then raise exception 'Invalid colour'; end if;
 update tk7_signup_sessions set preset_teams=(select coalesce(array_agg(distinct t),'{}') from unnest(coalesce(p_teams,'{}')) t),revision=revision+1 where id=p_session;
 if not found then raise exception 'Session not found'; end if;
end $$;

create or replace function public.tk7_read_roster(p_session uuid) returns jsonb
language sql stable security definer set search_path=public as $$
 select jsonb_build_object('revision',s.revision,'teams',s.teams,'presetTeams',s.preset_teams,'isOpen',s.is_open,
 'matchDate',s.match_date,'startTime',to_char(s.start_time,'HH24:MI'),'timePerMatch',s.time_per_match,
 'entries',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'team',e.team,'slot',e.slot,'name',e.name) order by e.team,e.slot)
 from tk7_signup_entries e where e.session_id=s.id),'[]'::jsonb))
 from tk7_signup_sessions s where s.id=p_session
$$;

revoke all on function public.tk7_admin_set_preset(uuid,text[]) from public,anon;
grant execute on function public.tk7_admin_set_preset(uuid,text[]) to authenticated;
revoke all on function public.tk7_read_roster(uuid) from public,anon,authenticated;
grant execute on function public.tk7_read_roster(uuid) to service_role;
commit;
