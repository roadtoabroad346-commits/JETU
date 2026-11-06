begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(35);
-- Test-only grants, rolled back with fixtures; production grants remain unchanged.
grant usage on schema extensions to authenticated;
grant execute on all functions in schema extensions to authenticated;
insert into auth.users(id,email) values('23000000-0000-4000-8000-000000000001','phase23-a@example.invalid'),('23000000-0000-4000-8000-000000000002','phase23-b@example.invalid');
insert into public.notification_preferences(user_id,timezone,quiet_start,quiet_end,lead_days) values('23000000-0000-4000-8000-000000000001','America/New_York','00:00','00:00',array[1]) on conflict(user_id) do update set timezone=excluded.timezone,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,lead_days=excluded.lead_days;
-- An older opt-in permits the injected clock to exercise due work without backfill.
alter table public.notification_preferences disable trigger notification_timezone;
update public.notification_preferences set updated_at='2026-11-01' where user_id='23000000-0000-4000-8000-000000000001';
alter table public.notification_preferences enable trigger notification_timezone;
insert into public.calendar_custom_events(id,user_id,title,due_date) values('23000000-0000-4000-8000-000000000010','23000000-0000-4000-8000-000000000001','TEST ONLY: personal date','2026-11-07');
select ok((select relrowsecurity from pg_class where oid='public.notifications'::regclass),'inbox RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.notification_jobs'::regclass),'queue RLS enabled');
select ok(not has_table_privilege('anon','public.calendar_custom_events','select'),'anonymous events denied');
select ok(not has_table_privilege('authenticated','public.notification_jobs','insert'),'users cannot forge jobs');
select ok(not has_table_privilege('authenticated','public.notifications','insert'),'users cannot forge inbox');
select ok(not has_function_privilege('authenticated','notification_private.run(timestamptz,integer)','execute'),'worker unavailable to students');
select ok(not has_column_privilege('authenticated','public.notifications','title','update'),'receipt update cannot alter content');
select ok((select public.notification_allowed_at('2026-03-08T06:00Z',jsonb_populate_record(p,'{"digest":"daily","digest_time":"02:30","quiet_start":"00:00","quiet_end":"00:00"}'))='2026-03-08T07:30Z' from public.notification_preferences p where user_id='23000000-0000-4000-8000-000000000001' limit 1),'spring DST gap moves forward');
select ok((select public.notification_allowed_at('2026-11-01T04:00Z',jsonb_populate_record(p,'{"digest":"daily","digest_time":"01:30","quiet_start":"00:00","quiet_end":"00:00"}'))='2026-11-01T06:30Z' from public.notification_preferences p where user_id='23000000-0000-4000-8000-000000000001' limit 1),'fall DST overlap uses later time');
select ok((select public.notification_allowed_at('2026-11-06T23:00Z',jsonb_populate_record(p,'{"timezone":"UTC","quiet_start":"22:00","quiet_end":"08:00"}'))='2026-11-07T08:00Z' from public.notification_preferences p where user_id='23000000-0000-4000-8000-000000000001' limit 1),'quiet hours cross midnight');
select ok((select public.notification_allowed_at('2026-11-06T12:00Z',jsonb_populate_record(p,'{"timezone":"UTC","digest":"weekly"}'))='2026-11-09T09:00Z' from public.notification_preferences p where user_id='23000000-0000-4000-8000-000000000001' limit 1),'weekly Monday window');
-- Worker must schedule before opted-in future occurrences; no old reminder backfill.
select notification_private.run('2026-11-06T13:59Z');
select ok((select count(*)=1 from public.notification_jobs where user_id='23000000-0000-4000-8000-000000000001'),'one reminder scheduled');
select notification_private.run('2026-11-06T14:00Z');
select notification_private.run('2026-11-06T14:00Z');
select ok((select count(*)=1 from public.notifications where user_id='23000000-0000-4000-8000-000000000001'),'duplicate runs create one receipt');
select ok((select status='sent' and attempts=1 from public.notification_jobs where user_id='23000000-0000-4000-8000-000000000001'),'in-app persistence is sent once');
set local role authenticated;
select set_config('request.jwt.claim.sub','23000000-0000-4000-8000-000000000002',true);
select ok((select count(*)=0 from public.calendar_events),'second student cannot read first calendar');
select ok((select count(*)=0 from public.notifications),'second student cannot read first inbox');
select ok((select count(*)=0 from public.notification_preferences where user_id='23000000-0000-4000-8000-000000000001'),'second student cannot read preferences');
select ok((select count(*)=0 from public.notification_jobs),'second student cannot read delivery status');
select set_config('request.jwt.claim.sub','23000000-0000-4000-8000-000000000001',true);
select ok((select count(*)=1 from public.calendar_events),'owner can read personal calendar');
update public.notifications set read_at=now();
select ok((select read_at is not null from public.notifications),'owner receipt persists');
reset role;
update public.calendar_custom_events set due_date='2026-11-10' where id='23000000-0000-4000-8000-000000000010';
select notification_private.run('2026-11-06T14:00Z');
select ok((select count(*)=1 from public.notification_jobs where status='queued' and user_id='23000000-0000-4000-8000-000000000001'),'changed date creates new future revision');
update public.notification_preferences set paused=true where user_id='23000000-0000-4000-8000-000000000001';
select ok((select count(*)=0 from public.notification_jobs where status='queued' and user_id='23000000-0000-4000-8000-000000000001'),'pause immediately cancels queued jobs');
select notification_private.run('2026-11-09T14:00Z');
select ok((select count(*)=1 from public.notifications where user_id='23000000-0000-4000-8000-000000000001'),'paused user receives no new notification');
select ok((select count(*)>=2 from public.notification_preference_audit where user_id='23000000-0000-4000-8000-000000000001'),'consent changes audited');
select ok((select count(*)=0 from public.notification_jobs where channel<>'in_app'),'unconfigured external channels never queued');

