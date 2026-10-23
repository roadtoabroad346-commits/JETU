-- Phase 13 security closure and Phase 14 Global Opportunities Hub.
-- No catalog facts or demo records are inserted by this migration.
begin;

-- These Phase 13 wrappers are SECURITY DEFINER functions in the exposed public
-- schema. Editor access is routed through an authorized server endpoint instead of
-- granting every authenticated browser the ability to invoke a definer function.
revoke all on function public.scholarship_editor_preview(text)
  from public, anon, authenticated;
revoke all on function public.scholarship_editor_create_draft(jsonb)
  from public, anon, authenticated;
revoke all on function public.scholarship_editor_transition(bigint, text, text)
  from public, anon, authenticated;
revoke all on function public.scholarship_editor_list()
  from public, anon, authenticated;
grant execute on function public.scholarship_editor_preview(text),
  public.scholarship_editor_create_draft(jsonb),
  public.scholarship_editor_transition(bigint, text, text),
  public.scholarship_editor_list()
  to service_role;

alter table public.opportunities
  drop constraint if exists opportunities_opportunity_type_check;
alter table public.opportunities
  add constraint opportunities_opportunity_type_check check (
    opportunity_type in (
      'olympiad', 'hackathon', 'summer_school', 'research_school',
      'academic_competition', 'exchange', 'volunteering', 'internship',
      'student_conference', 'award', 'essay_contest', 'coding_contest',
      'mentorship', 'portfolio_program', 'high_school', 'gap_year', 'other'
    )
  );

alter table public.opportunities
  add column provider_name text,
  add column sponsor_name text,
  add column summary text,
  add column participation_format text not null default 'unknown',
  add column country_id bigint references public.countries(id) on delete restrict,
  add column location_text text,
  add column cost_state text not null default 'unknown',
  add column cost_amount_min numeric(16, 2),
  add column cost_amount_max numeric(16, 2),
  add column cost_currency_code text references public.fee_currency(code) on delete restrict,
  add column eligibility_age_min smallint,
  add column eligibility_age_max smallint,
  add column eligibility_grade_min smallint,
  add column eligibility_grade_max smallint,
  add column eligibility_summary text,
  add column official_application_url text,
  add column risk_summary text,
  add column source_claim_id bigint;

alter table public.opportunities
  add constraint opportunities_provider_name_check check (
    provider_name is null or length(btrim(provider_name)) between 2 and 240
  ),
  add constraint opportunities_sponsor_name_check check (
    sponsor_name is null or length(btrim(sponsor_name)) between 2 and 240
  ),
  add constraint opportunities_provider_check check (
    provider_institution_id is not null
    or (provider_name is not null and length(btrim(provider_name)) between 2 and 240)
  ),
  add constraint opportunities_summary_check check (
    summary is null or length(btrim(summary)) between 10 and 4000
  ),
  add constraint opportunities_format_check check (
    participation_format in ('unknown', 'online', 'in_person', 'hybrid')
  ),
  add constraint opportunities_location_check check (
    location_text is null or length(btrim(location_text)) between 2 and 300
  ),
  add constraint opportunities_cost_state_check check (
    cost_state in ('unknown', 'free', 'paid', 'fee_waiver_available')
  ),
  add constraint opportunities_cost_amount_check check (
    cost_amount_min is null or cost_amount_min >= 0
  ),
  add constraint opportunities_cost_range_check check (
    cost_amount_max is null or cost_amount_max >= coalesce(cost_amount_min, 0)
  ),
  add constraint opportunities_cost_currency_check check (
    (cost_amount_min is null and cost_amount_max is null)
    or cost_currency_code is not null
  ),
  add constraint opportunities_free_cost_check check (
    cost_state <> 'free'
    or (coalesce(cost_amount_min, 0) = 0 and coalesce(cost_amount_max, 0) = 0)
  ),
  add constraint opportunities_age_min_check check (
    eligibility_age_min is null or eligibility_age_min between 5 and 35
  ),
  add constraint opportunities_age_max_check check (
    eligibility_age_max is null or eligibility_age_max between 5 and 35
  ),
  add constraint opportunities_age_range_check check (
    eligibility_age_max is null or eligibility_age_min is null
    or eligibility_age_max >= eligibility_age_min
  ),
  add constraint opportunities_grade_min_check check (
    eligibility_grade_min is null or eligibility_grade_min between 1 and 13
  ),
  add constraint opportunities_grade_max_check check (
    eligibility_grade_max is null or eligibility_grade_max between 1 and 13
  ),
  add constraint opportunities_grade_range_check check (
    eligibility_grade_max is null or eligibility_grade_min is null
    or eligibility_grade_max >= eligibility_grade_min
  ),
  add constraint opportunities_eligibility_summary_check check (
    eligibility_summary is null or length(btrim(eligibility_summary)) between 2 and 4000
  ),
  add constraint opportunities_application_url_check check (
    official_application_url is null
    or official_application_url ~ '^https://[^[:space:]]+$'
  ),
  add constraint opportunities_risk_summary_check check (
    risk_summary is null or length(btrim(risk_summary)) between 2 and 2000
  ),
  add constraint opportunities_source_claim_parent foreign key (source_claim_id, id)
    references public.source_claims(id, catalog_entity_id) on delete restrict;

