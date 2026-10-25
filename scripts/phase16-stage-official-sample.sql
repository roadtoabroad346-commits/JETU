-- Idempotent editorial staging only. Never publishes or labels AI-curated claims
-- as human verified. Run on the authorized Jetuu development project only.
-- Reviewed source pages on 2026-10-25:
-- https://future.utoronto.ca/program/computer-science
-- https://future.utoronto.ca/pearson-scholarships
begin;
do $$
declare
  v_country bigint;
  v_field bigint;
  v_institution bigint;
  v_campus bigint;
  v_unit bigint;
  v_program bigint;
  v_scholarship bigint;
  v_cycle bigint;
  v_source_program bigint;
  v_source_award bigint;
  v_id bigint;
  v_item text;
  v_claim text;
begin
  insert into public.countries (iso2, iso3, name)
  values ('CA', 'CAN', 'Canada') on conflict (iso2) do nothing;
  select id into strict v_country from public.countries where iso2 = 'CA';
  select id into strict v_field from public.fields_of_study where code = 'CS';

  insert into public.official_sources
    (canonical_url, publisher_name, source_title, source_type, locale, last_checked_at)
  values
    ('https://future.utoronto.ca/program/computer-science', 'University of Toronto',
     'Computer Science', 'official_webpage', 'en', now()),
    ('https://future.utoronto.ca/pearson-scholarships', 'University of Toronto',
     'Lester B. Pearson International Student Scholarships', 'official_webpage', 'en', now())
  on conflict (canonical_url) do nothing;
  select id into strict v_source_program from public.official_sources
    where canonical_url = 'https://future.utoronto.ca/program/computer-science';
  select id into strict v_source_award from public.official_sources
    where canonical_url = 'https://future.utoronto.ca/pearson-scholarships';

  select id into v_institution from public.institutions where slug = 'university-of-toronto';
  if v_institution is null then
    insert into public.catalog_entities (entity_type) values ('institution') returning id into v_institution;
    insert into public.institutions
      (id, country_id, slug, legal_name, institution_type, website_url)
    values (v_institution, v_country, 'university-of-toronto', 'University of Toronto',
      'university', 'https://www.utoronto.ca');
  end if;
  select id into v_campus from public.campuses
    where institution_id = v_institution and campus_code = 'ST_GEORGE';
  if v_campus is null then
    insert into public.catalog_entities (entity_type) values ('campus') returning id into v_campus;
    insert into public.campuses (id, institution_id, country_id, campus_code, name)
    values (v_campus, v_institution, v_country, 'ST_GEORGE', 'St. George');
  end if;
  select id into v_unit from public.academic_units
    where institution_id = v_institution and slug = 'arts-and-science';
  if v_unit is null then
    insert into public.catalog_entities (entity_type) values ('academic_unit') returning id into v_unit;
    insert into public.academic_units
      (id, institution_id, campus_id, slug, title, unit_type)
    values (v_unit, v_institution, v_campus, 'arts-and-science',
      'Faculty of Arts & Science', 'faculty');
  end if;
  select id into v_program from public.degree_programs
    where academic_unit_id = v_unit and slug = 'computer-science-bcs';
  if v_program is null then
    insert into public.catalog_entities (entity_type) values ('degree_program') returning id into v_program;
    insert into public.degree_programs
      (id, academic_unit_id, degree_level_code, primary_field_id, slug, title)
    values (v_program, v_unit, 'bachelor', v_field, 'computer-science-bcs',
      'Computer Science (BCS)');
    insert into public.program_campuses (program_id, campus_id, is_primary)
    values (v_program, v_campus, true);
  end if;

  select id into v_scholarship from public.scholarships
    where slug = 'lester-b-pearson-international';
  if v_scholarship is null then
    insert into public.catalog_entities (entity_type) values ('scholarship') returning id into v_scholarship;
    insert into public.scholarships
      (id, provider_institution_id, slug, title, award_type, official_url)
    values (v_scholarship, v_institution, 'lester-b-pearson-international',
      'Lester B. Pearson International Student Scholarship', 'scholarship',
      'https://future.utoronto.ca/pearson-scholarships');
  end if;
  select id into v_cycle from public.scholarship_cycles
    where scholarship_id = v_scholarship and academic_year_start = 2027
      and cycle_code = 'september';
  if v_cycle is null then
    insert into public.catalog_entities (entity_type) values ('scholarship_cycle') returning id into v_cycle;
    insert into public.scholarship_cycles
      (id, scholarship_id, academic_year_start, cycle_code)
    values (v_cycle, v_scholarship, 2027, 'september');
  end if;
  -- The source says the award is for first-entry undergraduate programs;
  -- this link still requires editorial review of program-specific restrictions.
  insert into public.scholarship_program_links
    (scholarship_cycle_id, program_id, relationship_type)
  values (v_cycle, v_program, 'eligible') on conflict do nothing;

  foreach v_item in array array['tuition', 'books', 'mandatory_fees', 'housing'] loop
    select id into v_id from public.scholarship_benefits
      where scholarship_cycle_id = v_cycle and coverage_item_code = v_item;
    if v_id is null then
      insert into public.catalog_entities (entity_type) values ('scholarship_benefit') returning id into v_id;
      insert into public.scholarship_benefits
        (id, scholarship_cycle_id, coverage_item_code, description)
      values (v_id, v_cycle, v_item,
        case v_item when 'housing' then 'Full residence support for four years'
          else 'Official page lists coverage for four years' end);
    end if;
    v_claim := 'Official Pearson page lists ' || v_item || ' coverage for four years.';
    insert into public.source_claims
      (source_id, catalog_entity_id, claim_key, claim_text, content_hash)
    values (v_source_award, v_id, 'coverage.' || v_item, v_claim, md5(v_claim))
    on conflict do nothing;
  end loop;

  insert into public.source_claims
    (source_id, catalog_entity_id, claim_key, claim_text, content_hash)
  values
    (v_source_program, v_institution, 'institution.name', 'University of Toronto', md5('University of Toronto')),
    (v_source_program, v_campus, 'campus.name', 'St. George campus', md5('St. George campus')),
    (v_source_program, v_unit, 'unit.name', 'Faculty of Arts & Science', md5('Faculty of Arts & Science')),
    (v_source_program, v_program, 'program.title', 'Computer Science, BCS, St. George campus', md5('Computer Science, BCS, St. George campus')),
    (v_source_award, v_scholarship, 'scholarship.title', 'Lester B. Pearson International Student Scholarship', md5('Lester B. Pearson International Student Scholarship')),
    (v_source_award, v_cycle, 'cycle.intake', 'September 2027 undergraduate entry', md5('September 2027 undergraduate entry'))
  on conflict do nothing;
end $$;
commit;
