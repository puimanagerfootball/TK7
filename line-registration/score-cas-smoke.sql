begin;
do $$
declare d date:='2199-09-01'; uid uuid;
begin
 select id into uid from public.profiles where status='approved' and role in ('admin','superadmin') limit 1;
 if uid is null then raise exception 'No approved admin fixture';end if;
 while exists(select 1 from public.match_days where match_date=d) loop d=d+1;end loop;
 insert into public.match_days(match_date,settings,schedule,updated_at)
 values(d,'{"activeTeams":["green","red"],"timePerMatch":8,"startTime":"20:15"}',
 '[{"home":"green","away":"red","homeScore":null,"awayScore":null}]',now()-interval '1 hour');
 perform set_config('request.jwt.claim.sub',uid::text,true);
 perform set_config('tk7.score_fixture_date',d::text,true);
end $$;
set local role authenticated;
do $$
declare d date:=current_setting('tk7.score_fixture_date')::date; previous timestamptz; changed integer;
begin
 select updated_at into previous from public.match_days where match_date=d;
 update public.match_days set schedule='[{"home":"green","away":"red","homeScore":1,"awayScore":0}]'
 where match_date=d and updated_at=previous;
 get diagnostics changed=row_count;if changed<>1 then raise exception 'TEST: valid revision denied';end if;
 update public.match_days set schedule='[]' where match_date=d and updated_at=previous;
 get diagnostics changed=row_count;if changed<>0 then raise exception 'TEST: stale revision overwrote a schedule';end if;
 if (select schedule->0->>'homeScore' from public.match_days where match_date=d)<>'1' then raise exception 'TEST: correct score lost';end if;
end $$;
reset role;
select 'PASS: approved score save updates revision; stale revision changes zero rows; saved score preserved' result;
rollback;