create table public.opportunity_eligibility_rules (
  id bigint generated always as identity primary key,
  opportunity_id bigint not null references public.opportunities(id) on delete cascade,
  rule_kind text not null check (
    rule_kind in (
      'age', 'grade', 'citizenship', 'residency', 'language', 'academic',
      'experience', 'location', 'travel', 'other'
    )
  ),
  requirement_state text not null default 'required'
    check (requirement_state in ('required', 'conditional', 'preferred', 'unknown')),
  description text not null check (length(btrim(description)) between 2 and 2000),
  source_claim_id bigint not null,
  unique (opportunity_id, rule_kind, description),
  foreign key (source_claim_id, opportunity_id)
    references public.source_claims(id, catalog_entity_id) on delete restrict
);

create table public.opportunity_risk_flags (
  id bigint generated always as identity primary key,
  opportunity_id bigint not null references public.opportunities(id) on delete cascade,
  risk_code text not null check (
    risk_code in (
      'fee_nonrefundable', 'travel_required', 'visa_required', 'adult_contact',
      'data_sharing', 'third_party_portal', 'deadline_unconfirmed', 'other'
    )
  ),
  severity text not null check (severity in ('info', 'caution', 'high')),
  description text not null check (length(btrim(description)) between 2 and 2000),
  source_claim_id bigint not null,
  unique (opportunity_id, risk_code),
  foreign key (source_claim_id, opportunity_id)
    references public.source_claims(id, catalog_entity_id) on delete restrict
);

create table public.institution_school_profiles (
  institution_id bigint primary key references public.institutions(id) on delete cascade,
  school_kind text not null check (
    school_kind in (
      'partner_school', 'high_school', 'education_center',
      'boarding_school', 'summer_program_provider', 'other'
    )
  ),
  partnership_state text not null default 'none'
    check (partnership_state in ('none', 'candidate', 'verified_partner', 'inactive')),
  source_claim_id bigint not null,
  foreign key (source_claim_id, institution_id)
    references public.source_claims(id, catalog_entity_id) on delete restrict
);

