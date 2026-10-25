begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(18);

select ok((select relrowsecurity from pg_class where oid='public.matching_preferences'::regclass), 'preferences RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.matching_runs'::regclass), 'runs RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.matching_results'::regclass), 'results RLS enabled');
select ok(not has_table_privilege('anon','public.matching_preferences','SELECT'), 'anonymous preferences denied');
select ok(not has_table_privilege('anon','public.matching_runs','SELECT'), 'anonymous runs denied');
select ok(not has_table_privilege('anon','public.matching_results','SELECT'), 'anonymous results denied');
select ok(not has_table_privilege('authenticated','public.matching_results','UPDATE'), 'results cannot be updated by clients');
select ok(not has_table_privilege('authenticated','public.matching_runs','DELETE'), 'runs cannot be deleted by clients');
select is((select count(*)::integer from public.matching_configuration where is_active),1,'one active configuration');
select is((select version from public.matching_configuration where is_active),'matching-v2','budget ranking configuration is active');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','16160000-0000-0000-0000-000000000001','authenticated','authenticated','phase16-a@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','16160000-0000-0000-0000-000000000002','authenticated','authenticated','phase16-b@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','16160000-0000-0000-0000-000000000003','authenticated','authenticated','phase16-c@example.invalid','',now(),'{}','{}',now(),now());
create temporary table phase16_rls_results(kind text primary key, observed integer not null);
grant select, insert on phase16_rls_results to authenticated;
create temporary table phase16_denials(kind text primary key, denied boolean not null);
grant select, insert on phase16_denials to authenticated;
select set_config('request.jwt.claim.sub','16160000-0000-0000-0000-000000000001',true);
set local role authenticated;
insert into public.matching_preferences(user_id,preferences)
values ('16160000-0000-0000-0000-000000000001','{"countries":["DE"]}');
insert into public.matching_runs(user_id,profile_version,rules_version,preferences_snapshot,candidate_count,rate_slot)
values ('16160000-0000-0000-0000-000000000001',1,'matching-v1','{}',0,floor(extract(epoch from now())/30)::bigint);
insert into phase16_rls_results values ('owner_prefs',(select count(*)::integer from public.matching_preferences));
insert into phase16_rls_results values ('owner_runs',(select count(*)::integer from public.matching_runs));
select set_config('request.jwt.claim.sub','16160000-0000-0000-0000-000000000002',true);
do $$ begin
  insert into public.matching_preferences(user_id,preferences) values ('16160000-0000-0000-0000-000000000003','{}');
  insert into phase16_denials values ('prefs',false);
exception when insufficient_privilege then
  insert into phase16_denials values ('prefs',true);
end $$;
do $$ begin
  insert into public.matching_runs(user_id,profile_version,rules_version,preferences_snapshot,candidate_count,rate_slot)
  values ('16160000-0000-0000-0000-000000000003',1,'matching-v2','{}',0,floor(extract(epoch from now())/30)::bigint);
  insert into phase16_denials values ('runs',false);
exception when insufficient_privilege then
  insert into phase16_denials values ('runs',true);
end $$;
insert into phase16_rls_results values ('other_prefs',(select count(*)::integer from public.matching_preferences));
insert into phase16_rls_results values ('other_runs',(select count(*)::integer from public.matching_runs));
with changed as (update public.matching_preferences set preferences='{}' returning 1)
insert into phase16_rls_results select 'other_update',count(*)::integer from changed;
reset role;
select is((select observed from phase16_rls_results where kind='owner_prefs'),1,'owner reads preferences');
select is((select observed from phase16_rls_results where kind='owner_runs'),1,'owner reads run');
select is((select observed from phase16_rls_results where kind='other_prefs'),0,'other user cannot read preferences');
select is((select observed from phase16_rls_results where kind='other_runs'),0,'other user cannot read run');
select is((select observed from phase16_rls_results where kind='other_update'),0,'other user cannot update preferences');
select is((select denied from phase16_denials where kind='prefs'),true,'other user cannot insert preferences under owner ID');
select is((select denied from phase16_denials where kind='runs'),true,'other user cannot insert a run under owner ID');
select ok((select count(*)=0 from public.matching_results),'test leaves no matching results');
select * from finish();
rollback;
