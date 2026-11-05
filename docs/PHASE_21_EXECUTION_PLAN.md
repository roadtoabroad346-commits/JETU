# Phase 21 execution — 2026-11-05

Owner: Codex. Scope: Phase 21 only; Phase 22/24 remain separate.

- [x] Recover main 5c30fe0 and inspect open upstream PRs #2–8.
- [x] Identify existing Phase 19 writing tables/RPCs in all 43 recovered migrations.
- [x] Extend existing draft authority with bounded autosave, checkpoint versions, idempotency and prompt provenance.
- [x] Implement localized Studio, deterministic anchored feedback, CV/activities and private text interview.
- [x] Integrate real draft continuation with dashboard; preserve current account/profile UI.
- [x] Verify units, API failures, SQL isolation, browser autosave/conflict/recovery, accessibility and build.
- [x] Commit, feature-branch PR/CI, generated types, preview and honest handoff.

Evidence: main is current; later application code lives in draft PR #7 (1114700).
Import only needed writing contracts, not unrelated roadmap/admin/vault UI. Existing
application rows are owner-scoped associations; no fake targets or official prompts.
Phase 20 schema exists but no gateway source on available branches and no AI credentials.
Live AI remains disabled until an actual configured server adapter is verified.
No schema change to the existing production-connected Jetuu project is authorized
by an isolated staging identity; local replay/CI are the migration verification target.
UI/UX Pro Max cloud instructions and canonical JETU design contract read. Search
script is not installed in workspace; use documented accessibility/design defaults.
Supabase changelog HTTP CONNECT 403; current RLS/functions docs consulted via MCP.

Checkpoint: 142 unit/integration; 88 production browser cases (four inherited
Auth skips); 14 component UI cases; 96 SQL assertions in two CI Supabase replays.
Fixed-source CI is green; draft PR #11 and READY preview exist. See the test evidence
for exact commits/runs/URLs and the independent hosted/AI/staging release blockers.
