# Phase 23 checkpoint — 2026-11-06

Read `docs/PHASE_23_QA.md` and `docs/DEADLINE_ENGINE.md` first. Current user scope
explicitly authorizes Phase 23 plus existing dashboard/search polish, and scoped
GitHub/Supabase/Vercel publication. Do not start Phase 24 or change older labels.

Branch `codex/phase-23-deadlines` starts from current main `5c30fe0`. New migration
`20261106122552_phase_23_deadlines_notifications.sql` is already applied to the
existing Jetuu development project `edpuovkgoisyzpguksdi`; do not replay it there.
Cron `jetu-deadlines` (job 2) is enabled every minute. Hosted rollback assertions
35/35 pass; no test identities persist. External email/push remain unavailable.

Implementation: `src/features/deadlines/`, `/api/deadlines`, `/api/calendar/export`,
private calendar/inbox/settings/dashboard routes, search chips/advanced filters,
owner RLS views and transactional private worker. Existing snapshots are preserved.
Standalone PostgreSQL `jetu-phase23-db` contains disposable replay databases only;
actual generated public types come from pinned CLI. SQL suite101, component UI28,
unit/integration150 passed at checkpoints. Final release gate/results and links
must be read from the QA record, not inferred from these provisional counts.

Final check passes; full E2E80 pass/4 Auth-dependent skips, UI28 pass.
PR13 is open. Next: verify follow-up preview SHA/health after proxy/config repair. Real hosted authenticated two-account browser acceptance is
still required before VERIFIED. CLI `gh` reports an invalid GH_TOKEN; connected
GitHub tools remain available if git push fails. Never print or retrieve secrets.

Older handoff follows as historical context.

# Publication handoff — 2026-11-04

The user explicitly authorized GitHub/Supabase/Vercel publication after the UI
work. Read `docs/DEPLOYMENT_2026-11-04.md` and PR #10 for release checks and final
deployment records. Git now preserves all 43 already-applied Jetuu migrations;
the missing 20 were recovered exactly, not replayed remotely. Pinned-CLI database
types are generated from the complete migration chain. Local-only script guards
remain active. Later phase application code was not merged or marked verified.
Primary production origin is `https://jetu-iota.vercel.app`; previews retain
Vercel protection. Hosted email confirmation and two-account acceptance still
require real evidence. Older statements below about missing publication
authorization are historical and do not override the user's latest request.

# Previous handoff — 2026-11-04 student experience

Read `docs/STUDENT_EXPERIENCE.md` for the new user-authorized account/profile UI,
original JETU mascot, private five-step journey, supplied privacy contact and tests.
`docs/MVP_COMPLETION.md` remains the previous MVP quality checkpoint. Hosted
Auth/REST still returns CONNECT 403; no phase is promoted to FULL AND VERIFIED.
Profile versions, owner checks and unrelated JSON fields remain protected. New
profile saves return structured errors without discarding input. No automatic
browser draft storage, fabricated success, migration or deployment was added.

# Previous handoff — 2026-11-03 MVP quality pass

Read `docs/MVP_COMPLETION.md` first for current acceptance, fixes and verification.
The existing scope remains **PARTIAL**. Autocomplete now discards stale responses
and closes on Escape/blur; matching validates inputs, retains drafts on POST failure,
retries the correct method and handles session expiry; profile updates compare the
rendered version atomically and reject stale tabs. No schema migration was needed.
Six hosted rollback SQL assertions proved profile CAS/history/owner isolation;
this does not verify Auth/REST. The user meant old **Codex environments**, not the
nested `jetu/` upload. No available environment-list/delete capability exists.
Preserve the original upload and unrelated projects. Do not claim environment cleanup.

Previous checkpoint context follows; its dated counts are historical.

# Next agent handoff — Phase 16 PARTIAL, 2026-10-25

Phase 16 is implemented locally and in the authorized Jetuu development database, but **not verified end to end**. Do not start Phase 17 under this checkpoint. Read `docs/AI_MATCHING_ARCHITECTURE.md` and the Phase 16 gate in `docs/PHASE_TRACKER.md` before work.

GitHub `main` contains implementation commit `afa3f11`. The existing Vercel `jetu-phase13-preview` project is now Git-linked; its matching preview reached READY with a 200 health check, anonymous match-to-login path and real public search. Git `main` auto-deploys to that project's production target at its default `.vercel.app` domain, with no custom JETU production domain. Supabase Git-linked `main` reported `ACTIVE_HEALTHY`. No signed-in matching journey or acceptance-ready product release was verified.

The private `/{locale}/match` page and `/api/matching/run` use the existing profile and published unified search. The deterministic engine in `src/features/matching/engine.ts` returns source-aware rule statuses and separate weighted preference points; `service.ts` batches catalog evidence and stores owner-scoped runs. Three additive migrations and generated types are committed with the code. The profile action now preserves unrelated JSON fields. RU/KK/EN UI has readiness, preferences, run, explanations, source links, details/save/compare and retry. No AI provider is configured; deterministic explanations are intentional.

The development catalog has **zero published programs and scholarships**. Direct hosted Auth/REST from this workspace fails CONNECT 403; local database image pull fails registry 403. Cloud transactional matching SQL passed 18 assertions with rollback, but real login → profile → matching → save/compare/recalculate and visual Auth page checks are not proven. Keep Phase 16 PARTIAL and do not fabricate rows, criteria, awards, deadlines or probabilities. Existing Phase 12/15 and other phase statuses are unchanged.

**Release gate before marking VERIFIED:** curate a small official-source-backed program/scholarship corpus with current requirement/deadline/funding claims in an authorized environment; run clean migration replay and pgTAP; exercise two real test accounts through hosted Auth/REST, owner isolation, profile changes, recommendations, save/compare and recalculation; inspect mobile/tablet/desktop and axe; resolve any defects; check deployment. Atomic run/result persistence and broader eligibility coverage are known follow-ups. Phase 17 may consume rule gaps only after Phase 16 evidence is closed and separately authorized.
