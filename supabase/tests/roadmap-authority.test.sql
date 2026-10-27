begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(20);
select ok(not has_function_privilege('authenticated','public.roadmap_apply_generation(uuid,smallint,text,integer,text,text,bigint,jsonb,jsonb,jsonb,jsonb)','execute'),'owner cannot call trusted generation');
select ok(not has_function_privilege('anon','public.roadmap_apply_generation(uuid,smallint,text,integer,text,text,bigint,jsonb,jsonb,jsonb,jsonb)','execute'),'anonymous cannot call trusted generation');
select ok(not has_function_privilege('authenticated','jetu_private.roadmap_apply_generation(smallint,text,integer,text,text,bigint,jsonb,jsonb,jsonb,jsonb)','execute'),'private legacy generator is not a bypass');
select ok(not has_table_privilege('authenticated','public.roadmap_milestones','UPDATE'),'milestone text is server-owned');
select ok(not has_table_privilege('authenticated','public.roadmap_targets','UPDATE'),'target title is server-owned');
select ok(not has_table_privilege('authenticated','public.roadmap_generation_runs','INSERT'),'generation audit cannot be fabricated');
insert into auth.users(id,email) values('17170000-0000-0000-0000-000000000001','roadmap-authority@example.invalid');
create temporary table phase17_authority_results(k text primary key,v boolean);
grant all on phase17_authority_results to authenticated,service_role;
set local role service_role;
select public.roadmap_apply_generation('17170000-0000-0000-0000-000000000001'::uuid,2027::smallint,'Asia/Almaty',300,'roadmap-v1',repeat('a',64),null,'[]','[]',
'[{"generationKey":"test:prepare","taskKind":"document","title":"Synthetic preparation","priority":"high","mandatory":true,"estimatedMinutes":30},{"generationKey":"test:submit","taskKind":"application","title":"Synthetic submission","priority":"high","mandatory":true,"estimatedMinutes":30}]',
'[{"taskKey":"test:submit","dependsOnKey":"test:prepare","dependencyType":"mandatory"}]');
reset role;
select is((select count(*)::integer from public.roadmap_tasks),2,'trusted generator creates complete graph');
select set_config('request.jwt.claim.sub','17170000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
 update public.roadmap_tasks set title='Forged official instruction',version=version+1 where generation_key='test:prepare';
 insert into phase17_authority_results values('text',false);
exception when insufficient_privilege then insert into phase17_authority_results values('text',true); end $$;
do $$ begin
 update public.roadmap_tasks set origin='manual',generation_key=null,version=version+1 where generation_key='test:prepare';
 insert into phase17_authority_results values('origin',false);
exception when insufficient_privilege then insert into phase17_authority_results values('origin',true); end $$;
do $$ begin
 delete from public.roadmap_task_dependencies;
 insert into phase17_authority_results values('edge',false);
exception when insufficient_privilege then insert into phase17_authority_results values('edge',true); end $$;
do $$ begin
 delete from public.roadmap_tasks where generation_key='test:prepare';
 insert into phase17_authority_results values('delete',false);
exception when insufficient_privilege then insert into phase17_authority_results values('delete',true); end $$;
update public.roadmap_tasks set note='My note',target_date='2027-01-02',priority_override='low',version=version+1 where generation_key='test:prepare';
update public.roadmap_tasks set status='completed',version=version+1 where generation_key='test:prepare';
update public.roadmap_tasks set status='completed',version=version+1 where generation_key='test:submit';
insert into public.roadmap_tasks(roadmap_id,user_id,origin,task_kind,title,note)
select id,user_id,'manual','other','My manual task','Keep me' from public.roadmaps;
reset role;
select is((select v from phase17_authority_results where k='text'),true,'direct generated text forgery denied');
select is((select v from phase17_authority_results where k='origin'),true,'origin laundering denied');
select is((select v from phase17_authority_results where k='edge'),true,'required generated dependency deletion denied');
select is((select v from phase17_authority_results where k='delete'),true,'generated task deletion denied');
set local role service_role;
select public.roadmap_apply_generation('17170000-0000-0000-0000-000000000001'::uuid,2027::smallint,'Asia/Almaty',300,'roadmap-v1',repeat('b',64),null,'[]','[]',
'[{"generationKey":"test:prepare","taskKind":"document","title":"Updated synthetic preparation","priority":"high","mandatory":true,"estimatedMinutes":30},{"generationKey":"test:submit","taskKind":"application","title":"Synthetic submission","priority":"high","mandatory":true,"estimatedMinutes":30}]',
'[{"taskKey":"test:submit","dependsOnKey":"test:prepare","dependencyType":"mandatory"}]');
reset role;
select is((select count(*)::integer from public.roadmap_tasks where status='completed'),2,'regeneration preserves completed tasks');
select is((select note from public.roadmap_tasks where generation_key='test:prepare'),'My note','regeneration preserves note');
select is((select priority_override from public.roadmap_tasks where generation_key='test:prepare'),'low','regeneration preserves priority override');
select is((select count(*)::integer from public.roadmap_tasks where origin='manual' and note='Keep me'),1,'regeneration preserves manual work');
select is((select target_date::text from public.roadmap_tasks where generation_key='test:prepare'),'2027-01-02','regeneration preserves custom date');
set local role service_role;
insert into phase17_authority_results select 'idempotent',public.roadmap_apply_generation('17170000-0000-0000-0000-000000000001'::uuid,2027::smallint,'Asia/Almaty',300,'roadmap-v1',repeat('b',64),null,'[]','[]','[]','[]')->>'unchanged'='true';
do $$ begin
  perform public.roadmap_apply_generation('17170000-0000-0000-0000-000000000001'::uuid,2027::smallint,'Asia/Almaty',300,'roadmap-v1',repeat('c',64),null,'[]','[]',
  '[{"generationKey":"test:prepare","taskKind":"document","title":"Synthetic preparation","priority":"high","mandatory":true,"estimatedMinutes":30},{"generationKey":"test:submit","taskKind":"application","title":"Synthetic submission","priority":"high","mandatory":true,"estimatedMinutes":30},{"generationKey":"test:new","taskKind":"document","title":"New prerequisite","priority":"high","mandatory":true,"estimatedMinutes":30}]',
  '[{"taskKey":"test:submit","dependsOnKey":"test:new","dependencyType":"mandatory"}]');
  insert into phase17_authority_results values('changed_graph',false);
exception when check_violation then insert into phase17_authority_results values('changed_graph',true); end $$;
reset role;
select is((select v from phase17_authority_results where k='idempotent'),true,'same input is idempotent');
select is((select v from phase17_authority_results where k='changed_graph'),true,'new unmet prerequisites cannot leave submit falsely completed');
select is((select count(*)::integer from public.roadmap_tasks where generation_key='test:new'),0,'failed regeneration rolls back new work');
select is((select last_input_hash from public.roadmaps),repeat('b',64),'failed regeneration preserves previous generation');
select * from finish();
rollback;
