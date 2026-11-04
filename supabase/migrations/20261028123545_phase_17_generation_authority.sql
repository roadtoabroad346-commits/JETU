-- Trusted generation is server-only; ordinary owner edits remain under RLS.
begin;

alter function public.roadmap_apply_generation(smallint,text,integer,text,text,bigint,jsonb,jsonb,jsonb,jsonb)
  set schema jetu_private;
revoke all on function jetu_private.roadmap_apply_generation(smallint,text,integer,text,text,bigint,jsonb,jsonb,jsonb,jsonb)
  from public,anon,authenticated,service_role;

create or replace function jetu_private.roadmap_apply_generation(
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

  -- Old generated edges must not constrain an intermediate regeneration state.
  -- The entire graph replacement is atomic and rechecked below before commit.
  delete from public.roadmap_task_dependencies
  where roadmap_id = v_roadmap.id and user_id = v_user_id and origin = 'generated';

  update public.roadmap_tasks set obsolete_at = now(), version = version + 1
  where roadmap_id = v_roadmap.id and user_id = v_user_id
    and origin = 'generated' and obsolete_at is null
    and not exists (select 1 from jsonb_array_elements(p_tasks) item
      where item->>'generationKey' = public.roadmap_tasks.generation_key);
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

  -- A changed graph must never leave a completed submit with incomplete work.
  -- Roll back atomically; the owner can reopen dependents before regeneration.
  if exists (
    select 1 from public.roadmap_tasks task
    join public.roadmap_task_dependencies edge on edge.task_id=task.id
      and edge.roadmap_id=task.roadmap_id and edge.user_id=task.user_id
    join public.roadmap_tasks prerequisite on prerequisite.id=edge.depends_on_task_id
    where task.roadmap_id=v_roadmap.id and task.user_id=v_user_id
      and task.obsolete_at is null and task.status='completed'
      and edge.dependency_type='mandatory'
      and (prerequisite.status<>'completed' or prerequisite.obsolete_at is not null)
  ) then
    raise exception using errcode='23514',message='reopen completed dependents before changing roadmap prerequisites';
  end if;

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

create function public.roadmap_apply_generation(
  p_user_id uuid, p_cycle_year smallint, p_timezone_name text,
  p_availability_minutes_per_week integer, p_generation_version text,
  p_input_hash text, p_profile_version bigint, p_targets jsonb,
  p_milestones jsonb, p_tasks jsonb, p_dependencies jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_previous_sub text := current_setting('request.jwt.claim.sub',true);
  v_result jsonb;
begin
  -- SQL role, not editable JWT metadata, is the trust boundary.
  if current_setting('role',true) <> 'service_role' or p_user_id is null then
    raise exception using errcode='42501',message='trusted roadmap generation required';
  end if;
  if not exists (select 1 from auth.users where id=p_user_id) then
    raise exception using errcode='42501',message='roadmap owner unavailable';
  end if;
  perform set_config('request.jwt.claim.sub',p_user_id::text,true);
  v_result := jetu_private.roadmap_apply_generation(
    p_cycle_year,p_timezone_name,p_availability_minutes_per_week,
    p_generation_version,p_input_hash,p_profile_version,p_targets,
    p_milestones,p_tasks,p_dependencies
  );
  perform set_config('request.jwt.claim.sub',coalesce(v_previous_sub,''),true);
  return v_result;
end;
$$;
revoke all on function public.roadmap_apply_generation(uuid,smallint,text,integer,text,text,bigint,jsonb,jsonb,jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function public.roadmap_apply_generation(uuid,smallint,text,integer,text,text,bigint,jsonb,jsonb,jsonb,jsonb)
  to service_role;

-- Targets, milestones, generation history and generated edges are server-owned.
revoke insert,update,delete on public.roadmap_targets,public.roadmap_milestones,
  public.roadmap_generation_runs from authenticated;

create function jetu_private.guard_roadmap_generation_authority()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if current_user <> 'authenticated' then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  if tg_table_name='roadmap_task_dependencies' then
    if (tg_op<>'INSERT' and old.origin='generated')
       or (tg_op<>'DELETE' and new.origin='generated') then
      raise exception using errcode='42501',message='generated dependencies are server-owned';
    end if;
  elsif tg_op='INSERT' then
    if new.origin <> 'manual' then
      raise exception using errcode='42501',message='generated tasks are server-owned';
    end if;
  elsif tg_op='DELETE' then
    if old.origin='generated' then
      raise exception using errcode='42501',message='generated tasks are server-owned';
    end if;
  elsif new.origin is distinct from old.origin or
    (old.origin='generated' and
      (to_jsonb(new)-array['status','priority_override','target_date','note','version','completed_at','updated_at'])
        is distinct from
      (to_jsonb(old)-array['status','priority_override','target_date','note','version','completed_at','updated_at'])) then
    raise exception using errcode='42501',message='generated facts are server-owned';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function jetu_private.guard_roadmap_generation_authority() from public,anon,authenticated,service_role;
create trigger a_guard_roadmap_generation_authority before insert or update or delete
on public.roadmap_tasks for each row execute function jetu_private.guard_roadmap_generation_authority();
create trigger a_guard_roadmap_dependency_authority before insert or update or delete
on public.roadmap_task_dependencies for each row execute function jetu_private.guard_roadmap_generation_authority();

commit;
