begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(23);

select ok(exists(select 1 from pg_extension where extname='pg_trgm'), 'pg_trgm is installed');
select has_function('public', 'unified_catalog_search', array['jsonb'], 'unified search RPC exists');
select ok(not (select prosecdef from pg_proc where oid='public.unified_catalog_search(jsonb)'::regprocedure), 'unified search is security invoker');
select ok(has_function_privilege('anon','public.unified_catalog_search(jsonb)','EXECUTE'), 'anonymous public search is explicitly executable');
select ok(has_function_privilege('authenticated','public.unified_catalog_search(jsonb)','EXECUTE'), 'authenticated public search is explicitly executable');
select ok(not has_table_privilege('anon','public.saved_catalog_items','SELECT'), 'anonymous users cannot read saved items');
select ok(not has_table_privilege('anon','public.saved_searches','SELECT'), 'anonymous users cannot read saved searches');
select ok(has_table_privilege('authenticated','public.saved_catalog_items','SELECT'), 'authenticated users may select through owner RLS');
select ok(has_table_privilege('authenticated','public.saved_searches','SELECT'), 'authenticated users may select through owner RLS');
select ok((select relrowsecurity from pg_class where oid='public.saved_catalog_items'::regclass), 'saved items use RLS');
select ok((select relrowsecurity from pg_class where oid='public.saved_searches'::regclass), 'saved searches use RLS');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='saved_catalog_items'),4,'saved items have four owner policies');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='saved_searches'),4,'saved searches have four owner policies');
select has_index('public','degree_programs','degree_programs_title_trgm_idx','program title trigram index exists');
select has_index('public','scholarships','scholarships_title_trgm_idx','scholarship title trigram index exists');
select has_index('public','opportunities','opportunities_title_trgm_idx','opportunity title trigram index exists');
select ok(position('within_range' in pg_get_functiondef('public.opportunity_search(jsonb)'::regprocedure))>0,'range filter does not claim full eligibility');
select ok(position('''ineligible''' in pg_get_functiondef('public.opportunity_search(jsonb)'::regprocedure))=0,'range filter uses outside_range instead of an eligibility verdict');
select is((select count(*)::integer from public.unified_catalog_search('{"limit":24,"offset":4800}'::jsonb)),0,'a bounded high offset returns an empty page');

-- Exercise owner isolation with two disposable Auth users. Everything rolls back.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','15150000-0000-0000-0000-000000000001','authenticated','authenticated','phase15-a@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','15150000-0000-0000-0000-000000000002','authenticated','authenticated','phase15-b@example.invalid','',now(),'{}','{}',now(),now());
create temporary table phase15_rls_results(kind text primary key, observed integer not null);
grant select, insert on phase15_rls_results to authenticated;
select set_config('request.jwt.claim.sub','15150000-0000-0000-0000-000000000001',true);
set local role authenticated;
insert into public.saved_searches(user_id,name,filters)
values ('15150000-0000-0000-0000-000000000001','Phase 15 RLS','{"q":"cs"}');
insert into phase15_rls_results values ('owner_select',(select count(*)::integer from public.saved_searches));
select set_config('request.jwt.claim.sub','15150000-0000-0000-0000-000000000002',true);
insert into phase15_rls_results values ('other_select',(select count(*)::integer from public.saved_searches));
with changed as (
  update public.saved_searches set name='Cross-owner update' returning 1
) insert into phase15_rls_results select 'other_update',count(*)::integer from changed;
with changed as (
  delete from public.saved_searches returning 1
) insert into phase15_rls_results select 'other_delete',count(*)::integer from changed;
reset role;
select is((select observed from phase15_rls_results where kind='owner_select'),1,'saved-search owner can read their row');
select is((select observed from phase15_rls_results where kind='other_select'),0,'another user cannot read the owner row');
select is((select observed from phase15_rls_results where kind='other_update'),0,'another user cannot update the owner row');
select is((select observed from phase15_rls_results where kind='other_delete'),0,'another user cannot delete the owner row');

select * from finish();
rollback;
