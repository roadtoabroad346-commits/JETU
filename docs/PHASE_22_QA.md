# Phase 22 verification checkpoint — 2026-11-06

## Continuation: direct RPC and Studio isolation

Recovered actual head `b1efd61`, draft PR #12 and successful
[CI 42186393340](https://github.com/roadtoabroad346-commits/JETU/actions/runs/42186393340).
All three jobs passed on that source; its full-stack job logged **38 actual
Auth/REST/Storage/browser checks**, including the three owner-preview checks.
The corresponding Vercel deployment `dpl_H4oauiSJ18QsbCfRj1i7NA6juYPY` is READY.
Connected protected fetch confirmed the public directory route returns 200 and
the unconfigured private API returns 503 `PROVIDER_NOT_CONFIGURED`, with no-store.

Additional review reproduced null-sensitive SQL validation defects: direct RPC
could omit a CAS revision or provide null rubric scores/anchor fields, bypassing
the web API's Zod validation. Seven focused SQL regression assertions exposed
these paths; the pre-fix run had 11 failures including their downstream effects.
Forward migration `20261106111915_phase_22_rpc_integrity.sql` enforces numeric
integer CAS, affirmative human attestation, complete integer rubrics, bounded
actions and structurally valid Unicode anchors before any mutation. Application
version consent and uncertain-retry receipts retain their previous behavior.

Studio's feedback endpoint now excludes comments attached to another draft in
the same request. Component state is keyed by draft identity, so a slow or failed
request cannot display another draft's cached feedback. Added an API regression
and a browser switch/loading/failure/recovery regression. No public UI layout,
schema types, dependencies or prior-phase status was changed.

Current local proof: `npm run check` passed **164 tests** and production build;
native PostgreSQL 17.11 replayed **50 migrations**, with **281 assertions in eight
pgTAP suites** passing after the patch. This native SQL harness uses upstream
Auth/Storage base DDL plus compatibility columns; it is not a running GoTrue or
Storage HTTP service. The existing disposable full-stack CI job additionally
tests five new direct REST rejection paths. Final-source browser/CI/deployment
results are maintained in the PR and current handoff. Release remains PARTIAL:
the isolated hosted staging and human/operational gates below still apply.

## Earlier implementation evidence

**PARTIAL — no production promotion.** Baseline and previous-phase blocker matrix:
`PHASE_22_PRECHECK.md`. Security, verification and workflow contract:
`MENTOR_SECURITY_MODEL.md`. Five additive Phase 22 migrations begin with
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
- Native PostgreSQL 17.11 clean replay: **49 migrations**, **eight pgTAP suites /
  274 assertions**. The 178 new mentor assertions cover two students, two verified
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
  **27 passed**, including **13 mentor** scenarios. Synthetic API fixtures cover
  request consent/retry/revocation, private draft recovery, weekly rules, moderator
  controls, clearance denial, truthful empty state, RU/KK/EN at 320/768/1440, keyboard,
  reduced motion and axe, owner-only pre-consent preview and labelled booking timezones. No real Auth is inferred from component mocks.
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
2. Exact final-head CI and preview outcomes are maintained in draft PR #12. Commit
   `aef372f` / CI [42182652354](https://github.com/roadtoabroad346-commits/JETU/actions/runs/42182652354)
   passed all three jobs, including **35 real Auth/Storage/browser checks**, both
   GoTrue account-deletion regressions and provider-specific SQL/type drift checks.
   The final follow-up adds three actual owner-preview checks and must pass its own
   complete CI. Automated fixtures remain synthetic identities in disposable local
   Supabase; they do not establish hosted staging or human verification.
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

The third forward migration `20261106071826_phase_22_account_lifecycle.sql` fixes
account deletion without deleting another student's feedback. Historical pseudonymous
author/reviewer IDs are separate from current Auth membership. Auth deletion revokes
access, redacts mentor bio/claims, cancels availability/bookings and expires evidence;
old JWTs cannot reapply or retrieve materials. Twenty-six dedicated SQL assertions
cover deletion of staff, mentor and student, preserved authorship and prior Writing
cascades. A null resource operation is explicitly denied. No real identity was erased.

## Exact-source release evidence

Branch: `codex/phase22-mentor-network`. Draft PR:
https://github.com/roadtoabroad346-commits/JETU/pull/12 . The PR body and per-head
checks hold the exact final commit, CI run/job links, passed test counts and preview
URL so these do not become circular commit metadata. Local final source check passed
163 tests/build; production Chromium passed 96 with four inherited configured-Auth
skips; all 27 component journeys passed. No hosted migration or production promotion.
The selected Vercel project is `jetu` / Impact hub. Its preview environment has no
Supabase configuration, so hosted private APIs must truthfully fail closed. Actual
Auth/Storage acceptance is against disposable local Supabase in CI, not hosted staging.

The fourth forward migration `20261106073751_phase_22_report_erasure.sql` aligns the
reporter's Auth FK with request-owned erasure. A populated report/comment/Vault
fixture reproduced the SDK deletion failure as `mentor_reports_reporter_id_fkey`;
the direct FK now cascades and the regression passes. The final CI script requires
actual mentor AND student GoTrue deletion, while preserving the other student's
feedback. Diagnostic-only logging has been removed after identifying the mechanism.

The fifth forward migration `20261106075326_phase_22_application_consent_version.sql`
requires the student-selected numeric application version before capturing a
readiness snapshot. A changed application fails with a conflict; an uncertain retry
retains its original immutable receipt. Owner-only pre-consent previews show exact
writing checkpoints, clean Vault bytes or minimal application fields without grants.
Bookings keep participant-only start/end/timezone data after slots leave discovery;
display uses the labelled timezone. Staff receive only role-limited operational
counts. Added SQL assertions cover version mismatch and booking/stat isolation.
