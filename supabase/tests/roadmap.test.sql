begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(27);

select ok((select relrowsecurity from pg_class where oid='public.roadmaps'::regclass), 'roadmaps RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.roadmap_targets'::regclass), 'targets RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.roadmap_milestones'::regclass), 'milestones RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.roadmap_tasks'::regclass), 'tasks RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.roadmap_task_dependencies'::regclass), 'dependencies RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.roadmap_generation_runs'::regclass), 'runs RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.roadmap_task_events'::regclass), 'events RLS enabled');
select ok(not has_table_privilege('anon','public.roadmaps','SELECT'), 'anonymous roadmaps denied');
select ok(not has_table_privilege('anon','public.roadmap_tasks','SELECT'), 'anonymous tasks denied');
select ok(not has_table_privilege('authenticated','public.roadmap_task_events','INSERT'), 'task events cannot be fabricated directly');
select ok(not has_table_privilege('authenticated','public.roadmap_generation_runs','UPDATE'), 'generation history cannot be rewritten');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','17170000-0000-0000-0000-000000000001','authenticated','authenticated','phase17-a@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','17170000-0000-0000-0000-000000000002','authenticated','authenticated','phase17-b@example.invalid','',now(),'{}','{}',now(),now());

create temporary table phase17_results(kind text primary key, observed text not null);
grant select,insert,update on phase17_results to authenticated;
create temporary table phase17_denials(kind text primary key, denied boolean not null);
grant select,insert on phase17_denials to authenticated;

select set_config('request.jwt.claim.sub','17170000-0000-0000-0000-000000000001',true);
set local role authenticated;

insert into public.roadmaps(id,user_id,cycle_year,timezone_name)
values ('17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001',2027,'Asia/Almaty');
insert into public.roadmap_tasks(id,roadmap_id,user_id,origin,task_kind,title,status,generated_priority,is_mandatory,official_deadline_precision,completed_at)
values
('17170000-0000-0000-0000-000000000101','17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','manual','document','Prepare transcript','todo','high',true,'unknown',null),
('17170000-0000-0000-0000-000000000102','17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','manual','application','Review application','todo','high',true,'unknown',null),
('17170000-0000-0000-0000-000000000103','17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','manual','application','Submit application','todo','critical',true,'unknown',null);
insert into public.roadmap_task_dependencies(roadmap_id,user_id,task_id,depends_on_task_id)
values
('17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','17170000-0000-0000-0000-000000000102','17170000-0000-0000-0000-000000000101'),
('17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','17170000-0000-0000-0000-000000000103','17170000-0000-0000-0000-000000000102');

insert into phase17_results values ('owner_roadmaps',(select count(*)::text from public.roadmaps));
insert into phase17_results values ('owner_tasks',(select count(*)::text from public.roadmap_tasks));
insert into phase17_results values ('events_after_create',(select count(*)::text from public.roadmap_task_events));

do $$ begin
  insert into public.roadmap_task_dependencies(roadmap_id,user_id,task_id,depends_on_task_id)
  values ('17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','17170000-0000-0000-0000-000000000102','17170000-0000-0000-0000-000000000101');
  insert into phase17_denials values ('duplicate',false);
exception when unique_violation then insert into phase17_denials values ('duplicate',true); end $$;

do $$ begin
  insert into public.roadmap_task_dependencies(roadmap_id,user_id,task_id,depends_on_task_id)
  values ('17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','17170000-0000-0000-0000-000000000101','17170000-0000-0000-0000-000000000103');
  insert into phase17_denials values ('cycle',false);
exception when check_violation then insert into phase17_denials values ('cycle',true); end $$;

do $$ begin
  update public.roadmap_tasks set status='completed',version=2 where id='17170000-0000-0000-0000-000000000102';
  insert into phase17_denials values ('blocked_completion',false);
exception when check_violation then insert into phase17_denials values ('blocked_completion',true); end $$;

update public.roadmap_tasks set status='completed',version=2 where id='17170000-0000-0000-0000-000000000101';
update public.roadmap_tasks set status='completed',version=2 where id='17170000-0000-0000-0000-000000000102';
insert into phase17_results values ('completed_chain',(select count(*)::text from public.roadmap_tasks where status='completed'));

do $$ begin
  update public.roadmap_tasks set status='todo',version=3 where id='17170000-0000-0000-0000-000000000101';
  insert into phase17_denials values ('unsafe_reopen',false);
exception when check_violation then insert into phase17_denials values ('unsafe_reopen',true); end $$;

do $$ begin
  update public.roadmap_tasks set note='bad-version',version=9 where id='17170000-0000-0000-0000-000000000103';
  insert into phase17_denials values ('version',false);
exception when serialization_failure then insert into phase17_denials values ('version',true); end $$;

select set_config('request.jwt.claim.sub','17170000-0000-0000-0000-000000000002',true);
insert into phase17_results values ('other_roadmaps',(select count(*)::text from public.roadmaps));
insert into phase17_results values ('other_tasks',(select count(*)::text from public.roadmap_tasks));
with changed as (update public.roadmap_tasks set note='tamper',version=version+1 returning 1)
insert into phase17_results select 'other_update',count(*)::text from changed;
do $$ begin
  insert into public.roadmap_tasks(roadmap_id,user_id,origin,task_kind,title,generated_priority,is_mandatory,official_deadline_precision)
  values ('17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','manual','other','Tamper','low',false,'unknown');
  insert into phase17_denials values ('owner_insert',false);
exception when insufficient_privilege then insert into phase17_denials values ('owner_insert',true); end $$;
do $$ begin
  insert into public.roadmap_task_dependencies(roadmap_id,user_id,task_id,depends_on_task_id)
  values ('17170000-0000-0000-0000-000000000010','17170000-0000-0000-0000-000000000001','17170000-0000-0000-0000-000000000103','17170000-0000-0000-0000-000000000101');
  insert into phase17_denials values ('dependency_tamper',false);
exception when insufficient_privilege then insert into phase17_denials values ('dependency_tamper',true); end $$;

reset role;
select is((select observed from phase17_results where kind='owner_roadmaps'),'1','owner reads roadmap');
select is((select observed from phase17_results where kind='owner_tasks'),'3','owner reads tasks');
select is((select observed from phase17_results where kind='events_after_create'),'3','task creation events captured');
select is((select denied from phase17_denials where kind='duplicate'),true,'duplicate dependency rejected');
select is((select denied from phase17_denials where kind='cycle'),true,'dependency cycle rejected');
select is((select denied from phase17_denials where kind='blocked_completion'),true,'completion requires mandatory prerequisites');
select is((select observed from phase17_results where kind='completed_chain'),'2','valid completion chain succeeds');
select is((select denied from phase17_denials where kind='unsafe_reopen'),true,'reopen requires completed dependents first');
select is((select denied from phase17_denials where kind='version'),true,'stale task version rejected');
select is((select observed from phase17_results where kind='other_roadmaps'),'0','other user cannot read roadmap');
select is((select observed from phase17_results where kind='other_tasks'),'0','other user cannot read tasks');
select is((select observed from phase17_results where kind='other_update'),'0','other user cannot update tasks');
select is((select denied from phase17_denials where kind='owner_insert'),true,'other user cannot insert under owner ID');
select is((select denied from phase17_denials where kind='dependency_tamper'),true,'other user cannot manipulate dependencies');
select ok((select count(*) >= 5 from public.roadmap_task_events),'status changes are auditable');
select ok((select count(*)=0 from public.roadmap_generation_runs),'test leaves no generation runs');
select * from finish();
rollback;
