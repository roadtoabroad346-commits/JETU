-- Synthetic fixture, transactionally rolled back. Never publish as product data.
begin;
-- The catalog migration defines taxonomy tables but intentionally seeds no product data.
-- Supply only the reference values required by this rollback-only fixture.
insert into public.fee_currency (code, name)
values ('KZT', 'Kazakhstani tenge'), ('USD', 'US dollar') on conflict do nothing;
insert into public.countries (iso2, iso3, name, default_currency_code)
values ('KZ', 'KAZ', 'Kazakhstan', 'KZT') on conflict do nothing;
insert into public.degree_levels (code, label, rank)
values ('bachelor', 'Bachelor', 1), ('master', 'Master', 2) on conflict do nothing;
insert into public.fields_of_study (code, name)
values ('CS', 'Computer science'), ('BUS', 'Business') on conflict do nothing;
insert into public.languages_of_instruction (code, name)
values ('en', 'English'), ('kk', 'Kazakh') on conflict do nothing;
insert into public.program_delivery_modes (code, label)
values ('on_campus', 'On campus'), ('hybrid', 'Hybrid') on conflict do nothing;
create temporary table catalog_fixture (kind text primary key, bundle jsonb not null);
insert into catalog_fixture values ('published', public.import_catalog_bundle(jsonb_build_object(
  'source',jsonb_build_object('url','https://fixture.example/phase12-published','publisher','Fixture University','title','Fixture degree page','locale','en','excerpt','Synthetic evidence for SQL isolation test'),
  'institution',jsonb_build_object('slug','fixture-phase12-university','legal_name','Fixture University','type','university','country_iso2','KZ','website_url','https://fixture.example'),
  'campus',jsonb_build_object('code','MAIN','name','Fixture Campus'),
  'academic_unit',jsonb_build_object('slug','science','title','Science'),
  'program',jsonb_build_object('slug','fixture-computing','title','Fixture Computing','degree_level_code','bachelor','field_code','CS'),
  'intake',jsonb_build_object('academic_year_start',2027,'term_code','fall','starts_on','2027-09-01')
)));
insert into catalog_fixture values ('draft', public.import_catalog_bundle(jsonb_build_object(
  'source',jsonb_build_object('url','https://fixture.example/phase12-draft','publisher','Draft University','title','Draft degree page','locale','en','excerpt','Synthetic draft evidence'),
  'institution',jsonb_build_object('slug','fixture-phase12-draft','legal_name','Draft University','type','university','country_iso2','KZ'),
  'campus',jsonb_build_object('code','MAIN','name','Draft Campus'),
  'academic_unit',jsonb_build_object('slug','science','title','Science'),
  'program',jsonb_build_object('slug','fixture-hidden','title','Fixture Hidden','degree_level_code','master','field_code','BUS'),
  'intake',jsonb_build_object('academic_year_start',2027,'term_code','fall','starts_on','2027-09-01')
)));
update public.source_claims set verification_state_code='verified'
where source_id=(select (bundle->>'sourceId')::bigint from catalog_fixture where kind='published');
select public.publish_catalog_entity((bundle->>key)::bigint, now()) from catalog_fixture,
  (values ('institutionId'),('campusId'),('academicUnitId'),('programId'),('intakeId')) keys(key)
