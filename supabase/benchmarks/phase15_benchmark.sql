-- Manual rollback-only 10k-row search benchmark, outside the pgTAP test directory.
-- Never publish these synthetic records. Run only on an authorized disposable database.
begin;
set local statement_timeout = '55s';

insert into public.fee_currency(code,name) values ('XTS','Testing currency') on conflict do nothing;
insert into public.countries(iso2,iso3,name,default_currency_code) values ('ZZ','ZZZ','Synthetic test country','XTS') on conflict do nothing;
insert into public.degree_levels(code,label,rank) values ('bachelor','Bachelor',1) on conflict do nothing;
insert into public.fields_of_study(code,name) values ('P15CS','Computer science') on conflict do nothing;

create temporary table p15_base(kind text primary key,id bigint not null);
create temporary table p15_source(id bigint primary key);
with inserted as (
  insert into public.official_sources(canonical_url,publisher_name,source_title,locale,last_checked_at)
  values ('https://fixture.example/phase15','Phase 15 Fixture','Synthetic benchmark source','en',now())
  returning id
) insert into p15_source select id from inserted;

with entity as (
  insert into public.catalog_entities(entity_type) values ('institution') returning id
) insert into p15_base select 'institution',id from entity;
insert into public.institutions(id,country_id,slug,legal_name,institution_type,website_url)
select b.id,c.id,'phase15-fixture-university','Phase 15 Fixture University','university','https://fixture.example'
from p15_base b cross join public.countries c where b.kind='institution' and c.iso2='ZZ';
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select s.id,b.id,'record','Synthetic institution evidence',md5('p15-institution'),'verified'
from p15_source s cross join p15_base b where b.kind='institution';
update public.catalog_entities set publication_status_code='published',verification_state_code='verified',last_checked_at=now()
where id=(select id from p15_base where kind='institution');

with entity as (
  insert into public.catalog_entities(entity_type) values ('academic_unit') returning id
) insert into p15_base select 'unit',id from entity;
insert into public.academic_units(id,institution_id,slug,title)
select unit.id,institution.id,'phase15-science','Synthetic Science'
from p15_base unit cross join p15_base institution where unit.kind='unit' and institution.kind='institution';
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select s.id,b.id,'record','Synthetic academic unit evidence',md5('p15-unit'),'verified'
from p15_source s cross join p15_base b where b.kind='unit';
update public.catalog_entities set publication_status_code='published',verification_state_code='verified',last_checked_at=now()
where id=(select id from p15_base where kind='unit');

create temporary table p15_programs as
with inserted as (
  insert into public.catalog_entities(entity_type)
  select 'degree_program' from generate_series(1,10000)
  returning id
) select row_number() over(order by id)::integer as n,id from inserted;
insert into public.degree_programs(id,academic_unit_id,degree_level_code,primary_field_id,slug,title)
select p.id,b.id,'bachelor',f.id,'phase15-program-'||p.n,
  case p.n%5 when 0 then 'Computer Science '||p.n when 1 then 'Компьютерные науки '||p.n
    when 2 then 'Компьютерлік ғылымдар '||p.n when 3 then 'École informatique '||p.n
    else 'Data systems '||p.n end
from p15_programs p cross join p15_base b cross join public.fields_of_study f
where b.kind='unit' and f.code='P15CS';
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select s.id,p.id,'record','Synthetic program benchmark evidence '||p.n,md5('p15-program-'||p.n),'verified'
from p15_source s cross join p15_programs p;
update public.catalog_entities ce set publication_status_code='published',verification_state_code='verified',last_checked_at=now()
from p15_programs p where ce.id=p.id;

with entity as (
  insert into public.catalog_entities(entity_type) values ('scholarship') returning id
) insert into p15_base select 'scholarship',id from entity;
insert into public.scholarships(id,provider_institution_id,slug,title,award_type,official_url)
select scholarship.id,institution.id,'phase15-scholarship','Synthetic CS Scholarship','scholarship','https://fixture.example/scholarship'
from p15_base scholarship cross join p15_base institution where scholarship.kind='scholarship' and institution.kind='institution';
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select s.id,b.id,'record','Synthetic scholarship evidence',md5('p15-scholarship'),'verified'
from p15_source s cross join p15_base b where b.kind='scholarship';
insert into public.scholarship_funding_profiles(scholarship_id,funding_label)
select id,'unknown' from p15_base where kind='scholarship';
update public.catalog_entities set publication_status_code='published',verification_state_code='verified',last_checked_at=now()
where id=(select id from p15_base where kind='scholarship');

