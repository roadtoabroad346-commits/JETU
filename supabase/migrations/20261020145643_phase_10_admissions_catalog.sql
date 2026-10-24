-- Phase 10: normalized global admissions catalog, provenance and read-only public access.
-- Editorial writes are server-only. No admissions records are seeded by this migration.
begin;

create table public.publication_status (
  code text primary key,
  label text not null,
  is_public boolean not null default false,
  check (code ~ '^[a-z][a-z0-9_]*$')
);

insert into public.publication_status (code, label, is_public) values
  ('draft', 'Draft', false),
  ('in_review', 'In review', false),
  ('published', 'Published', true),
  ('archived', 'Archived', false);

create table public.verification_states (
  code text primary key,
  label text not null,
  is_verified boolean not null default false,
  check (code ~ '^[a-z][a-z0-9_]*$')
);

insert into public.verification_states (code, label, is_verified) values
  ('needs_review', 'Needs review', false),
  ('verified', 'Verified', true),
  ('conflicted', 'Conflicted', false),
  ('stale', 'Stale', false),
  ('rejected', 'Rejected', false);

create table public.catalog_entities (
  id bigint generated always as identity primary key,
  entity_type text not null,
  publication_status_code text not null default 'draft'
    references public.publication_status (code) on update cascade on delete restrict,
  verification_state_code text not null default 'needs_review'
    references public.verification_states (code) on update cascade on delete restrict,
  last_checked_at timestamptz,
  effective_from date,
  effective_until date,
  archived_at timestamptz,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entity_type in (
    'institution', 'campus', 'institution_accreditation', 'academic_unit',
    'degree_program', 'admission_intake', 'application_round',
    'eligibility_requirement', 'estimated_tuition', 'cost_of_living',
    'financial_aid_scheme', 'scholarship', 'scholarship_cycle',
    'scholarship_benefit', 'deadline', 'nomination_route', 'opportunity'
  )),
  check (effective_until is null or effective_from is null or effective_until >= effective_from),
  check (publication_status_code <> 'archived' or archived_at is not null),
  check (publication_status_code <> 'published' or archived_at is null),
  check (
    publication_status_code <> 'published'
    or verification_state_code <> 'verified'
    or last_checked_at is not null
  )
);

