-- One reviewed editorial record for the authorized JETU development project.
-- Checked 2026-10-24 against Bow Seat's official 2027 overview, FAQ and entry instructions.
-- Run only after Phase 14 migrations; refuse to overwrite an existing slug.
begin;
do $$
declare
  opportunity_id bigint;
  deadline_id bigint;
  overview_source_id bigint;
  faq_source_id bigint;
  overview_claim_id bigint;
begin
  if exists (select 1 from public.opportunities where slug = 'blue-planet-awareness-contest-2027') then
    raise exception 'Opportunity slug already exists; review before changing editorial facts';
  end if;

  insert into public.catalog_entities (entity_type)
  values ('opportunity') returning id into opportunity_id;

  insert into public.official_sources (
    canonical_url, publisher_name, source_title, locale, last_checked_at
  ) values (
    'https://bowseat.org/programs/blue-planet-awareness-contest/contest-overview/',
    'Bow Seat: Creative Action for Conservation',
    '2027 Blue Planet Awareness Contest overview', 'en', now()
  ) returning id into overview_source_id;

  insert into public.official_sources (
    canonical_url, publisher_name, source_title, locale, last_checked_at
  ) values (
    'https://bowseat.org/programs/blue-planet-awareness-contest/faqs/',
    'Bow Seat: Creative Action for Conservation',
    '2027 Blue Planet Awareness Contest FAQ', 'en', now()
  ) returning id into faq_source_id;

  insert into public.source_claims (
    source_id, catalog_entity_id, claim_key, claim_text,
    verification_state_code, content_hash
  ) values (
    overview_source_id, opportunity_id, 'eligibility_deadline_2027',
    '2027 Blue Planet Awareness Contest: students ages 11–18 worldwide, not enrolled in college; adult sponsor required; online entry deadline June 7 2027 at 11:59 PM EDT.',
    'verified', md5('2027 Blue Planet Awareness Contest: students ages 11–18 worldwide, not enrolled in college; adult sponsor required; online entry deadline June 7 2027 at 11:59 PM EDT.')
  ) returning id into overview_claim_id;

  insert into public.source_claims (
    source_id, catalog_entity_id, claim_key, claim_text,
    verification_state_code, content_hash
  ) values (
    faq_source_id, opportunity_id, 'free_entry_2027',
    'Bow Seat FAQ says entry is free, submission is via its online platform, and an adult sponsor is required.',
    'verified', md5('Bow Seat FAQ says entry is free, submission is via its online platform, and an adult sponsor is required.')
  );

  insert into public.opportunities (
    id, opportunity_type, slug, title, official_url, provider_name,
    summary, participation_format, location_text, cost_state,
    eligibility_age_min, eligibility_age_max, eligibility_summary,
    official_application_url, risk_summary, source_claim_id
  ) values (
    opportunity_id, 'academic_competition', 'blue-planet-awareness-contest-2027',
    '2027 Blue Planet Awareness Contest',
    'https://bowseat.org/programs/blue-planet-awareness-contest/how-to-enter/',
    'Bow Seat: Creative Action for Conservation',
    'Global creative contest about environmental disinformation, with art, writing, film and multimedia categories.',
    'online', 'Online; open worldwide', 'free', 11, 18,
    'Students aged 11–18 at entry, in middle or high school, may enter worldwide. College students are not eligible. Every entrant needs an adult sponsor. English is required for judged material; check category rules for subtitles and reflections.',
    'https://bowseat.org/programs/blue-planet-awareness-contest/how-to-enter/',
    'An adult sponsor is required; entrants under 13 need parent or guardian consent. Check category rules and English-language requirements on the official site. JETU does not submit entries or promise an award.',
    overview_claim_id
  );

  insert into public.catalog_entities (entity_type)
  values ('deadline') returning id into deadline_id;
  insert into public.deadlines (id, deadline_type, title, due_at, timezone_name)
  values (
    deadline_id, 'application', 'Blue Planet Awareness Contest 2027 entry',
    '2027-06-08 03:59:00+00', 'America/New_York'
  );
  insert into public.source_claims (
    source_id, catalog_entity_id, claim_key, claim_text,
    verification_state_code, content_hash
  ) values (
    overview_source_id, deadline_id, 'entry_deadline_2027',
    'Bow Seat states the 2027 contest deadline is June 7 2027 at 11:59 PM EDT.',
    'verified', md5('Bow Seat states the 2027 contest deadline is June 7 2027 at 11:59 PM EDT.')
  );
  insert into public.opportunity_deadlines (opportunity_id, deadline_id)
  values (opportunity_id, deadline_id);

  update public.catalog_entities
    set publication_status_code = 'published', verification_state_code = 'verified',
        last_checked_at = now()
    where id in (opportunity_id, deadline_id);
end;
$$;
commit;
