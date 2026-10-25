-- Phase 15: public, source-gated unified discovery plus private saved state.
-- The search function is SECURITY INVOKER so every underlying RLS policy remains active.
begin;

create extension if not exists pg_trgm with schema extensions;

-- Trigram indexes provide bounded typo tolerance for Latin and Cyrillic titles.
-- FTS uses the language-neutral simple configuration inside the RPC.
create index degree_programs_title_trgm_idx
  on public.degree_programs using gin (lower(title) extensions.gin_trgm_ops);
create index degree_programs_title_word_trgm_idx
  on public.degree_programs using gist (lower(title) extensions.gist_trgm_ops(siglen=32));
create index institutions_name_trgm_idx
  on public.institutions using gin (lower(legal_name) extensions.gin_trgm_ops);
create index scholarships_title_trgm_idx
  on public.scholarships using gin (lower(title) extensions.gin_trgm_ops);
create index scholarships_title_word_trgm_idx
  on public.scholarships using gist (lower(title) extensions.gist_trgm_ops(siglen=32));
create index scholarships_provider_name_trgm_idx
  on public.scholarships using gin (lower(provider_name) extensions.gin_trgm_ops)
  where provider_name is not null;
create index opportunities_title_trgm_idx
  on public.opportunities using gin (lower(title) extensions.gin_trgm_ops);
create index opportunities_title_word_trgm_idx
  on public.opportunities using gist (lower(title) extensions.gist_trgm_ops(siglen=32));
create index opportunities_provider_name_trgm_idx
  on public.opportunities using gin (lower(provider_name) extensions.gin_trgm_ops)
  where provider_name is not null;
create index opportunities_cost_currency_fk_idx
  on public.opportunities(cost_currency_code)
  where cost_currency_code is not null;

create table public.saved_catalog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_entity_id bigint not null references public.catalog_entities(id) on delete cascade,
  list_name text not null default 'Saved' check (length(btrim(list_name)) between 1 and 40),
  note text check (note is null or length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, catalog_entity_id)
);

create index saved_catalog_items_owner_recent_idx
  on public.saved_catalog_items(user_id, updated_at desc, id);
create index saved_catalog_items_entity_idx
  on public.saved_catalog_items(catalog_entity_id);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  filters jsonb not null check (
    jsonb_typeof(filters) = 'object'
    and octet_length(filters::text) <= 4000
  ),
  fingerprint text generated always as (md5(filters::text)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, fingerprint)
);

create index saved_searches_owner_recent_idx
  on public.saved_searches(user_id, updated_at desc, id);

alter table public.saved_catalog_items enable row level security;
alter table public.saved_searches enable row level security;

create policy saved_catalog_items_owner_select on public.saved_catalog_items
for select to authenticated
using ((select auth.uid()) = user_id);
create policy saved_catalog_items_owner_insert on public.saved_catalog_items
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.catalog_entities ce
    where ce.id = catalog_entity_id
      and ce.entity_type in ('degree_program', 'scholarship', 'opportunity')
  )
);
create policy saved_catalog_items_owner_update on public.saved_catalog_items
for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.catalog_entities ce
    where ce.id = catalog_entity_id
      and ce.entity_type in ('degree_program', 'scholarship', 'opportunity')
  )
);
create policy saved_catalog_items_owner_delete on public.saved_catalog_items
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy saved_searches_owner_select on public.saved_searches
for select to authenticated
using ((select auth.uid()) = user_id);
create policy saved_searches_owner_insert on public.saved_searches
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy saved_searches_owner_update on public.saved_searches
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy saved_searches_owner_delete on public.saved_searches
for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.saved_catalog_items, public.saved_searches
  from public, anon, authenticated;
grant select, insert, delete on table public.saved_catalog_items, public.saved_searches
  to authenticated;
grant update(list_name, note, updated_at) on table public.saved_catalog_items
  to authenticated;
grant update(name, filters, updated_at) on table public.saved_searches
  to authenticated;
grant all on table public.saved_catalog_items, public.saved_searches to service_role;

