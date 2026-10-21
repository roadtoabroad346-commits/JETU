begin;

create table public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  constraint student_profile_document_object check (jsonb_typeof(document) = 'object'),
  constraint student_profile_document_size check (octet_length(document::text) <= 65536)
);
create table public.student_profile_versions (
  user_id uuid not null references public.student_profiles(user_id) on delete cascade,
  version bigint not null,
  document jsonb not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, version)
);
create index student_profile_versions_recent on public.student_profile_versions (user_id, saved_at desc);

alter table public.student_profiles enable row level security;
alter table public.student_profile_versions enable row level security;
create policy student_profiles_owner_select on public.student_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy student_profiles_owner_insert on public.student_profiles for insert to authenticated with check ((select auth.uid()) = user_id and version = 1);
create policy student_profiles_owner_update on public.student_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy student_profiles_owner_delete on public.student_profiles for delete to authenticated using ((select auth.uid()) = user_id);
create policy student_profile_versions_owner_select on public.student_profile_versions for select to authenticated using ((select auth.uid()) = user_id);

-- Save history in the same transaction as an insert/update. Clients have no revision write grant.
create function jetu_private.capture_student_profile_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.version <> old.version + 1 then
    raise exception 'profile version must increment by one' using errcode = '23514';
  end if;
  insert into public.student_profile_versions (user_id, version, document)
  values (new.user_id, new.version, new.document);
  return new;
end;
$$;
revoke all on function jetu_private.capture_student_profile_version() from public, anon, authenticated, service_role;
create trigger capture_student_profile_version after insert or update on public.student_profiles
for each row execute function jetu_private.capture_student_profile_version();

grant select, insert, update, delete on public.student_profiles to authenticated;
grant select on public.student_profile_versions to authenticated;
commit;
