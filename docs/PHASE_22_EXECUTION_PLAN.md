# Phase 22 execution and acceptance

Scope: Verified Mentor Network and Review Workflow. Stop before Phase 23.

- [x] Recover authoritative branch, exact master criteria, previous release evidence.
- [ ] Add private onboarding/evidence, explicit human reviewer membership, audited decisions and safe public projection.
- [ ] Add service catalog, verified mentor discovery, availability and honest empty/error states.
- [ ] Add idempotent requests, exact version grants, expiry/revocation and bounded service conversations.
- [ ] Add anchored human comments, rubrics, student dispositions, application readiness and summaries.
- [ ] Add internal booking, capacity/concurrency guards, reports/block and moderation.
- [ ] Connect localized student/mentor/admin screens, Writing Studio and safety controls.
- [ ] Run negative SQL/RLS, unit, browser/axe/mobile, full regression and generated types.
- [ ] Commit/push, draft PR, exact-source CI and preview checks; record unresolved gates.

Security invariants: identity comes from Auth; no client role grants; no self approval;
each read checks active verified identity, active request, exact version and operation,
expiry and blocks. Owner-only writing policies remain unchanged. File access uses
fresh authenticated proxy checks, never mentor signed URLs. Cancel/revoke/block/
suspend stop future access. Students retain feedback/history and control revisions.
Minors/unknown age cannot create requests until an operator-reviewed safeguarding
approval exists; self-declared age cannot authorize contact. No paid checkout, real
mentor seed, synthetic credentials, external calendar or notification service.

Release remains PARTIAL until real human verification, selected isolated staging,
actual authenticated multi-identity tests and complete acceptance evidence exist.
