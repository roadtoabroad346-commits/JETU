-- Phase 18: owner-scoped application CRM with guarded transitions and immutable history.
begin;

alter table public.roadmap_tasks
  add constraint roadmap_tasks_id_user_unique unique (id, user_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id bigint not null references public.degree_programs(id) on delete restrict,
  intake_id bigint references public.admission_intakes(id) on delete restrict,
  cycle_year smallint not null check (cycle_year between 2020 and 2200),
  program_title_snapshot text not null check (length(btrim(program_title_snapshot)) between 1 and 300),
  institution_name_snapshot text not null check (length(btrim(institution_name_snapshot)) between 1 and 300),
  degree_level_snapshot text not null check (length(btrim(degree_level_snapshot)) between 1 and 80),
  country_code_snapshot text check (country_code_snapshot is null or country_code_snapshot ~ '^[A-Z]{2}$'),
  status text not null default 'researching' check (status in (
    'researching','shortlisted','preparing','ready_for_review','ready_to_submit',
    'submitted_external_confirmed','under_review','interview','offer','waitlist',
    'rejected','accepted','declined','enrollment','withdrawn'
  )),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  official_portal_url text check (official_portal_url is null or official_portal_url ~ '^https://[^[:space:]]+$'),
  program_source_url text check (program_source_url is null or program_source_url ~ '^https://[^[:space:]]+$'),
  program_source_checked_at timestamptz,
  official_deadline_at timestamptz,
  official_deadline_date date,
  official_deadline_precision text not null default 'unknown'
    check (official_deadline_precision in ('instant','date_only','rolling','unknown')),
  official_deadline_timezone text check (official_deadline_timezone is null or length(official_deadline_timezone) <= 80),
  application_fee_amount numeric(14,2) check (application_fee_amount is null or application_fee_amount >= 0),
  application_fee_currency text references public.fee_currency(code) on delete restrict,
  fee_waiver_state text not null default 'unknown' check (fee_waiver_state in ('available','not_available','unknown')),
  user_reference_id text check (user_reference_id is null or length(btrim(user_reference_id)) between 1 and 160),
  notes text not null default '' check (length(notes) <= 12000),
  submitted_at timestamptz,
  submission_evidence text check (submission_evidence is null or length(btrim(submission_evidence)) between 3 and 2000),
  submission_provenance text check (submission_provenance is null or submission_provenance = 'USER_REPORTED'),
  roadmap_submission_task_id uuid,
  archived_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (roadmap_submission_task_id, user_id)
    references public.roadmap_tasks(id, user_id) on delete set null,
  unique nulls not distinct (user_id, program_id, intake_id, cycle_year),
  unique (id, user_id),
  check ((application_fee_amount is null) = (application_fee_currency is null)),
  check (
    (official_deadline_precision = 'instant' and official_deadline_at is not null and official_deadline_date is null and official_deadline_timezone is not null)
    or (official_deadline_precision = 'date_only' and official_deadline_at is null and official_deadline_date is not null)
    or (official_deadline_precision in ('rolling','unknown') and official_deadline_at is null and official_deadline_date is null)
  ),
  check (
    status <> 'submitted_external_confirmed'
    or (submitted_at is not null and submission_evidence is not null and submission_provenance = 'USER_REPORTED')
  )
);

create table public.application_checklist_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  user_id uuid not null,
  checklist_key text check (checklist_key is null or checklist_key ~ '^[a-z0-9][a-z0-9:._-]{1,159}$'),
  title text not null check (length(btrim(title)) between 1 and 240),
  status text not null default 'todo' check (status in ('todo','completed','not_applicable')),
  is_mandatory boolean not null default true,
  origin text not null check (origin in ('system','roadmap','manual')),
  verification_state text not null default 'unknown'
    check (verification_state in ('verified','unknown','user_created')),
  source_claim_id bigint references public.source_claims(id) on delete set null,
  roadmap_task_id uuid,
  completed_at timestamptz,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (application_id, user_id) references public.applications(id, user_id) on delete cascade,
  foreign key (roadmap_task_id, user_id) references public.roadmap_tasks(id, user_id) on delete set null,
  unique (application_id, checklist_key),
  unique (application_id, roadmap_task_id),
  unique (id, application_id, user_id),
  check ((status = 'completed') = (completed_at is not null)),
  check (origin = 'manual' or checklist_key is not null)
);

