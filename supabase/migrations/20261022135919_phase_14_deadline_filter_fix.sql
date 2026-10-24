-- Correct the applied Phase 14 date guard without rewriting migration history.
begin;
create or replace function public.opportunity_search(p_filters jsonb default '{}'::jsonb)
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
      case when coalesce(p_filters->>'deadline', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
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
commit;
