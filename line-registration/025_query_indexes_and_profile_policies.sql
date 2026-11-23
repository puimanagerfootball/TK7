create index if not exists tk7_profiles_approved_by_idx on public.profiles(approved_by);
create index if not exists tk7_batches_session_id_idx on public.tk7_signup_batches(session_id);
create index if not exists tk7_changes_session_id_idx on public.tk7_signup_changes(session_id);
create index if not exists tk7_entries_batch_id_idx on public.tk7_signup_entries(batch_id);
create index if not exists tk7_outbox_session_id_idx on public.tk7_signup_outbox(session_id);

alter policy profiles_select_own_or_superadmin on public.profiles
 using (id=(select auth.uid()) or (select public.is_superadmin()));
alter policy profiles_insert_own_pending on public.profiles
 with check (id=(select auth.uid()) and role='admin' and status='pending');
alter policy profiles_update_superadmin on public.profiles
 using ((select public.is_superadmin()))
 with check ((select public.is_superadmin()));
