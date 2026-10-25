-- Phase 15 performance repair: pre-aggregate shared relations once instead of
-- executing evidence/deadline/tuition lateral scans for every candidate row.
begin;

create index source_claims_unified_search_idx
  on public.source_claims(catalog_entity_id, verification_state_code, observed_at desc, id desc)
  include(source_id);
create index degree_programs_title_fts_idx
  on public.degree_programs using gin (to_tsvector('simple', title));
create index scholarships_title_fts_idx
  on public.scholarships using gin (to_tsvector('simple', title));
create index opportunities_title_fts_idx
  on public.opportunities using gin (to_tsvector('simple', title));

create or replace function public.unified_catalog_search(p_filters jsonb default '{}'::jsonb)
returns table (
  entity_type text, entity_id bigint, slug text, title text, subtitle text,
  country_code text, degree_level text, category text, delivery_format text,
  cost_state text, cost_amount_min numeric, cost_amount_max numeric,
  cost_currency text, cost_period text, deadline_at timestamptz,
  funding_label text, has_funding boolean, source_url text,
  source_checked_at timestamptz, source_freshness text,
  eligibility_state text, detail_path text, relevance double precision,
  total_count bigint, type_counts jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
with requested as (
  select
    nullif(btrim(p_filters->>'q'), '') as query,
    case when p_filters->>'type' in ('program','scholarship','opportunity') then p_filters->>'type' end as result_type,
    nullif(upper(p_filters->>'country'), '') as country,
    nullif(p_filters->>'level', '') as degree_level,
    nullif(p_filters->>'category', '') as category,
    nullif(p_filters->>'format', '') as delivery_format,
    nullif(p_filters->>'funding', '') as funding_label,
    nullif(p_filters->>'cost', '') as cost_state,
    case when coalesce(p_filters->>'deadline', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then (p_filters->>'deadline')::date end as deadline_before,
    case when p_filters->>'sort' in ('relevance','recent','deadline','title') then p_filters->>'sort' else 'relevance' end as sort_key,
    case when coalesce(p_filters->>'limit', '') ~ '^[0-9]{1,2}$' then least(greatest((p_filters->>'limit')::integer,1),24) else 20 end as row_limit,
    case when coalesce(p_filters->>'offset', '') ~ '^[0-9]{1,5}$' then least(greatest((p_filters->>'offset')::integer,0),4800) else 0 end as row_offset,
    case when jsonb_typeof(p_filters->'ids')='array' then (
      select array_agg(value::bigint order by ordinal)
      from (
        select value,ordinality as ordinal
        from jsonb_array_elements_text(p_filters->'ids') with ordinality
        where value ~ '^[1-9][0-9]*$'
        order by ordinality limit 4
      ) valid_ids
    ) end as ids
), latest_evidence as materialized (
  select distinct on (sc.catalog_entity_id)
    sc.catalog_entity_id,os.canonical_url,os.last_checked_at
  from public.source_claims sc
  join public.official_sources os on os.id=sc.source_id and os.is_active
  where sc.verification_state_code='verified'
  order by sc.catalog_entity_id,os.last_checked_at desc,os.id desc
), program_deadlines as materialized (
  select distinct on (ai.program_id) ai.program_id,d.due_at
  from public.admission_intakes ai
  join public.application_rounds ar on ar.intake_id=ai.id
  join public.application_round_deadlines ard on ard.application_round_id=ar.id
  join public.deadlines d on d.id=ard.deadline_id
  where d.is_rolling or d.due_at>=now()
  order by ai.program_id,d.is_rolling,d.due_at nulls last,d.id
), program_tuition as materialized (
  select distinct on (et.program_id)
    et.program_id,et.amount_min,et.amount_max,et.currency_code,et.billing_period
  from public.estimated_tuition et
  order by et.program_id,et.academic_year_start desc nulls last,et.id desc
), program_modes as materialized (
  select program_id,array_agg(delivery_mode_code order by delivery_mode_code) as values
  from public.degree_program_delivery_modes group by program_id
), program_funding as materialized (
  select distinct program_id from public.scholarship_program_links
), scholarship_deadlines as materialized (
  select distinct on (cy.scholarship_id) cy.scholarship_id,d.due_at
  from public.scholarship_cycles cy
  join public.scholarship_cycle_deadlines cd on cd.scholarship_cycle_id=cy.id
  join public.deadlines d on d.id=cd.deadline_id
  where d.is_rolling or d.due_at>=now()
  order by cy.scholarship_id,d.is_rolling,d.due_at nulls last,d.id
), opportunity_deadlines as materialized (
  select distinct on (od.opportunity_id) od.opportunity_id,d.due_at
  from public.opportunity_deadlines od
  join public.deadlines d on d.id=od.deadline_id
  where d.is_rolling or d.due_at>=now()
  order by od.opportunity_id,d.is_rolling,d.due_at nulls last,d.id
), program_rows(
  entity_type,entity_id,slug,title,subtitle,country_code,degree_level,category,
  delivery_format,cost_state,cost_amount_min,cost_amount_max,cost_currency,
  cost_period,deadline_at,funding_label,has_funding,source_url,
  source_checked_at,source_freshness,eligibility_state,detail_path,relevance
) as (
  select
    'program'::text,p.id,p.slug,p.title,i.legal_name,country.iso2,
    p.degree_level_code,field.name,
    array_to_string(coalesce(modes.values,array[]::text[]),', '),
    case when tuition.amount_min is null then 'unknown' else 'published' end,
    tuition.amount_min,tuition.amount_max,tuition.currency_code,tuition.billing_period,
    deadline.due_at,null::text,(funding.program_id is not null),
    evidence.canonical_url,evidence.last_checked_at,
    case when evidence.last_checked_at>=now()-interval '180 days' then 'current' else 'stale' end,
    'not_evaluated'::text,'/programs/'||p.id::text,
    case when requested.query is null then 0::double precision else greatest(
      case when lower(p.title)=lower(requested.query) then 100 else 0 end,
      case when lower(p.title) like lower(requested.query)||'%' then 90 else 0 end,
      50*ts_rank(to_tsvector('simple',p.title||' '||i.legal_name||' '||field.name),websearch_to_tsquery('simple',requested.query)),
      20*extensions.word_similarity(lower(requested.query),lower(p.title||' '||i.legal_name||' '||field.name))
    ) end
  from requested
  cross join public.degree_programs p
  join public.catalog_entities ce on ce.id=p.id
  join public.academic_units au on au.id=p.academic_unit_id
  join public.institutions i on i.id=au.institution_id
  join public.countries country on country.id=i.country_id
  join public.fields_of_study field on field.id=p.primary_field_id
  join latest_evidence evidence on evidence.catalog_entity_id=p.id
  left join program_deadlines deadline on deadline.program_id=p.id
  left join program_tuition tuition on tuition.program_id=p.id
  left join program_modes modes on modes.program_id=p.id
  left join program_funding funding on funding.program_id=p.id
  where ce.publication_status_code='published' and ce.verification_state_code='verified'
    and ce.archived_at is null and ce.last_checked_at is not null
    and (requested.result_type is null or requested.result_type='program')
    and (requested.ids is null or p.id=any(requested.ids))
    and (requested.country is null or country.iso2=requested.country)
    and (requested.degree_level is null or p.degree_level_code=requested.degree_level)
    and (requested.category is null or lower(field.name)=lower(requested.category))
    and (requested.delivery_format is null or requested.delivery_format=any(coalesce(modes.values,array[]::text[])))
    and requested.funding_label is null and requested.cost_state is null
    and (requested.deadline_before is null or deadline.due_at<requested.deadline_before+interval '1 day')
    and (requested.query is null
      or to_tsvector('simple',p.title)@@websearch_to_tsquery('simple',requested.query)
      or to_tsvector('simple',i.legal_name)@@websearch_to_tsquery('simple',requested.query)
      or to_tsvector('simple',field.name)@@websearch_to_tsquery('simple',requested.query)
      or lower(p.title||' '||i.legal_name||' '||field.name) like '%'||lower(requested.query)||'%'
      or lower(requested.query) operator(extensions.<%) lower(p.title)
      or length(requested.query)>=3 and lower(p.title) operator(extensions.%) lower(requested.query))
), scholarship_rows as (
  select
    'scholarship'::text,s.id,s.slug,s.title,coalesce(s.provider_name,i.legal_name),
    coalesce(s.provider_country_code,country.iso2),null::text,s.award_type,null::text,
    'unknown'::text,null::numeric,null::numeric,null::text,null::text,
    deadline.due_at,coalesce(funding.funding_label,'unknown'),true,
    evidence.canonical_url,evidence.last_checked_at,
    case when evidence.last_checked_at>=now()-interval '180 days' then 'current' else 'stale' end,
    'not_evaluated'::text,'/scholarships/'||s.slug,
    case when requested.query is null then 0::double precision else greatest(
      case when lower(s.title)=lower(requested.query) then 100 else 0 end,
      case when lower(s.title) like lower(requested.query)||'%' then 90 else 0 end,
      50*ts_rank(to_tsvector('simple',s.title||' '||coalesce(s.provider_name,i.legal_name,'')),websearch_to_tsquery('simple',requested.query)),
      20*extensions.word_similarity(lower(requested.query),lower(s.title||' '||coalesce(s.provider_name,i.legal_name,'')))
    ) end
  from requested
  cross join public.scholarships s
  join public.catalog_entities ce on ce.id=s.id
  left join public.institutions i on i.id=s.provider_institution_id
  left join public.countries country on country.id=i.country_id
  join latest_evidence evidence on evidence.catalog_entity_id=s.id
  left join public.scholarship_funding_profiles funding on funding.scholarship_id=s.id
  left join scholarship_deadlines deadline on deadline.scholarship_id=s.id
  where ce.publication_status_code='published' and ce.verification_state_code='verified'
    and ce.archived_at is null and ce.last_checked_at is not null
    and (requested.result_type is null or requested.result_type='scholarship')
    and (requested.ids is null or s.id=any(requested.ids))
    and (requested.country is null or coalesce(s.provider_country_code,country.iso2)=requested.country)
    and requested.degree_level is null
    and (requested.category is null or s.award_type=requested.category)
    and requested.delivery_format is null
    and (requested.funding_label is null or coalesce(funding.funding_label,'unknown')=requested.funding_label)
    and requested.cost_state is null
    and (requested.deadline_before is null or deadline.due_at<requested.deadline_before+interval '1 day')
    and (requested.query is null
      or to_tsvector('simple',s.title)@@websearch_to_tsquery('simple',requested.query)
      or to_tsvector('simple',coalesce(s.provider_name,i.legal_name,''))@@websearch_to_tsquery('simple',requested.query)
      or lower(s.title||' '||coalesce(s.provider_name,i.legal_name,'')) like '%'||lower(requested.query)||'%'
      or lower(requested.query) operator(extensions.<%) lower(s.title)
      or length(requested.query)>=3 and lower(s.title) operator(extensions.%) lower(requested.query))
), opportunity_rows as (
  select
    'opportunity'::text,o.id,o.slug,o.title,coalesce(o.provider_name,i.legal_name),country.iso2,
    null::text,o.opportunity_type,o.participation_format,o.cost_state,
    o.cost_amount_min,o.cost_amount_max,o.cost_currency_code,
    case when o.cost_amount_min is null then null else 'program' end,
    deadline.due_at,null::text,false,source.canonical_url,source.last_checked_at,
    case when source.last_checked_at>=now()-interval '180 days' then 'current' else 'stale' end,
    'not_evaluated'::text,'/opportunities/'||o.slug,
    case when requested.query is null then 0::double precision else greatest(
      case when lower(o.title)=lower(requested.query) then 100 else 0 end,
      case when lower(o.title) like lower(requested.query)||'%' then 90 else 0 end,
      50*ts_rank(to_tsvector('simple',o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,'')),websearch_to_tsquery('simple',requested.query)),
      20*extensions.word_similarity(lower(requested.query),lower(o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,'')))
    ) end
  from requested
  cross join public.opportunities o
  join public.catalog_entities ce on ce.id=o.id
  left join public.institutions i on i.id=o.provider_institution_id
  left join public.countries country on country.id=o.country_id
  join public.source_claims claim on claim.id=o.source_claim_id and claim.catalog_entity_id=o.id and claim.verification_state_code='verified'
  join public.official_sources source on source.id=claim.source_id and source.is_active
  left join opportunity_deadlines deadline on deadline.opportunity_id=o.id
  where ce.publication_status_code='published' and ce.verification_state_code='verified'
    and ce.archived_at is null and ce.last_checked_at is not null
    and (requested.result_type is null or requested.result_type='opportunity')
    and (requested.ids is null or o.id=any(requested.ids))
    and (requested.country is null or country.iso2=requested.country)
    and requested.degree_level is null
    and (requested.category is null or o.opportunity_type=requested.category)
    and (requested.delivery_format is null or o.participation_format=requested.delivery_format)
    and requested.funding_label is null
    and (requested.cost_state is null or o.cost_state=requested.cost_state)
    and (requested.deadline_before is null or deadline.due_at<requested.deadline_before+interval '1 day')
    and (requested.query is null
      or to_tsvector('simple',o.title)@@websearch_to_tsquery('simple',requested.query)
      or to_tsvector('simple',coalesce(o.provider_name,i.legal_name,''))@@websearch_to_tsquery('simple',requested.query)
      or to_tsvector('simple',coalesce(o.summary,''))@@websearch_to_tsquery('simple',requested.query)
      or lower(o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,'')) like '%'||lower(requested.query)||'%'
      or lower(requested.query) operator(extensions.<%) lower(o.title)
      or length(requested.query)>=3 and lower(o.title) operator(extensions.%) lower(requested.query))
), matching as (
  select * from program_rows union all select * from scholarship_rows union all select * from opportunity_rows
), ranked as (
  select matching.*,count(*) over() as total_count,
    jsonb_build_object(
      'program',count(*) filter(where entity_type='program') over(),
      'scholarship',count(*) filter(where entity_type='scholarship') over(),
      'opportunity',count(*) filter(where entity_type='opportunity') over()
    ) as type_counts
  from matching
)
select ranked.* from ranked cross join requested
order by
  case when requested.sort_key='relevance' then ranked.relevance end desc,
  case when requested.sort_key='recent' then ranked.source_checked_at end desc,
  case when requested.sort_key='deadline' then ranked.deadline_at end asc nulls last,
  case when requested.sort_key='title' then ranked.title end asc,
  ranked.entity_type,ranked.title,ranked.entity_id
limit (select row_limit from requested) offset (select row_offset from requested);
$$;

commit;
