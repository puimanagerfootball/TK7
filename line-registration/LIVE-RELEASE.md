# TK7 manual sharing release · 3 November 2026

Supabase `tk7-signup` v17 no longer uses LINE Bot APIs, bot tokens, group membership
checks, webhook replies or background message delivery. LINE Login is still
required, and account identity is verified server-side. Anyone with the signup
link and a valid LINE login can access the configured registration dataset.
Administrator permissions remain unchanged. Existing group_id values remain only
as internal dataset keys so existing sessions and rosters keep working.

The applied migration `pause_tk7_bot_delivery_reversibly` only sets the named
`tk7-deliver-pending` cron job to inactive. It preserves all database functions,
grants, triggers, queue rows and historical records. The earlier broad migration
was rejected and was NOT applied. Do not apply that superseded migration.

Before/after verified: 1 session, 2 players, 2 activity logs, no pending or leased
outbox items. Existing logs, latest-three history, expanded history and admin
access are retained. New actor names come from verified LINE tokens; if profile
permission is unavailable, the UI uses a short account suffix.

The admin Share card button opens LIFF with `?share=1`. The user previews the
undated bilingual Flex card, taps Share to LINE, and chooses recipients. Nothing
is sent automatically. Share target picker must be enabled in the existing LINE
Login channel. Actual LINE login and sending from the user's phone must be
verified on that phone; no message is sent by deployment checks.

Rollback: redeploy the backed-up v16 function and restore the previous frontend
commit if needed. Re-enable only the TK7 cron job with:

```sql
select cron.alter_job(job_id:=jobid,active:=true)
from cron.job where jobname='tk7-deliver-pending';
```

No OA needs to join the group. Existing OA credentials can remain unused until
the owner revokes them; the released application does not read them. The existing
OA webhook, if still configured, receives HTTP 410 and cannot post through TK7.
