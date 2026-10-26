# Phase 17–18 release report — 2026-10-26

Phase 17 Roadmap was recovered from `codex/phase17-roadmap`, reviewed and retained as PARTIAL. Phase 18 adds a localized application CRM with list/board views, per-application workspace, persisted readiness checklist, guarded program and scholarship state machines, explicit external-submission confirmation, notes/reference/priority, source/deadline context and immutable history. The narrow Roadmap integration reuses a matching generated submission task and preserves its dependency guard.

The authorized Jetuu development project is synchronized through migration `20261026164713`. No production database or production deployment was changed. No synthetic catalog or application rows persist. Official-source work added a jurisdiction-neutral adapter/rate-limit/fingerprint/review contract; automated collection and publication remain disabled pending source-policy review and human editorial approval.

Local quality gates pass and cloud rollback SQL passes. A draft GitHub pull request and commit-matched Vercel preview are required before this branch can be reviewed. Neither phase may be labeled VERIFIED until a small reviewed catalog exists and two real accounts complete the hosted, cross-device, responsive and accessibility journey described in `PHASE_17_QA.md` and `PHASE_18_QA.md`.
