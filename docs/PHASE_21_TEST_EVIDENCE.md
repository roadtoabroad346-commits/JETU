# Phase 21 evidence — in progress, 2026-11-05

Status: PARTIAL. Feature branch `codex/phase21-writing-studio`, base `5c30fe0`.

- `npm run check` passed formatting/lint/strict types/141 unit-integration/build at
  the first integration checkpoint. Final changed-tree gate still required.
- Seven new component browser scenarios passed using mocked API responses, including
  acknowledged autosave/reload, retry UUID, conflict fork, checkpoints/diff/restore,
  stale anchored comments, CV/TXT, ephemeral text interview, XSS text rendering,
  RU/KK/EN at 320/768/1440, reduced motion and axe. This is UI evidence, not Auth/RLS.
- Disposable PostgreSQL 16.2 replayed all 44 migrations with synthetic provider
  Auth/Storage schemas. Five pgTAP suites passed 93 assertions (27 new Writing
  assertions). Test identities roll back; no real student content was accessed.
- Database types generated from that actual database using pinned CLI 2.121.0.
  Diff is additive: 164 lines for new fields/tables/function.
- Production dependency audit: zero vulnerabilities.
- Supabase Docker database startup did not complete after repeated image pull
  failures/retries; stopped that attempt. Native local PostgreSQL is explicitly
  a fallback and does not prove local GoTrue, REST, Storage or hosted login.

Remaining: final check/browser run after fixes; exact CI migration/types checks;
real two-account authenticated browser acceptance; live AI provider; official
current-cycle prompt curation; isolated staging schema/preview verification.
Production-connected Jetuu was inspected read-only and not migrated.
