begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(26);
select ok((select relrowsecurity from pg_class where oid='public.catalog_editor_memberships'::regclass),'memberships have RLS');
select ok((select relrowsecurity from pg_class where oid='public.catalog_editor_events'::regclass),'audit has RLS');
select ok(not has_table_privilege('authenticated','public.catalog_editor_memberships','INSERT'),'student cannot grant role');
select ok(not has_table_privilege('authenticated','public.catalog_editor_events','UPDATE'),'audit cannot be rewritten');
select ok(not has_function_privilege('anon','public.catalog_editor_queue(bigint)','EXECUTE'),'anonymous cannot read editorial data');
select ok(not has_function_privilege('authenticated','jetu_private.catalog_record(bigint,text)','EXECUTE'),'private snapshot is not a bypass');

insert into auth.users(id,email) values
('28280000-0000-4000-8000-000000000001','catalog-student@example.invalid'),
('28280000-0000-4000-8000-000000000002','catalog-editor@example.invalid'),
('28280000-0000-4000-8000-000000000003','catalog-reviewer@example.invalid');
insert into public.catalog_editor_memberships(user_id,role) values
('28280000-0000-4000-8000-000000000002','editor'),
('28280000-0000-4000-8000-000000000003','reviewer');
create temporary table editor_results(k text primary key,v text);
grant all on editor_results to authenticated;
create temporary table editor_fixture(entity_id bigint,claim_id bigint,source_id bigint);
grant all on editor_fixture to authenticated;
with entity as (insert into public.catalog_entities(entity_type) values('eligibility_requirement') returning id),
source as (insert into public.official_sources(canonical_url,publisher_name,source_title,locale,last_checked_at)
values('https://catalog-review-fixture.invalid/source','Synthetic fixture','Synthetic requirement source','en',now()) returning id)
insert into editor_fixture(entity_id,source_id) select entity.id,source.id from entity,source;
insert into public.eligibility_requirements(id,requirement_type,title,description)
select entity_id,'other','Synthetic requirement','Synthetic fixture only' from editor_fixture;
with claim as (insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash)
select source_id,entity_id,'requirement.test','Synthetic requirement',repeat('a',32) from editor_fixture returning id)
update editor_fixture set claim_id=claim.id from claim;

