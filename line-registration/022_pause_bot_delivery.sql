-- Reversible operational change only. No rows removed or marked as delivered.
-- Keep every session, player, audit row, grant, trigger and outbox row unchanged.
-- The reviewed bot-free API uses the existing schema and selected dataset.
begin;
do $$
declare selected_job record;
begin
 for selected_job in select jobid from cron.job where jobname='tk7-deliver-pending'
 loop perform cron.alter_job(job_id:=selected_job.jobid,active:=false); end loop;
end $$;
commit;
-- Rollback if needed:
-- select cron.alter_job(job_id:=jobid,active:=true)
-- from cron.job where jobname='tk7-deliver-pending';
