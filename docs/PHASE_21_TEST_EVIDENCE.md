# Phase 21 evidence — 2026-11-05

**PARTIAL.** PR: https://github.com/roadtoabroad346-commits/JETU/pull/11 . Branch:
`codex/phase21-writing-studio`, based on published main `5c30fe0`. No merge or
production promotion; Phase 22/24 remain separate. The current head and current
exact-commit CI/preview checks are available in the PR.

## Delivered / exercised

Existing Phase 19 writing authority now supports private project creation,
rename, duplication, archive/reopen, acknowledged debounced autosave, uncertain
request replay, optimistic concurrency, checkpoint compare and restore into a new
version. RU/KK/EN editor has source-vs-personal constraints, Unicode counters,
local anchored feedback with explicit accept/dismiss/undo and stale markers,
student self-review, structured CV/activities with reorder/preview/TXT/browser-PDF,
generic text interviews with opt-in history and real-data dashboard continuation.
See WRITING_STUDIO_ARCHITECTURE.md for limits and permissions.

## Command evidence

- `npm run check`: PASS, formatting/lint/strict types, **142 unit/integration**
  tests, production build. Final source gate ran sequentially before production E2E.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`:
  **88 passed, 4 skipped**, no failures. The four inherited dashboard/matching
  cases require configured Supabase; they are not claimed as authenticated proof.
  Eight new production-browser cases verify private writing login and API failure
  contracts across desktop/mobile.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:journey-ui`:
  **14 passed**, including eight new Writing scenarios and six existing account/
  profile scenarios. Writing API responses are mocked in this suite; no Auth/RLS
  acceptance is inferred. It covers save acknowledgements, retry UUID, conflict
  fork, versions/restore, stale comments, CV/TXT/PDF, interview opt-in, plain-text
  XSS payloads, RU/KK/EN at 320/768/1440, reduced motion and axe.
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities**. Full CI audit
  at high severity passes; inherited moderate development findings are not claimed
  resolved by Phase 21.
- `git diff --check`: PASS. No package/dependency or lockfile changes.

## Database and security

Disposable PostgreSQL 16.2 with synthetic provider schemas replayed all 44
migrations and passed five pgTAP suites / **96 assertions**, including 30 new
Writing tests. These establish actual SQL command/CAS/receipt behavior, immutable
history, anonymous/cross-owner/claimed-mentor denial, private receipts, unknown/
expired prompt denial and continued saving with existing expired context. All
synthetic identities roll back; no real student content was inspected.

Pinned CLI 2.121.0 generated types from that actual local database: additive 164
lines. CI run https://github.com/roadtoabroad346-commits/JETU/actions/runs/42055661186
confirmed the database job with two clean Supabase replays and **96 pgTAP assertions
per replay**, advisors and exact generated-type drift passing. Its frontend exposed
an Origin defect, subsequently repaired. On fixed source commit
`0216c80296744b43e9560c5e061e28b3eacb61d1`, both frontend and database jobs PASS:
https://github.com/roadtoabroad346-commits/JETU/actions/runs/42056457543 .

The local Supabase Docker image pull never completed successfully and was stopped.
Native PostgreSQL is a fallback; hosted GoTrue/REST/Storage and real two-account
Auth/browser/device journeys remain unverified. Mentor sharing is unavailable;
no grant or revoked-grant workflow is claimed. All writing access stays owner-only.

## UI, export and performance

Synthetic screenshots/PDF under `docs/evidence/phase21/` contain no student data.
Desktop and Kazakh 320px images were actually inspected. The before/after phone
images show a detected defect: long Kazakh button labels fragmented into syllables.
The final mobile action layout stacks full-width controls, then passed the 14-case
UI suite. Light-only contract; no dark-mode or physical-device claim.

The exported PDF opens as one page. `pdftotext` and PyMuPDF recover the Kazakh text;
TXT export contents were read by the browser test. PDF uses browser print, not a
server generation job; DOCX, tagged-PDF accessibility and physical printers are not
verified. Local domain performance records 12 samples on a 95,000-byte draft:
count median 17.30ms/max 103.41ms; changed-range median 8.48ms/max 47.63ms. This is
local CPU timing under test load, not browser typing, web vitals, hosted DB latency,
an improvement against a measured baseline or a service guarantee.

## Preview and external blockers

Fixed-source preview `dpl_5toEEfHxn96XD9f1Rnz4jyxzQFxk` is READY:
https://jetu-narmpvsj2-impact-hub.vercel.app . Protected Vercel MCP smoke: health
200; English Writing resolves to real login, private no-store, no editor data.
The primary preview has no Supabase configuration and its private API returns
503 PROVIDER_NOT_CONFIGURED. This is build/degraded-mode evidence, not a working
signed-in Studio release. Latest cosmetic/docs pushes receive new preview URLs in
PR checks; use the matching commit when reviewing.

Jetuu `edpuovkgoisyzpguksdi` was inspected read-only and remains unmodified at its
43-migration head `20261029143849`. It is production-connected. New additive
migration `20261105145755_phase_21_writing_studio.sql` was **not** applied remotely.
An explicitly selected isolated staging DB must receive it before integrated testing.

No AI gateway source or configured provider was found on recovered branches. AI is
visibly unavailable; no writing is sent externally and no fake review is returned.
A real provider adapter/live feedback, reviewed current-cycle official prompts,
application/Roadmap populated journeys, real authenticated two-account acceptance
and isolated staging verification remain release blockers. No phase is relabelled
VERIFIED to hide them.

One local E2E attempt was stopped after concurrent `.next` builds invalidated it.
Checks subsequently ran sequentially. The Origin failure was fixed using browser-
facing Host plus exact protocol/port; a normalization regression test and real
production-browser checks pass. Invalidated/failed attempts are not passing evidence.
