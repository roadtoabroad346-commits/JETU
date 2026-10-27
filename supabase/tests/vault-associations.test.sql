begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into public.fee_currency(code,name) values ('KZT','Kazakhstani tenge') on conflict do nothing;
insert into public.countries(iso2,iso3,name,default_currency_code)
values ('KZ','KAZ','Kazakhstan','KZT') on conflict do nothing;
insert into public.degree_levels(code,label,rank) values ('bachelor','Bachelor',1) on conflict do nothing;
insert into public.fields_of_study(code,name) values ('VAULTTEST','CRM test field') on conflict do nothing;

create temporary table phase19assoc_fixture(kind text primary key, value text not null);
insert into phase19assoc_fixture values ('bundle', public.import_catalog_bundle(jsonb_build_object(
  'source',jsonb_build_object('url','https://fixture.example/phase19assoc-program','publisher','Fixture University','title','Fixture admissions page','locale','en','excerpt','Synthetic evidence for rollback-only application tests'),
  'institution',jsonb_build_object('slug','fixture-phase19assoc-university','legal_name','Fixture Phase 19 University','type','university','country_iso2','KZ','website_url','https://fixture.example'),
  'campus',jsonb_build_object('code','MAIN','name','Main Campus'),
  'academic_unit',jsonb_build_object('slug','admissions','title','Admissions'),
  'program',jsonb_build_object('slug','fixture-phase19assoc-program','title','Fixture Phase 19 Program','degree_level_code','bachelor','field_code','VAULTTEST'),
  'intake',jsonb_build_object('academic_year_start',2028,'term_code','fall','starts_on','2028-09-01')
))::text);
update public.source_claims set verification_state_code='verified'
where source_id=((select value::jsonb from phase19assoc_fixture where kind='bundle')->>'sourceId')::bigint;
select public.publish_catalog_entity(((value::jsonb)->>key)::bigint,now())
from phase19assoc_fixture cross join (values ('institutionId'),('campusId'),('academicUnitId'),('programId'),('intakeId')) keys(key)
where kind='bundle';


insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('19194444-0000-0000-0000-00000000000'||n)::uuid,'authenticated','authenticated','phase19-assoc-'||n||'@example.invalid','',now(),'{}','{}',now(),now() from generate_series(1,3) n;
grant all on phase19assoc_fixture to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000001',true);
with created as(select public.application_create(((select value::jsonb from phase19assoc_fixture where kind='bundle')->>'programId')::bigint,null::bigint,2028::smallint,'19194444-0000-0000-0000-000000000101') app)
insert into phase19assoc_fixture select 'appA',(app).id::text from created;
select public.vault_reserve(null,'essay','Essay.txt','',null,'txt','text/plain',5,repeat('a',64),'19195555-0000-0000-0000-000000000001');
insert into phase19assoc_fixture select 'docA',document_id::text from public.vault_versions;
insert into storage.objects(bucket_id,name) select 'student-vault',object_path from public.vault_versions;
select public.vault_finish('19195555-0000-0000-0000-000000000001',false);
select throws_ok($$select public.vault_link((select value::uuid from phase19assoc_fixture where kind='docA'),'19195555-0000-0000-0000-000000000001',(select value::uuid from phase19assoc_fixture where kind='appA'),null,false)$$,'23514',null,'quarantine cannot attach');
insert into phase19assoc_fixture select 'request',public.recommendation_create((select value::uuid from phase19assoc_fixture where kind='appA'),'phase19-assoc-3@example.invalid','Synthetic test request',null,repeat('c',64))::text;
select throws_ok($$select public.recommendation_respond(repeat('c',64),true)$$,'42501',null,'student cannot redeem own invite');
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000002',true);
with created as(select public.application_create(((select value::jsonb from phase19assoc_fixture where kind='bundle')->>'programId')::bigint,null::bigint,2028::smallint,'19194444-0000-0000-0000-000000000102') app)
insert into phase19assoc_fixture select 'appB',(app).id::text from created;
select throws_ok($$select public.vault_link((select value::uuid from phase19assoc_fixture where kind='docA'),'19195555-0000-0000-0000-000000000001',(select value::uuid from phase19assoc_fixture where kind='appB'),null,false)$$,'42501',null,'B cannot attach A file to B application');
select throws_ok($$select public.recommendation_respond(repeat('c',64),true)$$,'42501',null,'wrong invited email denied');
select throws_ok($$select public.recommendation_respond(repeat('d',64),true)$$,'42501',null,'guessed invite denied');
reset role;
select public.vault_scan_result('19195555-0000-0000-0000-000000000001',repeat('a',64),true,'synthetic role test');
set local role authenticated;
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000001',true);
select throws_ok($$select public.vault_link((select value::uuid from phase19assoc_fixture where kind='docA'),'19195555-0000-0000-0000-000000000001',(select value::uuid from phase19assoc_fixture where kind='appB'),null,false)$$,'42501',null,'A cannot attach file to B application');
select lives_ok($$select public.vault_link((select value::uuid from phase19assoc_fixture where kind='docA'),'19195555-0000-0000-0000-000000000001',(select value::uuid from phase19assoc_fixture where kind='appA'),null,false)$$,'valid owner association persists');
select is((select status from public.applications),'researching','attachment does not submit application');
select is((select count(*)::integer from public.vault_links),1,'real version association');
select throws_ok($$select public.vault_link((select value::uuid from phase19assoc_fixture where kind='docA'),'19195555-0000-0000-0000-000000000001',(select value::uuid from phase19assoc_fixture where kind='appA'),'19190000-0000-0000-0000-000000000999',false)$$,'42501',null,'forged task denied');
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000003',true);
select lives_ok($$select public.recommendation_respond(repeat('c',64),true)$$,'confirmed invited recommender accepts');
select throws_ok($$select public.recommendation_respond(repeat('c',64),true)$$,'42501',null,'one-time invite replay denied');
select public.vault_reserve(null,'recommendation','Letter.txt','',null,'txt','text/plain',5,repeat('a',64),'19195555-0000-0000-0000-000000000002',(select value::uuid from phase19assoc_fixture where kind='request'));
insert into phase19assoc_fixture select 'letter',document_id::text from public.vault_versions;
insert into storage.objects(bucket_id,name) select 'student-vault',object_path from public.vault_versions;
select public.vault_finish('19195555-0000-0000-0000-000000000002',false);
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from public.vault_documents where category='recommendation'),0,'student cannot read confidential letter metadata');
select is((select count(*)::integer from public.vault_versions where id='19195555-0000-0000-0000-000000000002'),0,'student cannot read confidential version');
select set_config('storage.operation','object.get_authenticated',true);
select is((select count(*)::integer from storage.objects where bucket_id='student-vault'),1,'student sees only own available essay');
select throws_ok($$select public.vault_link((select value::uuid from phase19assoc_fixture where kind='letter'),'19195555-0000-0000-0000-000000000002',(select value::uuid from phase19assoc_fixture where kind='appA'),null,false)$$,'42501',null,'sealed letter cannot enter student attachments');
select lives_ok($$select public.recommendation_cancel((select value::uuid from phase19assoc_fixture where kind='request'))$$,'student can cancel accepted request');
reset role;
select throws_ok($$select public.vault_scan_result('19195555-0000-0000-0000-000000000002',repeat('a',64),true,'synthetic role test')$$,'42501',null,'cancelled letter cannot become available');
set local role authenticated;
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000001',true);
insert into phase19assoc_fixture select 'expired',public.recommendation_create((select value::uuid from phase19assoc_fixture where kind='appA'),'phase19-assoc-3@example.invalid','Synthetic expiry request',null,repeat('e',64))::text;
reset role;
update public.recommendation_requests set expires_at=now()-interval '1 second' where id=(select value::uuid from phase19assoc_fixture where kind='expired');
set local role authenticated;
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000003',true);
select throws_ok($$select public.recommendation_respond(repeat('e',64),true)$$,'42501',null,'expired invitation denied');
reset role;
select is((select count(*)::integer from public.recommendation_events),4,'recommendation transitions audited without letter contents');
set local role authenticated;
select set_config('request.jwt.claim.sub','19194444-0000-0000-0000-000000000001',true);
select public.vault_manage((select value::uuid from phase19assoc_fixture where kind='docA'),'delete');
select lives_ok($$select public.vault_link((select value::uuid from phase19assoc_fixture where kind='docA'),'19195555-0000-0000-0000-000000000001',(select value::uuid from phase19assoc_fixture where kind='appA'),null,true)$$,'deleted attachment remains detachable');
select is((select count(*)::integer from public.vault_links),0,'detaching deleted attachment removes the stale reference');
select is((select status from public.applications),'researching','detaching preserves application state');
reset role;
select lives_ok($$delete from auth.users where id in ('19194444-0000-0000-0000-000000000001','19194444-0000-0000-0000-000000000002','19194444-0000-0000-0000-000000000003')$$,'account erasure cascades metadata after separate storage cleanup');
select * from finish();
rollback;
