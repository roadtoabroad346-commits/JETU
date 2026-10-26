-- Phase 17: owner-scoped, deterministic admissions roadmaps and task DAGs.
begin;

-- Preserve deadline uncertainty instead of coercing date-only facts into a
-- fictional instant. Existing rows were all stored as explicit instants.
alter table public.deadlines drop constraint deadlines_check;
alter table public.deadlines drop constraint deadlines_check1;
alter table public.deadlines
  add column due_date date,
  add column date_precision text;
update public.deadlines
set date_precision = case when is_rolling then 'rolling' else 'instant' end;
alter table public.deadlines
  alter column date_precision set not null,
  alter column date_precision set default 'unknown',
  add constraint deadlines_date_precision_check check (
    date_precision in ('instant', 'date_only', 'rolling', 'unknown')
  ),
  add constraint deadlines_value_precision_check check (
    (date_precision = 'instant' and due_at is not null and due_date is null and not is_rolling and timezone_name is not null)
    or (date_precision = 'date_only' and due_at is null and due_date is not null and not is_rolling)
    or (date_precision = 'rolling' and due_at is null and due_date is null and is_rolling)
    or (date_precision = 'unknown' and due_at is null and due_date is null and not is_rolling)
  );

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Admissions roadmap'
    check (length(btrim(title)) between 1 and 120),
  cycle_year smallint not null check (cycle_year between 2020 and 2200),
  timezone_name text not null check (length(timezone_name) between 1 and 80),
  availability_minutes_per_week integer not null default 300
    check (availability_minutes_per_week between 30 and 10080),
  status text not null default 'active' check (status in ('active', 'archived')),
  generation_version text not null default 'roadmap-v1'
    check (generation_version ~ '^[a-z0-9][a-z0-9._-]{1,39}$'),
  last_input_hash text check (last_input_hash is null or last_input_hash ~ '^[a-f0-9]{64}$'),
  last_generated_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cycle_year),
  unique (id, user_id)
);

