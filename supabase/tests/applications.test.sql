-- Synthetic fixture, transactionally rolled back. Never publish as product data.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(28);

select ok((select relrowsecurity from pg_class where oid='public.applications'::regclass), 'applications RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.application_checklist_items'::regclass), 'checklist RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.application_events'::regclass), 'application events RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.scholarship_applications'::regclass), 'scholarship applications RLS enabled');
select ok(not has_table_privilege('authenticated','public.applications','INSERT'), 'applications cannot be fabricated directly');
select ok(not has_table_privilege('authenticated','public.application_events','INSERT'), 'history cannot be fabricated directly');

insert into public.fee_currency(code,name) values ('KZT','Kazakhstani tenge') on conflict do nothing;
insert into public.countries(iso2,iso3,name,default_currency_code)
values ('KZ','KAZ','Kazakhstan','KZT') on conflict do nothing;
insert into public.degree_levels(code,label,rank) values ('bachelor','Bachelor',1) on conflict do nothing;
insert into public.fields_of_study(code,name) values ('CRMTEST','CRM test field') on conflict do nothing;

create temporary table phase18_fixture(kind text primary key, value text not null);
insert into phase18_fixture values ('bundle', public.import_catalog_bundle(jsonb_build_object(
  'source',jsonb_build_object('url','https://fixture.example/phase18-program','publisher','Fixture University','title','Fixture admissions page','locale','en','excerpt','Synthetic evidence for rollback-only application tests'),
  'institution',jsonb_build_object('slug','fixture-phase18-university','legal_name','Fixture Phase 18 University','type','university','country_iso2','KZ','website_url','https://fixture.example'),
  'campus',jsonb_build_object('code','MAIN','name','Main Campus'),
  'academic_unit',jsonb_build_object('slug','admissions','title','Admissions'),
  'program',jsonb_build_object('slug','fixture-phase18-program','title','Fixture Phase 18 Program','degree_level_code','bachelor','field_code','CRMTEST'),
  'intake',jsonb_build_object('academic_year_start',2028,'term_code','fall','starts_on','2028-09-01')
))::text);
update public.source_claims set verification_state_code='verified'
where source_id=((select value::jsonb from phase18_fixture where kind='bundle')->>'sourceId')::bigint;
select public.publish_catalog_entity(((value::jsonb)->>key)::bigint,now())
from phase18_fixture cross join (values ('institutionId'),('campusId'),('academicUnitId'),('programId'),('intakeId')) keys(key)
where kind='bundle';

with entity as (
  insert into public.catalog_entities(entity_type) values ('scholarship') returning id
), scholarship as (
  insert into public.scholarships(id,provider_institution_id,slug,title,award_type,official_url)
  select id,((select value::jsonb from phase18_fixture where kind='bundle')->>'institutionId')::bigint,
    'fixture-phase18-scholarship','Fixture Phase 18 Scholarship','scholarship','https://fixture.example/scholarship'
  from entity returning id
), claim as (
  insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,verification_state_code,content_hash)
  select ((select value::jsonb from phase18_fixture where kind='bundle')->>'sourceId')::bigint,
    id,'scholarship','Synthetic scholarship evidence','verified',md5('phase18-scholarship') from scholarship
)
insert into phase18_fixture select 'scholarship',id::text from scholarship;
select public.publish_catalog_entity(value::bigint,now()) from phase18_fixture where kind='scholarship';

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','18180000-0000-0000-0000-000000000001','authenticated','authenticated','phase18-a@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','18180000-0000-0000-0000-000000000002','authenticated','authenticated','phase18-b@example.invalid','',now(),'{}','{}',now(),now());

create temporary table phase18_results(kind text primary key, observed text not null);
create temporary table phase18_denials(kind text primary key, denied boolean not null);
grant select,insert,update on phase18_fixture,phase18_results,phase18_denials to authenticated;

select set_config('request.jwt.claim.sub','18180000-0000-0000-0000-000000000001',true);
set local role authenticated;

