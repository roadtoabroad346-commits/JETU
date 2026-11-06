# Phase 22 execution and acceptance

Scope: Verified Mentor Network and Review Workflow. Stop before Phase 23.

Continuation acceptance: reject malformed direct Data API commands at the DB
boundary; keep Studio comments scoped to the selected draft; never display a
previous draft's human feedback while another draft loads or fails. Add focused
SQL/API/browser proof, rerun release gates and update the existing draft PR.

- [x] Recover authoritative branch, exact master criteria, previous release evidence.
- [x] Add private onboarding/evidence, explicit human reviewer membership, audited decisions and safe public projection.
- [x] Add service catalog, verified mentor discovery, availability and honest empty/error states.
- [x] Add idempotent requests, exact version grants, expiry/revocation and bounded service conversations.
- [x] Add anchored human comments, rubrics, student dispositions, application readiness and summaries.
- [x] Add internal booking, capacity/concurrency guards, reports/block and moderation.
- [x] Connect localized student/mentor/admin screens, Writing Studio and safety controls.
- [x] Run negative SQL/RLS, unit, browser/axe/mobile, full regression and generated types.
- [x] Commit/push, draft PR, exact-source CI and preview checks; record unresolved gates.

Security invariants: identity comes from Auth; no client role grants; no self approval;
each read checks active verified identity, active request, exact version and operation,
expiry and blocks. Owner-only writing policies remain unchanged. File access uses
fresh authenticated proxy checks, never mentor signed URLs. Cancel/revoke/block/
suspend stop future access. Students retain feedback/history and control revisions.
Minors/unknown age cannot create requests until an operator-reviewed safeguarding
approval exists; self-declared age cannot authorize contact. No paid checkout, real
mentor seed, synthetic credentials, external calendar or notification service.

Release remains PARTIAL until real human verification, selected isolated staging,
hosted staging acceptance and complete operational evidence exist. Disposable local
Supabase CI already proves actual authenticated multi-identity tests; see the QA log.
