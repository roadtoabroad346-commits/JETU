begin;

-- A privileged deletion worker marks an account before removing physical Storage files.
-- The marker prevents new uploads while deletion is in progress or awaiting retry.
create table public.student_account_deletions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now()
);
alter table public.student_account_deletions enable row level security;
create policy student_account_deletions_owner_select
  on public.student_account_deletions for select to authenticated
  using ((select auth.uid()) = user_id);
grant select on public.student_account_deletions to authenticated;

-- Evidence files are one level below the owner's UUID; no shared or nested paths.
drop policy profile_evidence_owner_select on storage.objects;
drop policy profile_evidence_owner_insert on storage.objects;
drop policy profile_evidence_owner_delete on storage.objects;
create policy profile_evidence_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 1);
create policy profile_evidence_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 1
    and not exists (select 1 from public.student_account_deletions
      where user_id = (select auth.uid())));
create policy profile_evidence_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 1);
commit;
