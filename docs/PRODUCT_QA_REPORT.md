# Phase 16.5 QA report — 2026-10-25

Status: **PARTIAL**. The code checks and public browser tests exercise the implemented UI, but no authenticated two-user journey or populated reviewed catalog is available in this execution environment.

## Current evidence

| Area                     | Result                                                                                                                                                           | Limit                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run check`          | Format, ESLint, strict TypeScript, 81 unit/integration tests and production build passed after code changes.                                                     | Local checkout only.                                                              |
| Chromium full regression | 64 passed, 4 Auth-dependent skipped after origin/mobile corrections.                                                                                             | No live signed-in session or populated recommendation.                            |
| Public accessibility     | Existing desktop/mobile axe and keyboard checks passed in the focused run; 320 px catalog navigation focus reached the final link.                               | No authenticated or populated-card axe pass.                                      |
| Matching correctness     | Existing edge cases plus malformed deadline display test passed; cross-scheme Origin rejected with 403 in a real HTTP test.                                      | Eligibility with live student and published program data unverified.              |
| Supabase development     | Project `edpuovkgoisyzpguksdi` ACTIVE_HEALTHY; 23 migration versions through `20261025083044`; 77/77 public tables have RLS enabled.                             | RLS presence does not prove owner isolation. No schema changes in this pass.      |
| Supabase advisors        | Security: four INFO no-policy notices on intentionally private editorial/audit tables; no WARN/ERROR. Performance: unused-index INFO on sparse development data. | No meaningful real-corpus latency measurement.                                    |
| Data coverage            | One draft/needs_review institution, one program and one scholarship; zero published of these types.                                                              | No editor has completed review.                                                   |
| Dependency audit         | `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.                                                                                                 | Production dependencies only.                                                     |
| Performance              | Local production Chromium sample at 375/1440 px on `/en`, `/en/search`, `/en/universities`: LCP 56–856 ms, CLS 0, body overflow 0 px; TTFB 11–478 ms.            | One lab navigation per route/width; no field data, INP or populated-query timing. |

## Release blockers

The first remote database CI job replayed migrations and passed 66 assertions
across four pgTAP files, then failed because the runner also treated the manual
Phase 15 benchmark as a pgTAP file with no plan. The benchmark has been moved to
`supabase/benchmarks/` so the normal `test:db` discovery includes only TAP
tests. The next run passed two clean replays and 66 assertions per replay, then
failed on generated database type drift. The exact generated artifact from that
run was committed unchanged after local format, type, unit and build checks. A
final GitHub Actions run `40205477945` passed both the database and frontend
jobs, including two clean migration replays, 66 pgTAP assertions per replay,
advisors, the generated-type drift guard, typecheck and Chromium E2E.

1. A human editor must review official evidence and resolve the conflicting Pearson timeline before approving any deadline or publication. The staged `scholarship_program_links` relation also needs program-specific review.
2. Use two isolated non-production accounts against reachable hosted Auth/REST. Exercise profile update, matching, save/revisit, cross-user denial, invalid session, logout and anonymous redirect. Existing SQL owner checks are narrower evidence.
3. After editorial publication, inspect populated desktop/mobile result and detail pages with axe and screenshots; the empty catalog cannot provide this evidence.
4. Keep production promotion gated until the remaining editorial, Auth and populated-page checks pass.