with entity as (
  insert into public.catalog_entities(entity_type) values ('opportunity') returning id
) insert into p15_base select 'opportunity',id from entity;
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select s.id,b.id,'record','Synthetic opportunity evidence',md5('p15-opportunity'),'verified'
from p15_source s cross join p15_base b where b.kind='opportunity';
insert into public.opportunities(id,provider_institution_id,opportunity_type,slug,title,official_url,summary,participation_format,country_id,cost_state,source_claim_id,eligibility_age_min,eligibility_age_max,eligibility_summary,official_application_url)
select opportunity.id,institution.id,'summer_school','phase15-opportunity','Synthetic CS Summer School','https://fixture.example/opportunity',
  'Synthetic opportunity used only inside a rolled back search benchmark.','online',country.id,'free',claim.id,10,18,
  'Synthetic published criteria for the rolled back benchmark.','https://fixture.example/opportunity/apply'
from p15_base opportunity cross join p15_base institution cross join public.countries country
join public.source_claims claim on claim.catalog_entity_id=opportunity.id
where opportunity.kind='opportunity' and institution.kind='institution' and country.iso2='ZZ';
update public.catalog_entities set publication_status_code='published',verification_state_code='verified',last_checked_at=now()
where id=(select id from p15_base where kind='opportunity');

-- Model a steady corpus after autovacuum/ANALYZE has refreshed planner statistics.
-- These catalog-statistic changes roll back with the synthetic transaction.
analyze public.catalog_entities;
analyze public.source_claims;
analyze public.official_sources;
analyze public.degree_programs;
analyze public.academic_units;
analyze public.institutions;
analyze public.fields_of_study;

create temporary table p15_results(
  all_count bigint,mixed_types integer,latin integer,cyrillic integer,kazakh integer,diacritic integer,
  typo integer,stable_first boolean,stable_second boolean,pages_disjoint boolean,
  filter_composed boolean,within_range_truth boolean,outside_range_excluded boolean,
  invalid_type_falls_back boolean,hidden integer
);
grant insert on p15_results to anon;
set local role anon;
insert into p15_results
select
  (select total_count from public.unified_catalog_search('{"limit":1}'::jsonb) limit 1),
  (select count(*)::integer from jsonb_each((select type_counts from public.unified_catalog_search('{"limit":1}'::jsonb) limit 1)) where value::integer>0),
  (select count(*)::integer from public.unified_catalog_search('{"q":"Computer Science 100","limit":24}'::jsonb)),
  (select count(*)::integer from public.unified_catalog_search('{"q":"Компьютерные","limit":24}'::jsonb)),
  (select count(*)::integer from public.unified_catalog_search('{"q":"Компьютерлік","limit":24}'::jsonb)),
  (select count(*)::integer from public.unified_catalog_search('{"q":"École","limit":24}'::jsonb)),
  (select count(*)::integer from public.unified_catalog_search('{"q":"Computre Science","limit":24}'::jsonb)),
  (select array_agg(entity_type||':'||entity_id)=
    (select array_agg(entity_type||':'||entity_id) from public.unified_catalog_search('{"sort":"title","limit":20,"offset":0}'::jsonb))
    from public.unified_catalog_search('{"sort":"title","limit":20,"offset":0}'::jsonb)),
  (select array_agg(entity_type||':'||entity_id)=
    (select array_agg(entity_type||':'||entity_id) from public.unified_catalog_search('{"sort":"title","limit":20,"offset":20}'::jsonb))
    from public.unified_catalog_search('{"sort":"title","limit":20,"offset":20}'::jsonb)),
  (select not exists(
    select 1
    from public.unified_catalog_search('{"sort":"title","limit":20,"offset":0}'::jsonb) first_page
    join public.unified_catalog_search('{"sort":"title","limit":20,"offset":20}'::jsonb) second_page
      using(entity_type,entity_id)
  )),
  (select count(*)>0 from public.unified_catalog_search(
    '{"q":"Computer","type":"program","country":"ZZ","level":"bachelor","category":"Computer science","limit":24}'::jsonb
  )),
  (select age_fit='within_range' from public.opportunity_search(
    '{"slug":"phase15-opportunity","age":15,"limit":1}'::jsonb
  )),
  (select count(*)=0 from public.opportunity_search(
    '{"slug":"phase15-opportunity","age":99,"limit":1}'::jsonb
  )),
  (select count(*)>0 from public.unified_catalog_search('{"type":"admin","limit":1}'::jsonb)),
  (select count(*)::integer from public.unified_catalog_search('{"q":"never-published-private-record","limit":24}'::jsonb));
reset role;

select * from p15_results;
rollback;
