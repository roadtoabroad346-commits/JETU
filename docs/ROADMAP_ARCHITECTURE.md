# Phase 17 roadmap architecture

Status: PARTIAL. Original migrations are on Jetuu development; the 2026-10-27 authority/regeneration repair is local only. See PHASE_17_COMPLETION_REVIEW.md and PHASE_17_DEPLOYMENT_PLAN.md.

`/en|ru|kk/plan` reads a private owner-scoped roadmap. `POST /api/roadmaps` validates a bounded request, authenticates with `getUser`, loads saved published targets, profile and matching evidence, then runs the deterministic generator. The `roadmap_apply_generation` PostgreSQL function updates one cycle atomically under a row lock. Stable generation keys preserve completed status, notes, priority overrides, custom dates and manual tasks. Previous generated tasks become obsolete rather than deleted. A run records an input hash and generation version.

The schema separates roadmaps, targets, milestones, tasks, dependencies, runs and task events. Composite `(id, roadmap_id, user_id)` foreign keys keep nested resources under the same owner. RLS and explicit grants cover every exposed table. The hardening migration validates current target publication and checks claimed official deadlines against verified source evidence. This is development-only deployment; no student data was reset.

Deadline precision is `instant`, `date_only`, `rolling` or `unknown`. Existing precise rows remain instants. Date-only cutoffs retain the date without an invented time. Planning buffers are separate `recommended_due_date` fields, and a student override is separate `target_date`. The engine subtracts calendar days in the official timezone before proposing an internal date.

The local authority migration makes the exposed generation wrapper service-role-only;
its definer implementation calls the private generator without granting private-schema
usage. The server revalidates Auth identity, loads evidence through the user client,
and passes only its generated output to the isolated admin writer. Browser roles
cannot write generated text, facts, edges, milestones, targets or generation history.
Owner status/notes/dates/priority remain editable under RLS and version guards.

Regeneration replaces generated edges before reconciling tasks, obsoletes only removed
keys, and rolls back a new graph that would invalidate completed prerequisites.
The generated RPC types include the explicit owner argument; full CLI type drift is
still a required exact-commit CI gate.

Current limitations: zero reviewed published targets; hosted Auth/two-device and
populated UI acceptance remain unverified. Country/system-specific templates,
grade/capacity pacing and explicit program essay/reference/fee task extraction are
not proven by the current implementation. The security fix is not deployed; cloud
reads still confirm authenticated access to the old generation RPC. Do not mark the
phase feature-complete or production-ready. See the current completion review for
measured local evidence and the exact remaining gates.