create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null,
  user_id uuid not null,
  actor_id uuid not null,
  event_type text not null check (event_type in (
    'created','status_changed','metadata_updated','checklist_created',
    'checklist_updated','scholarship_linked'
  )),
  from_status text,
  to_status text,
  source_type text not null check (source_type in ('SYSTEM','USER_REPORTED')),
  reason text check (reason is null or length(btrim(reason)) between 1 and 2000),
  evidence text check (evidence is null or length(btrim(evidence)) between 1 and 2000),
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 12000),
  idempotency_key uuid,
  occurred_at timestamptz not null default now(),
  foreign key (application_id, user_id) references public.applications(id, user_id) on delete cascade,
  unique (application_id, idempotency_key)
);

create table public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid,
  scholarship_id bigint not null references public.scholarships(id) on delete restrict,
  scholarship_cycle_id bigint references public.scholarship_cycles(id) on delete restrict,
  cycle_year smallint not null check (cycle_year between 2020 and 2200),
  scholarship_title_snapshot text not null check (length(btrim(scholarship_title_snapshot)) between 1 and 300),
  status text not null default 'researching' check (status in (
    'researching','preparing','ready_to_submit','submitted_external_confirmed',
    'under_review','awarded','not_awarded','withdrawn'
  )),
  official_portal_url text check (official_portal_url is null or official_portal_url ~ '^https://[^[:space:]]+$'),
  source_url text check (source_url is null or source_url ~ '^https://[^[:space:]]+$'),
  deadline_at timestamptz,
  deadline_date date,
  deadline_precision text not null default 'unknown'
    check (deadline_precision in ('instant','date_only','rolling','unknown')),
  deadline_timezone text check (deadline_timezone is null or length(deadline_timezone) <= 80),
  user_reference_id text check (user_reference_id is null or length(btrim(user_reference_id)) between 1 and 160),
  notes text not null default '' check (length(notes) <= 8000),
  submitted_at timestamptz,
  submission_evidence text check (submission_evidence is null or length(btrim(submission_evidence)) between 3 and 2000),
  submission_provenance text check (submission_provenance is null or submission_provenance = 'USER_REPORTED'),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (application_id, user_id) references public.applications(id, user_id) on delete cascade,
  unique nulls not distinct (user_id, scholarship_id, scholarship_cycle_id, cycle_year),
  unique (id, user_id),
  check (
    (deadline_precision = 'instant' and deadline_at is not null and deadline_date is null and deadline_timezone is not null)
    or (deadline_precision = 'date_only' and deadline_at is null and deadline_date is not null)
    or (deadline_precision in ('rolling','unknown') and deadline_at is null and deadline_date is null)
  ),
  check (
    status <> 'submitted_external_confirmed'
    or (submitted_at is not null and submission_evidence is not null and submission_provenance = 'USER_REPORTED')
  )
);

create table public.scholarship_application_events (
  id bigint generated always as identity primary key,
  scholarship_application_id uuid not null,
  user_id uuid not null,
  actor_id uuid not null,
  from_status text,
  to_status text not null,
  source_type text not null check (source_type in ('SYSTEM','USER_REPORTED')),
  reason text check (reason is null or length(btrim(reason)) between 1 and 2000),
  evidence text check (evidence is null or length(btrim(evidence)) between 1 and 2000),
  idempotency_key uuid,
  occurred_at timestamptz not null default now(),
  foreign key (scholarship_application_id, user_id)
    references public.scholarship_applications(id, user_id) on delete cascade,
  unique (scholarship_application_id, idempotency_key)
);

