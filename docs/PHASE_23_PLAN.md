# Phase 23 implementation ledger — 2026-11-06

Scope: deadline engine, persistent inbox/preferences, calendar/ICS, existing dashboard
and search polish. Phase 24 is not started. Branch `codex/phase-23-deadlines`
starts from current remote main `5c30fe0`; initial working tree was clean.
Historical phases remain at their recorded status. Existing later-phase schema is
preserved; missing application interfaces are not fabricated.

| ID  | Acceptance / exit proof                                                       | Dependency / modules                        | Status                  |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------- | ----------------------- |
| A   | Owner RLS, explicit grants, canonical source precision, two-user SQL tests    | additive migration, generated types         | LOCAL + HOSTED VERIFIED |
| B   | 30/14/7/1 calendar-day scheduling, DST/quiet/digest, no unverified urgency    | SQL worker, pure time model, unit tests     | IMPLEMENTED / TESTED    |
| C   | Persist inbox read/archive and settings, failure retains input                | authenticated API, localized workspace      | IMPLEMENTED / TESTED    |
| D   | Concurrent claims, unique occurrence, revision cancellation, no backfill spam | transactional in-app worker, SQL assertions | IMPLEMENTED / TESTED    |
| E   | Day/week/month/agenda, custom events, scoped valid ICS                        | calendar UI/API, ICS tests                  | IMPLEMENTED / TESTED    |
| F   | External channels disabled honestly without providers                         | preferences, delivery contract              | IMPLEMENTED / TESTED    |
| G   | Real next actions/counts/deadlines, visual URL filters/sorts                  | existing dashboard/search, browser checks   | IMPLEMENTED / TESTED    |
| H   | check, E2E, RLS, responsive/keyboard/axe/reduced motion RU/KK/EN              | production build, test-only fixture         | TODO                    |
| I   | Verify migration, Git push/PR, preview smoke, concise handoff                 | connected Jetuu/GitHub/Vercel               | TODO                    |

Known constraints: Supabase changelog HTTP fetch returns 403; current official MCP
docs are reachable. Hosted Auth/REST connectivity must be retested. No email/push
provider credentials observed. No new paid infrastructure or OAuth integrations.

Release checkpoint: migration20261106122552 applied; hosted SQL34, local pgTAP100,
unit/integration140 and UI28 passed. Cron job2 succeeds every minute.
Final serial E2E/preview publication in progress. Phase23 remains PARTIAL until
hosted authenticated two-account acceptance. No Phase24 work.
