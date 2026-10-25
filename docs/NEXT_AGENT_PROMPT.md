# Next agent handoff — current state after the 2026-10-24 verified history consolidation

## Phase 15 checkpoint — PARTIAL (stop before Phase 16)

Unified search now covers published/source-backed programs, scholarships and
opportunities. Routes: `/{locale}/search`, `/api/search/suggest`, localized
scholarship/opportunity details, protected `/{locale}/saved`, and program-only
`/{locale}/compare?ids=...`. URL filters, deterministic pages, autocomplete,
source freshness, private idempotent saves and sparse 2–4 comparison are shipped.
Eligibility/personal fit is always not evaluated.

Applied Jetuu development migrations through
`20261025052618_phase_15_opportunity_range_truth` are represented in Git.
Cloud pgTAP passed 23 checks, including factual range outcomes and two-user
saved-search isolation. The
rollback-only 10,003-row benchmark covered all three result types, Latin,
Cyrillic, Kazakh, diacritics, typo tolerance, composed filters,
stable/disjoint sampled pages and hidden=0.
Measured SQL execution: 327.675 ms browse and 698.999 ms filtered after repairing
an initial 21.834-second plan. Local unit tests (66) and Phase 15 Playwright
desktop/mobile tests (10) passed; the complete browser suite passed 62 with two
hosted-Supabase-configured auth cases skipped.

Keep status PARTIAL until a reviewed corpus exists and hosted REST/Auth browser
flows can prove real search/detail/save/reload behavior. Local database replay
was blocked by Docker disk exhaustion. Vercel is unlinked/unauthenticated, so no
deployment is claimed. Read `docs/PHASE_15_REVIEW.md`; do not start Phase 16
without a new explicit request.

## Shipped-but-not-phase-verified work

Two historical feature commits implemented real work that no phase gate has
verified. They are preserved under tag
`archive-main-before-rewrite-2026-10-24`; do not upgrade those phases to
VERIFIED without recording their own acceptance evidence:

- `6dde0de` "feat: secure Supabase authentication flows" — Phase 08 scope
  (signup/sign-in/reset/update-password server actions, auth callback/confirm
  routes, session refresh in `src/proxy.ts`, auth route group pages).
- `4e7e7e0` "feat: ship localized account workspace" — Phase 09 slice
  (dashboard group, onboarding form saving to `student_profiles` with the
  version trigger, locale-aware auth copy in `src/lib/i18n/auth.ts`).

Both are covered by unit tests, and e2e specs exercise degraded-mode paths, but
no Phase 08/09 gate section, review document, or acceptance evidence exists.
They are NOT VERIFIED phases.

Phase 12 remains **PARTIAL** exactly as before: read-only University & Program
Explorer over the canonical Phase 10 development schema; migration
`20261021113901_catalog_explorer` applied to authorized Jetuu project
`edpuovkgoisyzpguksdi`; `catalog_search` RPC; no production deployment, no real
reviewed corpus.

## Standing environment limits (unchanged)

- Workspace direct REST proxy returns CONNECT 403; local PostgreSQL image pull
  returns registry 403.
- Real published records: one current source-backed opportunity, zero programs
  and scholarships. Do not publish synthetic records.
- REST/Auth/Storage round trips must be verified in an environment with access
  before any phase is marked VERIFIED.
- Save and program comparison now exist under Phase 15. Matching/plan remains out
  of scope until Phase 16+ explicitly begins.

## Supabase Preview repair — 2026-10-24

The connected Jetuu project reported its Git-linked `main` branch as
`MIGRATIONS_FAILED`. MCP migration history proved that five Phase 13 and two
Phase 14 migrations were already applied to the authorized development project
but absent from `main`. Their exact files were recovered from
`origin/codex/phase14-opportunities`; blob hashes match that source. This repairs
version-control history only and does not merge or verify the Phase 13/14 app.

`npm run check` passes with 62 tests and a production build. Push run
`40093573608` proved two clean migration replays, both pgTAP passes and advisors,
then exposed only a stale committed `database.types.ts`. The exact generated
artifact from that failed job (SHA-256
`71f250cc97a4b3d4e94980f2248f22664a0cfa9fc12786c740e31e33883ba1ce`) is now
committed, matching the pattern established by fix `684690a`.

## Main history consolidation — 2026-10-24

At the repository owner's explicit request, `main` was replaced with one root
commit containing the fully corrected tree so obsolete failed-check commits no
longer appear in the active branch timeline. The complete prior chain remains
recoverable at annotated tag `archive-main-before-rewrite-2026-10-24`, pointing
to former main SHA `c9ab9df88c18c6c1b3479d79ac8ca6ba4b701666`. No project
file was discarded; the consolidation changes ancestry, not the verified tree.

## Maintenance pass — 2026-10-23 (this working tree)

A full repository audit was executed and its approved findings were fixed:

- Gate is platform-neutral: Prettier `endOfLine: "auto"` + a `.gitattributes`
  with `* text=auto`; `npm run check` now passes on Windows at a clean checkout.
- Marketing/email/metadata copy now matches shipped reality (accounts and the
  program catalog search are live; scholarship catalog, matching, save/compare,
  payments are not). Auth/dashboard pages export locale-aware metadata.
- Onboarding renders a visible failure state when the profile read errors;
  catalog deadline sorting is chronological; known React-key, a11y and dead-code
  issues in `src/features/catalog/views.tsx`, `demo-preview.tsx`, `proxy.ts`,
  root layout and the marketing layout were resolved.
- Tooling/CI: `turbopack.root` pinned to the app root, Playwright validates
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and always builds fresh, CI pushes only
  `main` plus PRs, `scripts/db.mjs` uses the Windows named pipe on Windows, a
  Husky `pre-push` hook runs typecheck + unit tests.
- Documentation set (this handoff, tracker, README, architecture, schemas,
  matrices, feature matrix) was synced to the actual HEAD state.

## Next actions

1. Preserve the Phase 15 PARTIAL boundary; first close real-corpus and hosted
   REST/Auth/deployment evidence if credentials and network access become available.
2. Check `supabase migration list` on the authorized cloud project before any
   new SQL. As of 2026-10-24, all sixteen applied versions through
   `20261022135919_phase_14_deadline_filter_fix` are represented in `main`.
3. Do not start Phase 16 automatically; explicit user request required.
4. The Phase 12 synthetic filter/isolation transaction measured **eleven**
   conditions (see PHASE_TRACKER.md); earlier text saying "six" was a summary
   error and has been corrected.
