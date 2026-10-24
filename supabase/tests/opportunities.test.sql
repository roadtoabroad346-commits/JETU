-- Synthetic opportunity fixture. Entire test transaction rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

create temporary table phase14_ids (kind text primary key, id bigint not null);
with e as (insert into public.catalog_entities(entity_type) values ('opportunity') returning id)
insert into phase14_ids select 'published',id from e;
with e as (insert into public.catalog_entities(entity_type) values ('opportunity') returning id)
insert into phase14_ids select 'draft',id from e;
insert into public.opportunities(id,opportunity_type,slug,title,official_url,provider_name,
  participation_format,cost_state,eligibility_summary,official_application_url)
select id,'olympiad','fixture-phase14-' || kind,'Fixture ' || kind,
  'https://fixture.example/apply','Fixture host','online','free',
  'Ages 15–17, grades 9–11','https://fixture.example/apply'
from phase14_ids;
update public.opportunities set eligibility_age_min=15,eligibility_age_max=17,
  eligibility_grade_min=9,eligibility_grade_max=11
where id in (select id from phase14_ids);
insert into public.official_sources(canonical_url,publisher_name,source_title,locale,last_checked_at)
values ('https://fixture.example/opportunity-phase14','Fixture host','Fixture opportunity','en',now());
insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash,verification_state_code)
select s.id,p.id,'opportunity','Synthetic official claim',md5('phase14-source'),'verified'
from public.official_sources s cross join phase14_ids p
where s.canonical_url='https://fixture.example/opportunity-phase14' and p.kind='published';
update public.opportunities set source_claim_id=(select c.id from public.source_claims c
  where c.catalog_entity_id=opportunities.id and c.claim_key='opportunity')
where id=(select id from phase14_ids where kind='published');
update public.catalog_entities set publication_status_code='published',verification_state_code='verified',last_checked_at=now()
where id=(select id from phase14_ids where kind='published');

create temporary table phase14_results (visible int, aged int, excluded int, grade_match int, grade_excluded int, draft int);
grant insert on phase14_results to anon;
set local role anon;
insert into phase14_results select
  (select count(*) from public.opportunity_search('{"slug":"fixture-phase14-published"}'::jsonb)),
  (select count(*) from public.opportunity_search('{"slug":"fixture-phase14-published","age":16}'::jsonb)),
  (select count(*) from public.opportunity_search('{"slug":"fixture-phase14-published","age":18}'::jsonb)),
  (select count(*) from public.opportunity_search('{"slug":"fixture-phase14-published","grade":10}'::jsonb)),
  (select count(*) from public.opportunity_search('{"slug":"fixture-phase14-published","grade":12}'::jsonb)),
  (select count(*) from public.opportunity_search('{"slug":"fixture-phase14-draft"}'::jsonb));
reset role;
do $$
begin
  if not exists (select 1 from phase14_results where
    (visible,aged,excluded,grade_match,grade_excluded,draft)=(1,1,0,1,0,0)) then
    raise exception 'Phase 14 search or RLS fixture mismatch';
  end if;
end;
$$;
select is(visible,1,'only sourced published opportunity visible') from phase14_results;
select is(aged,1,'eligible age included') from phase14_results;
select is(excluded,0,'ineligible age excluded') from phase14_results;
select is(grade_match,1,'eligible grade included') from phase14_results;
select is(grade_excluded,0,'ineligible grade excluded') from phase14_results;
select is(draft,0,'draft opportunity hidden') from phase14_results;
select ok(not has_table_privilege('anon','public.student_opportunity_saves','INSERT'), 'anonymous users cannot save');
insert into auth.users(id,email) values
  ('e928e85a-15ad-4073-a5ce-46f15ba14501','phase14-owner-a@fixture.invalid'),
  ('e928e85a-15ad-4073-a5ce-46f15ba14502','phase14-owner-b@fixture.invalid');
grant select on phase14_ids to authenticated;
create temporary table phase14_owner_results (saves int, plans int);
grant insert on phase14_owner_results to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','e928e85a-15ad-4073-a5ce-46f15ba14501',true);
insert into public.student_opportunity_saves(user_id,opportunity_id)
select 'e928e85a-15ad-4073-a5ce-46f15ba14501',id from phase14_ids where kind='published';
insert into public.student_opportunity_plan_actions(user_id,opportunity_id,status)
select 'e928e85a-15ad-4073-a5ce-46f15ba14501',id,'planned' from phase14_ids where kind='published';
select set_config('request.jwt.claim.sub','e928e85a-15ad-4073-a5ce-46f15ba14502',true);
insert into phase14_owner_results select
  (select count(*) from public.student_opportunity_saves),
  (select count(*) from public.student_opportunity_plan_actions);
reset role;
do $$begin
  if not exists (select 1 from phase14_owner_results where saves=0 and plans=0) then
    raise exception 'Phase 14 cross-user isolation failed';
  end if;
end;$$;
select is(saves,0,'other student cannot see saved opportunities') from phase14_owner_results;
select is(plans,0,'other student cannot see plan actions') from phase14_owner_results;
select * from finish();
rollback;
