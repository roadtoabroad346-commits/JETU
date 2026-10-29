# Phase 17 roadmap architecture

Status: implemented in the branch and applied to Jetuu development; full authenticated release verification remains open.

`/en|ru|kk/plan` reads a private owner-scoped roadmap. `POST /api/roadmaps` validates a bounded request, authenticates with `getUser`, loads saved published targets, profile and matching evidence, then runs the deterministic generator. The `roadmap_apply_generation` PostgreSQL function updates one cycle atomically under a row lock. Stable generation keys preserve completed status, notes, priority overrides, custom dates and manual tasks. Previous generated tasks become obsolete rather than deleted. A run records an input hash and generation version.

The schema separates roadmaps, targets, milestones, tasks, dependencies, runs and task events. Composite `(id, roadmap_id, user_id)` foreign keys keep nested resources under the same owner. RLS and explicit grants cover every exposed table. The hardening migration validates current target publication and checks claimed official deadlines against verified source evidence. This is development-only deployment; no student data was reset.

Deadline precision is `instant`, `date_only`, `rolling` or `unknown`. Existing precise rows remain instants. Date-only cutoffs retain the date without an invented time. Planning buffers are separate `recommended_due_date` fields, and a student override is separate `target_date`. The engine subtracts calendar days in the official timezone before proposing an internal date.

Current limitations: the development catalog has no published program/scholarship, so target-specific generation has not been exercised against reviewed live records. The authenticated RPC still accepts structured generation input; the hardening trigger cross-checks target and deadline evidence, but a hostile authenticated caller could still manipulate explanatory text. This is a release blocker until generation authority is moved to a trusted server operation or the RPC verifies every generated field. Hosted Auth/REST and cross-device persistence are untested.
