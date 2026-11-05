create or replace function public.tk7_secure_mutation(p_rpc text,p_args jsonb,p_actor text,p_name text,p_action text,p_detail text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare sid uuid; mutation_request uuid; prior boolean; result_data jsonb;
begin
 if p_actor is null or length(p_actor) not between 1 and 128 or jsonb_typeof(p_args)<>'object' then raise exception 'Invalid identity'; end if;
 sid=(p_args->>'p_session')::uuid; mutation_request=(p_args->>'p_request')::uuid;
 if sid is null or mutation_request is null then raise exception 'Invalid request'; end if;
 perform 1 from public.tk7_signup_sessions where id=sid for update;
 if not found then raise exception 'Session not found'; end if;
 prior=exists(select 1 from public.tk7_signup_batches where id=mutation_request)
    or exists(select 1 from public.tk7_signup_changes where request_id=mutation_request);
 if p_rpc='tk7_signup_batch' then
  result_data=public.tk7_signup_batch(sid,mutation_request,p_actor,p_args->>'p_team',array(select jsonb_array_elements_text(p_args->'p_names')));
 elsif p_rpc='tk7_change_entry' then
  result_data=public.tk7_change_entry(sid,mutation_request,p_actor,(p_args->>'p_revision')::bigint,p_args->>'p_action',(p_args->>'p_entry')::uuid,p_args->>'p_team',(p_args->>'p_other')::uuid);
 elsif p_rpc='tk7_team_action' then
  result_data=public.tk7_team_action(sid,mutation_request,p_actor,(p_args->>'p_revision')::bigint,p_args->>'p_action',case when jsonb_typeof(p_args->'p_entries')='array' then array(select value::uuid from jsonb_array_elements_text(p_args->'p_entries')) else null end,p_args->>'p_team',p_args->>'p_from');
 else raise exception 'Invalid mutation'; end if;
 if not prior then
  insert into public.tk7_signup_log(session_id,actor_id,actor_name,source,action,detail)
  values(sid,p_actor,left(coalesce(nullif(btrim(p_name),''),'LINE'),60),'line',left(p_action,40),left(p_detail,300));
 end if;
 return result_data||jsonb_build_object('replayed',prior);
end $$;
revoke all on function public.tk7_secure_mutation(text,jsonb,text,text,text,text) from public,anon,authenticated;
grant execute on function public.tk7_secure_mutation(text,jsonb,text,text,text,text) to service_role;
