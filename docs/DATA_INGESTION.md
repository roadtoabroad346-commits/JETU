# Official-source data ingestion status — Phase 16.5

Current implementation is a **manual, idempotent staging sample**, not an automated ingest service. `scripts/phase16-stage-official-sample.sql` inserts one University of Toronto institution, Computer Science program, Pearson scholarship cycle, four benefit components and short source claims into the authorized Jetuu development project. It uses stable natural keys and `ON CONFLICT DO NOTHING`; it ran twice without duplicating records. All catalog entities remain `draft`/`needs_review` and are excluded from public search and matching.

The two source URLs, supported claims and unresolved Pearson date conflict are recorded in `DATA_VERIFICATION.md`. The script does not import unsupported tuition, test scores, international prerequisites or deadlines. It does not fetch pages, bypass access controls, infer a reviewer ID, or publish. The existing schema has `official_sources`, `source_claims`, catalog publication and verification states, `verification_runs`, and editor functions; no new migration was necessary for this staging pass.

## Required pipeline before broader imports

1. Register an official URL and its usage/robots constraints; prefer an API or public feed where available.
2. Fetch with a documented rate limit, capture UTC retrieval time, source version/hash and academic cycle.
3. Parse only factual fields with short claim excerpts; preserve the original value beside any normalized value.
4. Validate IDs, currency/period, date/time zone and eligibility qualifiers. Reject ambiguous cycles and missing evidence.
5. Resolve institution/program/scholarship natural keys and detect changed claims without overwriting reviewed history.
6. Stage draft records and evidence links; surface conflicts in an editorial queue.
7. Have a real authorized editor review each material claim, record the reviewer/time and resolve conflicts, then publish through the existing guarded workflow.
8. Monitor source freshness and retire stale claims; re-run the same import safely.

The current script implements only the manual source selection, normalization, deduplication and staging subset. Automated fetch, conflict diff, scheduled freshness monitoring, complete editor UI and publication verification remain open. No production data import was performed in this continuation.

## Phase 17 adapter boundary — 2026-10-26

`src/features/ingestion/official-source.ts` now implements the reusable policy and change-detection core described above: ISO jurisdiction and education-system metadata, exact-host allowlists, 1–60 requests/minute and 1–4 concurrent request bounds, dated robots/terms review gating, bounded retry/backoff, HTTPS/evidence/cycle validation, SHA-256 claim fingerprints and `new | unchanged | needs_review` dispositions. Unit tests cover the deny and retry paths.

This is architecture for multiple countries and systems, not evidence that those sites were crawled. No fetch worker, scheduler or source-specific parser was deployed; no robots/terms review was invented. See `OFFICIAL_SOURCE_PIPELINE.md`. The University of Toronto/Pearson sample remains the only staged set and remains unpublished.