create index applications_owner_stage_idx on public.applications(user_id, archived_at, status, updated_at desc);
create index applications_program_idx on public.applications(program_id);
create index applications_intake_idx on public.applications(intake_id) where intake_id is not null;
create index applications_roadmap_task_idx on public.applications(roadmap_submission_task_id) where roadmap_submission_task_id is not null;
create index applications_roadmap_task_owner_idx on public.applications(roadmap_submission_task_id, user_id) where roadmap_submission_task_id is not null;
create index checklist_application_status_idx on public.application_checklist_items(application_id, status, sort_order);
create index checklist_application_owner_idx on public.application_checklist_items(application_id, user_id);
create index checklist_owner_idx on public.application_checklist_items(user_id, application_id);
create index checklist_roadmap_task_idx on public.application_checklist_items(roadmap_task_id) where roadmap_task_id is not null;
create index checklist_source_claim_idx on public.application_checklist_items(source_claim_id) where source_claim_id is not null;
create index application_events_owner_recent_idx on public.application_events(user_id, application_id, occurred_at desc);
create index application_events_application_owner_idx on public.application_events(application_id, user_id);
create index scholarship_apps_owner_stage_idx on public.scholarship_applications(user_id, status, updated_at desc);
create index scholarship_apps_application_idx on public.scholarship_applications(application_id) where application_id is not null;
create index scholarship_apps_application_owner_idx on public.scholarship_applications(application_id, user_id) where application_id is not null;
create index scholarship_apps_scholarship_idx on public.scholarship_applications(scholarship_id);
create index scholarship_apps_cycle_idx on public.scholarship_applications(scholarship_cycle_id) where scholarship_cycle_id is not null;
create index scholarship_events_owner_recent_idx on public.scholarship_application_events(user_id, scholarship_application_id, occurred_at desc);
create index scholarship_events_application_owner_idx on public.scholarship_application_events(scholarship_application_id, user_id);

alter table public.applications enable row level security;
alter table public.application_checklist_items enable row level security;
alter table public.application_events enable row level security;
alter table public.scholarship_applications enable row level security;
alter table public.scholarship_application_events enable row level security;

create policy applications_owner_read on public.applications for select to authenticated
using ((select auth.uid()) = user_id);
create policy checklist_owner_read on public.application_checklist_items for select to authenticated
using ((select auth.uid()) = user_id);
create policy application_events_owner_read on public.application_events for select to authenticated
using ((select auth.uid()) = user_id);
create policy scholarship_applications_owner_read on public.scholarship_applications for select to authenticated
using ((select auth.uid()) = user_id);
create policy scholarship_events_owner_read on public.scholarship_application_events for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.applications, public.application_checklist_items,
  public.application_events, public.scholarship_applications,
  public.scholarship_application_events from public, anon, authenticated;
grant select on table public.applications, public.application_checklist_items,
  public.application_events, public.scholarship_applications,
  public.scholarship_application_events to authenticated;
grant all on table public.applications, public.application_checklist_items,
  public.application_events, public.scholarship_applications,
  public.scholarship_application_events to service_role;
grant usage, select on sequence public.application_events_id_seq,
  public.scholarship_application_events_id_seq to service_role;

create function jetu_private.application_transition_allowed(p_from text, p_to text)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select case p_from
    when 'researching' then p_to in ('shortlisted','withdrawn')
    when 'shortlisted' then p_to in ('researching','preparing','withdrawn')
    when 'preparing' then p_to in ('shortlisted','ready_for_review','withdrawn')
    when 'ready_for_review' then p_to in ('preparing','ready_to_submit','withdrawn')
    when 'ready_to_submit' then p_to in ('ready_for_review','submitted_external_confirmed','withdrawn')
    when 'submitted_external_confirmed' then p_to in ('under_review','withdrawn')
    when 'under_review' then p_to in ('interview','offer','waitlist','rejected','withdrawn')
    when 'interview' then p_to in ('under_review','offer','waitlist','rejected','withdrawn')
    when 'waitlist' then p_to in ('offer','rejected','withdrawn')
    when 'offer' then p_to in ('accepted','declined','withdrawn')
    when 'accepted' then p_to in ('enrollment','declined','withdrawn')
    when 'withdrawn' then p_to = 'researching'
    else false
  end
