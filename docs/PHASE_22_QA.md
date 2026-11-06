# Phase 22 verification checkpoint — 2026-11-06

**PARTIAL — no production promotion.** Baseline and previous-phase blocker matrix:
`PHASE_22_PRECHECK.md`. Security, verification and workflow contract:
`MENTOR_SECURITY_MODEL.md`. New migration:
`20261106060524_phase_22_mentor_network.sql`. No hosted migration has been applied.

Implemented: private onboarding/evidence and human-only verification decisions;
verified public projection and localized discovery; free request/service terms;
exact-version consent and authenticated file proxy; student/mentor queues; anchored
comments, threads, student dispositions, rubrics and immutable review summaries;
readiness snapshots and suggestions; internal slots/bookings; safeguarding clearance,
report/block/revoke and staff moderation; protected audit events and Studio feedback.
No real mentor approval, public testimonial, payment or meeting link is fabricated.

Local release evidence for the follow-up implementation:

- `npm run check`: PASS, formatting, ESLint, strict types, **163 unit/integration
  tests** and production build. `git diff --check`: PASS. Added-line secret pattern
  scan passed before publication; no passwords, privileged keys or auth state committed.
- Native PostgreSQL 17.11 clean replay: **46 migrations**, **seven pgTAP suites /
  241 assertions**. The 145 new mentor assertions cover two students, two verified
  fixture mentors, unverified applicant, RLS/Storage policy denial, version/operation
  scope, Unicode anchors, expiry/revoke/suspension, consent/clearance, status CAS,
  private drafts, moderation context/freeze, readiness privacy/provenance, scheduling,
  DST, SLA pauses/follow-up limits and retention authorization.
- Native PostgreSQL is SQL/RLS proof; actual GoTrue/Storage/browser proof is in the
  separate CI evidence below. Full-stack Docker image expansion exceeded workspace
  storage; the task-owned temporary image/container was removed. No hosted data reset.
- Actual DB types generated with pinned CLI 2.121.0's postgres-meta **v0.100.0**
  source against the native replay match the committed file byte-for-byte after
  formatting. Initial CI also passed its own generated-type drift check.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:journey-ui`:
  **25 passed**, including **11 mentor** scenarios. Synthetic API fixtures cover
  request consent/retry/revocation, private draft recovery, weekly rules, moderator
  controls, clearance denial, truthful empty state, RU/KK/EN at 320/768/1440, keyboard,
  reduced motion and axe. No real Auth is inferred from component mocks.
- Production Chromium on initial source: **96 passed / four inherited configured-Auth
  skips**. Final-source production regression and CI results are recorded below.
- `npm audit --omit=dev --audit-level=high`: **zero vulnerabilities**. No dependency
  or lockfile changes. Existing full audit is also enforced by CI.
- Inspected synthetic screenshots: [Kazakh 320px](evidence/phase22/empty-kk-320.png)
  and [fixture directory 1440px](evidence/phase22/directory-en-1440.png). Secondary
  filters collapse behind native details; focus/touch targets and text wrapping
  remain usable. No fictional mentor appears in the actual application seed.

The separate `mentor-auth-storage` CI job starts only a disposable local Supabase
stack, creates real GoTrue sessions and calls REST/Storage/Next with two students,
two approved synthetic mentors, an applicant and separate staff fixtures. Automated
fixture approval is permission testing, never evidence of actual human verification.

Open acceptance gates (explicit, not silently omitted):

1. A selected, isolated authorized staging database and configured preview environment;
   real human staff/mentor evidence review and guardian/school policy operations.
2. Final exact-source CI and preview checks after the follow-up migration. The initial
   commit `41f3f96` passed all three jobs in CI 42176315716, including **25 real
   GoTrue/REST/Storage/Next/browser checks** with two students, two verified mentor
   fixtures, an applicant and distinct staff roles. Newer checks must pass separately.
3. Production evidence purge scheduling, actual Vault malware scanner, Storage restore
   drill, moderation staffing/response times and operational privacy review. The local
   retention worker is executable; no hosted schedule or real identity deletion is claimed.
4. Richer Roadmap task adoption and prior Phase 17–20 screen/provider integrations;
   suggestions currently require the student to act independently. Existing selected
   application schema is used; current account/profile screens are preserved.
5. Production-scale cursor pagination and wider populated cross-device/browser
   operational acceptance. Public discovery/queue reads have explicit finite caps;
   no unlimited marketplace-scale search or queue completeness claim is made.

The follow-up migration `20261106064516_phase_22_availability_retention.sql` adds
weekly availability, blackout exceptions, slot/series cancellation, DST rejection,
SLA pause/resume and bounded follow-ups, case-scoped moderation evidence/freeze and
an evidence retention worker contract. Private request drafts are implemented and
recover without consent. Reinstatement can require a fresh evidence cycle. Review
source URLs must match an explicitly shared application source; arbitrary off-platform
contact links cannot be hidden as references.

## Exact-source release evidence

To be updated after final regression, remote CI, remote SHA and preview checks.
