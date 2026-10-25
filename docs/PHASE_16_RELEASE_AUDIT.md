# Phase 16.5 release audit — 2026-10-25

Status: **PARTIAL**. Phase 17 is untouched. The strict Phase 16 release gate is
blocked by zero human-reviewed published program/scholarship records and no
authenticated two-user E2E run. The staged sample cannot appear in public search
or matching until reviewed and published.

| Severity        | Defect / root cause                                                               | Reproduction and impact                                                                                   | Repair / regression evidence                                                                  | Status                          |
| --------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| High            | Malformed `deadlineAt` parsed to `NaN`, then compared as if the deadline was open | Pass a verified source and `invalid-date` into `evaluate`; a mandatory deadline could be `MET`            | Require finite parsed date; unit regression                                                   | Fixed locally                   |
| Medium          | First duplicate test score won regardless of conflicting second score             | Supply verified IELTS 8 and 5; order could affect eligibility                                             | Duplicates yield `UNKNOWN`; unit regression                                                   | Fixed locally                   |
| Medium          | Duplicate candidate IDs could produce repeated results                            | Pass the same candidate twice to `recommend`                                                              | Deduplicate by type and ID; unit regression                                                   | Fixed locally                   |
| Release blocker | Catalog lacks reviewed data                                                       | Cloud counts were zero before staging; still zero published after staging                                 | Official-source queue and idempotent draft staging                                            | Human editorial review required |
| Release blocker | Authenticated journey and cross-user isolation not exercised in browser           | Browser suite skips the configured-Auth routes; no isolated test credentials or reachable Auth/REST setup | Run two dedicated test identities against an authorized full stack after reviewer publication | Open                            |

## Verified checks

- GitHub `main` and local HEAD were `6b0657c` at preflight. Authorized remote:
  `roadtoabroad346-commits/JETU`.
- Jetuu development Supabase ID: `edpuovkgoisyzpguksdi`; 23 migration versions
  matched the Phase 16 history through `20261025083044`. No migration was added.
- Staging SQL ran twice without duplicates. Counts: 1 institution, 1 program,
  1 scholarship, 4 benefit claims, 0 published catalog entities of these types.
- All public tables reported RLS enabled. Security advisor reported four INFO
  no-policy, private audit/editorial tables, with no elevated finding; performance
  advisor reported unused indexes on this largely empty database. Do not remove
  indexes based on empty-catalog usage statistics.
- `npm run check`: format, lint, TypeScript, 80 unit/integration tests and
  production build passed. `npm audit --omit=dev --audit-level=high`: zero
  vulnerabilities. Browser result and remote delivery are recorded in the
  implementation log once complete.
- Vercel `jetu-phase13-preview` project ID
  `prj_ym5uK7EQumiSASSFdO4sSQMM1UxD` held a READY production-target Git
  deployment of preflight commit `6b0657c`; the separate `jetu` project had no
  deployment. The default alias is not a custom JETU production domain.
- Git branch `codex/phase16-5-hardening` was pushed as `fa0cace` and opened as
  draft PR #2. Vercel built that commit to READY preview deployment
  `dpl_jwH1EKwRzXYS3ur9qRBUwGAdsDUr` at
  `https://jetu-phase13-preview-pinnw2uyw-impact-hub.vercel.app`.
  Protected preview fetches returned health 200, homepage 200, search 200,
  anonymous matching sign-in, and public universities API `{"data":[]}`.
  The staged Pearson record was absent from public pages as intended.

No new UI motion or redesign is claimed. Existing desktop/mobile accessibility
regressions were rerun; visual inspection of new live catalog cards cannot happen
while reviewed rows are unpublished.

## PR #2 continuation

The first remote CI database job passed 66 pgTAP assertions after migration
replay but failed because it discovered the manual Phase 15 benchmark as a test
file without a TAP plan. The rollback-only benchmark was moved to
`supabase/benchmarks/` to keep it runnable by an operator while excluding it from
automatic pgTAP discovery. The clean two-replay remote gate must be rerun.
The following run completed both clean replays, 66 assertions per replay and
advisors, then caught drift in the checked-in generated database types. The
exact CI-generated artifact was recovered and checked locally; final remote
drift verification remains pending.

The matching POST Origin check now rejects a different scheme as well as a
different host. A malformed result deadline renders unknown instead of throwing.
Mobile public navigation has a right-edge scroll cue and keyboard focus reaches its
last link. Program/search/matching cards share subtle hover feedback using the
existing timing token; reduced-motion users get no transform. The first full
browser run exposed two regressions in the initial origin/mobile approach; both
were corrected and 20 affected cases passed with two configured-Auth skips.
No new migration or publication occurred. See `DESIGN_AUDIT.md` and
`PRODUCT_QA_REPORT.md`; the release state remains **PARTIAL**.
Final full local Chromium suite: 64 passed, four Auth-dependent skipped.
Production dependency audit: zero vulnerabilities. Local six-page/viewport lab
sample: LCP 56–856 ms, CLS 0, no horizontal overflow; no field or populated
catalog performance result is claimed.