$$;
revoke all on function jetu_private.application_transition_allowed(text,text)
from public, anon, authenticated, service_role;

create function jetu_private.scholarship_transition_allowed(p_from text, p_to text)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select case p_from
    when 'researching' then p_to in ('preparing','withdrawn')
    when 'preparing' then p_to in ('researching','ready_to_submit','withdrawn')
    when 'ready_to_submit' then p_to in ('preparing','submitted_external_confirmed','withdrawn')
    when 'submitted_external_confirmed' then p_to in ('under_review','withdrawn')
    when 'under_review' then p_to in ('awarded','not_awarded','withdrawn')
    when 'withdrawn' then p_to = 'researching'
    else false
  end
$$;
revoke all on function jetu_private.scholarship_transition_allowed(text,text)
from public, anon, authenticated, service_role;

create function jetu_private.prevent_event_mutation()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode='42501', message='application history is append-only';
end;
$$;
revoke all on function jetu_private.prevent_event_mutation() from public,anon,authenticated,service_role;
create trigger application_events_append_only before update or delete on public.application_events
for each row execute function jetu_private.prevent_event_mutation();
create trigger scholarship_events_append_only before update or delete on public.scholarship_application_events
for each row execute function jetu_private.prevent_event_mutation();

create function jetu_private.validate_application_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.version <> old.version + 1 then
    raise exception using errcode='40001', message='application version conflict';
  end if;
  if new.program_id <> old.program_id or new.user_id <> old.user_id
    or new.cycle_year <> old.cycle_year or new.intake_id is distinct from old.intake_id then
    raise exception using errcode='23514', message='application identity is immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function jetu_private.validate_application_update() from public,anon,authenticated,service_role;
create trigger validate_application_update before update on public.applications
for each row execute function jetu_private.validate_application_update();

create function jetu_private.validate_checklist_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.version <> old.version + 1 then
      raise exception using errcode='40001', message='checklist version conflict';
    end if;
    if new.application_id <> old.application_id or new.user_id <> old.user_id
      or new.origin <> old.origin or new.roadmap_task_id is distinct from old.roadmap_task_id
      or new.source_claim_id is distinct from old.source_claim_id then
      raise exception using errcode='23514', message='checklist evidence identity is immutable';
    end if;
    if old.origin <> 'manual' and (new.title <> old.title or new.is_mandatory <> old.is_mandatory) then
      raise exception using errcode='23514', message='generated checklist fields are immutable';
    end if;
    new.updated_at := now();
  end if;
  new.completed_at := case when new.status='completed'
    then coalesce(old.completed_at, now()) else null end;
  return new;
end;
$$;
revoke all on function jetu_private.validate_checklist_update() from public,anon,authenticated,service_role;
create trigger validate_checklist_update before update on public.application_checklist_items
for each row execute function jetu_private.validate_checklist_update();

create function jetu_private.capture_checklist_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.application_events(
    application_id,user_id,actor_id,event_type,source_type,details
  ) values (
    new.application_id,new.user_id,coalesce((select auth.uid()),new.user_id),
    case when tg_op='INSERT' then 'checklist_created' else 'checklist_updated' end,
    case when new.origin='system' then 'SYSTEM' else 'USER_REPORTED' end,
    jsonb_build_object('checklistItemId',new.id,'status',new.status,'mandatory',new.is_mandatory)
  );
  return new;
end;
$$;
revoke all on function jetu_private.capture_checklist_event() from public,anon,authenticated,service_role;
create trigger capture_checklist_event after insert or update on public.application_checklist_items
for each row execute function jetu_private.capture_checklist_event();