create table public.official_sources (
  id bigint generated always as identity primary key,
  canonical_url text not null unique,
  publisher_name text not null check (length(btrim(publisher_name)) between 2 and 240),
  source_title text not null check (length(btrim(source_title)) between 2 and 500),
  source_type text not null default 'official_webpage'
    check (source_type in ('official_webpage', 'official_pdf', 'official_api', 'official_feed', 'government_registry')),
  locale text not null check (locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  is_active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_checked_at timestamptz not null,
  effective_from date,
  effective_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (canonical_url ~ '^https://[^[:space:]]+$'),
  check (effective_until is null or effective_from is null or effective_until >= effective_from),
  check (last_checked_at >= first_seen_at - interval '5 minutes')
);

create table public.source_claims (
  id bigint generated always as identity primary key,
  source_id bigint not null references public.official_sources (id) on delete restrict,
  catalog_entity_id bigint not null references public.catalog_entities (id) on delete cascade,
  claim_key text not null check (claim_key ~ '^[a-z][a-z0-9_.-]*$'),
  claim_text text not null check (length(btrim(claim_text)) between 1 and 4000),
  verification_state_code text not null default 'needs_review'
    references public.verification_states (code) on update cascade on delete restrict,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_until date,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{32,64}$'),
  created_at timestamptz not null default now(),
  unique (source_id, catalog_entity_id, claim_key, content_hash),
  unique (id, catalog_entity_id),
  check (effective_until is null or effective_from is null or effective_until >= effective_from)
);

create table public.verification_runs (
  id bigint generated always as identity primary key,
  source_id bigint not null references public.official_sources (id) on delete restrict,
  outcome text not null check (outcome in ('running', 'verified', 'needs_review', 'conflicted', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  reviewer_id uuid,
  notes text check (notes is null or length(notes) <= 4000),
  created_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at),
  check ((outcome = 'running') = (completed_at is null))
);

create table public.countries (
  id bigint generated always as identity primary key,
  iso2 text not null unique check (iso2 ~ '^[A-Z]{2}$'),
  iso3 text not null unique check (iso3 ~ '^[A-Z]{3}$'),
  name text not null check (length(btrim(name)) between 2 and 120),
  default_currency_code text check (default_currency_code is null or default_currency_code ~ '^[A-Z]{3}$'),
  is_active boolean not null default true
);

create table public.regions (
  id bigint generated always as identity primary key,
  country_id bigint not null references public.countries (id) on delete restrict,
  code text not null check (length(btrim(code)) between 1 and 32),
  name text not null check (length(btrim(name)) between 1 and 160),
  is_active boolean not null default true,
  unique (country_id, code),
  unique (id, country_id)
);

create table public.cities (
  id bigint generated always as identity primary key,
  country_id bigint not null references public.countries (id) on delete restrict,
  region_id bigint,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 1 and 160),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  is_active boolean not null default true,
  unique (country_id, slug),
  unique (id, country_id),
  foreign key (region_id, country_id)
    references public.regions (id, country_id) on delete restrict
);

create table public.institutions (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  country_id bigint not null references public.countries (id) on delete restrict,
  city_id bigint,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text not null check (length(btrim(legal_name)) between 2 and 300),
  institution_type text not null
    check (institution_type in ('university', 'college', 'institute', 'academy', 'school', 'other')),
  website_url text check (website_url is null or website_url ~ '^https://[^[:space:]]+$'),
  founded_year smallint check (founded_year between 900 and 2200),
  unique (id, country_id),
  unique (country_id, legal_name),
  foreign key (city_id, country_id)
    references public.cities (id, country_id) on delete restrict
);

create table public.campuses (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  institution_id bigint not null references public.institutions (id) on delete restrict,
  country_id bigint not null references public.countries (id) on delete restrict,
  city_id bigint,
  campus_code text not null check (campus_code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  name text not null check (length(btrim(name)) between 1 and 240),
  address_line text check (address_line is null or length(address_line) <= 500),
  unique (institution_id, campus_code),
  unique (id, institution_id),
  foreign key (city_id, country_id)
    references public.cities (id, country_id) on delete restrict
);

create table public.institution_accreditations (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  institution_id bigint not null references public.institutions (id) on delete restrict,
  accreditor_name text not null check (length(btrim(accreditor_name)) between 2 and 300),
  accreditation_code text,
  accreditation_status text not null
    check (accreditation_status in ('active', 'provisional', 'expired', 'revoked', 'unknown')),
  granted_on date,
  expires_on date,
  unique nulls not distinct (institution_id, accreditor_name, accreditation_code),
  check (expires_on is null or granted_on is null or expires_on >= granted_on)
);

create table public.institution_names_translations (
  id bigint generated always as identity primary key,
  institution_id bigint not null references public.institutions (id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  name_kind text not null default 'display' check (name_kind in ('display', 'legal', 'short', 'former')),
  translated_name text not null check (length(btrim(translated_name)) between 1 and 300),
  source_claim_id bigint not null,
  unique (institution_id, locale, name_kind),
  foreign key (source_claim_id, institution_id)
    references public.source_claims (id, catalog_entity_id) on delete restrict
);

create table public.academic_units (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  institution_id bigint not null references public.institutions (id) on delete restrict,
  campus_id bigint,
  parent_unit_id bigint,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 1 and 300),
  unit_type text not null default 'faculty'
    check (unit_type in ('faculty', 'school', 'department', 'institute', 'college', 'other')),
  unique (institution_id, slug),
  unique (id, institution_id),
  foreign key (campus_id, institution_id)
    references public.campuses (id, institution_id) on delete restrict,
  foreign key (parent_unit_id, institution_id)
    references public.academic_units (id, institution_id) on delete restrict,
  check (parent_unit_id is null or parent_unit_id <> id)
);

create table public.degree_levels (
  code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label text not null,
  rank smallint not null unique check (rank > 0),
  is_active boolean not null default true
);

create table public.fields_of_study (
  id bigint generated always as identity primary key,
  parent_id bigint references public.fields_of_study (id) on delete restrict,
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9.-]*$'),
  name text not null check (length(btrim(name)) between 1 and 200),
  is_active boolean not null default true,
  check (parent_id is null or parent_id <> id)
);

create table public.degree_programs (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  academic_unit_id bigint not null references public.academic_units (id) on delete restrict,
  degree_level_code text not null references public.degree_levels (code) on delete restrict,
  primary_field_id bigint not null references public.fields_of_study (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 2 and 300),
  duration_months smallint check (duration_months between 1 and 240),
  credit_value numeric(8, 2) check (credit_value > 0),
  credit_system text check (credit_system is null or length(credit_system) <= 40),
  unique (academic_unit_id, slug)
);

create table public.program_campuses (
  program_id bigint not null references public.degree_programs (id) on delete cascade,
  campus_id bigint not null references public.campuses (id) on delete restrict,
  is_primary boolean not null default false,
  primary key (program_id, campus_id)
);

create table public.program_delivery_modes (
  code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label text not null,
  is_active boolean not null default true
);

create table public.degree_program_delivery_modes (
  program_id bigint not null references public.degree_programs (id) on delete cascade,
  delivery_mode_code text not null references public.program_delivery_modes (code) on delete restrict,
  primary key (program_id, delivery_mode_code)
);

create table public.languages_of_instruction (
  code text primary key check (code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  name text not null,
  is_active boolean not null default true
);

create table public.degree_program_languages (
  program_id bigint not null references public.degree_programs (id) on delete cascade,
  language_code text not null references public.languages_of_instruction (code) on delete restrict,
  minimum_share_percent numeric(5, 2) check (minimum_share_percent between 0 and 100),
  primary key (program_id, language_code)
);

create table public.admission_intakes (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  program_id bigint not null references public.degree_programs (id) on delete restrict,
  academic_year_start smallint not null check (academic_year_start between 2000 and 2200),
  term_code text not null check (term_code ~ '^[a-z][a-z0-9_]*$'),
  starts_on date,
  ends_on date,
  planned_capacity integer check (planned_capacity > 0),
  unique (program_id, academic_year_start, term_code),
  unique (id, program_id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.application_rounds (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  intake_id bigint not null references public.admission_intakes (id) on delete cascade,
  round_code text not null check (round_code ~ '^[a-z][a-z0-9_]*$'),
  title text not null check (length(btrim(title)) between 1 and 160),
  opens_at timestamptz,
  closes_at timestamptz,
  decision_by date,
  is_rolling boolean not null default false,
  unique (intake_id, round_code),
  check (closes_at is null or opens_at is null or closes_at >= opens_at),
  check (not is_rolling or closes_at is null)
);

create table public.eligibility_requirements (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  requirement_type text not null
    check (requirement_type in ('academic', 'citizenship', 'residency', 'language', 'test', 'experience', 'financial', 'nomination', 'other')),
  title text not null check (length(btrim(title)) between 1 and 240),
  description text not null check (length(btrim(description)) between 1 and 4000),
  is_mandatory boolean not null default true
);

create table public.standardized_tests (
  code text primary key check (code ~ '^[A-Z0-9][A-Z0-9_-]*$'),
  name text not null unique,
  score_unit text not null,
  minimum_score numeric(10, 3),
  maximum_score numeric(10, 3),
  is_active boolean not null default true,
  check (maximum_score is null or minimum_score is null or maximum_score >= minimum_score)
);

create table public.required_tests (
  id bigint generated always as identity primary key,
  eligibility_requirement_id bigint not null references public.eligibility_requirements (id) on delete cascade,
  test_code text not null references public.standardized_tests (code) on delete restrict,
  purpose text not null default 'admission' check (purpose in ('admission', 'language', 'placement', 'scholarship')),
  waivers_allowed boolean not null default false,
  unique (eligibility_requirement_id, test_code, purpose)
);

create table public.test_score_thresholds (
  id bigint generated always as identity primary key,
  required_test_id bigint not null references public.required_tests (id) on delete cascade,
  component text not null default 'overall' check (component ~ '^[a-z][a-z0-9_]*$'),
  minimum_score numeric(10, 3),
  maximum_score numeric(10, 3),
  score_unit text not null,
  unique (required_test_id, component),
  check (minimum_score is not null or maximum_score is not null),
  check (maximum_score is null or minimum_score is null or maximum_score >= minimum_score)
);

create table public.prerequisites (
  id bigint generated always as identity primary key,
  eligibility_requirement_id bigint not null references public.eligibility_requirements (id) on delete cascade,
  prerequisite_type text not null check (prerequisite_type in ('subject', 'degree', 'coursework', 'portfolio', 'experience', 'other')),
  subject text,
  description text not null check (length(btrim(description)) between 1 and 2000),
  minimum_value numeric(12, 3),
  value_unit text,
  unique nulls not distinct (eligibility_requirement_id, prerequisite_type, subject, description)
);

create table public.citizenship_eligibility (
  eligibility_requirement_id bigint not null references public.eligibility_requirements (id) on delete cascade,
  country_id bigint not null references public.countries (id) on delete restrict,
  eligibility_kind text not null check (eligibility_kind in ('citizen', 'resident', 'excluded_citizen', 'excluded_resident')),
  primary key (eligibility_requirement_id, country_id, eligibility_kind)
);

create table public.fee_currency (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  name text not null unique,
  minor_unit smallint not null default 2 check (minor_unit between 0 and 4),
  is_active boolean not null default true
);

alter table public.countries
  add constraint countries_default_currency_code_fkey
  foreign key (default_currency_code) references public.fee_currency (code) on delete restrict;

create table public.estimated_tuition (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  program_id bigint not null references public.degree_programs (id) on delete restrict,
  intake_id bigint,
  campus_id bigint,
  currency_code text not null references public.fee_currency (code) on delete restrict,
  amount_min numeric(16, 2) not null check (amount_min >= 0),
  amount_max numeric(16, 2) check (amount_max >= 0),
  billing_period text not null check (billing_period in ('program', 'academic_year', 'semester', 'term', 'credit')),
  academic_year_start smallint check (academic_year_start between 2000 and 2200),
  includes_mandatory_fees boolean not null default false,
  check (amount_max is null or amount_max >= amount_min),
  foreign key (intake_id, program_id)
    references public.admission_intakes (id, program_id) on delete restrict,
  foreign key (program_id, campus_id)
    references public.program_campuses (program_id, campus_id) on delete restrict
);

create table public.cost_of_living (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  campus_id bigint references public.campuses (id) on delete restrict,
  city_id bigint references public.cities (id) on delete restrict,
  currency_code text not null references public.fee_currency (code) on delete restrict,
  amount_min numeric(16, 2) not null check (amount_min >= 0),
  amount_max numeric(16, 2) check (amount_max >= 0),
  billing_period text not null check (billing_period in ('month', 'academic_year', 'year')),
  includes_housing boolean not null default false,
  check (campus_id is not null or city_id is not null),
  check (amount_max is null or amount_max >= amount_min)
);

create table public.financial_aid_schemes (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  institution_id bigint not null references public.institutions (id) on delete restrict,
  scheme_code text not null check (scheme_code ~ '^[A-Z0-9][A-Z0-9_-]*$'),
  title text not null check (length(btrim(title)) between 2 and 300),
  aid_type text not null check (aid_type in ('need_based', 'merit_based', 'mixed', 'loan', 'work_study', 'other')),
  unique (institution_id, scheme_code)
);

create table public.scholarships (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  financial_aid_scheme_id bigint references public.financial_aid_schemes (id) on delete restrict,
  provider_institution_id bigint references public.institutions (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 2 and 300),
  award_type text not null check (award_type in ('scholarship', 'grant', 'fellowship', 'bursary', 'waiver', 'assistantship', 'other')),
  official_url text not null check (official_url ~ '^https://[^[:space:]]+$'),
  check (financial_aid_scheme_id is not null or provider_institution_id is not null)
);

create table public.scholarship_cycles (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  scholarship_id bigint not null references public.scholarships (id) on delete restrict,
  academic_year_start smallint not null check (academic_year_start between 2000 and 2200),
  cycle_code text not null check (cycle_code ~ '^[a-z0-9][a-z0-9_-]*$'),
  opens_at timestamptz,
  closes_at timestamptz,
  award_start_on date,
  award_end_on date,
  unique (scholarship_id, academic_year_start, cycle_code),
  check (closes_at is null or opens_at is null or closes_at >= opens_at),
  check (award_end_on is null or award_start_on is null or award_end_on >= award_start_on)
);

create table public.coverage_items (
  code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label text not null unique,
  is_active boolean not null default true
);

create table public.scholarship_benefits (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  scholarship_cycle_id bigint not null references public.scholarship_cycles (id) on delete cascade,
  coverage_item_code text not null references public.coverage_items (code) on delete restrict,
  description text not null check (length(btrim(description)) between 1 and 2000),
  coverage_percent numeric(5, 2) check (coverage_percent between 0 and 100),
  is_in_kind boolean not null default false,
  unique (scholarship_cycle_id, coverage_item_code)
);

create table public.funding_limits (
  id bigint generated always as identity primary key,
  scholarship_benefit_id bigint not null references public.scholarship_benefits (id) on delete cascade,
  currency_code text references public.fee_currency (code) on delete restrict,
  amount_min numeric(16, 2) check (amount_min >= 0),
  amount_max numeric(16, 2) check (amount_max >= 0),
  limit_period text not null check (limit_period in ('total', 'academic_year', 'semester', 'month', 'one_time')),
  renewal_conditions text check (renewal_conditions is null or length(renewal_conditions) <= 2000),
  check (amount_min is not null or amount_max is not null or renewal_conditions is not null),
  check (amount_max is null or amount_min is null or amount_max >= amount_min),
  check ((amount_min is null and amount_max is null) or currency_code is not null)
);

create table public.scholarship_program_links (
  scholarship_cycle_id bigint not null references public.scholarship_cycles (id) on delete cascade,
  program_id bigint not null references public.degree_programs (id) on delete restrict,
  relationship_type text not null default 'eligible' check (relationship_type in ('eligible', 'preferred', 'excluded')),
  primary key (scholarship_cycle_id, program_id)
);

create table public.nomination_routes (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  scholarship_cycle_id bigint not null references public.scholarship_cycles (id) on delete cascade,
  nominator_type text not null check (nominator_type in ('institution', 'school', 'government', 'employer', 'self', 'other')),
  title text not null check (length(btrim(title)) between 1 and 240),
  description text not null check (length(btrim(description)) between 1 and 2000),
  is_required boolean not null default true,
  unique (scholarship_cycle_id, nominator_type, title)
);

create table public.program_eligibility_requirements (
  program_id bigint not null references public.degree_programs (id) on delete cascade,
  eligibility_requirement_id bigint not null references public.eligibility_requirements (id) on delete cascade,
  primary key (program_id, eligibility_requirement_id)
);

create table public.intake_eligibility_requirements (
  intake_id bigint not null references public.admission_intakes (id) on delete cascade,
  eligibility_requirement_id bigint not null references public.eligibility_requirements (id) on delete cascade,
  primary key (intake_id, eligibility_requirement_id)
);

create table public.scholarship_eligibility_requirements (
  scholarship_cycle_id bigint not null references public.scholarship_cycles (id) on delete cascade,
  eligibility_requirement_id bigint not null references public.eligibility_requirements (id) on delete cascade,
  primary key (scholarship_cycle_id, eligibility_requirement_id)
);

create table public.deadlines (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  deadline_type text not null check (deadline_type in ('application', 'document', 'test', 'nomination', 'financial_aid', 'scholarship', 'acceptance', 'deposit', 'other')),
  title text not null check (length(btrim(title)) between 1 and 240),
  due_at timestamptz,
  is_rolling boolean not null default false,
  timezone_name text check (timezone_name is null or length(timezone_name) <= 80),
  check ((due_at is not null) <> is_rolling),
  check (due_at is null or timezone_name is not null)
);

create table public.application_round_deadlines (
  application_round_id bigint not null references public.application_rounds (id) on delete cascade,
  deadline_id bigint not null references public.deadlines (id) on delete cascade,
  primary key (application_round_id, deadline_id)
);

create table public.scholarship_cycle_deadlines (
  scholarship_cycle_id bigint not null references public.scholarship_cycles (id) on delete cascade,
  deadline_id bigint not null references public.deadlines (id) on delete cascade,
  primary key (scholarship_cycle_id, deadline_id)
);

create table public.opportunities (
  id bigint primary key references public.catalog_entities (id) on delete cascade,
  provider_institution_id bigint references public.institutions (id) on delete restrict,
  opportunity_type text not null check (opportunity_type in ('summer_school', 'competition', 'internship', 'research', 'exchange', 'volunteering', 'other')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 2 and 300),
  official_url text not null check (official_url ~ '^https://[^[:space:]]+$'),
  starts_on date,
  ends_on date,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.opportunity_deadlines (
  opportunity_id bigint not null references public.opportunities (id) on delete cascade,
  deadline_id bigint not null references public.deadlines (id) on delete cascade,
  primary key (opportunity_id, deadline_id)
);

create table public.opportunity_tags (
  code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label text not null unique,
  is_active boolean not null default true
);

create table public.catalog_entity_tags (
  catalog_entity_id bigint not null references public.catalog_entities (id) on delete cascade,
  tag_code text not null references public.opportunity_tags (code) on delete restrict,
  primary key (catalog_entity_id, tag_code)
);

create table public.translation_entries (
  id bigint generated always as identity primary key,
  catalog_entity_id bigint not null references public.catalog_entities (id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  field_name text not null check (field_name ~ '^[a-z][a-z0-9_]*$'),
  translated_text text not null check (length(btrim(translated_text)) between 1 and 8000),
  source_claim_id bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_entity_id, locale, field_name),
  foreign key (source_claim_id, catalog_entity_id)
    references public.source_claims (id, catalog_entity_id) on delete restrict
);

create table public.data_revisions (
  id bigint generated always as identity primary key,
  catalog_entity_id bigint not null references public.catalog_entities (id) on delete restrict,
  revision bigint not null check (revision > 0),
  source_claim_id bigint,
  changed_by uuid,
  change_reason text not null check (length(btrim(change_reason)) between 1 and 1000),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz not null default now(),
  unique (catalog_entity_id, revision),
  foreign key (source_claim_id, catalog_entity_id)
    references public.source_claims (id, catalog_entity_id) on delete restrict
);

-- Every FK used for traversal, deletion checks or RLS has an index on its referencing side.
create index catalog_entities_public_idx
  on public.catalog_entities (entity_type, effective_from, effective_until)
  where publication_status_code = 'published' and verification_state_code = 'verified' and archived_at is null;
create index catalog_entities_publication_status_idx on public.catalog_entities (publication_status_code);
create index catalog_entities_verification_state_idx on public.catalog_entities (verification_state_code);
create index source_claims_entity_idx on public.source_claims (catalog_entity_id, verification_state_code);
create index source_claims_source_idx on public.source_claims (source_id);
create index verification_runs_source_idx on public.verification_runs (source_id, started_at desc);
create index countries_default_currency_idx on public.countries (default_currency_code) where default_currency_code is not null;
create index regions_country_idx on public.regions (country_id);
create index cities_country_region_idx on public.cities (country_id, region_id);
create index institutions_country_city_idx on public.institutions (country_id, city_id);
create index campuses_institution_idx on public.campuses (institution_id);
create index campuses_country_city_idx on public.campuses (country_id, city_id);
create index institution_accreditations_institution_idx on public.institution_accreditations (institution_id);
create index institution_names_translations_institution_idx on public.institution_names_translations (institution_id);
create index institution_names_translations_source_idx on public.institution_names_translations (source_claim_id, institution_id);
create index academic_units_institution_idx on public.academic_units (institution_id);
create index academic_units_campus_idx on public.academic_units (campus_id, institution_id) where campus_id is not null;
create index academic_units_parent_idx on public.academic_units (parent_unit_id, institution_id) where parent_unit_id is not null;
create index fields_of_study_parent_idx on public.fields_of_study (parent_id) where parent_id is not null;
create index degree_programs_unit_level_idx on public.degree_programs (academic_unit_id, degree_level_code);
create index degree_programs_field_idx on public.degree_programs (primary_field_id);
create index program_campuses_campus_idx on public.program_campuses (campus_id);
create index degree_program_delivery_modes_mode_idx on public.degree_program_delivery_modes (delivery_mode_code);
create index degree_program_languages_language_idx on public.degree_program_languages (language_code);
create index admission_intakes_program_year_idx on public.admission_intakes (program_id, academic_year_start, term_code);
create index application_rounds_intake_close_idx on public.application_rounds (intake_id, closes_at);
create index required_tests_requirement_idx on public.required_tests (eligibility_requirement_id);
create index required_tests_test_idx on public.required_tests (test_code);
create index test_score_thresholds_test_idx on public.test_score_thresholds (required_test_id);
create index prerequisites_requirement_idx on public.prerequisites (eligibility_requirement_id);
create index citizenship_eligibility_country_idx on public.citizenship_eligibility (country_id);
create index estimated_tuition_program_idx on public.estimated_tuition (program_id, academic_year_start);
create index estimated_tuition_intake_idx on public.estimated_tuition (intake_id, program_id) where intake_id is not null;
create index estimated_tuition_campus_idx on public.estimated_tuition (program_id, campus_id) where campus_id is not null;
create index estimated_tuition_currency_idx on public.estimated_tuition (currency_code);
create index cost_of_living_campus_idx on public.cost_of_living (campus_id) where campus_id is not null;
create index cost_of_living_city_idx on public.cost_of_living (city_id) where city_id is not null;
create index cost_of_living_currency_idx on public.cost_of_living (currency_code);
create index financial_aid_schemes_institution_idx on public.financial_aid_schemes (institution_id);
create index scholarships_scheme_idx on public.scholarships (financial_aid_scheme_id) where financial_aid_scheme_id is not null;
create index scholarships_provider_idx on public.scholarships (provider_institution_id) where provider_institution_id is not null;
create index scholarship_cycles_scholarship_year_idx on public.scholarship_cycles (scholarship_id, academic_year_start);
create index scholarship_benefits_cycle_idx on public.scholarship_benefits (scholarship_cycle_id);
create index scholarship_benefits_coverage_idx on public.scholarship_benefits (coverage_item_code);
create index funding_limits_benefit_idx on public.funding_limits (scholarship_benefit_id);
create index funding_limits_currency_idx on public.funding_limits (currency_code) where currency_code is not null;
create index scholarship_program_links_program_idx on public.scholarship_program_links (program_id);
create index nomination_routes_cycle_idx on public.nomination_routes (scholarship_cycle_id);
create index program_eligibility_requirement_idx on public.program_eligibility_requirements (eligibility_requirement_id);
create index intake_eligibility_requirement_idx on public.intake_eligibility_requirements (eligibility_requirement_id);
create index scholarship_eligibility_requirement_idx on public.scholarship_eligibility_requirements (eligibility_requirement_id);
create index application_round_deadlines_deadline_idx on public.application_round_deadlines (deadline_id);
create index scholarship_cycle_deadlines_deadline_idx on public.scholarship_cycle_deadlines (deadline_id);
create index opportunities_provider_idx on public.opportunities (provider_institution_id) where provider_institution_id is not null;
create index opportunity_deadlines_deadline_idx on public.opportunity_deadlines (deadline_id);
create index catalog_entity_tags_tag_idx on public.catalog_entity_tags (tag_code);
create index translation_entries_entity_idx on public.translation_entries (catalog_entity_id);
create index translation_entries_source_idx on public.translation_entries (source_claim_id, catalog_entity_id);
create index data_revisions_entity_idx on public.data_revisions (catalog_entity_id, revision desc);
create index data_revisions_source_idx on public.data_revisions (source_claim_id, catalog_entity_id) where source_claim_id is not null;

create function public.touch_catalog_entity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  if row(new.publication_status_code, new.verification_state_code, new.last_checked_at,
         new.effective_from, new.effective_until, new.archived_at)
     is distinct from
     row(old.publication_status_code, old.verification_state_code, old.last_checked_at,
         old.effective_from, old.effective_until, old.archived_at) then
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;

create trigger catalog_entities_touch
before update on public.catalog_entities
for each row execute function public.touch_catalog_entity();

create function public.enforce_catalog_entity_type()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actual_type text;
begin
  select entity_type into actual_type
  from public.catalog_entities
  where id = new.id;

  if actual_type is distinct from tg_argv[0] then
    raise exception using
      errcode = '23514',
      message = format('catalog entity %s must have type %s', new.id, tg_argv[0]);
  end if;
  return new;
end;
$$;

create trigger institutions_entity_type before insert or update of id on public.institutions
  for each row execute function public.enforce_catalog_entity_type('institution');
create trigger campuses_entity_type before insert or update of id on public.campuses
  for each row execute function public.enforce_catalog_entity_type('campus');
create trigger institution_accreditations_entity_type before insert or update of id on public.institution_accreditations
  for each row execute function public.enforce_catalog_entity_type('institution_accreditation');
create trigger academic_units_entity_type before insert or update of id on public.academic_units
  for each row execute function public.enforce_catalog_entity_type('academic_unit');
create trigger degree_programs_entity_type before insert or update of id on public.degree_programs
  for each row execute function public.enforce_catalog_entity_type('degree_program');
create trigger admission_intakes_entity_type before insert or update of id on public.admission_intakes
  for each row execute function public.enforce_catalog_entity_type('admission_intake');
create trigger application_rounds_entity_type before insert or update of id on public.application_rounds
  for each row execute function public.enforce_catalog_entity_type('application_round');
create trigger eligibility_requirements_entity_type before insert or update of id on public.eligibility_requirements
  for each row execute function public.enforce_catalog_entity_type('eligibility_requirement');
create trigger estimated_tuition_entity_type before insert or update of id on public.estimated_tuition
  for each row execute function public.enforce_catalog_entity_type('estimated_tuition');
create trigger cost_of_living_entity_type before insert or update of id on public.cost_of_living
  for each row execute function public.enforce_catalog_entity_type('cost_of_living');
create trigger financial_aid_schemes_entity_type before insert or update of id on public.financial_aid_schemes
  for each row execute function public.enforce_catalog_entity_type('financial_aid_scheme');
create trigger scholarships_entity_type before insert or update of id on public.scholarships
  for each row execute function public.enforce_catalog_entity_type('scholarship');
create trigger scholarship_cycles_entity_type before insert or update of id on public.scholarship_cycles
  for each row execute function public.enforce_catalog_entity_type('scholarship_cycle');
create trigger scholarship_benefits_entity_type before insert or update of id on public.scholarship_benefits
  for each row execute function public.enforce_catalog_entity_type('scholarship_benefit');
create trigger nomination_routes_entity_type before insert or update of id on public.nomination_routes
  for each row execute function public.enforce_catalog_entity_type('nomination_route');
create trigger deadlines_entity_type before insert or update of id on public.deadlines
  for each row execute function public.enforce_catalog_entity_type('deadline');
create trigger opportunities_entity_type before insert or update of id on public.opportunities
  for each row execute function public.enforce_catalog_entity_type('opportunity');

create function public.enforce_program_campus_institution()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  program_institution_id bigint;
  campus_institution_id bigint;
begin
  select au.institution_id into program_institution_id
  from public.degree_programs dp
  join public.academic_units au on au.id = dp.academic_unit_id
  where dp.id = new.program_id;

  select institution_id into campus_institution_id
  from public.campuses
  where id = new.campus_id;

  if program_institution_id is not null
     and campus_institution_id is not null
     and program_institution_id <> campus_institution_id then
    raise exception using
      errcode = '23514',
      message = 'program campus must belong to the program institution';
  end if;
  return new;
end;
$$;

create trigger program_campuses_same_institution
before insert or update on public.program_campuses
for each row execute function public.enforce_program_campus_institution();

create function public.assert_catalog_entity_evidence(target_entity_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requires_evidence boolean;
begin
  select publication_status_code = 'published' and verification_state_code = 'verified'
    into requires_evidence
  from public.catalog_entities
  where id = target_entity_id;

  if coalesce(requires_evidence, false) and not exists (
    select 1
    from public.source_claims sc
    join public.official_sources os on os.id = sc.source_id
    where sc.catalog_entity_id = target_entity_id
      and sc.verification_state_code = 'verified'
      and os.is_active
      and (sc.effective_from is null or sc.effective_from <= current_date)
      and (sc.effective_until is null or sc.effective_until >= current_date)
      and (os.effective_from is null or os.effective_from <= current_date)
      and (os.effective_until is null or os.effective_until >= current_date)
  ) then
    raise exception using
      errcode = '23514',
      message = format('published verified catalog entity %s requires active verified official evidence', target_entity_id);
  end if;
end;
$$;

create function public.check_catalog_entity_evidence()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.assert_catalog_entity_evidence(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create constraint trigger catalog_entities_require_evidence
after insert or update on public.catalog_entities
deferrable initially deferred
for each row execute function public.check_catalog_entity_evidence();

create function public.check_source_claim_evidence()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.assert_catalog_entity_evidence(old.catalog_entity_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.assert_catalog_entity_evidence(new.catalog_entity_id);
  end if;
  return coalesce(new, old);
end;
$$;

create constraint trigger source_claims_preserve_evidence
after insert or update or delete on public.source_claims
deferrable initially deferred
for each row execute function public.check_source_claim_evidence();

create function public.check_official_source_evidence()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entity_id bigint;
begin
  if new.is_active is distinct from old.is_active
     or new.effective_from is distinct from old.effective_from
     or new.effective_until is distinct from old.effective_until then
    for entity_id in
      select distinct sc.catalog_entity_id
      from public.source_claims sc
      where sc.source_id = new.id
    loop
      perform public.assert_catalog_entity_evidence(entity_id);
    end loop;
  end if;
  return new;
end;
$$;

create constraint trigger official_sources_preserve_evidence
after update on public.official_sources
deferrable initially deferred
for each row execute function public.check_official_source_evidence();

-- All exposed tables are opt-in: RLS first, grants and policies below.
do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'publication_status', 'verification_states', 'catalog_entities', 'official_sources',
    'source_claims', 'verification_runs', 'countries', 'regions', 'cities', 'institutions',
    'campuses', 'institution_accreditations', 'institution_names_translations',
    'academic_units', 'degree_levels', 'fields_of_study', 'degree_programs',
    'program_campuses', 'program_delivery_modes', 'degree_program_delivery_modes',
    'languages_of_instruction', 'degree_program_languages', 'admission_intakes',
    'application_rounds', 'eligibility_requirements', 'standardized_tests',
    'required_tests', 'test_score_thresholds', 'prerequisites', 'citizenship_eligibility',
    'fee_currency', 'estimated_tuition', 'cost_of_living', 'financial_aid_schemes',
    'scholarships', 'scholarship_cycles', 'coverage_items', 'scholarship_benefits',
    'funding_limits', 'scholarship_program_links', 'nomination_routes',
    'program_eligibility_requirements', 'intake_eligibility_requirements',
    'scholarship_eligibility_requirements', 'deadlines', 'application_round_deadlines',
    'scholarship_cycle_deadlines', 'opportunities', 'opportunity_deadlines',
    'opportunity_tags', 'catalog_entity_tags', 'translation_entries', 'data_revisions'
  ] loop
    execute format('alter table public.%I enable row level security', relation_name);
  end loop;
end;
$$;

create policy catalog_entities_public_read on public.catalog_entities
for select to anon, authenticated
using (
  publication_status_code = 'published'
  and verification_state_code = 'verified'
  and archived_at is null
  and last_checked_at is not null
  and (effective_from is null or effective_from <= current_date)
  and (effective_until is null or effective_until >= current_date)
);

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'publication_status', 'verification_states', 'countries', 'regions', 'cities',
    'degree_levels', 'fields_of_study', 'program_delivery_modes',
    'languages_of_instruction', 'standardized_tests', 'fee_currency',
    'coverage_items', 'opportunity_tags'
  ] loop
    execute format(
      'create policy reference_public_read on public.%I for select to anon, authenticated using (true)',
      relation_name
    );
  end loop;
end;
$$;

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'institutions', 'campuses', 'institution_accreditations', 'academic_units',
    'degree_programs', 'admission_intakes', 'application_rounds',
    'eligibility_requirements', 'estimated_tuition', 'cost_of_living',
    'financial_aid_schemes', 'scholarships', 'scholarship_cycles',
    'scholarship_benefits', 'nomination_routes', 'deadlines', 'opportunities'
  ] loop
    execute format(
      'create policy catalog_subtype_public_read on public.%1$I for select to anon, authenticated using (exists (select 1 from public.catalog_entities ce where ce.id = %1$I.id))',
      relation_name
    );
  end loop;
end;
$$;

create policy source_claims_public_read on public.source_claims
for select to anon, authenticated
using (
  verification_state_code = 'verified'
  and (effective_from is null or effective_from <= current_date)
  and (effective_until is null or effective_until >= current_date)
  and exists (select 1 from public.catalog_entities ce where ce.id = source_claims.catalog_entity_id)
);

create policy official_sources_public_read on public.official_sources
for select to anon, authenticated
using (
  is_active
  and (effective_from is null or effective_from <= current_date)
  and (effective_until is null or effective_until >= current_date)
  and exists (select 1 from public.source_claims sc where sc.source_id = official_sources.id)
);

create policy institution_names_translations_public_read on public.institution_names_translations
for select to anon, authenticated
using (
  exists (select 1 from public.institutions i where i.id = institution_names_translations.institution_id)
  and exists (select 1 from public.source_claims sc where sc.id = institution_names_translations.source_claim_id)
);

create policy translation_entries_public_read on public.translation_entries
for select to anon, authenticated
using (
  exists (select 1 from public.catalog_entities ce where ce.id = translation_entries.catalog_entity_id)
  and exists (select 1 from public.source_claims sc where sc.id = translation_entries.source_claim_id)
);

create policy program_campuses_public_read on public.program_campuses for select to anon, authenticated
using (exists (select 1 from public.degree_programs p where p.id = program_campuses.program_id)
  and exists (select 1 from public.campuses c where c.id = program_campuses.campus_id));
create policy degree_program_delivery_modes_public_read on public.degree_program_delivery_modes for select to anon, authenticated
using (exists (select 1 from public.degree_programs p where p.id = degree_program_delivery_modes.program_id));
create policy degree_program_languages_public_read on public.degree_program_languages for select to anon, authenticated
using (exists (select 1 from public.degree_programs p where p.id = degree_program_languages.program_id));
create policy required_tests_public_read on public.required_tests for select to anon, authenticated
using (exists (select 1 from public.eligibility_requirements r where r.id = required_tests.eligibility_requirement_id));
create policy test_score_thresholds_public_read on public.test_score_thresholds for select to anon, authenticated
using (exists (select 1 from public.required_tests rt where rt.id = test_score_thresholds.required_test_id));
create policy prerequisites_public_read on public.prerequisites for select to anon, authenticated
using (exists (select 1 from public.eligibility_requirements r where r.id = prerequisites.eligibility_requirement_id));
create policy citizenship_eligibility_public_read on public.citizenship_eligibility for select to anon, authenticated
using (exists (select 1 from public.eligibility_requirements r where r.id = citizenship_eligibility.eligibility_requirement_id));
create policy funding_limits_public_read on public.funding_limits for select to anon, authenticated
using (exists (select 1 from public.scholarship_benefits b where b.id = funding_limits.scholarship_benefit_id));
create policy scholarship_program_links_public_read on public.scholarship_program_links for select to anon, authenticated
using (exists (select 1 from public.scholarship_cycles c where c.id = scholarship_program_links.scholarship_cycle_id)
  and exists (select 1 from public.degree_programs p where p.id = scholarship_program_links.program_id));
create policy program_eligibility_requirements_public_read on public.program_eligibility_requirements for select to anon, authenticated
using (exists (select 1 from public.degree_programs p where p.id = program_eligibility_requirements.program_id)
  and exists (select 1 from public.eligibility_requirements r where r.id = program_eligibility_requirements.eligibility_requirement_id));
create policy intake_eligibility_requirements_public_read on public.intake_eligibility_requirements for select to anon, authenticated
using (exists (select 1 from public.admission_intakes i where i.id = intake_eligibility_requirements.intake_id)
  and exists (select 1 from public.eligibility_requirements r where r.id = intake_eligibility_requirements.eligibility_requirement_id));
create policy scholarship_eligibility_requirements_public_read on public.scholarship_eligibility_requirements for select to anon, authenticated
using (exists (select 1 from public.scholarship_cycles c where c.id = scholarship_eligibility_requirements.scholarship_cycle_id)
  and exists (select 1 from public.eligibility_requirements r where r.id = scholarship_eligibility_requirements.eligibility_requirement_id));
create policy application_round_deadlines_public_read on public.application_round_deadlines for select to anon, authenticated
using (exists (select 1 from public.application_rounds r where r.id = application_round_deadlines.application_round_id)
  and exists (select 1 from public.deadlines d where d.id = application_round_deadlines.deadline_id));
create policy scholarship_cycle_deadlines_public_read on public.scholarship_cycle_deadlines for select to anon, authenticated
using (exists (select 1 from public.scholarship_cycles c where c.id = scholarship_cycle_deadlines.scholarship_cycle_id)
  and exists (select 1 from public.deadlines d where d.id = scholarship_cycle_deadlines.deadline_id));
create policy opportunity_deadlines_public_read on public.opportunity_deadlines for select to anon, authenticated
using (exists (select 1 from public.opportunities o where o.id = opportunity_deadlines.opportunity_id)
  and exists (select 1 from public.deadlines d where d.id = opportunity_deadlines.deadline_id));
create policy catalog_entity_tags_public_read on public.catalog_entity_tags for select to anon, authenticated
using (exists (select 1 from public.catalog_entities ce where ce.id = catalog_entity_tags.catalog_entity_id));

create view public.published_degree_programs
with (security_invoker = true)
as
select
  p.id as program_id,
  p.slug as program_slug,
  p.title as program_title,
  dl.code as degree_level_code,
  dl.label as degree_level,
  fs.code as field_code,
  fs.name as field_name,
  au.id as academic_unit_id,
  au.title as academic_unit_title,
  i.id as institution_id,
  i.slug as institution_slug,
  i.legal_name as institution_name,
  c.iso2 as country_code,
  cp.id as campus_id,
  cp.name as campus_name,
  ai.id as intake_id,
  ai.academic_year_start,
  ai.term_code,
  ai.starts_on,
  institution_evidence.canonical_url as institution_source_url,
  academic_unit_evidence.canonical_url as academic_unit_source_url,
  campus_evidence.canonical_url as campus_source_url,
  program_evidence.canonical_url as program_source_url,
  intake_evidence.canonical_url as intake_source_url,
  least(
    institution_evidence.last_checked_at,
    academic_unit_evidence.last_checked_at,
    campus_evidence.last_checked_at,
    program_evidence.last_checked_at,
    intake_evidence.last_checked_at
  ) as evidence_checked_at
from public.degree_programs p
join public.academic_units au on au.id = p.academic_unit_id
join public.institutions i on i.id = au.institution_id
join public.countries c on c.id = i.country_id
join public.degree_levels dl on dl.code = p.degree_level_code
join public.fields_of_study fs on fs.id = p.primary_field_id
join public.program_campuses pc on pc.program_id = p.id
join public.campuses cp on cp.id = pc.campus_id
join public.admission_intakes ai on ai.program_id = p.id
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims sc join public.official_sources os on os.id = sc.source_id
  where sc.catalog_entity_id = i.id order by os.last_checked_at desc limit 1
) institution_evidence on true
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims sc join public.official_sources os on os.id = sc.source_id
  where sc.catalog_entity_id = au.id order by os.last_checked_at desc limit 1
) academic_unit_evidence on true
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims sc join public.official_sources os on os.id = sc.source_id
  where sc.catalog_entity_id = cp.id order by os.last_checked_at desc limit 1
) campus_evidence on true
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims sc join public.official_sources os on os.id = sc.source_id
  where sc.catalog_entity_id = p.id order by os.last_checked_at desc limit 1
) program_evidence on true
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims sc join public.official_sources os on os.id = sc.source_id
  where sc.catalog_entity_id = ai.id order by os.last_checked_at desc limit 1
) intake_evidence on true;

