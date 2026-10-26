# Phase 18 QA — 2026-10-26

## Passed evidence

- `npm run check`: formatting, ESLint, strict TypeScript, 116 unit/integration tests and Next.js production build passed.
- Application domain tests cover exhaustive transition maps, readiness, explicit submission evidence, decision ordering, scholarship independence, metrics and date precision.
- Development rollback SQL reached 28 pgTAP assertions: RLS/grants, A/B isolation, multiple manual checklist items, readiness blocking, valid/invalid transitions, idempotent replay, user-reported provenance, separate scholarship lifecycle and append-only history. The transaction left zero fixtures.
- Development migrations `20261026164251`, `20261026164434` and `20261026164713` applied successfully; generated TypeScript types were refreshed from that schema. Five application tables remain empty.
- Supabase’s unindexed-foreign-key advice was resolved for Phase 17/18. The four older deny-by-default INFO notices remain. Six new SECURITY DEFINER warnings are reviewed authenticated command RPCs; see `APPLICATION_AUDIT_TRAIL.md`.
- Full desktop/mobile Chromium regression passed 68 tests with eight configured-Auth cases skipped. Application API boundaries passed unsafe-origin, invalid payload/state and malformed-ID cases in both projects. The application anonymous-redirect cases were among the skips because this checkout has no Supabase runtime environment. The system Chromium path was used explicitly.
- GitHub Actions run `40391982239` passed frontend checks, audit and Chromium plus two clean database resets/replays, every pgTAP suite, advisors, generated-type drift and final typecheck.
- Exact commit `cdc5a7e` reached READY on Vercel. Health/home/login/search returned 200; anonymous Roadmap and Applications rendered sign-in.

## Blocked or incomplete evidence

- Local clean-room migration replay could not start: Docker exhausted its internal layer store while registering the pinned Supabase PostgreSQL image. Two clean CI replays now pass; local parity remains unavailable on this runner.
- Development has zero published/verified programs and scholarships. The workspace therefore cannot render a real populated application portfolio without fabricating editorial approval.
- No hosted two-account browser journey, authenticated responsive screenshots or populated axe run was possible. Cross-user isolation is proven at SQL/RLS level only.
- Phase 17’s reviewed-catalog, generation-authority and hosted Auth gates remain open; Phase 18 does not silently close them.

**Status: PARTIAL.** Implementation and database evidence are real; product acceptance remains blocked by reviewed catalog data and hosted authenticated verification.
