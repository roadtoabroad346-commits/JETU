begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-evidence', 'profile-evidence', false, 8388608,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create table public.student_profile_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null,
  category text not null,
  created_at timestamptz not null default now(),
  constraint attachment_owner_path check (split_part(object_path, '/', 1) = user_id::text),
  constraint attachment_name_length check (length(file_name) between 1 and 255),
  constraint attachment_size check (byte_size between 1 and 8388608),
  constraint attachment_mime check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  constraint attachment_category check (category in ('transcript', 'exam', 'award', 'portfolio', 'other'))
);
create index student_profile_attachments_owner_created
  on public.student_profile_attachments (user_id, created_at desc);
alter table public.student_profile_attachments enable row level security;
create policy profile_attachments_owner_select on public.student_profile_attachments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy profile_attachments_owner_insert on public.student_profile_attachments
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profile_attachments_owner_delete on public.student_profile_attachments
  for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on public.student_profile_attachments to authenticated;

create policy profile_evidence_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy profile_evidence_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy profile_evidence_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