create view public.published_scholarship_opportunities
with (security_invoker = true)
as
select
  s.id as scholarship_id,
  s.slug as scholarship_slug,
  s.title as scholarship_title,
  scy.id as scholarship_cycle_id,
  scy.academic_year_start,
  scy.cycle_code,
  scy.opens_at,
  scy.closes_at,
  spl.relationship_type,
  p.id as program_id,
  p.slug as program_slug,
  p.title as program_title,
  scholarship_evidence.canonical_url as scholarship_source_url,
  cycle_evidence.canonical_url as cycle_source_url,
  program_evidence.canonical_url as program_source_url,
  least(
    scholarship_evidence.last_checked_at,
    cycle_evidence.last_checked_at,
    program_evidence.last_checked_at
  ) as evidence_checked_at
from public.scholarships s
join public.scholarship_cycles scy on scy.scholarship_id = s.id
join public.scholarship_program_links spl on spl.scholarship_cycle_id = scy.id
join public.degree_programs p on p.id = spl.program_id
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims cl join public.official_sources os on os.id = cl.source_id
  where cl.catalog_entity_id = s.id order by os.last_checked_at desc limit 1
) scholarship_evidence on true
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims cl join public.official_sources os on os.id = cl.source_id
  where cl.catalog_entity_id = scy.id order by os.last_checked_at desc limit 1
) cycle_evidence on true
join lateral (
  select os.canonical_url, os.last_checked_at
  from public.source_claims cl join public.official_sources os on os.id = cl.source_id
  where cl.catalog_entity_id = p.id order by os.last_checked_at desc limit 1
) program_evidence on true;

