# MVP recovery — 2026-10-28

The integrated recovery branch starts at `446d4d7`, preserving Phases 17–19 and
the trusted generation repair. Older Phase 13 redeploys do not include these
features. No phase is promoted to VERIFIED by a dependency upgrade or a build.

## Deployment warnings repaired

- Vercel install/build commands remove the unsupported inherited
  `npm_config_cache_dir` / `NPM_CONFIG_CACHE_DIR` variables before starting npm.
  Supported npm cache configuration remains available as `npm_config_cache`.
- ESLint is pinned to 10.13.0, with @eslint/js 10.0.1. The JSX accessibility
  plugin still advertises ESLint 9 peers. A narrow npm override explicitly uses
  the root ESLint; lint and an invalid-image regression verify enforcement.
  No legacy-peer-deps, warning suppression or disabled accessibility rule is used.
- The new preserve-caught-error rule requires scanner failures to retain their
  cause. The CLI still emits its existing sanitized external failure message.

## Hosted development state

Jetuu `edpuovkgoisyzpguksdi` has two email-confirmed users (aggregate read only).
Their passwords were neither retrieved nor changed. Hosted login cannot be
tested merely from the existence of Auth rows. `scripts/hosted-auth-smoke.mjs`
reads QA credentials from environment variables, validates real logins and checks
cross-user profile/roadmap reads without changing data or logging credentials.

The generation authority migration passed a transaction rollback probe and was
applied as `20261028123545_phase_17_generation_authority`. Its 20-assertion suite
was rerun transactionally; the returned final assertion is `ok 20`. This alone
does not establish every test result or browser acceptance. Browser callers can
no longer forge generated content; generation requires server configuration.

Required private Vercel Preview variable: `SUPABASE_SECRET_KEY`. Configure it in
the Vercel dashboard, never under NEXT_PUBLIC. The generation API fails closed
until this exists. Public variables are `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the earlier ANON_KEY guidance was wrong).

## Remaining acceptance dependencies

- Actual QA credentials in a protected execution environment, then hosted browser
  login/profile/matching/saved/roadmap/application/vault journeys and persistence.
- Human review of official program/scholarship requirements, funding and dates;
  publication with provenance. Conflicting Pearson dates cannot be self-approved.
- Phase 17 pacing/capacity and program document extraction gaps described in
  PHASE_17_COMPLETION_REVIEW.md need implementation and tests.
- Phase 19 real scanner, purge schedule, object backup/restore and consent gates
  remain in PHASE_19_QA_AND_RELEASE.md. No live destructive worker was started.
- Earlier research/architecture/localization/ingestion acceptance must be checked
  against the master requirements. Real research and editorial approval cannot
  be replaced with invented evidence. Full MVP release remains blocked.
