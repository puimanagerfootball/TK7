-- Replace only explicitly supplied team blocks, in one audited transaction.
create or replace function public.tk7_admin_import_roster(
 p_session uuid,p_request uuid,p_revision bigint,p_match_date date,p_blocks jsonb
) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare s public.tk7_signup_sessions; prior public.tk7_signup_changes;
 actor text:=auth.uid()::text; payload jsonb; normalized jsonb:='[]'; block_data jsonb; slots_data jsonb;
 seen text[]:='{}'; team_name text; player_name text; old_name text; old_id uuid; i integer;
 added integer:=0; changed integer:=0; removed integer:=0; new_revision bigint; result_data jsonb;
begin
 if auth.uid() is null or not public.is_approved_admin() then raise exception 'Admin required';end if;
 select * into s from public.tk7_signup_sessions where id=p_session for update;
 if not found then raise exception 'Session not found';end if;
 if not exists(select 1 from public.tk7_line_settings c where c.id and c.group_id=s.group_id and c.environment=s.environment) then raise exception 'Session unavailable';end if;
 if p_request is null or p_match_date is null or p_match_date<>s.match_date then raise exception 'Invalid import date';end if;
 if jsonb_typeof(p_blocks) is distinct from 'array' then raise exception 'Invalid import blocks';end if;
 if jsonb_array_length(p_blocks) not between 1 and 10 then raise exception 'Invalid import blocks';end if;
 for block_data in select value from jsonb_array_elements(p_blocks) loop
  team_name=block_data->>'team';slots_data='[]';
  if team_name is null or not team_name=any(s.teams) or team_name=any(seen) then raise exception 'Invalid import team';end if;
  seen=array_append(seen,team_name);
  if jsonb_typeof(block_data->'slots') is distinct from 'array' then raise exception 'Import requires seven slots';end if;
  if jsonb_array_length(block_data->'slots')<>7 then raise exception 'Import requires seven slots';end if;
  for i in 0..6 loop
   if jsonb_typeof(block_data->'slots'->i) not in ('string','null') then raise exception 'Invalid import name';end if;
   player_name=block_data->'slots'->>i;
   if player_name ~ '[[:cntrl:]]' then raise exception 'Invalid import name';end if;
   player_name=nullif(btrim(regexp_replace(player_name,'\s+',' ','g')),'');
   if player_name is not null and char_length(player_name)>40 then raise exception 'Invalid import name';end if;
   slots_data=slots_data||jsonb_build_array(player_name);
  end loop;
  normalized=normalized||jsonb_build_array(jsonb_build_object('team',team_name,'slots',slots_data));
 end loop;
 payload=jsonb_build_object('action','import','date',p_match_date,'revision',p_revision,'blocks',normalized);
 select * into prior from public.tk7_signup_changes where request_id=p_request;
 if found then
  if prior.session_id<>p_session or prior.actor_id<>actor or prior.payload<>payload then raise exception 'Request conflict';end if;
  return prior.result;
 end if;
 if exists(select 1 from public.tk7_signup_batches where id=p_request) then raise exception 'Request conflict';end if;
 if not s.is_open then raise exception 'Registration closed';end if;
 if p_revision is null or p_revision<>s.revision then raise exception 'Roster changed; refresh first';end if;
 for block_data in select value from jsonb_array_elements(normalized) loop
  team_name=block_data->>'team';
  for i in 1..7 loop
   player_name=block_data->'slots'->>(i-1);old_name=null;old_id=null;
   select id,name into old_id,old_name from public.tk7_signup_entries where session_id=s.id and team=team_name and slot=i;
   if old_name is not distinct from player_name then continue;end if;
   if old_id is not null then delete from public.tk7_signup_entries where id=old_id;end if;
   if player_name is not null then
    if not exists(select 1 from public.tk7_signup_batches where id=p_request) then
     insert into public.tk7_signup_batches(id,session_id,owner_id,payload) values(p_request,s.id,actor,payload);
    end if;
    insert into public.tk7_signup_entries(session_id,batch_id,team,slot,name,name_key)
    values(s.id,p_request,team_name,i,player_name,lower(player_name));
    if old_id is null then added=added+1;else changed=changed+1;end if;
   else removed=removed+1;end if;
  end loop;
 end loop;
 if added+changed+removed>0 then
  update public.tk7_signup_sessions set revision=revision+1 where id=s.id;
  perform public.tk7_admin_log(s.id,'import','นำเข้าข้อความ LINE: เพิ่ม '||added||' · เปลี่ยน '||changed||' · ลบ '||removed||' · เฉพาะทีม '||array_to_string(seen,', '));
 end if;
 select revision into new_revision from public.tk7_signup_sessions where id=s.id;
 result_data=jsonb_build_object('ok',true,'added',added,'changed',changed,'deleted',removed,'revision',new_revision,'roster',public.tk7_read_roster(s.id));
 insert into public.tk7_signup_changes(request_id,session_id,actor_id,payload,result) values(p_request,s.id,actor,payload,result_data);
 return result_data;
end $$;
revoke all on function public.tk7_admin_import_roster(uuid,uuid,bigint,date,jsonb) from public,anon,authenticated;
grant execute on function public.tk7_admin_import_roster(uuid,uuid,bigint,date,jsonb) to authenticated;
