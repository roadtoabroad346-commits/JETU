-- Phase 18 hardening: nullable optional-source records must have typed storage,
-- and every scholarship state event must carry an idempotency key.
begin;

alter table public.scholarship_application_events
  alter column idempotency_key set not null;

create or replace function public.application_create(
  p_program_id bigint,
  p_intake_id bigint,
  p_cycle_year smallint,
  p_idempotency_key uuid
) returns public.applications
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_application public.applications%rowtype;
  v_program record;
  v_source_url text;
  v_source_checked_at timestamptz;
  v_deadline_at timestamptz;
  v_deadline_date date;
  v_deadline_precision text := 'unknown';
  v_deadline_timezone text;
  v_roadmap_task_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode='42501', message='authentication required';
  end if;
  if p_cycle_year not between 2020 and 2200 or p_idempotency_key is null then
    raise exception using errcode='22023', message='invalid application input';
  end if;
  select program.title,program.degree_level_code,institution.legal_name,country.iso2
  into v_program
  from public.degree_programs program
  join public.catalog_entities entity on entity.id=program.id
  join public.academic_units unit on unit.id=program.academic_unit_id
  join public.institutions institution on institution.id=unit.institution_id
  join public.countries country on country.id=institution.country_id
  where program.id=p_program_id and entity.publication_status_code='published'
    and entity.verification_state_code='verified' and entity.archived_at is null;
  if not found then
    raise exception using errcode='22023', message='program is not published and verified';
  end if;
  if p_intake_id is not null and not exists (
    select 1 from public.admission_intakes intake
    join public.catalog_entities entity on entity.id=intake.id
    where intake.id=p_intake_id and intake.program_id=p_program_id
      and intake.academic_year_start=p_cycle_year
      and entity.publication_status_code='published'
      and entity.verification_state_code='verified'
  ) then
    raise exception using errcode='22023', message='intake does not belong to the program and cycle';
  end if;

  select source.canonical_url,source.last_checked_at
  into v_source_url,v_source_checked_at
  from public.source_claims claim
  join public.official_sources source on source.id=claim.source_id
  where claim.catalog_entity_id=p_program_id
    and claim.verification_state_code='verified' and source.is_active
  order by source.last_checked_at desc limit 1;

  if p_intake_id is not null then
    select deadline.due_at,deadline.due_date,deadline.date_precision,deadline.timezone_name
    into v_deadline_at,v_deadline_date,v_deadline_precision,v_deadline_timezone
    from public.application_rounds round
    join public.application_round_deadlines link on link.application_round_id=round.id
    join public.deadlines deadline on deadline.id=link.deadline_id
    join public.source_claims claim on claim.catalog_entity_id=deadline.id
    join public.official_sources source on source.id=claim.source_id
    where round.intake_id=p_intake_id and claim.verification_state_code='verified'
      and source.is_active
    order by coalesce(deadline.due_at::date,deadline.due_date) nulls last limit 1;
  end if;

  select task.id into v_roadmap_task_id
  from public.roadmap_targets target
  join public.roadmap_tasks task on task.target_id=target.id
  where target.user_id=v_user_id and target.catalog_entity_id=p_program_id
    and target.is_active and task.obsolete_at is null
    and task.generation_key='program:'||p_program_id::text||':application:submit'
  order by task.updated_at desc limit 1;

  insert into public.applications(
    user_id,program_id,intake_id,cycle_year,program_title_snapshot,
    institution_name_snapshot,degree_level_snapshot,country_code_snapshot,
    program_source_url,program_source_checked_at,official_deadline_at,
    official_deadline_date,official_deadline_precision,official_deadline_timezone,
    roadmap_submission_task_id
  ) values (
    v_user_id,p_program_id,p_intake_id,p_cycle_year,v_program.title,
    v_program.legal_name,v_program.degree_level_code,v_program.iso2,
    v_source_url,v_source_checked_at,v_deadline_at,v_deadline_date,
    coalesce(v_deadline_precision,'unknown'),v_deadline_timezone,v_roadmap_task_id
  )
  on conflict (user_id,program_id,intake_id,cycle_year) do nothing
  returning * into v_application;
  if v_application.id is null then
    select * into v_application from public.applications
    where user_id=v_user_id and program_id=p_program_id
      and intake_id is not distinct from p_intake_id and cycle_year=p_cycle_year;
    return v_application;
  end if;

  insert into public.application_events(
    application_id,user_id,actor_id,event_type,to_status,source_type,idempotency_key
  ) values (
    v_application.id,v_user_id,v_user_id,'created','researching','USER_REPORTED',p_idempotency_key
  );
  insert into public.application_checklist_items(
    application_id,user_id,checklist_key,title,status,is_mandatory,origin,
    verification_state,roadmap_task_id,sort_order
  )
  select v_application.id,v_user_id,'roadmap:'||task.id::text,task.title,
    case when task.status='completed' then 'completed' else 'todo' end,
    task.is_mandatory,'roadmap',
    case when task.official_source_url is not null then 'verified' else 'unknown' end,
    task.id,row_number() over(order by milestone.sequence,task.created_at)::integer
  from public.roadmap_targets target
  join public.roadmap_tasks task on task.target_id=target.id
  left join public.roadmap_milestones milestone on milestone.id=task.milestone_id
  where target.user_id=v_user_id and target.catalog_entity_id=p_program_id
    and target.is_active and task.obsolete_at is null
    and task.task_kind in ('document','recommendation','essay','fee','application')
    and task.id is distinct from v_roadmap_task_id
  on conflict do nothing;
  if not exists (
    select 1 from public.application_checklist_items item
    where item.application_id=v_application.id and item.is_mandatory
  ) then
    insert into public.application_checklist_items(
      application_id,user_id,checklist_key,title,is_mandatory,origin,
      verification_state,sort_order
    ) values
      (v_application.id,v_user_id,'system:confirm_requirements','Confirm current official requirements',true,'system','unknown',10),
      (v_application.id,v_user_id,'system:prepare_materials','Prepare required application materials',true,'system','unknown',20),
      (v_application.id,v_user_id,'system:final_review','Review the application before external submission',true,'system','user_created',30);
  end if;
  return v_application;