create table public.roadmap_targets (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  user_id uuid not null,
  catalog_entity_id bigint not null references public.catalog_entities(id) on delete restrict,
  target_type text not null check (target_type in ('program', 'scholarship')),
  title_snapshot text not null check (length(btrim(title_snapshot)) between 1 and 300),
  detail_path text not null check (detail_path ~ '^/[a-z0-9/_-]+$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (roadmap_id, user_id) references public.roadmaps(id, user_id) on delete cascade,
  unique (roadmap_id, catalog_entity_id),
  unique (id, roadmap_id, user_id)
);

create table public.roadmap_milestones (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  user_id uuid not null,
  target_id uuid,
  generation_key text not null check (generation_key ~ '^[a-z0-9][a-z0-9:._-]{1,159}$'),
  title text not null check (length(btrim(title)) between 1 and 240),
  description text not null default '' check (length(description) <= 2000),
  sequence integer not null check (sequence between 0 and 10000),
  recommended_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (roadmap_id, user_id) references public.roadmaps(id, user_id) on delete cascade,
  foreign key (target_id, roadmap_id, user_id)
    references public.roadmap_targets(id, roadmap_id, user_id) on delete restrict,
  unique (roadmap_id, generation_key),
  unique (id, roadmap_id, user_id)
);

create table public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  user_id uuid not null,
  milestone_id uuid,
  target_id uuid,
  generation_key text check (
    generation_key is null or generation_key ~ '^[a-z0-9][a-z0-9:._-]{1,199}$'
  ),
  origin text not null check (origin in ('generated', 'manual')),
  task_kind text not null check (
    task_kind in (
      'research', 'verify_requirement', 'academic_preparation', 'test_preparation',
      'document', 'recommendation', 'essay', 'fee', 'application', 'interview',
      'decision', 'visa', 'enrollment', 'scholarship', 'other'
    )
  ),
  title text not null check (length(btrim(title)) between 1 and 240),
  description text not null default '' check (length(description) <= 4000),
  why_it_matters text not null default '' check (length(why_it_matters) <= 2000),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'completed')),
  generated_priority text not null default 'medium'
    check (generated_priority in ('low', 'medium', 'high', 'critical')),
  priority_override text check (
    priority_override is null or priority_override in ('low', 'medium', 'high', 'critical')
  ),
  is_mandatory boolean not null default true,
  official_deadline_at timestamptz,
  official_deadline_date date,
  official_deadline_precision text not null default 'unknown'
    check (official_deadline_precision in ('instant', 'date_only', 'rolling', 'unknown')),
  official_deadline_timezone text check (
    official_deadline_timezone is null or length(official_deadline_timezone) <= 80
  ),
  official_source_url text check (
    official_source_url is null or official_source_url ~ '^https://[^[:space:]]+$'
  ),
  official_source_checked_at timestamptz,
  recommended_due_date date,
  target_date date,
  estimated_minutes integer not null default 30 check (estimated_minutes between 5 and 10080),
  note text check (note is null or length(note) <= 4000),
  source_requirement_id bigint references public.eligibility_requirements(id) on delete set null,
  source_deadline_id bigint references public.deadlines(id) on delete set null,
  completed_at timestamptz,
  obsolete_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (roadmap_id, user_id) references public.roadmaps(id, user_id) on delete cascade,
  foreign key (milestone_id, roadmap_id, user_id)
    references public.roadmap_milestones(id, roadmap_id, user_id) on delete restrict,
  foreign key (target_id, roadmap_id, user_id)
    references public.roadmap_targets(id, roadmap_id, user_id) on delete restrict,
  unique (roadmap_id, generation_key),
  unique (id, roadmap_id, user_id),
  check ((origin = 'generated') = (generation_key is not null)),
  check (
    (official_deadline_precision = 'instant' and official_deadline_at is not null and official_deadline_date is null and official_deadline_timezone is not null)
    or (official_deadline_precision = 'date_only' and official_deadline_at is null and official_deadline_date is not null)
    or (official_deadline_precision in ('rolling', 'unknown') and official_deadline_at is null and official_deadline_date is null)
  ),
  check ((status = 'completed') = (completed_at is not null))
);

