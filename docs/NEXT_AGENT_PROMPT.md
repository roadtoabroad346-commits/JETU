# Next agent handoff — Phase 16 PARTIAL, 2026-10-25

Phase 16.5 staged one University of Toronto program and one Pearson scholarship
cycle in Jetuu development using `scripts/phase16-stage-official-sample.sql`.
They remain unpublished and `needs_review`; no reviewer approval was simulated.
The script is idempotent and ran twice. Matching now fails closed on malformed
deadlines and duplicate test scores and deduplicates candidate IDs. `npm run
check` passed (80 tests); Chromium passed 64 with four Auth-dependent skips.
Read `docs/PHASE_16_RELEASE_AUDIT.md` and `docs/DATA_VERIFICATION.md` before
any editorial publication or release. The 2026/2027 Pearson page contains an
older contradictory FAQ, so deadline review is mandatory. Phase 17 remains gated.

Phase 16 is implemented locally and in the authorized Jetuu development database, but **not verified end to end**. Do not start Phase 17 under this checkpoint. Read `docs/AI_MATCHING_ARCHITECTURE.md` and the Phase 16 gate in `docs/PHASE_TRACKER.md` before work.

GitHub `main` contains implementation commit `afa3f11`. The existing Vercel `jetu-phase13-preview` project is now Git-linked; its matching preview reached READY with a 200 health check, anonymous match-to-login path and real public search. Git `main` auto-deploys to that project's production target at its default `.vercel.app` domain, with no custom JETU production domain. Supabase Git-linked `main` reported `ACTIVE_HEALTHY`. No signed-in matching journey or acceptance-ready product release was verified.

The private `/{locale}/match` page and `/api/matching/run` use the existing profile and published unified search. The deterministic engine in `src/features/matching/engine.ts` returns source-aware rule statuses and separate weighted preference points; `service.ts` batches catalog evidence and stores owner-scoped runs. Three additive migrations and generated types are committed with the code. The profile action now preserves unrelated JSON fields. RU/KK/EN UI has readiness, preferences, run, explanations, source links, details/save/compare and retry. No AI provider is configured; deterministic explanations are intentional.

The development catalog has **zero published programs and scholarships**. Direct hosted Auth/REST from this workspace fails CONNECT 403; local database image pull fails registry 403. Cloud transactional matching SQL passed 18 assertions with rollback, but real login → profile → matching → save/compare/recalculate and visual Auth page checks are not proven. Keep Phase 16 PARTIAL and do not fabricate rows, criteria, awards, deadlines or probabilities. Existing Phase 12/15 and other phase statuses are unchanged.

**Release gate before marking VERIFIED:** curate a small official-source-backed program/scholarship corpus with current requirement/deadline/funding claims in an authorized environment; run clean migration replay and pgTAP; exercise two real test accounts through hosted Auth/REST, owner isolation, profile changes, recommendations, save/compare and recalculation; inspect mobile/tablet/desktop and axe; resolve any defects; check deployment. Atomic run/result persistence and broader eligibility coverage are known follow-ups. Phase 17 may consume rule gaps only after Phase 16 evidence is closed and separately authorized.
