begin;

-- A generated task cannot claim an official cutoff or source that is absent
-- from the published, verified catalog. This also covers direct Data API writes.
create function jetu_private.validate_roadmap_task_evidence()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.origin = 'manual' then
    if new.generation_key is not null or new.source_requirement_id is not null
      or new.source_deadline_id is not null or new.official_source_url is not null
      or new.official_deadline_precision <> 'unknown' then
      raise exception using errcode='23514', message='manual task cannot assert official evidence';
    end if;
  else
    if new.target_id is not null and not exists (
      select 1 from public.roadmap_targets target
      join public.catalog_entities entity on entity.id=target.catalog_entity_id
      where target.id=new.target_id and target.roadmap_id=new.roadmap_id
        and target.user_id=new.user_id and target.is_active
        and entity.publication_status_code='published'
        and entity.verification_state_code='verified'
    ) then
      raise exception using errcode='23514', message='generated target is not published and verified';
    end if;
    if new.official_deadline_precision in ('instant','date_only') then
      if new.source_deadline_id is null or new.official_source_url is null
        or not exists (
          select 1 from public.deadlines deadline
          join public.source_claims claim on claim.catalog_entity_id=deadline.id
          join public.official_sources source on source.id=claim.source_id
          where deadline.id=new.source_deadline_id
            and deadline.date_precision=new.official_deadline_precision
            and deadline.due_at is not distinct from new.official_deadline_at
            and deadline.due_date is not distinct from new.official_deadline_date
            and deadline.timezone_name is not distinct from new.official_deadline_timezone
            and claim.verification_state_code='verified'
            and source.canonical_url=new.official_source_url
            and source.is_active
            and source.last_checked_at<=now()
            and source.last_checked_at>=now()-interval '180 days'
        ) then
        raise exception using errcode='23514', message='official deadline evidence does not match catalog';
      end if;
    end if;
    if new.source_requirement_id is not null and new.target_id is not null
      and not exists (
        select 1 from public.roadmap_targets target
        where target.id=new.target_id and (
          (target.target_type='program' and exists (
            select 1 from public.program_eligibility_requirements link
            where link.program_id=target.catalog_entity_id
              and link.eligibility_requirement_id=new.source_requirement_id
          )) or (target.target_type='scholarship' and exists (
            select 1 from public.scholarship_cycles cycle
            join public.scholarship_eligibility_requirements link
              on link.scholarship_cycle_id=cycle.id
            where cycle.scholarship_id=target.catalog_entity_id
              and link.eligibility_requirement_id=new.source_requirement_id
          ))
        )
      ) then
      raise exception using errcode='23514', message='requirement is unrelated to target';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function jetu_private.validate_roadmap_task_evidence() from public,anon,authenticated,service_role;
create trigger validate_roadmap_task_evidence before insert or update
on public.roadmap_tasks for each row execute function jetu_private.validate_roadmap_task_evidence();

-- Child inserts also need an owner check when clients bypass the application API.
create function jetu_private.validate_roadmap_target()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if not exists (
    select 1 from public.catalog_entities entity
    where entity.id=new.catalog_entity_id
      and entity.entity_type=case new.target_type when 'program' then 'degree_program' when 'scholarship' then 'scholarship' end
      and entity.publication_status_code='published'
      and entity.verification_state_code='verified'
  ) then
    raise exception using errcode='23514',message='roadmap target is not published and verified';
  end if;
  return new;
end;
$$;
revoke all on function jetu_private.validate_roadmap_target() from public,anon,authenticated,service_role;
create trigger validate_roadmap_target before insert or update of catalog_entity_id,target_type,is_active
on public.roadmap_targets for each row execute function jetu_private.validate_roadmap_target();

commit;