create table public.student_opportunity_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id bigint not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create table public.student_opportunity_plan_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id bigint not null references public.opportunities(id) on delete cascade,
  status text not null default 'planned'
    check (status in ('planned', 'preparing', 'applied_external', 'completed', 'withdrawn')),
  target_date date,
  note text check (note is null or length(note) <= 2000),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create table public.student_opportunity_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id bigint not null references public.opportunities(id) on delete cascade,
  remind_at timestamptz not null,
  timezone_name text not null check (length(timezone_name) between 1 and 80),
  channel text not null default 'in_app' check (channel = 'in_app'),
  status text not null default 'active' check (status in ('active', 'cancelled', 'sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id, remind_at, channel)
);

create index opportunities_country_idx on public.opportunities(country_id);
create index opportunities_source_claim_idx on public.opportunities(source_claim_id, id);
create index opportunities_filter_idx on public.opportunities(
  opportunity_type, participation_format, cost_state
);
create index opportunities_age_idx on public.opportunities(
  eligibility_age_min, eligibility_age_max
);
create index opportunities_grade_idx on public.opportunities(
  eligibility_grade_min, eligibility_grade_max
);
create index opportunity_eligibility_parent_idx on public.opportunity_eligibility_rules(opportunity_id);
create index opportunity_eligibility_claim_idx on public.opportunity_eligibility_rules(source_claim_id, opportunity_id);
create index opportunity_risk_parent_idx on public.opportunity_risk_flags(opportunity_id);
create index opportunity_risk_claim_idx on public.opportunity_risk_flags(source_claim_id, opportunity_id);
create index school_profiles_claim_idx on public.institution_school_profiles(source_claim_id, institution_id);
create index student_opportunity_saves_opportunity_idx on public.student_opportunity_saves(opportunity_id);
create index student_opportunity_plan_owner_status_idx on public.student_opportunity_plan_actions(user_id, status, updated_at desc);
create index student_opportunity_plan_opportunity_idx on public.student_opportunity_plan_actions(opportunity_id);
create index student_opportunity_reminder_due_idx on public.student_opportunity_reminders(user_id, status, remind_at);
create index student_opportunity_reminder_opportunity_idx on public.student_opportunity_reminders(opportunity_id);

alter table public.opportunity_eligibility_rules enable row level security;
alter table public.opportunity_risk_flags enable row level security;
alter table public.institution_school_profiles enable row level security;
alter table public.student_opportunity_saves enable row level security;
alter table public.student_opportunity_plan_actions enable row level security;
alter table public.student_opportunity_reminders enable row level security;

create policy opportunity_rules_public_read on public.opportunity_eligibility_rules
for select to anon, authenticated
using (
  exists (select 1 from public.opportunities o where o.id = opportunity_id)
  and exists (select 1 from public.source_claims sc where sc.id = source_claim_id)
);

create policy opportunity_risks_public_read on public.opportunity_risk_flags
for select to anon, authenticated
using (
  exists (select 1 from public.opportunities o where o.id = opportunity_id)
  and exists (select 1 from public.source_claims sc where sc.id = source_claim_id)
);

create policy school_profiles_public_read on public.institution_school_profiles
for select to anon, authenticated
using (
  exists (select 1 from public.institutions i where i.id = institution_id)
  and exists (select 1 from public.source_claims sc where sc.id = source_claim_id)
);

create policy opportunity_saves_owner_select on public.student_opportunity_saves
for select to authenticated
using ((select auth.uid()) = user_id);
create policy opportunity_saves_owner_insert on public.student_opportunity_saves
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.opportunities o where o.id = opportunity_id)
);
create policy opportunity_saves_owner_delete on public.student_opportunity_saves
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy opportunity_plan_owner_select on public.student_opportunity_plan_actions
for select to authenticated
using ((select auth.uid()) = user_id);
create policy opportunity_plan_owner_insert on public.student_opportunity_plan_actions
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.opportunities o where o.id = opportunity_id)
);
create policy opportunity_plan_owner_update on public.student_opportunity_plan_actions
for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.opportunities o where o.id = opportunity_id)
);
create policy opportunity_plan_owner_delete on public.student_opportunity_plan_actions
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy opportunity_reminders_owner_select on public.student_opportunity_reminders
for select to authenticated
using ((select auth.uid()) = user_id);
create policy opportunity_reminders_owner_insert on public.student_opportunity_reminders
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.opportunities o where o.id = opportunity_id)
);
create policy opportunity_reminders_owner_update on public.student_opportunity_reminders
for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.opportunities o where o.id = opportunity_id)
);
create policy opportunity_reminders_owner_delete on public.student_opportunity_reminders
for delete to authenticated
using ((select auth.uid()) = user_id);

create function jetu_private.touch_opportunity_plan()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.version <> old.version + 1 then
    raise exception using errcode = '23514', message = 'plan action version must increment by one';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger touch_opportunity_plan
before update on public.student_opportunity_plan_actions
for each row execute function jetu_private.touch_opportunity_plan();
revoke all on function jetu_private.touch_opportunity_plan()
  from public, anon, authenticated, service_role;

create function jetu_private.validate_opportunity_reminder()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names tz where tz.name = new.timezone_name
  ) then
    raise exception using errcode = '22023', message = 'reminder timezone must be an IANA zone';
  end if;
  if new.status = 'active' and new.remind_at <= now() then
    raise exception using errcode = '22023', message = 'active reminder must be in the future';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger validate_opportunity_reminder
before insert or update on public.student_opportunity_reminders
for each row execute function jetu_private.validate_opportunity_reminder();
revoke all on function jetu_private.validate_opportunity_reminder()
  from public, anon, authenticated, service_role;

