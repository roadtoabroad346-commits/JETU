# Phase 17 completion review — 2026-10-27

**Release status: PARTIAL. Local repairs prepared; no external changes executed.**

## Source and branch

GitHub connected as `roadtoabroad346-commits`. Repository:
https://github.com/roadtoabroad346-commits/JETU . Local branch
`codex/phase17-completion` starts at `3118aea27bdf20083693c057edadff46119aa801`,
the head of draft PR #5. This preserves the complete draft stack, rather than
reverting Phases 18–19 to repair Phase 17. Open PRs: #2 hardening → #3 Roadmap →
#4 Applications → #5 Vault. No independent issue beyond these PRs was returned
by the all-state issue listing. The existing #3/#4/#5 discussions contain Vercel bot deployment evidence,
not human acceptance. No PR was posted, edited or merged in this session.

## Confirmed mechanisms and repairs

1. `roadmap_apply_generation` accepted generated text from authenticated callers.
   Direct table writes also allowed text/origin/dependency tampering. The additive
   `20261027102016_phase_17_generation_authority` migration moves the old generator
   into the private schema and introduces a service-only public wrapper with an
   explicit owner. The server revalidates `getUser()` before privileged generation;
   catalog/profile reads continue through the user's RLS client. The wrapper has
   a fixed empty search path, checks the actual SQL role, checks owner existence,
   sets owner context transactionally, and restores it. Its definer privilege is
   intentionally restricted to service_role; no browser role or private-schema
   usage grant is introduced. No user metadata authorizes generation.
2. Direct generated task insert/delete, generated fact edits, origin laundering,
   generated dependency changes, target/milestone edits and fabricated generation
   runs are denied. Owner status, note, target-date and priority overrides still
   pass through RLS/version/dependency checks. Application command RPCs retain
   their existing transactional submission-task integration.
3. Regeneration of completed graphs failed when intermediate obsoletion made old
   prerequisites appear incomplete. Generated edges are now replaced atomically
   before task reconciliation, and only removed keys become obsolete. Completed
   retained work and manual work survive. If changed prerequisites would leave a
   completed task invalid, the entire generation rolls back; reopen completed
   dependents first. Such failures return the existing sanitized HTTP 409 contract.

`SUPABASE_SECRET_KEY` is now required on the server for generation; it is already
an existing supported environment variable. Missing configuration fails closed.
The public RPC argument addition in generated types was derived programmatically
from the replayed PostgreSQL `pg_proc` definition. Full Supabase-generated type
parity remains a required CI gate; it was not falsely claimed here.

## Evidence and limits

| Gate                               | Observed result                                                                                                                                                | Meaning                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh npm ci                       | Passed                                                                                                                                                         | Lockfile retained, no added app dependencies                                                                                          |
| npm run check                      | Passed: format/lint/strict types, 168 unit/integration tests, production build                                                                                 | Current local application verification                                                                                                |
| npm audit --audit-level=high       | Zero vulnerabilities                                                                                                                                           | Current dependency audit                                                                                                              |
| All migrations + nine SQL suites   | 220 pgTAP assertions pass in PGlite 0.5.12 with pgTAP 1.3.2 SQL                                                                                                | Real embedded PostgreSQL/PLpgSQL; synthetic Auth/Storage schemas, not Supabase service parity                                         |
| New mocked provider boundary tests | Five pass                                                                                                                                                      | Missing/mismatched identity rejected, trusted writer selected, failed writes not reported successful                                  |
| Focused production Playwright      | Two API cases pass; two page cases blocked at browser launch                                                                                                   | Chromium absent; download returned an invalid/truncated ZIP. No populated visual/axe proof                                            |
| Local Supabase                     | Blocked: Docker unavailable                                                                                                                                    | No current full Auth/Storage/two-browser execution                                                                                    |
| Expanded Auth/browser runner       | Seven roadmap checks added; not executed here                                                                                                                  | Requires disposable Supabase with modern SECRET_KEY and browser; target-free profile plan only                                        |
| Inherited GitHub CI                | Run 40464197717 passed on 3118aea                                                                                                                              | Historical baseline only; no CI run for this local branch                                                                             |
| Current Supabase read-only check   | Jetuu ACTIVE_HEALTHY; 33 migrations through 20261027055906; zero reviewed/published program or scholarship targets; old authenticated generation still enabled | Confirms remaining editorial gate and unapplied security migration                                                                    |
| Current Supabase security advisor  | Four INFO private no-policy tables; 18 WARN authenticated command-definer endpoints                                                                            | Inherited intentional command boundary warnings; not evidence of a clean new-migration advisor run                                    |
| Current Vercel read-only check     | dpl_Dj4wqY6C9y7DUkZ9no3Z2jc6GKQR READY, exact inherited SHA 3118aea                                                                                            | Preview build metadata only; no new deployment, HTTP smoke or authenticated acceptance; second linked jetu project also reports READY |

Reproduction of the embedded fallback is in
`docs/evidence/phase17/embedded-replay.mjs`. It intentionally scaffolds provider
schemas and grants test-helper permissions; it must never be used to modify a
hosted database. Install `@electric-sql/pglite@0.5.12` in a disposable prefix and
extract pgTAP SQL 1.3.2 from `postgresql-16-pgtap` 1.3.2-2. Set
`JETU_PGLITE_MODULE_ROOT` to the absolute package directory and `JETU_PGTAP_SQL`
to its extracted `pgtap--1.3.2.sql`, then run the script from the repository.

## Exact acceptance still open

- Human editorial review/publishing of genuine programs, deadlines and requirements.
  No student identity or synthetic catalog record was published to clear a gate.
- Hosted login → reviewed saved target → generation → mandatory documents → final
  milestone; two independent users and two devices; override/manual-task retention.
- Populated RU/KK/EN Kanban, timeline, calendar and checklist keyboard/mobile/axe
  evidence. Existing views are implemented; no current populated browser proof.
- Master-prompt country/system templates are currently generic target templates;
  grade-specific pacing and weekly-capacity scheduling are not proven. Explicit
  program-level essay/reference/fee/translation/extracurricular task extraction is
  not established by current schema/engine evidence. Scholarship document tasks
  and verified exam-gap tasks exist. These are scope gaps, not editorial proof.
  Do not call Phase 17 feature-complete merely because generation is hardened.
- Exact new-commit full Supabase replay, generated-type drift, advisors, real local
  Auth/browser runner and hosted preview acceptance.

No whole earlier phase is relabeled VERIFIED. Historical Phase 05 remains
VERIFIED; its current cross-browser regression was not rerun. Phases 01–03/10
remain UNVERIFIED; Phase 07/11 remain BACKLOG; Phase 08/09 remain implemented but
not verified; 04/06/12–19 retain their existing PARTIAL status. See the tracker and
`PREVIOUS_PHASE_CLOSURE_19.md` for independent gates. Phase 19 scanner, purge,
backup/restore, recommender and mentor-consent gates remain outside this repair.