end;
$$;

create or replace function public.application_add_scholarship(
  p_application_id uuid,
  p_scholarship_id bigint,
  p_scholarship_cycle_id bigint,
  p_cycle_year smallint,
  p_idempotency_key uuid
) returns public.scholarship_applications
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.scholarship_applications%rowtype;
  v_title text;
  v_source_url text;
  v_deadline_at timestamptz;
  v_deadline_date date;
  v_deadline_precision text := 'unknown';
  v_deadline_timezone text;
begin
  if v_user_id is null then raise exception using errcode='42501',message='authentication required'; end if;
  if not exists(select 1 from public.applications where id=p_application_id and user_id=v_user_id)
    or p_idempotency_key is null or p_cycle_year not between 2020 and 2200 then
    raise exception using errcode='22023',message='invalid scholarship application input';
  end if;
  select scholarship.title into v_title from public.scholarships scholarship
  join public.catalog_entities entity on entity.id=scholarship.id
  where scholarship.id=p_scholarship_id and entity.publication_status_code='published'
    and entity.verification_state_code='verified' and entity.archived_at is null;
  if v_title is null then raise exception using errcode='22023',message='scholarship is not published and verified'; end if;
  if p_scholarship_cycle_id is not null and not exists(
    select 1 from public.scholarship_cycles cycle where cycle.id=p_scholarship_cycle_id
      and cycle.scholarship_id=p_scholarship_id and cycle.academic_year_start=p_cycle_year
  ) then raise exception using errcode='22023',message='scholarship cycle does not match'; end if;
  select source.canonical_url into v_source_url
  from public.source_claims claim join public.official_sources source on source.id=claim.source_id
  where claim.catalog_entity_id=p_scholarship_id and claim.verification_state_code='verified' and source.is_active
  order by source.last_checked_at desc limit 1;
  if p_scholarship_cycle_id is not null then
    select deadline.due_at,deadline.due_date,deadline.date_precision,deadline.timezone_name
    into v_deadline_at,v_deadline_date,v_deadline_precision,v_deadline_timezone
    from public.scholarship_cycle_deadlines link
    join public.deadlines deadline on deadline.id=link.deadline_id
    join public.source_claims claim on claim.catalog_entity_id=deadline.id
    where link.scholarship_cycle_id=p_scholarship_cycle_id and claim.verification_state_code='verified'
    order by coalesce(deadline.due_at::date,deadline.due_date) nulls last limit 1;
  end if;
  insert into public.scholarship_applications(
    user_id,application_id,scholarship_id,scholarship_cycle_id,cycle_year,
    scholarship_title_snapshot,source_url,deadline_at,deadline_date,deadline_precision,deadline_timezone
  ) values (
    v_user_id,p_application_id,p_scholarship_id,p_scholarship_cycle_id,p_cycle_year,
    v_title,v_source_url,v_deadline_at,v_deadline_date,coalesce(v_deadline_precision,'unknown'),v_deadline_timezone
  ) on conflict (user_id,scholarship_id,scholarship_cycle_id,cycle_year) do nothing
  returning * into v_row;
  if v_row.id is null then
    select * into v_row from public.scholarship_applications
    where user_id=v_user_id and scholarship_id=p_scholarship_id
      and scholarship_cycle_id is not distinct from p_scholarship_cycle_id and cycle_year=p_cycle_year;
    return v_row;
  end if;
  insert into public.scholarship_application_events(
    scholarship_application_id,user_id,actor_id,to_status,source_type,idempotency_key
  ) values(v_row.id,v_user_id,v_user_id,'researching','USER_REPORTED',p_idempotency_key);
  insert into public.application_events(
    application_id,user_id,actor_id,event_type,source_type,details
  ) values(p_application_id,v_user_id,v_user_id,'scholarship_linked','USER_REPORTED',jsonb_build_object('scholarshipApplicationId',v_row.id));
  return v_row;
end;
$$;

commit;