create function jetu_private.check_opportunity_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target public.opportunities%rowtype;
begin
  if new.entity_type <> 'opportunity' or new.publication_status_code <> 'published' then
    return new;
  end if;

  select * into target from public.opportunities o where o.id = new.id;
  if not found then
    return new;
  end if;
  if target.source_claim_id is null
     or target.provider_name is null and target.provider_institution_id is null
     or target.eligibility_summary is null
     or target.official_application_url is null
     or target.participation_format = 'unknown'
     or target.cost_state = 'unknown' then
    raise exception using
      errcode = '23514',
      message = 'published opportunity requires source, host, eligibility, application, format and cost facts';
  end if;
  if not exists (
    select 1 from public.source_claims sc
    join public.official_sources os on os.id = sc.source_id
    where sc.id = target.source_claim_id
      and sc.catalog_entity_id = new.id
      and sc.verification_state_code = 'verified'
      and os.is_active
      and os.last_checked_at >= now() - interval '180 days'
  ) then
    raise exception using
      errcode = '23514',
      message = 'recent verified opportunity source required';
  end if;
  if exists (
    select 1 from public.source_claims sc
    where sc.catalog_entity_id = new.id
      and sc.verification_state_code = 'conflicted'
  ) then
    raise exception using
      errcode = '23514',
      message = 'conflicted opportunity evidence cannot be published';
  end if;
  return new;
end;
$$;
create trigger opportunity_publication_truth
before insert or update of publication_status_code, verification_state_code, last_checked_at
on public.catalog_entities
for each row execute function jetu_private.check_opportunity_publication();
revoke all on function jetu_private.check_opportunity_publication()
  from public, anon, authenticated, service_role;