with created as (
  select public.application_create(
    ((select value::jsonb from phase18_fixture where kind='bundle')->>'programId')::bigint,
    null::bigint,2028::smallint,'18180000-0000-0000-0000-000000000101'::uuid
  ) application
)
insert into phase18_fixture select 'application',(application).id::text from created;
insert into phase18_results values ('initial_status',(select status from public.applications));
insert into phase18_results values ('system_checklist',(select count(*)::text from public.application_checklist_items));

select public.application_checklist_change(
  (select value::uuid from phase18_fixture where kind='application'),null,null,
  'Optional portfolio note','todo',false
);
select public.application_checklist_change(
  (select value::uuid from phase18_fixture where kind='application'),null,null,
  'Optional interview note','todo',false
);
insert into phase18_results values ('manual_items',(select count(*)::text from public.application_checklist_items where origin='manual'));

select public.application_transition((select value::uuid from phase18_fixture where kind='application'),1,'shortlisted','','',false,'18180000-0000-0000-0000-000000000102');
select public.application_transition((select value::uuid from phase18_fixture where kind='application'),2,'preparing','','',false,'18180000-0000-0000-0000-000000000103');
do $$ begin
  perform public.application_transition((select value::uuid from phase18_fixture where kind='application'),3,'ready_for_review','','',false,'18180000-0000-0000-0000-000000000104');
  insert into phase18_denials values ('incomplete',false);
exception when check_violation then insert into phase18_denials values ('incomplete',true); end $$;

do $$ declare item record; begin
  for item in select * from public.application_checklist_items where origin='system' loop
    perform public.application_checklist_change(item.application_id,item.id,item.version,item.title,'completed',item.is_mandatory);
  end loop;
end $$;
select public.application_transition((select value::uuid from phase18_fixture where kind='application'),3,'ready_for_review','','',false,'18180000-0000-0000-0000-000000000105');
select public.application_transition((select value::uuid from phase18_fixture where kind='application'),4,'ready_to_submit','','',false,'18180000-0000-0000-0000-000000000106');
do $$ begin
  perform public.application_transition((select value::uuid from phase18_fixture where kind='application'),5,'submitted_external_confirmed','','',false,'18180000-0000-0000-0000-000000000107');
  insert into phase18_denials values ('unconfirmed',false);
exception when check_violation then insert into phase18_denials values ('unconfirmed',true); end $$;
select public.application_transition((select value::uuid from phase18_fixture where kind='application'),5,'submitted_external_confirmed','','Portal receipt 42',true,'18180000-0000-0000-0000-000000000108');
select public.application_transition((select value::uuid from phase18_fixture where kind='application'),5,'submitted_external_confirmed','','Portal receipt 42',true,'18180000-0000-0000-0000-000000000108');
insert into phase18_results values ('submitted_status',(select status from public.applications));
insert into phase18_results values ('submission_provenance',(select submission_provenance from public.applications));

select public.application_transition((select value::uuid from phase18_fixture where kind='application'),6,'under_review','','',false,'18180000-0000-0000-0000-000000000109');
do $$ begin
  perform public.application_transition((select value::uuid from phase18_fixture where kind='application'),7,'accepted','Accepted early','',false,'18180000-0000-0000-0000-000000000110');
  insert into phase18_denials values ('skip_offer',false);
exception when check_violation then insert into phase18_denials values ('skip_offer',true); end $$;
select public.application_transition((select value::uuid from phase18_fixture where kind='application'),7,'offer','Offer received','',false,'18180000-0000-0000-0000-000000000111');
select public.application_transition((select value::uuid from phase18_fixture where kind='application'),8,'accepted','Offer accepted','',false,'18180000-0000-0000-0000-000000000112');
insert into phase18_results values ('accepted_status',(select status from public.applications));