select set_config('request.jwt.claim.sub','28280000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin perform public.catalog_editor_queue(); insert into editor_results values('student','bad');
exception when insufficient_privilege then insert into editor_results values('student','denied'); end $$;
reset role;
select is((select v from editor_results where k='student'),'denied','signed-in student cannot inspect queue');

select set_config('request.jwt.claim.sub','28280000-0000-4000-8000-000000000002',true);
set local role authenticated;
insert into editor_results select 'editor_role',public.catalog_editor_queue()->>'role';
do $$ begin perform public.catalog_editor_command('{}'); insert into editor_results values('editor_write','bad');
exception when insufficient_privilege then insert into editor_results values('editor_write','denied'); end $$;
reset role;
select is((select v from editor_results where k='editor_role'),'editor','editor can inspect bounded queue');
select is((select v from editor_results where k='editor_write'),'denied','editor cannot review or publish');

select set_config('request.jwt.claim.sub','28280000-0000-4000-8000-000000000003',true);
create temporary table editor_command as select jsonb_build_object(
 'entityId',entity_id,'expectedRevision',1,'claimId',claim_id,'expectedHash',repeat('a',32),
 'expectedState','needs_review','action','review_claim','note','Human fixture review of the official source','attested',true,
 'expectedRecordHash',md5(jetu_private.catalog_record(entity_id,'eligibility_requirement')::text)
) command from editor_fixture;
grant select on editor_command to authenticated;
set local role authenticated;
do $$ begin perform public.catalog_editor_command((select command||'{"action":"publish"}'::jsonb from editor_command));
insert into editor_results values('unresolved','bad');
exception when check_violation then insert into editor_results values('unresolved','denied'); end $$;
do $$ begin perform public.catalog_editor_command((select command||'{"attested":false}'::jsonb from editor_command));
insert into editor_results values('attestation','bad');
exception when invalid_parameter_value then insert into editor_results values('attestation','denied'); end $$;
do $$ begin perform public.catalog_editor_command((select command||'{"expectedRevision":99}'::jsonb from editor_command));
insert into editor_results values('stale','bad');
exception when serialization_failure then insert into editor_results values('stale','denied'); end $$;
do $$ begin perform public.catalog_editor_command((select command||'{"expectedHash":"changed"}'::jsonb from editor_command));
insert into editor_results values('hash','bad');
exception when serialization_failure then insert into editor_results values('hash','denied'); end $$;
select public.catalog_editor_command(command) from editor_command;
reset role;
select is((select v from editor_results where k='unresolved'),'denied','unreviewed claims block publication');
select is((select v from editor_results where k='attestation'),'denied','review requires explicit attestation');
select is((select v from editor_results where k='stale'),'denied','stale entity review is rejected');
select is((select v from editor_results where k='hash'),'denied','stale claim content is rejected');
select is((select sc.verification_state_code from public.source_claims sc join editor_fixture f on sc.id=f.claim_id),'verified','review changes exact claim');
select is((select count(*)::integer from public.verification_runs vr join editor_fixture f on f.source_id=vr.source_id where vr.reviewer_id='28280000-0000-4000-8000-000000000003'),1,'real request identity is recorded as reviewer');
select is((select count(*)::integer from public.catalog_editor_events ev join editor_fixture f on f.entity_id=ev.entity_id),1,'review is audited');
select ok(exists(select 1 from pg_locks where locktype='advisory' and objid=284028 and pid=pg_backend_pid() and granted),'review and publication hold the shared transaction lock');
select is((select count(*)::integer from public.catalog_editor_memberships where user_id in ('28280000-0000-4000-8000-000000000002','28280000-0000-4000-8000-000000000003')),2,'review actions do not mint or elevate memberships');

update editor_command set command=jsonb_build_object('entityId',f.entity_id,'expectedRevision',e.revision,
 'action','publish','note','Reviewed record; missing fields remain unknown','attested',true,
 'expectedRecordHash',md5(jetu_private.catalog_record(e.id,e.entity_type)::text))
from editor_fixture f join public.catalog_entities e on e.id=f.entity_id;
set local role authenticated;
do $$ begin perform public.catalog_editor_command((select command||'{"expectedRecordHash":"stale"}'::jsonb from editor_command));
insert into editor_results values('snapshot','bad');
exception when serialization_failure then insert into editor_results values('snapshot','denied'); end $$;
select public.catalog_editor_command(command) from editor_command;
reset role;
select is((select v from editor_results where k='snapshot'),'denied','normalized record edits invalidate publication attestation');
select is((select e.publication_status_code from public.catalog_entities e join editor_fixture f on f.entity_id=e.id),'published','reviewer can publish source-backed resolved record');
select is((select count(*)::integer from public.catalog_editor_events ev join editor_fixture f on f.entity_id=ev.entity_id),2,'publication audit appended');
select is((select ev.before_snapshot->>'publication_status_code' from public.catalog_editor_events ev join editor_fixture f on f.entity_id=ev.entity_id where action='publish'),'draft','audit preserves old publication state');
select is((select ev.after_snapshot->>'publication_status_code' from public.catalog_editor_events ev join editor_fixture f on f.entity_id=ev.entity_id where action='publish'),'published','audit records actual publication result');
update editor_command set command=jsonb_build_object('entityId',f.entity_id,'expectedRevision',e.revision,
 'claimId',f.claim_id,'expectedHash',repeat('a',32),'expectedState','verified','action','reject_claim',
 'note','Fixture source correction; revoke the old claim','attested',true)
from editor_fixture f join public.catalog_entities e on e.id=f.entity_id;
set local role authenticated;
select public.catalog_editor_command(command) from editor_command;
reset role;
select is((select e.publication_status_code from public.catalog_entities e join editor_fixture f on f.entity_id=e.id),'draft','rejecting published evidence withdraws the record atomically');
select is((select sc.verification_state_code from public.source_claims sc join editor_fixture f on sc.id=f.claim_id),'rejected','rejected evidence stays explicit');
select ok((select count(*)=3 from public.catalog_editor_events ev join editor_fixture f on f.entity_id=ev.entity_id),'every mutation has immutable audit evidence');
select * from finish();
rollback;
