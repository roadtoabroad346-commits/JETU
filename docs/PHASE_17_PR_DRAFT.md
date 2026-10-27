# Draft PR: Harden Phase 17 generation and preserve completed roadmap regeneration

Generated Roadmap text and dependencies could be rewritten directly by their
owner, bypassing server generation. Restrict generation to a server-authenticated
owner and a service-only RPC; keep ordinary owner task edits under RLS. Repair
completed-plan regeneration by replacing edges atomically and preserving retained
completion, overrides and manual work. Inconsistent new prerequisites roll back.

Based on draft PR #5; preserves the existing Phase 18/19 stack. This is a bounded
Phase 17 repair, not a claim that all master acceptance criteria are complete.

Validation: local check passes (168 unit/integration tests, format/lint/strict
types/build); zero dependency vulnerabilities; nine embedded PostgreSQL/pgTAP
suites pass 220 assertions with synthetic provider schemas. Two production API
cases pass; two browser page cases cannot launch Chromium. Seven new real local
Auth/browser checks are prepared but unexecuted. Exact-head full Supabase replay,
type drift and runtime CI remain required.

**PARTIAL — keep draft.** No external migration/deployment/push has run. Human
editorial review, zero published targets, hosted/two-device/populated UI evidence,
and remaining country/system/pacing/program-task requirements remain open.
Apply the migration only under the separate synchronization approval described
in docs/PHASE_17_DEPLOYMENT_PLAN.md. Missing server secret or mismatched old schema
fails generation closed. No merge or production promotion is requested.
