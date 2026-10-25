begin;

create table public.matching_configuration (
  version text primary key check (version ~ '^[a-z0-9._-]{1,40}$'),
  weights jsonb not null check (jsonb_typeof(weights) = 'object' and octet_length(weights::text) < 2048),
  is_active boolean not null default false
);
create unique index matching_one_active_configuration on public.matching_configuration (is_active) where is_active;
insert into public.matching_configuration(version, weights, is_active)
values ('matching-v1', '{"major":30,"country":20,"language":15,"degree":15,"funding":20}', true);
alter table public.matching_configuration enable row level security;
create policy matching_configuration_read on public.matching_configuration for select to authenticated using (true);
revoke all on public.matching_configuration from public, anon, authenticated;
grant select on public.matching_configuration to authenticated;
grant all on public.matching_configuration to service_role;

create table public.matching_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(preferences) = 'object' and octet_length(preferences::text) <= 4096),
  updated_at timestamptz not null default now()
);
alter table public.matching_preferences enable row level security;
create policy matching_preferences_read on public.matching_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy matching_preferences_insert on public.matching_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy matching_preferences_update on public.matching_preferences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.matching_preferences from public, anon, authenticated;
grant select, insert, update on public.matching_preferences to authenticated;
grant all on public.matching_preferences to service_role;

create table public.matching_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_version bigint not null check (profile_version > 0),
  rules_version text not null references public.matching_configuration(version),
  preferences_snapshot jsonb not null check (jsonb_typeof(preferences_snapshot) = 'object' and octet_length(preferences_snapshot::text) <= 4096),
  candidate_count integer not null check (candidate_count between 0 and 50),
  rate_slot bigint not null,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, rate_slot),
  constraint matching_rate_slot_current check (rate_slot = floor(extract(epoch from created_at) / 30)::bigint)
);
create index matching_runs_recent on public.matching_runs(user_id, created_at desc);
alter table public.matching_runs enable row level security;
create policy matching_runs_read on public.matching_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy matching_runs_insert on public.matching_runs for insert to authenticated with check ((select auth.uid()) = user_id);
revoke all on public.matching_runs from public, anon, authenticated;
grant select, insert on public.matching_runs to authenticated;
grant all on public.matching_runs to service_role;

create table public.matching_results (
  run_id uuid not null,
  user_id uuid not null,
  entity_type text not null check (entity_type in ('program', 'scholarship')),
  entity_id bigint not null references public.catalog_entities(id) on delete cascade,
  eligibility jsonb not null check (jsonb_typeof(eligibility) = 'object' and octet_length(eligibility::text) <= 32768),
  preference_score smallint check (preference_score between 0 and 100),
  rank_order smallint not null check (rank_order between 1 and 50),
  created_at timestamptz not null default now(),
  primary key (run_id, entity_type, entity_id),
  unique (run_id, rank_order),
  foreign key (run_id, user_id) references public.matching_runs(id, user_id) on delete cascade
);
create index matching_results_owner on public.matching_results(user_id, run_id, rank_order);
alter table public.matching_results enable row level security;
create policy matching_results_read on public.matching_results for select to authenticated using ((select auth.uid()) = user_id);
create policy matching_results_insert on public.matching_results for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.matching_runs r where r.id = run_id and r.user_id = user_id));
revoke all on public.matching_results from public, anon, authenticated;
grant select, insert on public.matching_results to authenticated;
grant all on public.matching_results to service_role;

commit;
