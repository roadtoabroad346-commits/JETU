-- Phase 12: read-only search over the existing Phase 10 canonical catalog.
-- No new product tables; all joins run as the caller under existing RLS.
begin;
create function public.catalog_search(p_filters jsonb default '{}'::jsonb)
returns table (id text, program_name text, university_slug text, university_name text, country text, city text,
  level text, major text, teaching_language text, study_mode text, tuition_amount numeric, tuition_currency text,
  tuition_period text, tuition_as_of date, next_deadline timestamptz, total_count bigint)
language sql stable security invoker set search_path = '' as $$
  with base as (
    select p.id::text as id, p.title as program_name, u.slug as university_slug, u.legal_name as university_name,
      co.iso2 as country, ci.name as city, p.degree_level_code as level, f.name as major,
      lang.language_code as teaching_language, modes.delivery_mode_code as study_mode,
      tuition.amount_min as tuition_amount, tuition.currency_code as tuition_currency,
      tuition.billing_period as tuition_period, tuition_checked.last_checked_at::date as tuition_as_of,
      deadline.due_at as next_deadline,
      exists (select 1 from public.required_tests rt join public.standardized_tests st on st.code = rt.test_code
        where rt.eligibility_requirement_id in (select per.eligibility_requirement_id from public.program_eligibility_requirements per where per.program_id = p.id)
        and st.name ilike '%' || coalesce(p_filters->>'exam','') || '%') as exam_match,
      exists (select 1 from public.admission_intakes ai where ai.program_id = p.id and ai.term_code = p_filters->>'intake') as intake_match,
      exists (select 1 from public.scholarship_program_links spl where spl.program_id = p.id) as funding_match
    from public.degree_programs p
    join public.academic_units au on au.id = p.academic_unit_id
    join public.institutions u on u.id = au.institution_id
    join public.countries co on co.id = u.country_id
    join public.fields_of_study f on f.id = p.primary_field_id
    left join lateral (select c.city_id, c.name from public.program_campuses pc join public.campuses c on c.id = pc.campus_id
      where pc.program_id = p.id order by pc.is_primary desc, c.id limit 1) campus on true
    left join public.cities ci on ci.id = campus.city_id
    left join lateral (select language_code from public.degree_program_languages where program_id = p.id order by language_code limit 1) lang on true
    left join lateral (select delivery_mode_code from public.degree_program_delivery_modes where program_id = p.id order by delivery_mode_code limit 1) modes on true
    left join lateral (select et.id, et.amount_min, et.currency_code, et.billing_period from public.estimated_tuition et
      where et.program_id = p.id order by et.academic_year_start desc nulls last, et.id desc limit 1) tuition on true
    left join public.catalog_entities tuition_checked on tuition_checked.id = tuition.id
    left join lateral (select min(d.due_at) as due_at from public.admission_intakes ai
      join public.application_rounds ar on ar.intake_id = ai.id
      join public.application_round_deadlines ard on ard.application_round_id = ar.id
      join public.deadlines d on d.id = ard.deadline_id
      where ai.program_id = p.id and d.due_at >= now()) deadline on true
    where exists (select 1 from public.source_claims sc where sc.catalog_entity_id = p.id and sc.verification_state_code = 'verified')
      and exists (select 1 from public.source_claims sc where sc.catalog_entity_id = u.id and sc.verification_state_code = 'verified')
  ), matching as (
    select * from base b where
      (coalesce(p_filters->>'q','') = '' or b.program_name ilike '%' || (p_filters->>'q') || '%' or b.university_name ilike '%' || (p_filters->>'q') || '%' or b.major ilike '%' || (p_filters->>'q') || '%')
      and (coalesce(p_filters->>'country','') = '' or b.country = p_filters->>'country')
      and (coalesce(p_filters->>'city','') = '' or b.city = p_filters->>'city')
      and (coalesce(p_filters->>'level','') = '' or b.level = p_filters->>'level')
      and (coalesce(p_filters->>'major','') = '' or b.major = p_filters->>'major')
      and (coalesce(p_filters->>'language','') = '' or b.teaching_language = p_filters->>'language')
      and (coalesce(p_filters->>'mode','') = '' or b.study_mode = p_filters->>'mode')
      and (coalesce(p_filters->>'exam','') = '' or b.exam_match)
      and (coalesce(p_filters->>'intake','') = '' or b.intake_match)
      and (coalesce(p_filters->>'deadline','') = '' or (b.next_deadline is not null and b.next_deadline::date <= (p_filters->>'deadline')::date))
      and (coalesce(p_filters->>'maxTuition','') = '' or (b.tuition_amount <= (p_filters->>'maxTuition')::numeric and b.tuition_currency = p_filters->>'currency'))
      and (coalesce(p_filters->>'funding','') = '' or b.funding_match)
  )
  select m.id, m.program_name, m.university_slug, m.university_name, m.country, m.city,
    m.level, m.major, m.teaching_language, m.study_mode, m.tuition_amount, m.tuition_currency,
    m.tuition_period, m.tuition_as_of, m.next_deadline, count(*) over ()
  from matching m
  order by case when p_filters->>'sort' = 'tuition' then m.tuition_amount end asc nulls last,
    case when p_filters->>'sort' = 'deadline' then m.next_deadline end asc nulls last,
    m.university_name, m.program_name, m.id
  limit least(greatest(coalesce((p_filters->>'limit')::int, 12), 1), 24)
  offset least(greatest(coalesce((p_filters->>'offset')::int, 0), 0), 2400)
$$;
revoke all on function public.catalog_search(jsonb) from public;
grant execute on function public.catalog_search(jsonb) to anon, authenticated;
commit;