where kind='published';
insert into public.degree_program_languages (program_id,language_code)
select (bundle->>'programId')::bigint,'en' from catalog_fixture where kind='published';
insert into public.degree_program_delivery_modes (program_id,delivery_mode_code)
select (bundle->>'programId')::bigint,'on_campus' from catalog_fixture where kind='published';
insert into public.degree_program_languages (program_id,language_code) select (bundle->>'programId')::bigint,'kk' from catalog_fixture where kind='published';
insert into public.degree_program_delivery_modes (program_id,delivery_mode_code) select (bundle->>'programId')::bigint,'hybrid' from catalog_fixture where kind='published';
create temporary table catalog_tuition_fixture (id bigint);
with entity as (insert into public.catalog_entities(entity_type) values ('estimated_tuition') returning id)
insert into catalog_tuition_fixture select id from entity;
insert into public.estimated_tuition(id,program_id,currency_code,amount_min,billing_period,academic_year_start)
select t.id,(f.bundle->>'programId')::bigint,'USD',12000,'academic_year',2027
from catalog_tuition_fixture t cross join catalog_fixture f where f.kind='published';
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select (f.bundle->>'sourceId')::bigint,t.id,'tuition','Synthetic tuition fixture',md5('phase12-tuition'),'verified'
from catalog_tuition_fixture t cross join catalog_fixture f where f.kind='published';
select public.publish_catalog_entity(id,now()) from catalog_tuition_fixture;
create temporary table catalog_round_fixture (id bigint);
with entity as (insert into public.catalog_entities(entity_type) values ('application_round') returning id)
insert into catalog_round_fixture select id from entity;
insert into public.application_rounds(id,intake_id,round_code,title,closes_at)
select r.id,(f.bundle->>'intakeId')::bigint,'regular','Regular','2027-03-01T12:00:00Z'
from catalog_round_fixture r cross join catalog_fixture f where f.kind='published';
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select (f.bundle->>'sourceId')::bigint,r.id,'deadline','Synthetic deadline fixture',md5('phase12-deadline'),'verified'
from catalog_round_fixture r cross join catalog_fixture f where f.kind='published';
select public.publish_catalog_entity(id,now()) from catalog_round_fixture;
create temporary table catalog_deadline_fixture (id bigint);
with entity as (insert into public.catalog_entities(entity_type) values ('deadline') returning id)
insert into catalog_deadline_fixture select id from entity;
insert into public.deadlines(id,deadline_type,title,due_at,timezone_name)
select id,'application','Application deadline','2027-03-01T12:00:00Z','UTC'
from catalog_deadline_fixture;
insert into public.application_round_deadlines(application_round_id,deadline_id)
select r.id,d.id from catalog_round_fixture r cross join catalog_deadline_fixture d;
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select (f.bundle->>'sourceId')::bigint,d.id,'deadline','Synthetic deadline fixture',md5('phase12-application-deadline'),'verified'
from catalog_deadline_fixture d cross join catalog_fixture f where f.kind='published';
select public.publish_catalog_entity(id,now()) from catalog_deadline_fixture;
set local role anon;
select
  (select count(*) from public.catalog_search('{}'::jsonb)) as published_visible,
  (select count(*) from public.catalog_search('{"country":"KZ","level":"bachelor","major":"Computer science","language":"en","mode":"on_campus","intake":"fall"}'::jsonb)) as matching_facets,
  (select count(*) from public.catalog_search('{"language":"kk","mode":"hybrid"}'::jsonb)) as secondary_facets,
  (select count(*) from public.catalog_search('{"maxTuition":13000,"currency":"USD"}'::jsonb)) as budget_match,
  (select count(*) from public.catalog_search('{"maxTuition":11000,"currency":"USD"}'::jsonb)) as budget_excludes,
  (select count(*) from public.catalog_search('{"deadline":"2027-04-01"}'::jsonb)) as deadline_match,
  (select count(*) from public.catalog_search('{"deadline":"2027-02-01"}'::jsonb)) as deadline_excludes,
  (select count(*) from public.catalog_search('{"level":"master"}'::jsonb)) as draft_hidden,
  (select count(*) from public.catalog_search('{"country":"US"}'::jsonb)) as wrong_country,
  (select count(*) from public.catalog_search('{"q":"Fixture Computing"}'::jsonb)) as search_match,
  (select count(*) from public.catalog_search('{"q":"Fixture Hidden"}'::jsonb)) as hidden_search;
do $$
begin
  if (select count(*) from public.catalog_search('{}'::jsonb)) <> 1
    or (select count(*) from public.catalog_search('{"country":"KZ","level":"bachelor","major":"Computer science","language":"en","mode":"on_campus","intake":"fall"}'::jsonb)) <> 1
    or (select count(*) from public.catalog_search('{"language":"kk","mode":"hybrid"}'::jsonb)) <> 1
    or (select count(*) from public.catalog_search('{"maxTuition":13000,"currency":"USD"}'::jsonb)) <> 1
    or (select count(*) from public.catalog_search('{"maxTuition":11000,"currency":"USD"}'::jsonb)) <> 0
    or (select count(*) from public.catalog_search('{"deadline":"2027-04-01"}'::jsonb)) <> 1
    or (select count(*) from public.catalog_search('{"deadline":"2027-02-01"}'::jsonb)) <> 0
    or (select count(*) from public.catalog_search('{"level":"master"}'::jsonb)) <> 0
    or (select count(*) from public.catalog_search('{"country":"US"}'::jsonb)) <> 0
    or (select count(*) from public.catalog_search('{"q":"Fixture Computing"}'::jsonb)) <> 1
    or (select count(*) from public.catalog_search('{"q":"Fixture Hidden"}'::jsonb)) <> 0
  then raise exception 'catalog filter or visibility assertion failed'; end if;
end;
$$;
rollback;