create function public.unified_catalog_search(p_filters jsonb default '{}'::jsonb)
returns table (
  entity_type text,
  entity_id bigint,
  slug text,
  title text,
  subtitle text,
  country_code text,
  degree_level text,
  category text,
  delivery_format text,
  cost_state text,
  cost_amount_min numeric,
  cost_amount_max numeric,
  cost_currency text,
  cost_period text,
  deadline_at timestamptz,
  funding_label text,
  has_funding boolean,
  source_url text,
  source_checked_at timestamptz,
  source_freshness text,
  eligibility_state text,
  detail_path text,
  relevance double precision,
  total_count bigint,
  type_counts jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
with requested as (
  select
    nullif(btrim(p_filters->>'q'), '') as query,
    case when p_filters->>'type' in ('program','scholarship','opportunity')
      then p_filters->>'type' end as result_type,
    nullif(upper(p_filters->>'country'), '') as country,
    nullif(p_filters->>'level', '') as degree_level,
    nullif(p_filters->>'category', '') as category,
    nullif(p_filters->>'format', '') as delivery_format,
    nullif(p_filters->>'funding', '') as funding_label,
    nullif(p_filters->>'cost', '') as cost_state,
    case when coalesce(p_filters->>'deadline', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      then (p_filters->>'deadline')::date end as deadline_before,
    case when p_filters->>'sort' in ('relevance','recent','deadline','title')
      then p_filters->>'sort' else 'relevance' end as sort_key,
    case when coalesce(p_filters->>'limit', '') ~ '^[0-9]{1,2}$'
      then least(greatest((p_filters->>'limit')::integer, 1), 24) else 20 end as row_limit,
    case when coalesce(p_filters->>'offset', '') ~ '^[0-9]{1,5}$'
      then least(greatest((p_filters->>'offset')::integer, 0), 4800) else 0 end as row_offset,
    case when jsonb_typeof(p_filters->'ids') = 'array' then (
      select array_agg(value::bigint order by ordinal)
      from (
        select value, ordinality as ordinal
        from jsonb_array_elements_text(p_filters->'ids') with ordinality
        where value ~ '^[1-9][0-9]*$'
        order by ordinality
        limit 4
      ) valid_ids
    ) end as ids
), program_rows as (
  select
    'program'::text as entity_type,
    p.id as entity_id,
    p.slug,
    p.title,
    i.legal_name as subtitle,
    country.iso2 as country_code,
    p.degree_level_code as degree_level,
    field.name as category,
    mode.delivery_mode_code as delivery_format,
    case when tuition.amount_min is null then 'unknown' else 'published' end as cost_state,
    tuition.amount_min as cost_amount_min,
    tuition.amount_max as cost_amount_max,
    tuition.currency_code as cost_currency,
    tuition.billing_period as cost_period,
    deadline.due_at as deadline_at,
    null::text as funding_label,
    exists(select 1 from public.scholarship_program_links spl where spl.program_id=p.id) as has_funding,
    evidence.canonical_url as source_url,
    evidence.last_checked_at as source_checked_at,
    case when evidence.last_checked_at >= now()-interval '180 days' then 'current' else 'stale' end as source_freshness,
    'not_evaluated'::text as eligibility_state,
    '/programs/' || p.id::text as detail_path,
    case when requested.query is null then 0::double precision
      else greatest(
        case when lower(p.title)=lower(requested.query) then 100 else 0 end,
        case when lower(p.title) like lower(requested.query)||'%' then 90 else 0 end,
        50 * ts_rank(
          to_tsvector('simple', p.title||' '||i.legal_name||' '||field.name),
          websearch_to_tsquery('simple', requested.query)
        ),
        20 * extensions.word_similarity(lower(requested.query), lower(p.title||' '||i.legal_name||' '||field.name))
      ) end as relevance
  from requested
  cross join public.degree_programs p
  join public.academic_units au on au.id=p.academic_unit_id
  join public.institutions i on i.id=au.institution_id
  join public.countries country on country.id=i.country_id
  join public.fields_of_study field on field.id=p.primary_field_id
  join lateral (
    select os.canonical_url,os.last_checked_at
    from public.source_claims sc join public.official_sources os on os.id=sc.source_id
    where sc.catalog_entity_id=p.id and sc.verification_state_code='verified' and os.is_active
    order by os.last_checked_at desc,os.id desc limit 1
  ) evidence on true
  left join lateral (
    select d.due_at from public.admission_intakes ai
    join public.application_rounds ar on ar.intake_id=ai.id
    join public.application_round_deadlines ard on ard.application_round_id=ar.id
    join public.deadlines d on d.id=ard.deadline_id
    where ai.program_id=p.id and (d.is_rolling or d.due_at>=now())
    order by d.is_rolling,d.due_at nulls last,d.id limit 1
  ) deadline on true
  left join lateral (
    select et.amount_min,et.amount_max,et.currency_code,et.billing_period
    from public.estimated_tuition et where et.program_id=p.id
    order by et.academic_year_start desc nulls last,et.id desc limit 1
  ) tuition on true
  left join lateral (
    select delivery_mode_code from public.degree_program_delivery_modes
    where program_id=p.id order by delivery_mode_code limit 1
  ) mode on true
  where (requested.result_type is null or requested.result_type='program')
    and (requested.ids is null or p.id=any(requested.ids))
    and (requested.country is null or country.iso2=requested.country)
    and (requested.degree_level is null or p.degree_level_code=requested.degree_level)
    and (requested.category is null or lower(field.name)=lower(requested.category))
    and (requested.delivery_format is null or mode.delivery_mode_code=requested.delivery_format)
    and requested.funding_label is null
    and requested.cost_state is null
    and (requested.deadline_before is null or deadline.due_at < requested.deadline_before+interval '1 day')
    and (requested.query is null
      or to_tsvector('simple', p.title||' '||i.legal_name||' '||field.name)
        @@ websearch_to_tsquery('simple', requested.query)
      or lower(p.title||' '||i.legal_name||' '||field.name) like '%'||lower(requested.query)||'%'
      or lower(requested.query) OPERATOR(extensions.<%) lower(p.title)
      or length(requested.query)>=3 and lower(p.title||' '||i.legal_name||' '||field.name)
        OPERATOR(extensions.%) lower(requested.query))
), scholarship_rows as (
  select
    'scholarship'::text,s.id,s.slug,s.title,
    coalesce(s.provider_name,i.legal_name) as subtitle,
    coalesce(s.provider_country_code,country.iso2),
    null::text,s.award_type,null::text,
    'unknown'::text,null::numeric,null::numeric,null::text,null::text,
    deadline.due_at,
    coalesce(funding.funding_label,'unknown'),
    true,
    evidence.canonical_url,evidence.last_checked_at,
    case when evidence.last_checked_at>=now()-interval '180 days' then 'current' else 'stale' end,
    'not_evaluated'::text,
    '/scholarships/'||s.slug,
    case when requested.query is null then 0::double precision
      else greatest(
        case when lower(s.title)=lower(requested.query) then 100 else 0 end,
        case when lower(s.title) like lower(requested.query)||'%' then 90 else 0 end,
        50*ts_rank(to_tsvector('simple',s.title||' '||coalesce(s.provider_name,i.legal_name,'')),websearch_to_tsquery('simple',requested.query)),
        20*extensions.word_similarity(lower(requested.query),lower(s.title||' '||coalesce(s.provider_name,i.legal_name,'')))
      ) end
  from requested
  cross join public.scholarships s
  left join public.institutions i on i.id=s.provider_institution_id
  left join public.countries country on country.id=i.country_id
  join lateral (
    select os.canonical_url,os.last_checked_at
    from public.source_claims sc join public.official_sources os on os.id=sc.source_id
    where sc.catalog_entity_id=s.id and sc.verification_state_code='verified' and os.is_active
    order by os.last_checked_at desc,os.id desc limit 1
  ) evidence on true
  left join public.scholarship_funding_profiles funding on funding.scholarship_id=s.id
  left join lateral (
    select d.due_at from public.scholarship_cycles cy
    join public.scholarship_cycle_deadlines cd on cd.scholarship_cycle_id=cy.id
    join public.deadlines d on d.id=cd.deadline_id
    where cy.scholarship_id=s.id and (d.is_rolling or d.due_at>=now())
    order by d.is_rolling,d.due_at nulls last,d.id limit 1
  ) deadline on true
  where (requested.result_type is null or requested.result_type='scholarship')
    and (requested.ids is null or s.id=any(requested.ids))
    and (requested.country is null or coalesce(s.provider_country_code,country.iso2)=requested.country)
    and requested.degree_level is null
    and (requested.category is null or s.award_type=requested.category)
    and requested.delivery_format is null
    and (requested.funding_label is null or coalesce(funding.funding_label,'unknown')=requested.funding_label)
    and requested.cost_state is null
    and (requested.deadline_before is null or deadline.due_at < requested.deadline_before+interval '1 day')
    and (requested.query is null
      or to_tsvector('simple',s.title||' '||coalesce(s.provider_name,i.legal_name,''))
        @@ websearch_to_tsquery('simple',requested.query)
      or lower(s.title||' '||coalesce(s.provider_name,i.legal_name,'')) like '%'||lower(requested.query)||'%'
      or lower(requested.query) OPERATOR(extensions.<%) lower(s.title)
      or length(requested.query)>=3 and lower(s.title||' '||coalesce(s.provider_name,i.legal_name,''))
        OPERATOR(extensions.%) lower(requested.query))
), opportunity_rows as (
  select
    'opportunity'::text,o.id,o.slug,o.title,
    coalesce(o.provider_name,i.legal_name),country.iso2,
    null::text,o.opportunity_type,o.participation_format,o.cost_state,
    o.cost_amount_min,o.cost_amount_max,o.cost_currency_code,
    case when o.cost_amount_min is null then null else 'program' end,
    deadline.due_at,null::text,false,
    source.canonical_url,source.last_checked_at,
    case when source.last_checked_at>=now()-interval '180 days' then 'current' else 'stale' end,
    'not_evaluated'::text,
    '/opportunities/'||o.slug,
    case when requested.query is null then 0::double precision
      else greatest(
        case when lower(o.title)=lower(requested.query) then 100 else 0 end,
        case when lower(o.title) like lower(requested.query)||'%' then 90 else 0 end,
        50*ts_rank(to_tsvector('simple',o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,'')),websearch_to_tsquery('simple',requested.query)),
        20*extensions.word_similarity(lower(requested.query),lower(o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,'')))
      ) end
  from requested
  cross join public.opportunities o
  left join public.institutions i on i.id=o.provider_institution_id
  left join public.countries country on country.id=o.country_id
  join public.source_claims claim on claim.id=o.source_claim_id
    and claim.catalog_entity_id=o.id and claim.verification_state_code='verified'
  join public.official_sources source on source.id=claim.source_id and source.is_active
  left join lateral (
    select d.due_at from public.opportunity_deadlines od
    join public.deadlines d on d.id=od.deadline_id
    where od.opportunity_id=o.id and (d.is_rolling or d.due_at>=now())
    order by d.is_rolling,d.due_at nulls last,d.id limit 1
  ) deadline on true
  where (requested.result_type is null or requested.result_type='opportunity')
    and (requested.ids is null or o.id=any(requested.ids))
    and (requested.country is null or country.iso2=requested.country)
    and requested.degree_level is null
    and (requested.category is null or o.opportunity_type=requested.category)
    and (requested.delivery_format is null or o.participation_format=requested.delivery_format)
    and requested.funding_label is null
    and (requested.cost_state is null or o.cost_state=requested.cost_state)
    and (requested.deadline_before is null or deadline.due_at < requested.deadline_before+interval '1 day')
    and (requested.query is null
      or to_tsvector('simple',o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,''))
        @@ websearch_to_tsquery('simple',requested.query)
      or lower(o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,'')) like '%'||lower(requested.query)||'%'
      or lower(requested.query) OPERATOR(extensions.<%) lower(o.title)
      or length(requested.query)>=3 and lower(o.title||' '||coalesce(o.provider_name,i.legal_name,'')||' '||coalesce(o.summary,''))
        OPERATOR(extensions.%) lower(requested.query))
), matching as (
  select * from program_rows
  union all select * from scholarship_rows
  union all select * from opportunity_rows
), ranked as (
  select matching.*,
    count(*) over() as total_count,
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
limit (select row_limit from requested)
offset (select row_offset from requested);
$$;

revoke all on function public.unified_catalog_search(jsonb) from public, anon, authenticated;
grant execute on function public.unified_catalog_search(jsonb) to anon, authenticated, service_role;

commit;