with linked as (
  select public.application_add_scholarship(
    (select value::uuid from phase18_fixture where kind='application'),
    (select value::bigint from phase18_fixture where kind='scholarship'),null,2028::smallint,
    '18180000-0000-0000-0000-000000000201'::uuid
  ) scholarship_application
)
insert into phase18_fixture select 'scholarship_application',(scholarship_application).id::text from linked;
select public.scholarship_application_transition((select value::uuid from phase18_fixture where kind='scholarship_application'),1,'preparing','','',false,'18180000-0000-0000-0000-000000000202');
select public.scholarship_application_transition((select value::uuid from phase18_fixture where kind='scholarship_application'),2,'ready_to_submit','','',false,'18180000-0000-0000-0000-000000000203');
select public.scholarship_application_transition((select value::uuid from phase18_fixture where kind='scholarship_application'),3,'submitted_external_confirmed','','Scholarship receipt',true,'18180000-0000-0000-0000-000000000204');
select public.scholarship_application_transition((select value::uuid from phase18_fixture where kind='scholarship_application'),4,'under_review','','',false,'18180000-0000-0000-0000-000000000205');
select public.scholarship_application_transition((select value::uuid from phase18_fixture where kind='scholarship_application'),5,'awarded','Award email received','',false,'18180000-0000-0000-0000-000000000206');
insert into phase18_results values ('scholarship_status',(select status from public.scholarship_applications));
insert into phase18_results values ('event_count',(select count(*)::text from public.application_events));

select set_config('request.jwt.claim.sub','18180000-0000-0000-0000-000000000002',true);
insert into phase18_results values ('other_applications',(select count(*)::text from public.applications));
insert into phase18_results values ('other_checklist',(select count(*)::text from public.application_checklist_items));
insert into phase18_results values ('other_events',(select count(*)::text from public.application_events));
insert into phase18_results values ('other_scholarships',(select count(*)::text from public.scholarship_applications));
do $$ begin
  update public.applications set notes='tamper';
  insert into phase18_denials values ('direct_update',false);
exception when insufficient_privilege then insert into phase18_denials values ('direct_update',true); end $$;

reset role;
do $$ begin
  update public.application_events set reason='rewrite' where application_id=(select value::uuid from phase18_fixture where kind='application');
  insert into phase18_denials values ('event_rewrite',false);
exception when insufficient_privilege then insert into phase18_denials values ('event_rewrite',true); end $$;

select is((select observed from phase18_results where kind='initial_status'),'researching','application starts in research');
select is((select observed from phase18_results where kind='system_checklist'),'3','fallback checklist is created');
select is((select observed from phase18_results where kind='manual_items'),'2','multiple manual checklist items are supported');
select is((select denied from phase18_denials where kind='incomplete'),true,'readiness blocks incomplete checklist');
select is((select denied from phase18_denials where kind='unconfirmed'),true,'submission requires explicit evidence');
select is((select observed from phase18_results where kind='submitted_status'),'submitted_external_confirmed','external submission is explicit');
select is((select observed from phase18_results where kind='submission_provenance'),'USER_REPORTED','submission provenance is retained');
select is((select denied from phase18_denials where kind='skip_offer'),true,'invalid decision sequence is blocked');
select is((select observed from phase18_results where kind='accepted_status'),'accepted','valid decision sequence succeeds');
select is((select observed from phase18_results where kind='scholarship_status'),'awarded','scholarship lifecycle is independent');
select ok((select observed::integer from phase18_results where kind='event_count') >= 13,'history captures workflow changes');
select is((select observed from phase18_results where kind='other_applications'),'0','other user cannot read applications');
select is((select observed from phase18_results where kind='other_checklist'),'0','other user cannot read checklist');
select is((select observed from phase18_results where kind='other_events'),'0','other user cannot read application history');
select is((select observed from phase18_results where kind='other_scholarships'),'0','other user cannot read scholarship tracking');
select is((select denied from phase18_denials where kind='direct_update'),true,'RPC boundary blocks direct writes');
select is((select denied from phase18_denials where kind='event_rewrite'),true,'history is append-only for privileged writes');
select ok((select count(*)=1 from public.application_events where idempotency_key='18180000-0000-0000-0000-000000000108'),'transition retry is idempotent');
select ok((select count(*)>=2 from public.scholarship_application_events),'scholarship history is append-only');
select ok((select count(*)=3 from public.application_checklist_items where status='completed' and origin='system'),'readiness derives from persisted checklist state');
select ok((select submitted_at is not null from public.applications where id=(select value::uuid from phase18_fixture where kind='application')),'submission timestamp is retained');
select ok((select count(*)=1 from public.application_events where event_type='scholarship_linked'),'application records scholarship linkage');
select * from finish();
rollback;
