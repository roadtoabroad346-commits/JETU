# Phase 17–18 execution — 2026-10-26

## Outcome and baseline

Build on draft PR #2 plus `codex/phase17-roadmap`. Phase 17 already has an
owner-scoped schema, deterministic generator, five linked views and development
SQL evidence; it remains PARTIAL until its generation-authority, reviewed-data
and hosted Auth gates close. Phase 18 adds a separate per-program application
aggregate with guarded state transitions, append-only events, readiness
checklists, independent scholarship applications and a narrow Roadmap link.

## Measurable gates

- Database: additive migration replays; every new public table has RLS and
  explicit grants; SQL proves A/B isolation, immutable events, transition guards,
  checklist readiness, idempotency, stale-version conflict and roadmap ownership.
- Domain: exhaustive allowed/forbidden transition tests; external submission
  always requires explicit confirmation and user evidence; acceptance/enrollment
  ordering cannot be skipped.
- Product: RU/KK/EN application list, board and detail workspace; create, notes,
  checklist, guarded progression, submission confirmation, event timeline and
  independent scholarship tracker persist through the real API.
- Integration: application creation links one matching roadmap submission task;
  repeated creation/sync is idempotent; submission completion cannot bypass its
  mandatory roadmap predecessors.
- Quality: targeted tests after each slice, then format/lint/typecheck/unit/build,
  database pgTAP/advisors and Chromium checks. Phase status follows evidence.
- Delivery: sync only the authorized Jetuu development project, push the stacked
  branch, open/update a draft PR and deploy a commit-matched Vercel preview.

## Explicit non-goals

No university portal automation, fee payment, file upload, mentor assignment,
production promotion, fabricated editorial approval or Phase 19 work. Network
policy does not permit broad official-site collection, so the existing staged
University of Toronto/Pearson sample stays `needs_review`; ingestion work is
limited to a safe repeatable adapter/review contract unless official sources are
actually reachable and reviewable.
