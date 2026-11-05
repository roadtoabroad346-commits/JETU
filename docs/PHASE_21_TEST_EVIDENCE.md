# Phase 21 evidence — in progress, 2026-11-05

Status: PARTIAL. Feature branch `codex/phase21-writing-studio`, base `5c30fe0`.

- `npm run check` passed formatting/lint/strict types/142 unit-integration/build at
  the first integration checkpoint. Final changed-tree gate still required.
- Eight new component browser scenarios passed using mocked API responses, including
  acknowledged autosave/reload, retry UUID, conflict fork, checkpoints/diff/restore,
  stale anchored comments, CV/TXT, ephemeral text interview, XSS text rendering,
  RU/KK/EN at 320/768/1440, reduced motion and axe. This is UI evidence, not Auth/RLS.
- Disposable PostgreSQL 16.2 replayed all 44 migrations with synthetic provider
  Auth/Storage schemas. Five pgTAP suites passed 96 assertions (30 new Writing
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

## Preview / synchronization checkpoint

Draft PR #11: https://github.com/roadtoabroad346-commits/JETU/pull/11.
Implementation `06df845e8f47f956e625902e575bf8a5c2f581ec` pushed and remote SHA checked.
Primary preview `dpl_2oU5DX73Mr4YGREh4ckHC2iiKhYc` is READY:
https://jetu-7ztultyx7-impact-hub.vercel.app . Protected MCP smoke: health 200;
English writing resolves to the real sign-in form with private no-store caching;
writing API returns a truthful 503 PROVIDER_NOT_CONFIGURED. The preview lacks its
own configured Supabase integration; this is not a working signed-in Studio release.
Production-connected Jetuu `edpuovkgoisyzpguksdi` remains read-only/unmodified.

Initial exact-head CI run 42055661186 exposed Next internal-host normalization:
a valid local same-origin write was rejected with 403 before authentication. The
server now compares browser-facing Host, exact protocol and port, rejects malformed
Origin paths/credentials, and never trusts forwarded headers. Fourteen targeted
API adapter tests and eight targeted production-browser writing tests pass after
that repair. A fresh whole-tree CI run is required on the fixed commit.

One local E2E attempt was invalidated by concurrent writes to `.next`; it was stopped.
Subsequent production checks run sequentially. No invalidated run is claimed as proof.

PDF evidence opens as one page; `pdftotext` and PyMuPDF recover the Kazakh text.
`local-domain-performance.json` records 12 samples on a 95,000-byte synthetic draft:
count median 17.30ms/max 103.41ms, changed-range median 8.48ms/max 47.63ms. These are
local CPU observations under test load, not browser typing, web vitals, hosted query
latency, improvements against a baseline or service guarantees.