-- Canonical official deadline, source provenance and correction fixtures, rollback only.
update public.notification_preferences set paused=false where user_id='23000000-0000-4000-8000-000000000001';
create temporary table phase23_source(id bigint);
with s as(insert into public.official_sources(canonical_url,publisher_name,source_title,locale,last_checked_at) values('https://fixture.example/phase23-deadline','TEST ONLY Publisher','TEST ONLY Deadline','en',now()) returning id) insert into phase23_source select id from s;
create temporary table phase23_deadline(id bigint);
with d as(insert into public.catalog_entities(entity_type) values('deadline') returning id) insert into phase23_deadline select id from d;
insert into public.deadlines(id,deadline_type,title,due_date,date_precision) select id,'application','TEST ONLY Official date','2026-11-07','date_only' from phase23_deadline;
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,verification_state_code,content_hash) select s.id,d.id,'deadline','TEST ONLY verified deadline evidence','verified',md5('phase23') from phase23_source s cross join phase23_deadline d;
select public.publish_catalog_entity(id,now()) from phase23_deadline;
insert into public.deadline_watches(user_id,deadline_id) select '23000000-0000-4000-8000-000000000001',id from phase23_deadline;
-- A future claim may coexist with current evidence; it must not win provenance.
insert into public.official_sources(canonical_url,publisher_name,source_title,locale,last_checked_at)
values('https://fixture.example/phase23-future','TEST ONLY Future','TEST ONLY Future cycle','en',now());
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,verification_state_code,content_hash,effective_from,observed_at)
select os.id,d.id,'deadline','TEST ONLY future-cycle claim','verified',md5('phase23-future'),'2199-01-01',now()+interval '1 second'
from public.official_sources os cross join phase23_deadline d where os.canonical_url='https://fixture.example/phase23-future';
select ok((select source_url='https://fixture.example/phase23-deadline' from public.calendar_events where origin='official'),'future-cycle claim cannot replace current provenance');
select ok((select verified and "precision"='date_only' and due_at is null from public.calendar_events where origin='official'),'official date-only source retains precision');
select notification_private.run('2026-11-06T13:59Z');
select notification_private.run('2026-11-06T14:00Z');
select ok((select count(*)=1 from public.notifications where event_key like 'official:%' and kind='reminder'),'official reminder delivered once');
update public.deadlines set due_date='2026-11-09' where id in(select id from phase23_deadline);
select ok((select count(*)=0 from public.notification_jobs where event_key like 'official:%' and status='queued'),'source edit cancels obsolete queued work');
select notification_private.run('2026-11-06T14:00Z');
select notification_private.run('2026-11-06T14:00Z');
select ok((select count(*)=1 from public.notifications where kind='source_change'),'changed official date produces one correction');
select ok((select due_date='2026-11-09' from public.notifications where kind='source_change'),'correction carries new date');
select ok((select count(*)=1 from public.notification_jobs where event_key like 'official:%' and kind='reminder' and status='queued'),'new revision reminder rescheduled');
update public.catalog_entities set verification_state_code='stale' where id in(select id from phase23_deadline);
select notification_private.run('2026-11-08T14:00Z');
select ok((select count(*)=0 from public.notification_jobs where event_key like 'official:%' and status='queued'),'stale source revalidated at dispatch');
select ok((select count(*)=2 from public.notifications where event_key like 'official:%'),'stale source never creates extra reminder');
select ok((select count(*)=0 from public.notification_jobs where status='failed'),'worker completed without hidden failures');

select * from finish();
rollback;