create function public.application_create(
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
  v_deadline record;
  v_source record;
  v_roadmap_task_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode='42501', message='authentication required';
  end if;
  if p_cycle_year not between 2020 and 2200 or p_idempotency_key is null then
    raise exception using errcode='22023', message='invalid application input';
  end if;
  select program.title, program.degree_level_code, institution.legal_name,
    country.iso2
  into v_program
  from public.degree_programs program
  join public.catalog_entities entity on entity.id=program.id
  join public.academic_units unit on unit.id=program.academic_unit_id
  join public.institutions institution on institution.id=unit.institution_id
  join public.countries country on country.id=institution.country_id
  where program.id=p_program_id
    and entity.publication_status_code='published'
    and entity.verification_state_code='verified'
    and entity.archived_at is null;
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

  select source.canonical_url, source.last_checked_at into v_source
  from public.source_claims claim
  join public.official_sources source on source.id=claim.source_id
  where claim.catalog_entity_id=p_program_id
    and claim.verification_state_code='verified' and source.is_active
  order by source.last_checked_at desc limit 1;

  if p_intake_id is not null then
    select deadline.due_at,deadline.due_date,deadline.date_precision,
      deadline.timezone_name,source.canonical_url,source.last_checked_at
    into v_deadline
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
    v_source.canonical_url,v_source.last_checked_at,v_deadline.due_at,
    v_deadline.due_date,coalesce(v_deadline.date_precision,'unknown'),
    v_deadline.timezone_name,v_roadmap_task_id
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
revoke all on function public.application_create(bigint,bigint,smallint,uuid) from public,anon;
grant execute on function public.application_create(bigint,bigint,smallint,uuid) to authenticated,service_role;

create function public.application_update_metadata(
  p_application_id uuid,
  p_expected_version bigint,
  p_notes text,
  p_user_reference_id text,
  p_priority text
) returns public.applications
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.applications%rowtype;
begin
  if v_user_id is null then raise exception using errcode='42501',message='authentication required'; end if;
  if length(coalesce(p_notes,''))>12000 or length(coalesce(p_user_reference_id,''))>160
    or p_priority not in ('low','medium','high','critical') then
    raise exception using errcode='22023',message='invalid application metadata';
  end if;
  update public.applications set
    notes=coalesce(p_notes,''),
    user_reference_id=nullif(btrim(p_user_reference_id),''),
    priority=p_priority,
    version=version+1
  where id=p_application_id and user_id=v_user_id and version=p_expected_version
  returning * into v_row;
  if v_row.id is null then raise exception using errcode='40001',message='application version conflict'; end if;
  insert into public.application_events(application_id,user_id,actor_id,event_type,source_type,details)
  values(v_row.id,v_user_id,v_user_id,'metadata_updated','USER_REPORTED',jsonb_build_object('version',v_row.version));
  return v_row;
end;
$$;
revoke all on function public.application_update_metadata(uuid,bigint,text,text,text) from public,anon;
grant execute on function public.application_update_metadata(uuid,bigint,text,text,text) to authenticated,service_role;

create function public.application_checklist_change(
  p_application_id uuid,
  p_item_id uuid,
  p_expected_version bigint,
  p_title text,
  p_status text,
  p_is_mandatory boolean
) returns public.application_checklist_items
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.application_checklist_items%rowtype;
begin
  if v_user_id is null then raise exception using errcode='42501',message='authentication required'; end if;
  if not exists(select 1 from public.applications where id=p_application_id and user_id=v_user_id and archived_at is null)
    or p_status not in ('todo','completed','not_applicable')
    or length(btrim(coalesce(p_title,''))) not between 1 and 240 then
    raise exception using errcode='22023',message='invalid checklist input';
  end if;
  if p_item_id is null then
    insert into public.application_checklist_items(
      application_id,user_id,title,status,is_mandatory,origin,verification_state,completed_at,sort_order
    ) values (
      p_application_id,v_user_id,btrim(p_title),p_status,p_is_mandatory,'manual','user_created',
      case when p_status='completed' then now() end,1000
    ) returning * into v_row;
  else
    update public.application_checklist_items set
      title=case when origin='manual' then btrim(p_title) else title end,
      is_mandatory=case when origin='manual' then p_is_mandatory else is_mandatory end,
      status=p_status,version=version+1
    where id=p_item_id and application_id=p_application_id and user_id=v_user_id
      and version=p_expected_version
    returning * into v_row;
    if v_row.id is null then raise exception using errcode='40001',message='checklist version conflict'; end if;
  end if;
  return v_row;
end;
$$;
revoke all on function public.application_checklist_change(uuid,uuid,bigint,text,text,boolean) from public,anon;
grant execute on function public.application_checklist_change(uuid,uuid,bigint,text,text,boolean) to authenticated,service_role;

create function public.application_transition(
  p_application_id uuid,
  p_expected_version bigint,
  p_to_status text,
  p_reason text,
  p_evidence text,
  p_user_confirmed boolean,
  p_idempotency_key uuid
) returns public.applications
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.applications%rowtype;
  v_existing boolean;
  v_from text;
begin
  if v_user_id is null then raise exception using errcode='42501',message='authentication required'; end if;
  if p_idempotency_key is null or length(coalesce(p_reason,''))>2000 or length(coalesce(p_evidence,''))>2000 then
    raise exception using errcode='22023',message='invalid transition input';
  end if;
  select exists(select 1 from public.application_events where application_id=p_application_id and idempotency_key=p_idempotency_key)
    into v_existing;
  select * into v_row from public.applications
  where id=p_application_id and user_id=v_user_id for update;
  if v_row.id is null then raise exception using errcode='42501',message='application not found'; end if;
  if v_existing then return v_row; end if;
  if v_row.version<>p_expected_version then raise exception using errcode='40001',message='application version conflict'; end if;
  if not jetu_private.application_transition_allowed(v_row.status,p_to_status) then
    raise exception using errcode='23514',message='application transition is not allowed';
  end if;
  if p_to_status in ('ready_for_review','ready_to_submit','submitted_external_confirmed')
    and exists(select 1 from public.application_checklist_items item
      where item.application_id=v_row.id and item.is_mandatory and item.status<>'completed') then
    raise exception using errcode='23514',message='mandatory application checklist is incomplete';
  end if;
  if p_to_status='submitted_external_confirmed'
    and (not p_user_confirmed or length(btrim(coalesce(p_evidence,'')))<3) then
    raise exception using errcode='23514',message='external submission requires explicit confirmation and evidence';
  end if;
  if p_to_status in ('interview','offer','waitlist','rejected','accepted','declined','enrollment','withdrawn')
    and length(btrim(coalesce(p_reason,'')))<3 then
    raise exception using errcode='23514',message='user-reported outcome requires a reason';
  end if;
  if v_row.status='withdrawn' and p_to_status='researching'
    and length(btrim(coalesce(p_reason,'')))<10 then
    raise exception using errcode='23514',message='reopening a withdrawn application requires an explanation';
  end if;

  v_from := v_row.status;
  update public.applications set
    status=p_to_status,
    submitted_at=case when p_to_status='submitted_external_confirmed' then now() else submitted_at end,
    submission_evidence=case when p_to_status='submitted_external_confirmed' then btrim(p_evidence) else submission_evidence end,
    submission_provenance=case when p_to_status='submitted_external_confirmed' then 'USER_REPORTED' else submission_provenance end,
    version=version+1
  where id=v_row.id returning * into v_row;

  if p_to_status='submitted_external_confirmed' and v_row.roadmap_submission_task_id is not null then
    update public.roadmap_tasks set status='completed',version=version+1
    where id=v_row.roadmap_submission_task_id and user_id=v_user_id and obsolete_at is null;
  end if;

  insert into public.application_events(
    application_id,user_id,actor_id,event_type,from_status,to_status,source_type,
    reason,evidence,idempotency_key
  ) values (
    v_row.id,v_user_id,v_user_id,'status_changed',
    v_from,p_to_status,'USER_REPORTED',
    nullif(btrim(coalesce(p_reason,'')),''),nullif(btrim(coalesce(p_evidence,'')),''),p_idempotency_key
  );
  return v_row;
end;
$$;
revoke all on function public.application_transition(uuid,bigint,text,text,text,boolean,uuid) from public,anon;
grant execute on function public.application_transition(uuid,bigint,text,text,text,boolean,uuid) to authenticated,service_role;

create function public.application_add_scholarship(
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
  v_source record;
  v_deadline record;
begin
  if v_user_id is null then raise exception using errcode='42501',message='authentication required'; end if;
  if not exists(select 1 from public.applications where id=p_application_id and user_id=v_user_id)
    or p_idempotency_key is null then
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
  select source.canonical_url,source.last_checked_at into v_source
  from public.source_claims claim join public.official_sources source on source.id=claim.source_id
  where claim.catalog_entity_id=p_scholarship_id and claim.verification_state_code='verified' and source.is_active
  order by source.last_checked_at desc limit 1;
  if p_scholarship_cycle_id is not null then
    select deadline.due_at,deadline.due_date,deadline.date_precision,deadline.timezone_name
      into v_deadline
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
    v_title,v_source.canonical_url,v_deadline.due_at,v_deadline.due_date,
    coalesce(v_deadline.date_precision,'unknown'),v_deadline.timezone_name
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
revoke all on function public.application_add_scholarship(uuid,bigint,bigint,smallint,uuid) from public,anon;
grant execute on function public.application_add_scholarship(uuid,bigint,bigint,smallint,uuid) to authenticated,service_role;

create function public.scholarship_application_transition(
  p_scholarship_application_id uuid,
  p_expected_version bigint,
  p_to_status text,
  p_reason text,
  p_evidence text,
  p_user_confirmed boolean,
  p_idempotency_key uuid
) returns public.scholarship_applications
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.scholarship_applications%rowtype;
  v_from text;
begin
  if v_user_id is null then raise exception using errcode='42501',message='authentication required'; end if;
  select * into v_row from public.scholarship_applications
  where id=p_scholarship_application_id and user_id=v_user_id for update;
  if v_row.id is null then raise exception using errcode='42501',message='scholarship application not found'; end if;
  if exists(select 1 from public.scholarship_application_events where scholarship_application_id=v_row.id and idempotency_key=p_idempotency_key) then return v_row; end if;
  if v_row.version<>p_expected_version then raise exception using errcode='40001',message='scholarship version conflict'; end if;
  if not jetu_private.scholarship_transition_allowed(v_row.status,p_to_status) then
    raise exception using errcode='23514',message='scholarship transition is not allowed'; end if;
  if p_to_status='submitted_external_confirmed' and (not p_user_confirmed or length(btrim(coalesce(p_evidence,'')))<3) then
    raise exception using errcode='23514',message='external scholarship submission requires confirmation and evidence'; end if;
  if p_to_status in ('awarded','not_awarded','withdrawn') and length(btrim(coalesce(p_reason,'')))<3 then
    raise exception using errcode='23514',message='scholarship outcome requires a reason'; end if;
  v_from:=v_row.status;
  update public.scholarship_applications set status=p_to_status,
    submitted_at=case when p_to_status='submitted_external_confirmed' then now() else submitted_at end,
    submission_evidence=case when p_to_status='submitted_external_confirmed' then btrim(p_evidence) else submission_evidence end,
    submission_provenance=case when p_to_status='submitted_external_confirmed' then 'USER_REPORTED' else submission_provenance end,
    version=version+1,updated_at=now()
  where id=v_row.id returning * into v_row;
  insert into public.scholarship_application_events(
    scholarship_application_id,user_id,actor_id,from_status,to_status,source_type,reason,evidence,idempotency_key
  ) values(v_row.id,v_user_id,v_user_id,v_from,p_to_status,'USER_REPORTED',
    nullif(btrim(coalesce(p_reason,'')),''),nullif(btrim(coalesce(p_evidence,'')),''),p_idempotency_key);
  return v_row;
end;
$$;
revoke all on function public.scholarship_application_transition(uuid,bigint,text,text,text,boolean,uuid) from public,anon;
grant execute on function public.scholarship_application_transition(uuid,bigint,text,text,text,boolean,uuid) to authenticated,service_role;

commit;
