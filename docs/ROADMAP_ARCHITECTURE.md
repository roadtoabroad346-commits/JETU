# Phase 17 roadmap architecture

Status: PARTIAL. Authority migration `20261028123545` is applied to development;
Preview server secret is configured. CI `40689442104` passed clean replay, types
and the disposable real Auth/Storage/browser runner. Historical dated reviews do
not override this checkpoint.

The overview derives weekly workload from saved active tasks and availability,
starting at the student's current date in the saved timezone. Required preparation
inherits downstream urgency. Completed work consumes no capacity; long tasks split
across weeks. A finite 104-week horizon reports unresolved work. Internal/personal
date risk is distinct from official cutoff risk. Conditional post-decision steps
wait until started or dated. This derived estimate introduces no second schedule
store and does not rewrite official deadlines or student overrides.

`/en|ru|kk/plan` reads a private owner-scoped roadmap. `POST /api/roadmaps` validates a bounded request, authenticates with `getUser`, loads saved published targets, profile and matching evidence, then runs the deterministic generator. The `roadmap_apply_generation` PostgreSQL function updates one cycle atomically under a row lock. Stable generation keys preserve completed status, notes, priority overrides, custom dates and manual tasks. Previous generated tasks become obsolete rather than deleted. A run records an input hash and generation version.

The schema separates roadmaps, targets, milestones, tasks, dependencies, runs and task events. Composite `(id, roadmap_id, user_id)` foreign keys keep nested resources under the same owner. RLS and explicit grants cover every exposed table. The hardening migration validates current target publication and checks claimed official deadlines against verified source evidence. This is development-only deployment; no student data was reset.

Deadline precision is `instant`, `date_only`, `rolling` or `unknown`. Existing precise rows remain instants. Date-only cutoffs retain the date without an invented time. Planning buffers are separate `recommended_due_date` fields, and a student override is separate `target_date`. The engine subtracts calendar days in the official timezone before proposing an internal date.

The authority migration makes the exposed generation wrapper service-role-only;
its definer implementation calls the private generator without granting private-schema
usage. The server revalidates Auth identity, loads evidence through the user client,
and passes only its generated output to the isolated admin writer. Browser roles
cannot write generated text, facts, edges, milestones, targets or generation history.
Owner status/notes/dates/priority remain editable under RLS and version guards.

Regeneration replaces generated edges before reconciling tasks, obsoletes only removed
keys, and rolls back a new graph that would invalidate completed prerequisites.
The generated RPC types include the explicit owner argument; CLI type drift passed
in recovery CI on `5cde7ba`.

Current limitations: zero reviewed published targets; hosted Auth/two-device and
populated UI acceptance remain unverified. Country/system-specific templates,
grade-specific pacing and explicit program essay/reference/fee task extraction are
not proven by the current implementation. Weekly capacity estimates are now
implemented; hosted acceptance remains open. Do not mark the
phase feature-complete or production-ready. See the current completion review for
measured local evidence and the exact remaining gates.
