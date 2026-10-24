# Next agent handoff — Phase 14 verified checkpoint, 2026-10-24

Read `AGENTS.md`, `PHASE_TRACKER.md`, `PHASE_14_PLAN.md`, `PHASE_14_REVIEW.md`, `DECISIONS.md` and the exact master-prompt phase before work. **Phase 14 is VERIFIED for its development/preview scope. Do not start Phase 15 automatically.** Earlier phase statuses remain independent; Phase 12 is PARTIAL and Phases 08–09 are implemented but not phase-verified.

## Current implementation

- Localized RU/KK/EN opportunity search/detail, age/grade/type filters, source/date/fee/eligibility display and separate owner workspace exist. The proxy explicitly allows both detail and private workspace nested routes. Authenticated server actions persist saves and versioned plan statuses under owner RLS; Saved from a plan deletes the plan action while retaining the save.
- A separate `/schools` directory reads RLS-visible `institution_school_profiles`, institutions, verified source claims and active official sources. It excludes university institutions, marks a partner only when `verified_partner`, links to `/for-schools`, and currently shows a true empty state. B2B multi-tenant tooling is Phase 26, not silently included here.
- One reviewed real catalog record, the 2027 Blue Planet Awareness Contest, was inserted into authorized development project `edpuovkgoisyzpguksdi` with `supabase/content/20261024_blue_planet_2027.sql`. The exact official sources and checked facts are linked in `PHASE_14_REVIEW.md`. Do not rerun the one-time editorial script or replace its facts without source review. Existing Phase 13/14 migrations were recovered exactly into Git and already applied.
- Final code preview `dpl_AQd4ZT3uzH7zHdbQpTVbgHyRgqw4` from `62a227a` is READY on Vercel. The branch `codex/phase14-opportunities` is pushed. No production promotion or PR CI was claimed.

## Verification and limits

`npm run check`, 71 final unit/integration checks, full desktop/mobile Chromium E2E (70 passed, 2 skipped) plus an affected-school rerun, 9 rollback-only cloud SQL assertions, real preview RU/KK/EN item detail/age filters and actual authenticated Next server-action posts passed. Two disposable Auth accounts proved cross-user read/write denial; both accounts and their action rows were deleted. Follow-up database counts: users 0, identities 0, saves 0, plans 0, opportunities 1. Ephemeral sandboxes were stopped.

Local Supabase migration replay remains blocked by the image registry's 403; use the connected project history/SQL evidence or a disposable local CI environment when available. No school or verified partner records exist yet. The source freshness gate is 180 days, so recheck the Bow Seat facts before they go stale. Preview is protected/noindex; live detail was checked by deployed HTML and server-action form POST, while local desktop/mobile screenshots and axe covered empty/error school/opportunity states.

## Exact next action

Wait for a separate Phase 15 instruction. Before implementing Phase 15, reread the master acceptance criteria and preserve the verified Phase 14 contracts and source provenance. If asked to extend Phase 14 editorial content, verify each host's current official age, cost, eligibility, travel, application URL and deadline before publication.
