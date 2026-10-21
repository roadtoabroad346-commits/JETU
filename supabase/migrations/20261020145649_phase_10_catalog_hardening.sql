-- Phase 10 hardening: normalized fee details and lifecycle subtype integrity.
begin;

create table public.fee_breakdown_items (
  id bigint generated always as identity primary key,
  estimated_tuition_id bigint not null
    references public.estimated_tuition (id) on delete cascade,
  fee_category text not null check (fee_category in (
    'tuition', 'application', 'registration', 'student_services',
    'laboratory', 'technology', 'insurance', 'deposit', 'examination', 'other'
  )),
  label text not null check (length(btrim(label)) between 1 and 240),
  amount_min numeric(16, 2) not null check (amount_min >= 0),
  amount_max numeric(16, 2) check (amount_max >= 0),
  billing_period text not null check (billing_period in (
    'one_time', 'application', 'program', 'academic_year', 'semester', 'term', 'credit'
  )),
  is_mandatory boolean not null default true,
  is_refundable boolean not null default false,
  unique nulls not distinct (
    estimated_tuition_id, fee_category, label, billing_period
  ),
  check (amount_max is null or amount_max >= amount_min)
);

-- Composite FK lookups need the referenced columns in leading key order. Existing
-- broader indexes remain useful for their separate country/unit access patterns.
create index cities_region_country_fk_idx
  on public.cities (region_id, country_id);
create index institutions_city_country_fk_idx
  on public.institutions (city_id, country_id);
create index campuses_city_country_fk_idx
  on public.campuses (city_id, country_id);
create index degree_programs_degree_level_fk_idx
  on public.degree_programs (degree_level_code);
create index source_claims_verification_state_fk_idx
  on public.source_claims (verification_state_code);

alter table public.fee_breakdown_items enable row level security;

create policy fee_breakdown_items_public_read
on public.fee_breakdown_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.estimated_tuition et
    where et.id = fee_breakdown_items.estimated_tuition_id
  )
);

revoke all on table public.fee_breakdown_items from public, anon, authenticated;
grant select on table public.fee_breakdown_items to anon, authenticated;
grant select, insert, update, delete on table public.fee_breakdown_items to service_role;

revoke all on sequence public.fee_breakdown_items_id_seq from public, anon, authenticated;
grant usage, select on sequence public.fee_breakdown_items_id_seq to service_role;

create function public.enforce_catalog_entity_subtype_presence()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entity_id bigint;
  entity_kind text;
  subtype_table text;
  subtype_exists boolean;
begin
  if tg_table_name = 'catalog_entities' then
    entity_id := new.id;

    select ce.entity_type
    into entity_kind
    from public.catalog_entities ce
    where ce.id = entity_id;

    -- Inserting and then deleting a complete aggregate in one transaction is valid.
    if not found then
      return null;
    end if;
  else
    entity_id := old.id;

    select ce.entity_type
    into entity_kind
    from public.catalog_entities ce
    where ce.id = entity_id;

    -- A parent deletion cascades to its subtype and is valid.
    if not found then
      return null;
    end if;
  end if;

  subtype_table := case entity_kind
    when 'institution' then 'institutions'
    when 'campus' then 'campuses'
    when 'institution_accreditation' then 'institution_accreditations'
    when 'academic_unit' then 'academic_units'
    when 'degree_program' then 'degree_programs'
    when 'admission_intake' then 'admission_intakes'
    when 'application_round' then 'application_rounds'
    when 'eligibility_requirement' then 'eligibility_requirements'
    when 'estimated_tuition' then 'estimated_tuition'
    when 'cost_of_living' then 'cost_of_living'
    when 'financial_aid_scheme' then 'financial_aid_schemes'
    when 'scholarship' then 'scholarships'
    when 'scholarship_cycle' then 'scholarship_cycles'
    when 'scholarship_benefit' then 'scholarship_benefits'
    when 'deadline' then 'deadlines'
    when 'nomination_route' then 'nomination_routes'
    when 'opportunity' then 'opportunities'
  end;

  if subtype_table is null then
    raise exception using
      errcode = '23514',
      message = format('unsupported catalog entity type %s', entity_kind);
  end if;

  execute format(
    'select exists (select 1 from public.%I where id = $1)',
    subtype_table
  ) into subtype_exists using entity_id;

  if not subtype_exists then
    raise exception using
      errcode = '23514',
      message = format(
        'catalog entity %s requires subtype row for %s',
        entity_id,
        entity_kind
      );
  end if;

  return null;
end;
$$;

create constraint trigger catalog_entity_requires_subtype
after insert or update of entity_type on public.catalog_entities
deferrable initially deferred
for each row execute function public.enforce_catalog_entity_subtype_presence();

do $$
declare
  subtype_table text;
begin
  foreach subtype_table in array array[
    'institutions', 'campuses', 'institution_accreditations', 'academic_units',
    'degree_programs', 'admission_intakes', 'application_rounds',
    'eligibility_requirements', 'estimated_tuition', 'cost_of_living',
    'financial_aid_schemes', 'scholarships', 'scholarship_cycles',
    'scholarship_benefits', 'deadlines', 'nomination_routes', 'opportunities'
  ] loop
    execute format(
      'create constraint trigger %I after delete or update of id on public.%I '
      'deferrable initially deferred for each row execute function '
      'public.enforce_catalog_entity_subtype_presence()',
      subtype_table || '_retain_catalog_entity',
      subtype_table
    );
  end loop;
end;
$$;

-- Constraint triggers protect subsequent writes. Validate rows that may already
-- exist when this additive migration is promoted to a populated environment.
do $$
declare
  entity record;
  subtype_table text;
  subtype_exists boolean;
begin
  for entity in
    select ce.id, ce.entity_type from public.catalog_entities ce
  loop
    subtype_table := case entity.entity_type
      when 'institution' then 'institutions'
      when 'campus' then 'campuses'
      when 'institution_accreditation' then 'institution_accreditations'
      when 'academic_unit' then 'academic_units'
      when 'degree_program' then 'degree_programs'
      when 'admission_intake' then 'admission_intakes'
      when 'application_round' then 'application_rounds'
      when 'eligibility_requirement' then 'eligibility_requirements'
      when 'estimated_tuition' then 'estimated_tuition'
      when 'cost_of_living' then 'cost_of_living'
      when 'financial_aid_scheme' then 'financial_aid_schemes'
      when 'scholarship' then 'scholarships'
      when 'scholarship_cycle' then 'scholarship_cycles'
      when 'scholarship_benefit' then 'scholarship_benefits'
      when 'deadline' then 'deadlines'
      when 'nomination_route' then 'nomination_routes'
      when 'opportunity' then 'opportunities'
    end;

    execute format(
      'select exists (select 1 from public.%I where id = $1)',
      subtype_table
    ) into subtype_exists using entity.id;

    if not subtype_exists then
      raise exception using
        errcode = '23514',
        message = format(
          'catalog entity %s requires subtype row for %s',
          entity.id,
          entity.entity_type
        );
    end if;
  end loop;
end;
$$;

revoke all on function public.enforce_catalog_entity_subtype_presence()
from public, anon, authenticated;
grant execute on function public.enforce_catalog_entity_subtype_presence()
to service_role;

commit;
