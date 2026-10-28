-- Authorized Jetuu DEVELOPMENT only. Human approval was received in the work
-- thread on 2026-10-28 for these exact facts; no Auth reviewer is impersonated.
-- Does not publish whole entities or approve dates/country eligibility.
begin;
do $$
declare
  v_program bigint;
  v_award bigint;
  v_program_source bigint;
  v_award_source bigint;
  v_run bigint;
  v_claim bigint;
  v_fact record;
  v_marker constant text := 'human-limited-facts-2026-10-28';
begin
  select id into strict v_program from public.degree_programs where slug='computer-science-bcs';
  select id into strict v_award from public.scholarships where slug='lester-b-pearson-international';
  select id into strict v_program_source from public.official_sources
    where canonical_url='https://future.utoronto.ca/program/computer-science' for update;
  select id into strict v_award_source from public.official_sources
    where canonical_url='https://future.utoronto.ca/pearson-scholarships' for update;

  for v_fact in select * from (values
    (v_program_source,v_program,'program.name','Computer Science'),
    (v_award_source,v_award,'application.school_nomination','School nomination is required for the Pearson scholarship.'),
    (v_award_source,v_award,'coverage.tuition','The Pearson scholarship covers tuition for four years.'),
    (v_award_source,v_award,'coverage.books','The Pearson scholarship covers books for four years.'),
    (v_award_source,v_award,'coverage.incidental_fees','The Pearson scholarship covers incidental fees for four years.'),
    (v_award_source,v_award,'coverage.residence','The Pearson scholarship provides full residence support for four years.')
  ) as facts(source_id,entity_id,claim_key,claim_text)
  loop
    select id into v_run from public.verification_runs
      where source_id=v_fact.source_id and outcome='verified' and notes like v_marker || '%'
      order by id limit 1;
    if v_run is null then
      insert into public.verification_runs(source_id,outcome,started_at,completed_at,reviewer_id,notes)
      values(v_fact.source_id,'verified',now(),now(),null,
        v_marker || ': Human operator confirmed only the program name, school nomination and listed four-year coverage in the work thread. No authenticated editorial session was available, so reviewer_id is null. This run does not approve whole entities, campus/degree/unit details, cycle, deadlines or country-specific requirements.')
      returning id into v_run;
    end if;
    insert into public.source_claims(source_id,catalog_entity_id,claim_key,claim_text,content_hash)
    values(v_fact.source_id,v_fact.entity_id,v_fact.claim_key,v_fact.claim_text,md5(v_fact.claim_text))
    on conflict (source_id,catalog_entity_id,claim_key,content_hash) do nothing;
    select id into strict v_claim from public.source_claims
      where source_id=v_fact.source_id and catalog_entity_id=v_fact.entity_id
        and claim_key=v_fact.claim_key and content_hash=md5(v_fact.claim_text);
    perform public.review_source_claim(v_claim,v_run);
  end loop;
end;
$$;
commit;
