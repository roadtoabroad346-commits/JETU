# Phase 23 QA / release evidence — 2026-11-06

Status: PARTIAL pending real authenticated hosted browser acceptance. Phase 24
is not started. Source baseline: remote main `5c30fe0`; scoped branch
`codex/phase-23-deadlines`. No unrelated changes existed at the start.

## Verified

- `npm run check`: format, lint, TypeScript, 140 unit/integration tests and
  production build passed before final release refinements; final run recorded
  below when complete. 27 deadline cases include New York/London DST gaps and
  overlaps, Almaty, leap day, date-only precision, quiet hours, Monday windows,
  opt-outs, Unicode filtering, deterministic sorting and ICS injection/folding.
  Six API boundary cases cover CSRF, auth, owner/channel injection and error privacy.
- All 44 migration files replayed from zero in standalone PostgreSQL 17.11 using
  a test-only Supabase auth/storage shim. Full real pgTAP regression: **100
  assertions pass** (66 existing, 34 Phase 23). This checks SQL and owner RLS;
  the shim is not a Supabase Auth/Storage/Realtime runtime.
- Pinned Supabase CLI generated public database types from this actual replay.
  Existing generated types changed additively. No hand-written schema types.
- A concurrent worker call while another session held advisory lock `2300611`
  returned `{"busy":true}`. Duplicate scheduling produces one durable receipt;
  source changes produce one correction with a new-date snapshot; opt-outs,
  quiet hours, expiry and stale-source dispatch checks pass.
- Jetuu hosted migration `20261106122552_phase_23_deadlines_notifications`
  applied successfully to verified project `edpuovkgoisyzpguksdi`. All **34 hosted
  transactional assertions passed** with rollback; no synthetic users remain.
- Cron `jetu-deadlines`, job 2, runs every minute. Initial worker result:
  queued 0 / sent 0 / failed 0. Two existing users received in-app-only preference
  rows; no external channel consent or vendor delivery was created.
- Post-migration security advisor: no new WARN/ERROR. Privileged-only worker
  metrics deliberately have RLS and no user policy (INFO). Existing 20 privileged
  RPC warnings and Auth settings warnings predate this phase and remain recorded.
- New browser component suite: **28 passed**. RU/KK/EN calendar at 390/820/1440;
  dashboard, inbox and settings at 390/1440; axe, reflow, URL reload, native modal
  Escape, reduced motion and failed-save input retention. These use explicit
  test-only synthetic fixtures outside app routes, not real hosted sessions.
- Actual screenshot review found/fixed calendar accessible-name mismatch and
  an excessively long mobile month layout. Mobile month now uses a compact
  seven-column grid plus readable event list. Production surfaces contain no
  demo deadlines or fake dashboard statistics.

## Bugs / limits

| Finding                                              | Resolution / proof                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| Calendar day accessible name omitted visible weekday | Exact label and visible separator; focused mobile axe passes          |
| Mobile month became a long two-column sequence       | Compact month and event list; responsive screenshot suite             |
| Receipt changes left header unread stale             | Header listens for successful workspace reload count                  |
| Notification history limited to first page           | Stable owner-scoped `(created_at,id)` cursor, retained loaded history |
| Concurrent custom date insert could exceed UI cap    | Database advisory lock + 500-row trigger                              |
| Old reminders/source revisions could survive changes | DB cancellation + send-time checks + unique receipt SQL tests         |

An initial complete browser run had 78 pass / 4 Auth-dependent skips / 2 failures
on unstyled RU/KK marketing pages. A concurrent build changed static assets while
that server was running; failure screenshots show missing CSS, not small actual
control geometry. Release checks must run serially on a fresh production bundle;
this failure is not counted as a passed gate. Final serial results follow.

## External / unverified

- Email/push have no provider, remain visibly unavailable and never queue work.
- Delivery schedules are per-message windows, not consolidated email digests.
- No OAuth is enabled. ICS is the supported external calendar path.
- Hosted login → create/edit → reload → notification read/preferences → scoped
  export and two-account browser acceptance are not proven. SQL RLS evidence
  does not substitute for these browser flows.
- Earlier phase/editorial coverage is unchanged. Missing application/roadmap UI
  is not exposed as supported navigation; canonical existing data is integrated.