create function public.import_catalog_bundle(p_bundle jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_id bigint;
  country_id bigint;
  city_id bigint;
  institution_id bigint;
  campus_id bigint;
  academic_unit_id bigint;
  program_id bigint;
  intake_id bigint;
  entity_id bigint;
  source_excerpt text;
  checked_at timestamptz;
begin
  if jsonb_typeof(p_bundle) <> 'object'
     or jsonb_typeof(p_bundle -> 'source') <> 'object'
     or jsonb_typeof(p_bundle -> 'institution') <> 'object'
     or jsonb_typeof(p_bundle -> 'campus') <> 'object'
     or jsonb_typeof(p_bundle -> 'academic_unit') <> 'object'
     or jsonb_typeof(p_bundle -> 'program') <> 'object'
     or jsonb_typeof(p_bundle -> 'intake') <> 'object' then
    raise exception using errcode = '22023', message = 'catalog bundle requires all object sections';
  end if;

  if coalesce(p_bundle #>> '{source,url}', '') = ''
     or coalesce(p_bundle #>> '{source,publisher}', '') = ''
     or coalesce(p_bundle #>> '{source,title}', '') = ''
     or coalesce(p_bundle #>> '{source,locale}', '') = ''
     or coalesce(p_bundle #>> '{source,excerpt}', '') = ''
     or coalesce(p_bundle #>> '{institution,slug}', '') = ''
     or coalesce(p_bundle #>> '{institution,legal_name}', '') = ''
     or coalesce(p_bundle #>> '{institution,type}', '') = ''
     or coalesce(p_bundle #>> '{institution,country_iso2}', '') = ''
     or coalesce(p_bundle #>> '{campus,code}', '') = ''
     or coalesce(p_bundle #>> '{campus,name}', '') = ''
     or coalesce(p_bundle #>> '{academic_unit,slug}', '') = ''
     or coalesce(p_bundle #>> '{academic_unit,title}', '') = ''
     or coalesce(p_bundle #>> '{program,slug}', '') = ''
     or coalesce(p_bundle #>> '{program,title}', '') = ''
     or coalesce(p_bundle #>> '{program,degree_level_code}', '') = ''
     or coalesce(p_bundle #>> '{program,field_code}', '') = ''
     or coalesce(p_bundle #>> '{intake,academic_year_start}', '') = ''
     or coalesce(p_bundle #>> '{intake,term_code}', '') = '' then
    raise exception using errcode = '22023', message = 'catalog bundle has missing required fields';
  end if;

  source_excerpt := p_bundle #>> '{source,excerpt}';
  checked_at := coalesce((p_bundle #>> '{source,checked_at}')::timestamptz, now());
  if checked_at > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'source check timestamp cannot be in the future';
  end if;

  select id into strict country_id from public.countries
  where iso2 = upper(p_bundle #>> '{institution,country_iso2}') and is_active;

  if nullif(p_bundle #>> '{institution,city_slug}', '') is not null then
    select id into strict city_id from public.cities
    where country_id = import_catalog_bundle.country_id
      and slug = p_bundle #>> '{institution,city_slug}' and is_active;
  end if;

  perform 1 from public.degree_levels
  where code = p_bundle #>> '{program,degree_level_code}' and is_active;
  if not found then
    raise exception using errcode = '23503', message = 'unknown active degree level';
  end if;

  select id into strict entity_id from public.fields_of_study
  where code = p_bundle #>> '{program,field_code}' and is_active;

  insert into public.official_sources (
    canonical_url, publisher_name, source_title, source_type, locale,
    first_seen_at, last_checked_at
  ) values (
    p_bundle #>> '{source,url}', p_bundle #>> '{source,publisher}',
    p_bundle #>> '{source,title}', coalesce(p_bundle #>> '{source,type}', 'official_webpage'),
    p_bundle #>> '{source,locale}', checked_at, checked_at
  ) returning id into source_id;

  insert into public.catalog_entities (entity_type) values ('institution') returning id into institution_id;
  insert into public.institutions (id, country_id, city_id, slug, legal_name, institution_type, website_url)
  values (
    institution_id, country_id, city_id, p_bundle #>> '{institution,slug}',
    p_bundle #>> '{institution,legal_name}', p_bundle #>> '{institution,type}',
    nullif(p_bundle #>> '{institution,website_url}', '')
  );

  insert into public.catalog_entities (entity_type) values ('campus') returning id into campus_id;
  insert into public.campuses (id, institution_id, country_id, city_id, campus_code, name)
  values (
    campus_id, institution_id, country_id, city_id,
    p_bundle #>> '{campus,code}', p_bundle #>> '{campus,name}'
  );

  insert into public.catalog_entities (entity_type) values ('academic_unit') returning id into academic_unit_id;
  insert into public.academic_units (id, institution_id, campus_id, slug, title, unit_type)
  values (
    academic_unit_id, institution_id, campus_id,
    p_bundle #>> '{academic_unit,slug}', p_bundle #>> '{academic_unit,title}',
    coalesce(p_bundle #>> '{academic_unit,type}', 'faculty')
  );

  insert into public.catalog_entities (entity_type) values ('degree_program') returning id into program_id;
  insert into public.degree_programs (
    id, academic_unit_id, degree_level_code, primary_field_id, slug, title, duration_months
  ) values (
    program_id, academic_unit_id, p_bundle #>> '{program,degree_level_code}', entity_id,
    p_bundle #>> '{program,slug}', p_bundle #>> '{program,title}',
    nullif(p_bundle #>> '{program,duration_months}', '')::smallint
  );
  insert into public.program_campuses (program_id, campus_id, is_primary)
  values (program_id, campus_id, true);

  insert into public.catalog_entities (entity_type) values ('admission_intake') returning id into intake_id;
  insert into public.admission_intakes (id, program_id, academic_year_start, term_code, starts_on)
  values (
    intake_id, program_id, (p_bundle #>> '{intake,academic_year_start}')::smallint,
    p_bundle #>> '{intake,term_code}', nullif(p_bundle #>> '{intake,starts_on}', '')::date
  );

  insert into public.source_claims (
    source_id, catalog_entity_id, claim_key, claim_text, content_hash
  )
  select source_id, target_id, 'record', source_excerpt,
    md5(target_type || ':' || source_excerpt)
  from (values
    (institution_id, 'institution'),
    (campus_id, 'campus'),
    (academic_unit_id, 'academic_unit'),
    (program_id, 'degree_program'),
    (intake_id, 'admission_intake')
  ) as targets(target_id, target_type);

  return jsonb_build_object(
    'sourceId', source_id,
    'institutionId', institution_id,
    'campusId', campus_id,
    'academicUnitId', academic_unit_id,
    'programId', program_id,
    'intakeId', intake_id,
    'publicationStatus', 'draft',
    'verificationState', 'needs_review'
  );
exception
  when no_data_found then
    raise exception using errcode = '23503', message = 'catalog bundle references unknown active taxonomy';
end;
$$;

create function public.review_source_claim(
  p_claim_id bigint,
  p_verification_run_id bigint
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  claim_source_id bigint;
  run_source_id bigint;
  entity_id bigint;
begin
  select source_id, catalog_entity_id into strict claim_source_id, entity_id
  from public.source_claims where id = p_claim_id;

  select source_id into strict run_source_id
  from public.verification_runs
  where id = p_verification_run_id
    and outcome = 'verified'
    and completed_at is not null;

  if claim_source_id <> run_source_id then
    raise exception using errcode = '23514', message = 'verification run and claim source do not match';
  end if;

  update public.source_claims
  set verification_state_code = 'verified', observed_at = now()
  where id = p_claim_id;

  update public.official_sources
  set last_checked_at = greatest(last_checked_at, now()), updated_at = now()
  where id = claim_source_id;

  return entity_id;
end;
$$;

create function public.publish_catalog_entity(
  p_catalog_entity_id bigint,
  p_checked_at timestamptz
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_checked_at is null or p_checked_at > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'checked timestamp is required and cannot be in the future';
  end if;

  perform public.assert_catalog_entity_evidence(p_catalog_entity_id);
  if not exists (
    select 1 from public.source_claims sc
    join public.official_sources os on os.id = sc.source_id
    where sc.catalog_entity_id = p_catalog_entity_id
      and sc.verification_state_code = 'verified'
      and os.is_active
  ) then
    raise exception using errcode = '23514', message = 'verified evidence is required before publication';
  end if;

  update public.catalog_entities
  set publication_status_code = 'published',
      verification_state_code = 'verified',
      last_checked_at = p_checked_at,
      archived_at = null
  where id = p_catalog_entity_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'catalog entity not found';
  end if;
  return p_catalog_entity_id;
end;
$$;

-- Public-schema helpers are security invoker functions, denied as Data API RPCs to
-- browser roles and executable only by the server role for triggers/invariants.
revoke all on function public.touch_catalog_entity() from public, anon, authenticated;
revoke all on function public.enforce_catalog_entity_type() from public, anon, authenticated;
revoke all on function public.enforce_program_campus_institution() from public, anon, authenticated;
revoke all on function public.assert_catalog_entity_evidence(bigint) from public, anon, authenticated;
revoke all on function public.check_catalog_entity_evidence() from public, anon, authenticated;
revoke all on function public.check_source_claim_evidence() from public, anon, authenticated;
revoke all on function public.check_official_source_evidence() from public, anon, authenticated;
grant execute on function public.touch_catalog_entity() to service_role;
grant execute on function public.enforce_catalog_entity_type() to service_role;
grant execute on function public.enforce_program_campus_institution() to service_role;
grant execute on function public.assert_catalog_entity_evidence(bigint) to service_role;
grant execute on function public.check_catalog_entity_evidence() to service_role;
grant execute on function public.check_source_claim_evidence() to service_role;
grant execute on function public.check_official_source_evidence() to service_role;

revoke all on function public.import_catalog_bundle(jsonb) from public, anon, authenticated;
revoke all on function public.review_source_claim(bigint, bigint) from public, anon, authenticated;
revoke all on function public.publish_catalog_entity(bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.import_catalog_bundle(jsonb) to service_role;
grant execute on function public.review_source_claim(bigint, bigint) to service_role;
grant execute on function public.publish_catalog_entity(bigint, timestamptz) to service_role;

grant select on table
  public.publication_status, public.verification_states, public.catalog_entities,
  public.official_sources, public.source_claims, public.countries, public.regions,
  public.cities, public.institutions, public.campuses, public.institution_accreditations,
  public.institution_names_translations, public.academic_units, public.degree_levels,
  public.fields_of_study, public.degree_programs, public.program_campuses,
  public.program_delivery_modes, public.degree_program_delivery_modes,
  public.languages_of_instruction, public.degree_program_languages,
  public.admission_intakes, public.application_rounds, public.eligibility_requirements,
  public.standardized_tests, public.required_tests, public.test_score_thresholds,
  public.prerequisites, public.citizenship_eligibility, public.fee_currency,
  public.estimated_tuition, public.cost_of_living, public.financial_aid_schemes,
  public.scholarships, public.scholarship_cycles, public.coverage_items,
  public.scholarship_benefits, public.funding_limits, public.scholarship_program_links,
  public.nomination_routes, public.program_eligibility_requirements,
  public.intake_eligibility_requirements, public.scholarship_eligibility_requirements,
  public.deadlines, public.application_round_deadlines, public.scholarship_cycle_deadlines,
  public.opportunities, public.opportunity_deadlines, public.opportunity_tags,
  public.catalog_entity_tags, public.translation_entries,
  public.published_degree_programs, public.published_scholarship_opportunities
to anon, authenticated;

grant select, insert, update, delete on table
  public.publication_status, public.verification_states, public.catalog_entities,
  public.official_sources, public.source_claims, public.verification_runs,
  public.countries, public.regions, public.cities, public.institutions, public.campuses,
  public.institution_accreditations, public.institution_names_translations,
  public.academic_units, public.degree_levels, public.fields_of_study,
  public.degree_programs, public.program_campuses, public.program_delivery_modes,
  public.degree_program_delivery_modes, public.languages_of_instruction,
  public.degree_program_languages, public.admission_intakes, public.application_rounds,
  public.eligibility_requirements, public.standardized_tests, public.required_tests,
  public.test_score_thresholds, public.prerequisites, public.citizenship_eligibility,
  public.fee_currency, public.estimated_tuition, public.cost_of_living,
  public.financial_aid_schemes, public.scholarships, public.scholarship_cycles,
  public.coverage_items, public.scholarship_benefits, public.funding_limits,
  public.scholarship_program_links, public.nomination_routes,
  public.program_eligibility_requirements, public.intake_eligibility_requirements,
  public.scholarship_eligibility_requirements, public.deadlines,
  public.application_round_deadlines, public.scholarship_cycle_deadlines,
  public.opportunities, public.opportunity_deadlines, public.opportunity_tags,
  public.catalog_entity_tags, public.translation_entries, public.data_revisions
to service_role;
grant select on table public.published_degree_programs, public.published_scholarship_opportunities to service_role;
grant usage, select on all sequences in schema public to service_role;

commit;
