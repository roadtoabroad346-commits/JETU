# Next agent handoff — current state after the 2026-10-23 audit/maintenance pass

## Shipped-but-not-phase-verified work

The last two feature commits on `origin/main` implemented real work that no phase
gate has verified. Do not upgrade those phases to VERIFIED without recording
their own acceptance evidence:

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
- Real published records: zero. Do not publish synthetic records.
- REST/Auth/Storage round trips must be verified in an environment with access
  before any phase is marked VERIFIED.
- Unsupported save/compare/plan remain out of scope until their owning modules
  exist.

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

1. Record Phase 08/09 acceptance evidence (auth flows and profile persistence
   against a reachable Supabase environment) before starting any new phase.
2. Check `supabase migration list` on the authorized cloud project before any
   new SQL: branch `codex/phase13-scholarships` on origin carries five
   unmerged migrations from 2026-10-21; their cloud application state is
   unknown (see CLOUD_DEVELOPMENT.md).
3. Do not start Phase 13 automatically; explicit user request required.
4. The Phase 12 synthetic filter/isolation transaction measured **eleven**
   conditions (see PHASE_TRACKER.md); earlier text saying "six" was a summary
   error and has been corrected.