create function public.opportunity_search(p_filters jsonb default '{}'::jsonb)
returns table (
  id bigint,
  slug text,
  title text,
  opportunity_type text,
  provider_name text,
  sponsor_name text,
  summary text,
  participation_format text,
  country_code text,
  location_text text,
  cost_state text,
  cost_amount_min numeric,
  cost_amount_max numeric,
  cost_currency_code text,
  eligibility_age_min smallint,
  eligibility_age_max smallint,
  eligibility_grade_min smallint,
  eligibility_grade_max smallint,
  eligibility_summary text,
  official_application_url text,
  risk_summary text,
  starts_on date,
  ends_on date,
  deadline_at timestamptz,
  deadline_timezone text,
  source_url text,
  source_checked_at timestamptz,
  age_fit text,
  grade_fit text,
  tags text[],
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with requested as (
    select
      nullif(btrim(p_filters->>'q'), '') as query,
      nullif(p_filters->>'type', '') as opportunity_type,
      nullif(p_filters->>'format', '') as participation_format,
      nullif(p_filters->>'country', '') as country_code,
      nullif(p_filters->>'cost', '') as cost_state,
      nullif(p_filters->>'tag', '') as tag_code,
      nullif(p_filters->>'slug', '') as slug,
      case when coalesce(p_filters->>'age', '') ~ '^[0-9]{1,2}$'
        then (p_filters->>'age')::smallint end as age,
      case when coalesce(p_filters->>'grade', '') ~ '^[0-9]{1,2}$'
        then (p_filters->>'grade')::smallint end as grade,
      case when coalesce(p_filters->>'deadline', '') ~ '^\\d{4}-\\d{2}-\\d{2}$'
        then (p_filters->>'deadline')::date end as deadline_before,
      case when coalesce(p_filters->>'limit', '') ~ '^[0-9]{1,3}$'
        then least(greatest((p_filters->>'limit')::integer, 1), 48) else 24 end as row_limit,
      case when coalesce(p_filters->>'offset', '') ~ '^[0-9]{1,4}$'
        then least(greatest((p_filters->>'offset')::integer, 0), 960) else 0 end as row_offset,
      case when p_filters->>'sort' in ('title', 'deadline', 'recent')
        then p_filters->>'sort' else 'deadline' end as sort_key
  )
  select
    o.id,
    o.slug,
    o.title,
    o.opportunity_type,
    coalesce(o.provider_name, provider.legal_name),
    o.sponsor_name,
    o.summary,
    o.participation_format,
    country.iso2,
    o.location_text,
    o.cost_state,
    o.cost_amount_min,
    o.cost_amount_max,
    o.cost_currency_code,
    o.eligibility_age_min,
    o.eligibility_age_max,
    o.eligibility_grade_min,
    o.eligibility_grade_max,
    o.eligibility_summary,
    o.official_application_url,
    o.risk_summary,
    o.starts_on,
    o.ends_on,
    next_deadline.due_at,
    next_deadline.timezone_name,
    source.canonical_url,
    source.last_checked_at,
    case
      when requested.age is null or o.eligibility_age_min is null and o.eligibility_age_max is null then 'unknown'
      when requested.age < coalesce(o.eligibility_age_min, requested.age)
        or requested.age > coalesce(o.eligibility_age_max, requested.age) then 'ineligible'
      else 'eligible'
    end,
    case
      when requested.grade is null or o.eligibility_grade_min is null and o.eligibility_grade_max is null then 'unknown'
      when requested.grade < coalesce(o.eligibility_grade_min, requested.grade)
        or requested.grade > coalesce(o.eligibility_grade_max, requested.grade) then 'ineligible'
      else 'eligible'
    end,
    coalesce(tag_list.tags, array[]::text[]),
    count(*) over()
  from requested
  cross join public.opportunities o
  join public.catalog_entities ce on ce.id = o.id
  left join public.institutions provider on provider.id = o.provider_institution_id
  left join public.countries country on country.id = o.country_id
  join public.source_claims claim on claim.id = o.source_claim_id
    and claim.catalog_entity_id = o.id
    and claim.verification_state_code = 'verified'
  join public.official_sources source on source.id = claim.source_id and source.is_active
  left join lateral (
    select d.due_at, d.timezone_name
    from public.opportunity_deadlines od
    join public.deadlines d on d.id = od.deadline_id
    where od.opportunity_id = o.id
      and (d.is_rolling or d.due_at >= now())
    order by d.is_rolling, d.due_at nulls last, d.id
    limit 1
  ) next_deadline on true
  left join lateral (
    select array_agg(t.tag_code order by t.tag_code) as tags
    from public.catalog_entity_tags t
    where t.catalog_entity_id = o.id
  ) tag_list on true
  where ce.publication_status_code = 'published'
    and ce.verification_state_code = 'verified'
    and ce.archived_at is null
    and ce.last_checked_at is not null
    and source.last_checked_at >= now() - interval '180 days'
    and (requested.slug is null or o.slug = requested.slug)
    and (requested.opportunity_type is null or o.opportunity_type = requested.opportunity_type)
    and (requested.participation_format is null or o.participation_format = requested.participation_format)
    and (requested.country_code is null or country.iso2 = requested.country_code)
    and (requested.cost_state is null or o.cost_state = requested.cost_state)
    and (requested.tag_code is null or requested.tag_code = any(coalesce(tag_list.tags, array[]::text[])))
    and (requested.age is null
      or requested.age >= coalesce(o.eligibility_age_min, requested.age)
      and requested.age <= coalesce(o.eligibility_age_max, requested.age))
    and (requested.grade is null
      or requested.grade >= coalesce(o.eligibility_grade_min, requested.grade)
      and requested.grade <= coalesce(o.eligibility_grade_max, requested.grade))
    and (requested.deadline_before is null
      or next_deadline.due_at < requested.deadline_before + interval '1 day')
    and (requested.query is null
      or o.title ilike '%' || requested.query || '%'
      or coalesce(o.provider_name, provider.legal_name, '') ilike '%' || requested.query || '%'
      or coalesce(o.summary, '') ilike '%' || requested.query || '%')
  order by
    case when requested.sort_key = 'title' then o.title end asc,
    case when requested.sort_key = 'deadline' then next_deadline.due_at end asc nulls last,
    case when requested.sort_key = 'recent' then source.last_checked_at end desc,
    o.id desc
  limit (select row_limit from requested)
  offset (select row_offset from requested);
$$;

revoke all on function public.opportunity_search(jsonb)
  from public, anon, authenticated;
grant execute on function public.opportunity_search(jsonb)
  to anon, authenticated, service_role;

revoke all on table public.opportunity_eligibility_rules,
  public.opportunity_risk_flags, public.institution_school_profiles,
  public.student_opportunity_saves, public.student_opportunity_plan_actions,
  public.student_opportunity_reminders
  from public, anon, authenticated;
grant select on table public.opportunity_eligibility_rules,
  public.opportunity_risk_flags, public.institution_school_profiles
  to anon, authenticated;
grant select, insert, delete on table public.student_opportunity_saves
  to authenticated;
grant select, insert, delete on table public.student_opportunity_plan_actions
  to authenticated;
grant update (status, target_date, note, version) on public.student_opportunity_plan_actions
  to authenticated;
grant select, insert, delete on table public.student_opportunity_reminders
  to authenticated;
grant update (remind_at, timezone_name, status) on public.student_opportunity_reminders
  to authenticated;
grant all on table public.opportunity_eligibility_rules,
  public.opportunity_risk_flags, public.institution_school_profiles,
  public.student_opportunity_saves, public.student_opportunity_plan_actions,
  public.student_opportunity_reminders
  to service_role;
grant usage, select on sequence public.opportunity_eligibility_rules_id_seq,
  public.opportunity_risk_flags_id_seq
  to service_role;

commit;
