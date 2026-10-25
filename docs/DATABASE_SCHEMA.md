# Database scope at Phase 04

This section records the Phase 04 baseline. Later phases below extend it.

At Phase 04 no application tables, business functions, buckets, or records existed.
The baseline migration creates the non-exposed `jetu_private` namespace and restricts
default privileges and public schema creation. Supabase owns Auth/Storage internal
schemas; do not duplicate its identity model.

Generated public schema TS types are at `src/lib/supabase/database.types.ts`.
If its header says bootstrap placeholder, type generation has not succeeded and
must not be claimed verified. Only `npm run db:types` may replace it after local
migrations. `supabase/seed.sql` is intentionally empty; pgTAP probes roll back.

## Later-phase schema now present in the repo (from recovered/applied migrations)

At HEAD the migration chain includes:

- `20261018072531_foundation_security.sql` — baseline namespaces/privileges (above).
- `20261019130848_student_profile.sql` — `student_profiles` table, its `_versions`
  companion in `jetu_private` and the SECURITY DEFINER version-increment trigger
  (locked `search_path`, EXECUTE revoked; trigger-only invocation).
- `20261019131202_profile_evidence.sql` and
  `20261019131422_account_deletion_guard.sql` — private `profile-evidence`
  Storage bucket (non-public, MIME allowlist, 8 MiB cap; depth-1 owner paths
  guarded by a deletion-marker interlock).
- `20261020145643_phase_10_admissions_catalog.sql` — the canonical admissions
  catalog: reference/lookup tables, program/intake/round/deadline/funding
  structures, RLS enabled on every exposed table, explicit
  anon/authenticated/service_role grants, security-invoker editorial helpers
  and a SECURITY INVOKER RPC `catalog_search` over published rows only.
- `20261020145649_phase_10_catalog_hardening.sql` — index/visibility hardening.
- `20261021113901_catalog_explorer.sql` and
  `20261021114706_catalog_search_multivalue_fix.sql` — explorer RPC with
  multi-value filters, tuition-currency pre-filtering and deadline union
  (the second file contains the live definition).
- `student_account_deletions` support table with owner-only policies.

Notes: `verification_runs` and `data_revisions` are exposed-schema tables with
RLS enabled but **no policies and no browser grants** (deny-all by design;
service_role-only editorial path). This deny-all reflects the absent editorial
ingestion phase and must be revisited explicitly, never silently, when the
review workflow lands.

This evolution is recorded from migration SQL, not from live cloud inspection.
Whether every recovered file is applied to the authorized cloud project is a
deployment-state question — see docs/CLOUD_DEVELOPMENT.md.

## Phase 15 additions

- `saved_catalog_items`: one private row per user/catalog entity, optional list
  label and note, unique `(user_id, catalog_entity_id)`.
- `saved_searches`: private canonical JSON filters with generated MD5
  fingerprint, unique `(user_id, fingerprint)`.
- `unified_catalog_search(jsonb)`: bounded `SECURITY INVOKER` table function for
  published, verified, source-backed programs, scholarships and opportunities.
  It returns a discriminated common shape, aggregate counts and stable sort keys.
- `pg_trgm` title/provider indexes plus partial verified-evidence, source-date,
  deadline, tuition, study-mode and funding relationship indexes support the
  preaggregated query. `opportunity_search` now uses `within_range` /
  `outside_range`, never `eligible` / `ineligible`, for factual numeric ranges;
  current filtering excludes rows outside a requested range.

Applied development versions are `20261024142350`, `20261024182608`,
`20261024183658` and `20261025052618`. The real catalog has one opportunity and
no programs or scholarships; the 10k performance corpus is transactional and
rolls back.
