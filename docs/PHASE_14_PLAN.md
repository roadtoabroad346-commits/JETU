# Phase 14 plan — 2026-10-23

## Objective and constraints

Build an opportunities hub over the existing Phase 10 `opportunities` entity, with age/grade filtering, official provenance, and a private profile-building action state. Keep degree programs and scholarships distinct. Do not publish invented records or claim an activity changes admissions decisions. Phase 13 and 17 are not complete, so cross-module comparison and the full roadmap remain out of scope; a Phase 14 action list is the road-map entry point.

## Architecture and files

1. Reconcile the connected development schema before migration work. Its applied Phase 14 migrations already extend canonical `opportunities` with kind, eligibility, age/grade, cost, location/format, host, risk and closing date; add sourced school profiles and owner-only save/plan tables; and expose a bounded `SECURITY INVOKER` `opportunity_search(jsonb)`. Recover those exact SQL statements into Git. Reuse them rather than add duplicate tables.
2. Add `src/features/opportunities` server reads, validation and RU/KK/EN copy. Public `/{locale}/opportunities` and detail routes use URL filters, source/date and empty/error states. Keep actions server-side with an authenticated user and owner RLS. Dashboard gets a private activity list and status update control.
3. Add SQL fixtures for published/draft isolation, age/grade filtering, owner isolation and duplicate action behavior; add unit and browser checks for URL filters, empty/error rendering and controls.

## Contract and failure behavior

- Search: `q`, `kind`, `age`, `grade`, `page`; numeric ages/grades are bounded. The existing RPC accepts `{q,type,age,grade,slug,offset,limit}` and sorts by upcoming deadline then ID, 12 per page. Missing age/grade limits mean unknown eligibility and are labeled for user review; search with explicit age/grade excludes a record whose stated limit contradicts it.
- Detail: use one published/verified record with verified official source claim. Unknown data remains explicit. Official URL is an outbound HTTPS link, not an application submission.
- Actions: save, planned, preparing, applied_external, completed, withdrawn. Auth required; a user can write only their own save/plan rows, only for currently visible opportunities. Repeated saves are idempotent; plan status uses optimistic versioning. Failures show a real error and do not claim success.
- Missing Supabase configuration or transport failures show an unavailable state; zero reviewed records show a true empty state. No seed of public opportunities.

## Release gate

`npm run check`, SQL policy/fixture tests where a local database is available, E2E/a11y on actual rendered states, and cloud migration/REST confirmation if credentials and network allow. Mark PARTIAL if live round trips, reviewed content or roadmap integration remain unverified.

## Completion pass — 2026-10-24

The clean pushed branch has a route guard defect: it rejects every opportunity detail URL. Repair the guard and cover both valid and invalid slugs at HTTP level. The private status selector also offers `saved` without removing an existing plan; make that transition persist a save and remove the owner's plan row. Add a separate public schools route backed by the existing `institution_school_profiles` taxonomy, with bounded reads through public RLS, official source links, truthful partner labels, RU/KK/EN copy, and empty/error states. Reuse the JETU design tokens. No new table or remote migration is required.

Acceptance checks: detail route reaches the page rather than proxy 404; invalid slug stays 404; school directory does not mix university programs, school kinds or unverified partnerships; keyboard, 320px and axe checks pass; `npm run check` and E2E pass. Live reviewed content and authenticated persistence still require actual evidence before VERIFIED.