create table public.roadmap_task_dependencies (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  user_id uuid not null,
  task_id uuid not null,
  depends_on_task_id uuid not null,
  dependency_type text not null default 'mandatory'
    check (dependency_type in ('mandatory', 'optional')),
  origin text not null default 'generated' check (origin in ('generated', 'manual')),
  created_at timestamptz not null default now(),
  foreign key (roadmap_id, user_id) references public.roadmaps(id, user_id) on delete cascade,
  foreign key (task_id, roadmap_id, user_id)
    references public.roadmap_tasks(id, roadmap_id, user_id) on delete cascade,
  foreign key (depends_on_task_id, roadmap_id, user_id)
    references public.roadmap_tasks(id, roadmap_id, user_id) on delete cascade,
  unique (roadmap_id, task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table public.roadmap_generation_runs (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  user_id uuid not null,
  generation_version text not null,
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  profile_version bigint,
  change_summary jsonb not null default '{}'::jsonb
    check (jsonb_typeof(change_summary) = 'object' and octet_length(change_summary::text) <= 16000),
  created_at timestamptz not null default now(),
  foreign key (roadmap_id, user_id) references public.roadmaps(id, user_id) on delete cascade,
  unique (roadmap_id, generation_version, input_hash)
);

create table public.roadmap_task_events (
  id bigint generated always as identity primary key,
  roadmap_id uuid not null,
  user_id uuid not null,
  task_id uuid not null,
  event_type text not null check (
    event_type in ('created', 'updated', 'status_changed', 'regenerated')
  ),
  from_status text,
  to_status text,
  task_version bigint not null,
  created_at timestamptz not null default now(),
  foreign key (roadmap_id, user_id) references public.roadmaps(id, user_id) on delete cascade,
  foreign key (task_id, roadmap_id, user_id)
    references public.roadmap_tasks(id, roadmap_id, user_id) on delete cascade
);

create index roadmaps_owner_recent_idx on public.roadmaps(user_id, updated_at desc);
create index roadmap_targets_owner_active_idx on public.roadmap_targets(user_id, roadmap_id, is_active);
create index roadmap_milestones_timeline_idx on public.roadmap_milestones(roadmap_id, is_active, sequence);
create index roadmap_tasks_board_idx on public.roadmap_tasks(roadmap_id, obsolete_at, status, recommended_due_date);
create index roadmap_tasks_target_idx on public.roadmap_tasks(target_id) where target_id is not null;
create index roadmap_tasks_requirement_idx on public.roadmap_tasks(source_requirement_id) where source_requirement_id is not null;
create index roadmap_tasks_deadline_idx on public.roadmap_tasks(source_deadline_id) where source_deadline_id is not null;
create index roadmap_dependencies_task_idx on public.roadmap_task_dependencies(task_id, dependency_type);
create index roadmap_dependencies_prerequisite_idx on public.roadmap_task_dependencies(depends_on_task_id);
create index roadmap_runs_owner_recent_idx on public.roadmap_generation_runs(user_id, created_at desc);
create index roadmap_events_task_recent_idx on public.roadmap_task_events(task_id, created_at desc);

alter table public.roadmaps enable row level security;
alter table public.roadmap_targets enable row level security;
alter table public.roadmap_milestones enable row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.roadmap_task_dependencies enable row level security;
alter table public.roadmap_generation_runs enable row level security;
alter table public.roadmap_task_events enable row level security;

create policy roadmaps_owner_all on public.roadmaps for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy roadmap_targets_owner_all on public.roadmap_targets for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy roadmap_milestones_owner_all on public.roadmap_milestones for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy roadmap_tasks_owner_all on public.roadmap_tasks for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy roadmap_dependencies_owner_all on public.roadmap_task_dependencies for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy roadmap_runs_owner_select on public.roadmap_generation_runs for select to authenticated
using ((select auth.uid()) = user_id);
create policy roadmap_runs_owner_insert on public.roadmap_generation_runs for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy roadmap_events_owner_select on public.roadmap_task_events for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.roadmaps, public.roadmap_targets, public.roadmap_milestones,
  public.roadmap_tasks, public.roadmap_task_dependencies, public.roadmap_generation_runs,
  public.roadmap_task_events from public, anon, authenticated;
grant select, insert, update, delete on table public.roadmaps, public.roadmap_targets,
  public.roadmap_milestones, public.roadmap_tasks, public.roadmap_task_dependencies
  to authenticated;
grant select, insert on table public.roadmap_generation_runs to authenticated;
grant select on table public.roadmap_task_events to authenticated;
grant usage, select on sequence public.roadmap_task_events_id_seq to authenticated;
grant all on table public.roadmaps, public.roadmap_targets, public.roadmap_milestones,
  public.roadmap_tasks, public.roadmap_task_dependencies, public.roadmap_generation_runs,
  public.roadmap_task_events to service_role;
grant usage, select on sequence public.roadmap_task_events_id_seq to service_role;

create function jetu_private.validate_roadmap_timezone()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names where name = new.timezone_name
  ) then
    raise exception using errcode = '22023', message = 'roadmap timezone must be an IANA zone';
  end if;
  if tg_op = 'UPDATE' then
    if new.version <> old.version + 1 then
      raise exception using errcode = '40001', message = 'roadmap version conflict';
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
revoke all on function jetu_private.validate_roadmap_timezone() from public, anon, authenticated, service_role;
create trigger validate_roadmap_timezone before insert or update on public.roadmaps
for each row execute function jetu_private.validate_roadmap_timezone();

create function jetu_private.prevent_roadmap_dependency_cycle()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if exists (
    with recursive reachable(task_id) as (
      select new.depends_on_task_id
      union
      select dependency.depends_on_task_id
      from public.roadmap_task_dependencies dependency
      join reachable on dependency.task_id = reachable.task_id
      where dependency.roadmap_id = new.roadmap_id
        and dependency.id <> new.id
    )
    select 1 from reachable where task_id = new.task_id
  ) then
    raise exception using errcode = '23514', message = 'roadmap dependency cycle detected';
  end if;
  return new;
end;
$$;
revoke all on function jetu_private.prevent_roadmap_dependency_cycle() from public, anon, authenticated, service_role;
create trigger prevent_roadmap_dependency_cycle
before insert or update of task_id, depends_on_task_id on public.roadmap_task_dependencies
for each row execute function jetu_private.prevent_roadmap_dependency_cycle();

create function jetu_private.validate_roadmap_task_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_unmet boolean;
begin
  if new.version <> old.version + 1 then
    raise exception using errcode = '40001', message = 'roadmap task version conflict';
  end if;

  select exists (
    select 1
    from public.roadmap_task_dependencies dependency
    join public.roadmap_tasks prerequisite
      on prerequisite.id = dependency.depends_on_task_id
      and prerequisite.roadmap_id = dependency.roadmap_id
      and prerequisite.user_id = dependency.user_id
    where dependency.task_id = new.id
      and dependency.roadmap_id = new.roadmap_id
      and dependency.dependency_type = 'mandatory'
      and (prerequisite.status <> 'completed' or prerequisite.obsolete_at is not null)
  ) into v_unmet;

  if new.status = 'completed' and v_unmet then
    raise exception using errcode = '23514', message = 'mandatory roadmap prerequisites are incomplete';
  end if;
  if new.status in ('todo', 'in_progress') and v_unmet then
    new.status := 'blocked';
  elsif new.status = 'blocked' and not v_unmet then
    new.status := 'todo';
  end if;

  if old.status = 'completed' and new.status <> 'completed' and exists (
    select 1
    from public.roadmap_task_dependencies dependency
    join public.roadmap_tasks dependent
      on dependent.id = dependency.task_id
      and dependent.roadmap_id = dependency.roadmap_id
      and dependent.user_id = dependency.user_id
    where dependency.depends_on_task_id = new.id
      and dependency.dependency_type = 'mandatory'
      and dependent.status = 'completed'
      and dependent.obsolete_at is null
  ) then
    raise exception using errcode = '23514', message = 'reopen completed dependent tasks first';
  end if;

  new.completed_at := case when new.status = 'completed'
    then coalesce(old.completed_at, now()) else null end;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function jetu_private.validate_roadmap_task_update() from public, anon, authenticated, service_role;
create trigger validate_roadmap_task_update before update on public.roadmap_tasks
for each row execute function jetu_private.validate_roadmap_task_update();

create function jetu_private.capture_roadmap_task_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.roadmap_task_events(
    roadmap_id, user_id, task_id, event_type, from_status, to_status, task_version
  ) values (
    new.roadmap_id,
    new.user_id,
    new.id,
    case
      when tg_op = 'INSERT' then 'created'
      when old.status is distinct from new.status then 'status_changed'
      when old.generation_key is not null then 'regenerated'
      else 'updated'
    end,
    case when tg_op = 'UPDATE' then old.status end,
    new.status,
    new.version
  );
  return new;
end;
$$;
revoke all on function jetu_private.capture_roadmap_task_event() from public, anon, authenticated, service_role;
create trigger capture_roadmap_task_event after insert or update on public.roadmap_tasks
for each row execute function jetu_private.capture_roadmap_task_event();

create function public.roadmap_apply_generation(
  p_cycle_year smallint,
  p_timezone_name text,
  p_availability_minutes_per_week integer,
  p_generation_version text,
  p_input_hash text,
  p_profile_version bigint,
  p_targets jsonb,
  p_milestones jsonb,
  p_tasks jsonb,
  p_dependencies jsonb
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_roadmap public.roadmaps%rowtype;
  v_item jsonb;
  v_target_id uuid;
  v_milestone_id uuid;
  v_task_id uuid;
  v_depends_on_id uuid;
  v_added integer := 0;
  v_obsolete integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_cycle_year not between 2020 and 2200
     or p_availability_minutes_per_week not between 30 and 10080
     or p_generation_version !~ '^[a-z0-9][a-z0-9._-]{1,39}$'
     or p_input_hash !~ '^[a-f0-9]{64}$'
     or jsonb_typeof(p_targets) <> 'array'
     or jsonb_typeof(p_milestones) <> 'array'
     or jsonb_typeof(p_tasks) <> 'array'
     or jsonb_typeof(p_dependencies) <> 'array'
     or jsonb_array_length(p_targets) > 20
     or jsonb_array_length(p_milestones) > 100
     or jsonb_array_length(p_tasks) > 500
     or jsonb_array_length(p_dependencies) > 1500 then
    raise exception using errcode = '22023', message = 'invalid roadmap generation payload';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone_name) then
    raise exception using errcode = '22023', message = 'roadmap timezone must be an IANA zone';
  end if;

  insert into public.roadmaps(user_id, cycle_year, timezone_name, availability_minutes_per_week)
  values(v_user_id, p_cycle_year, p_timezone_name, p_availability_minutes_per_week)
  on conflict (user_id, cycle_year) do nothing;

  select * into v_roadmap from public.roadmaps
  where user_id = v_user_id and cycle_year = p_cycle_year
  for update;

  if v_roadmap.last_input_hash = p_input_hash
     and v_roadmap.generation_version = p_generation_version then
    return jsonb_build_object(
      'roadmapId', v_roadmap.id,
      'version', v_roadmap.version,
      'unchanged', true,
      'added', 0,
      'obsolete', 0
    );
  end if;

  update public.roadmap_targets set is_active = false, updated_at = now()
  where roadmap_id = v_roadmap.id and user_id = v_user_id and is_active;

  for v_item in select value from jsonb_array_elements(p_targets)
  loop
    if not exists (
      select 1 from public.catalog_entities entity
      where entity.id = (v_item->>'catalogEntityId')::bigint
        and entity.entity_type = case v_item->>'targetType'
          when 'program' then 'degree_program' when 'scholarship' then 'scholarship' end
    ) then
      raise exception using errcode = '22023', message = 'invalid roadmap target';
    end if;
    insert into public.roadmap_targets(
      roadmap_id, user_id, catalog_entity_id, target_type, title_snapshot, detail_path
    ) values (
      v_roadmap.id, v_user_id, (v_item->>'catalogEntityId')::bigint,
      v_item->>'targetType', v_item->>'title', v_item->>'detailPath'
    )
    on conflict (roadmap_id, catalog_entity_id) do update set
      target_type = excluded.target_type,
      title_snapshot = excluded.title_snapshot,
      detail_path = excluded.detail_path,
      is_active = true,
      updated_at = now();
  end loop;

  update public.roadmap_milestones set is_active = false, updated_at = now()
  where roadmap_id = v_roadmap.id and user_id = v_user_id and is_active;
  for v_item in select value from jsonb_array_elements(p_milestones)
  loop
    v_target_id := null;
    if v_item->>'targetCatalogId' is not null then
      select id into v_target_id from public.roadmap_targets
      where roadmap_id = v_roadmap.id and user_id = v_user_id
        and catalog_entity_id = (v_item->>'targetCatalogId')::bigint and is_active;
    end if;
    insert into public.roadmap_milestones(
      roadmap_id, user_id, target_id, generation_key, title, description,
      sequence, recommended_date
    ) values (
      v_roadmap.id, v_user_id, v_target_id, v_item->>'generationKey',
      v_item->>'title', coalesce(v_item->>'description', ''),
      (v_item->>'sequence')::integer, nullif(v_item->>'recommendedDate', '')::date
    )
    on conflict (roadmap_id, generation_key) do update set
      target_id = excluded.target_id,
      title = excluded.title,
      description = excluded.description,
      sequence = excluded.sequence,
      recommended_date = excluded.recommended_date,
      is_active = true,
      updated_at = now();
  end loop;

  update public.roadmap_tasks set obsolete_at = now(), version = version + 1
  where roadmap_id = v_roadmap.id and user_id = v_user_id
    and origin = 'generated' and obsolete_at is null;
  get diagnostics v_obsolete = row_count;

  for v_item in select value from jsonb_array_elements(p_tasks)
  loop
    v_target_id := null;
    v_milestone_id := null;
    if v_item->>'targetCatalogId' is not null then
      select id into v_target_id from public.roadmap_targets
      where roadmap_id = v_roadmap.id and user_id = v_user_id
        and catalog_entity_id = (v_item->>'targetCatalogId')::bigint and is_active;
    end if;
    if v_item->>'milestoneKey' is not null then
      select id into v_milestone_id from public.roadmap_milestones
      where roadmap_id = v_roadmap.id and user_id = v_user_id
        and generation_key = v_item->>'milestoneKey' and is_active;
    end if;
    insert into public.roadmap_tasks(
      roadmap_id, user_id, milestone_id, target_id, generation_key, origin,
      task_kind, title, description, why_it_matters, generated_priority,
      is_mandatory, official_deadline_at, official_deadline_date,
      official_deadline_precision, official_deadline_timezone,
      official_source_url, official_source_checked_at, recommended_due_date,
      estimated_minutes, source_requirement_id, source_deadline_id
    ) values (
      v_roadmap.id, v_user_id, v_milestone_id, v_target_id,
      v_item->>'generationKey', 'generated', v_item->>'taskKind',
      v_item->>'title', coalesce(v_item->>'description', ''),
      coalesce(v_item->>'whyItMatters', ''), v_item->>'priority',
      coalesce((v_item->>'mandatory')::boolean, true),
      nullif(v_item->>'officialDeadlineAt', '')::timestamptz,
      nullif(v_item->>'officialDeadlineDate', '')::date,
      coalesce(v_item->>'deadlinePrecision', 'unknown'),
      nullif(v_item->>'deadlineTimezone', ''),
      nullif(v_item->>'sourceUrl', ''),
      nullif(v_item->>'sourceCheckedAt', '')::timestamptz,
      nullif(v_item->>'recommendedDueDate', '')::date,
      (v_item->>'estimatedMinutes')::integer,
      nullif(v_item->>'sourceRequirementId', '')::bigint,
      nullif(v_item->>'sourceDeadlineId', '')::bigint
    )
    on conflict (roadmap_id, generation_key) do update set
      milestone_id = excluded.milestone_id,
      target_id = excluded.target_id,
      task_kind = excluded.task_kind,
      title = excluded.title,
      description = excluded.description,
      why_it_matters = excluded.why_it_matters,
      generated_priority = excluded.generated_priority,
      is_mandatory = excluded.is_mandatory,
      official_deadline_at = excluded.official_deadline_at,
      official_deadline_date = excluded.official_deadline_date,
      official_deadline_precision = excluded.official_deadline_precision,
      official_deadline_timezone = excluded.official_deadline_timezone,
      official_source_url = excluded.official_source_url,
      official_source_checked_at = excluded.official_source_checked_at,
      recommended_due_date = excluded.recommended_due_date,
      estimated_minutes = excluded.estimated_minutes,
      source_requirement_id = excluded.source_requirement_id,
      source_deadline_id = excluded.source_deadline_id,
      obsolete_at = null,
      version = public.roadmap_tasks.version + 1,
      updated_at = now();
    if not found then v_added := v_added + 1; end if;
  end loop;

  delete from public.roadmap_task_dependencies
  where roadmap_id = v_roadmap.id and user_id = v_user_id and origin = 'generated';
  for v_item in select value from jsonb_array_elements(p_dependencies)
  loop
    select id into v_task_id from public.roadmap_tasks
    where roadmap_id = v_roadmap.id and user_id = v_user_id
      and generation_key = v_item->>'taskKey' and obsolete_at is null;
    select id into v_depends_on_id from public.roadmap_tasks
    where roadmap_id = v_roadmap.id and user_id = v_user_id
      and generation_key = v_item->>'dependsOnKey' and obsolete_at is null;
    if v_task_id is null or v_depends_on_id is null then
      raise exception using errcode = '22023', message = 'roadmap dependency task is missing';
    end if;
    insert into public.roadmap_task_dependencies(
      roadmap_id, user_id, task_id, depends_on_task_id, dependency_type, origin
    ) values (
      v_roadmap.id, v_user_id, v_task_id, v_depends_on_id,
      coalesce(v_item->>'dependencyType', 'mandatory'), 'generated'
    );
  end loop;

  update public.roadmap_tasks task set
    status = 'blocked', version = task.version + 1
  where task.roadmap_id = v_roadmap.id and task.user_id = v_user_id
    and task.obsolete_at is null and task.status in ('todo', 'in_progress')
    and exists (
      select 1 from public.roadmap_task_dependencies dependency
      join public.roadmap_tasks prerequisite on prerequisite.id = dependency.depends_on_task_id
      where dependency.task_id = task.id and dependency.dependency_type = 'mandatory'
        and (prerequisite.status <> 'completed' or prerequisite.obsolete_at is not null)
    );
  update public.roadmap_tasks task set
    status = 'todo', version = task.version + 1
  where task.roadmap_id = v_roadmap.id and task.user_id = v_user_id
    and task.obsolete_at is null and task.status = 'blocked'
    and not exists (
      select 1 from public.roadmap_task_dependencies dependency
      join public.roadmap_tasks prerequisite on prerequisite.id = dependency.depends_on_task_id
      where dependency.task_id = task.id and dependency.dependency_type = 'mandatory'
        and (prerequisite.status <> 'completed' or prerequisite.obsolete_at is not null)
    );

  update public.roadmaps set
    timezone_name = p_timezone_name,
    availability_minutes_per_week = p_availability_minutes_per_week,
    status = 'active',
    generation_version = p_generation_version,
    last_input_hash = p_input_hash,
    last_generated_at = now(),
    version = version + 1
  where id = v_roadmap.id and user_id = v_user_id
  returning * into v_roadmap;

  insert into public.roadmap_generation_runs(
    roadmap_id, user_id, generation_version, input_hash, profile_version, change_summary
  ) values (
    v_roadmap.id, v_user_id, p_generation_version, p_input_hash, p_profile_version,
    jsonb_build_object('generatedTasks', jsonb_array_length(p_tasks), 'previousTasksMarkedObsolete', v_obsolete)
  ) on conflict (roadmap_id, generation_version, input_hash) do nothing;

  return jsonb_build_object(
    'roadmapId', v_roadmap.id,
    'version', v_roadmap.version,
    'unchanged', false,
    'generated', jsonb_array_length(p_tasks),
    'obsolete', v_obsolete
  );
end;
$$;
revoke all on function public.roadmap_apply_generation(
  smallint, text, integer, text, text, bigint, jsonb, jsonb, jsonb, jsonb
) from public, anon;
grant execute on function public.roadmap_apply_generation(
  smallint, text, integer, text, text, bigint, jsonb, jsonb, jsonb, jsonb
) to authenticated, service_role;

commit;
