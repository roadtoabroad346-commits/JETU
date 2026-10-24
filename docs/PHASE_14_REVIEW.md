# Phase 14 verification — 2026-10-24

**Status: VERIFIED for the Phase 14 development/preview gate.** A real official-source opportunity passed find → check → save → plan → status → Saved through deployed Next routes and server actions backed by the authorized Supabase development project. This does not promote production or verify earlier phases.

## Completion evidence

- Published the 2027 Blue Planet Awareness Contest after reviewing Bow Seat's [official overview](https://bowseat.org/programs/blue-planet-awareness-contest/contest-overview/), [FAQ](https://bowseat.org/programs/blue-planet-awareness-contest/faqs/) and [entry instructions](https://bowseat.org/programs/blue-planet-awareness-contest/how-to-enter/) on 2026-10-24. The source supports ages 11–18, worldwide middle/high-school eligibility, free online entry, an adult sponsor and under-13 consent, and June 7, 2027 at 11:59 PM EDT. The stored UTC instant is June 8 at 03:59 with `America/New_York`. Content SQL is `supabase/content/20261024_blue_planet_2027.sql`; it refuses an existing slug and uses verified official source claims. There is no fake award or admissions outcome.
- Fixed proxy guards that rejected both opportunity detail and `/dashboard/opportunities`. Added two route unit cases. Choosing Saved from a plan now keeps the save and deletes the versioned plan action. Added a separate RU/KK/EN schools directory using the existing RLS-protected school taxonomy; it requires visible institution and source evidence, excludes universities, and labels only `verified_partner` as a partner. No school or partner is invented. Full school/counselor tenancy belongs to Phase 26.
- `npm run check` passed after the directory change: format, ESLint, strict TypeScript, 67 unit/integration tests and production build. The final route-guard commit hook passed typecheck and 69 unit/integration tests. Full Chromium E2E: 70 passed, 2 existing skips; desktop/mobile RU/KK/EN opportunity and school pages passed axe, 320px reflow and reduced-motion checks. A final post-fix full rerun is recorded in `IMPLEMENTATION_LOG.md`.
- The nine rollback-only cloud SQL assertions passed with the real opportunity present. On a protected Vercel preview, RU/KK/EN detail returned 200, age 16 list contained the item and age 19 excluded it; the schools page showed a true empty state. Deployment `dpl_AQd4ZT3uzH7zHdbQpTVbgHyRgqw4` is READY from `62a227a`, with correct HTTPS canonical URLs.
- Independent review found the school read stopped silently at 24 rows. It now uses bounded URL pagination (12 rows, 13th-row next check, max page 200), filters school/university types and stale source checks, and has an invalid-page state. Two targeted unit cases bring the final suite to 71. The affected Chromium school/opportunity rerun is recorded in `IMPLEMENTATION_LOG.md`.
- Final code deployment `dpl_Cr3QLXtrABKDrBTEdW75dCDM4nD2` from `770b17b` reached READY. Connected fetch returned 200 for the real detail, a true school empty state, invalid school page feedback and age-19 exclusion; preview canonical URLs were HTTPS. The GitHub commit had no failed checks (the Supabase Preview check was skipped; no PR CI was run).
- From an ephemeral Vercel sandbox, two disposable students signed in via real Supabase Auth. The owner saved twice (one row), created a plan, updated it to `preparing` with version 2, and read persisted rows. The second student saw zero owner rows and a cross-user insert returned 403. The actual deployed Next detail form redirected 303 to success; detail and private workspace forms redirected 303 for planned, preparing and Saved. The workspace rendered HTTP 200 after reload. Before cleanup, the final database state was one save and zero plan rows. Both disposable users and their identity/action rows were removed; follow-up counts were 0 users, 0 identities, 0 saves, 0 plans, and 1 reviewed opportunity. The sandbox was stopped.

## Remaining limits

No reviewed school record or partner agreement exists, so the separate directory honestly shows empty. Local Supabase migration replay remains blocked by `public.ecr.aws` 403; connected SQL assertions and live Auth/RLS/REST/server-action paths passed. The populated preview detail was verified through deployed HTML and real form POST, not a screenshot-capable browser. No production promotion, PR CI, or scale benchmark is claimed.

UI/UX Pro Max `SKILL.md` and `references/quick-reference.md` were read for focus, touch size, responsive layout, status feedback and reduced motion. Its search script is not mounted in the cloud skill package, so no script result is claimed. Caveman `lean-build`, `migration`, `verify-and-stop` and `caveman-review` were read; no undocumented mode was invoked. JETU blue/yellow design tokens and native controls were retained.

Code commits `316ad5b` and `62a227a` were pushed to `codex/phase14-opportunities`; the documentation checkpoint follows. Recheck source facts before the 180-day freshness window closes. Do not begin Phase 15 automatically.

---

## Prior partial review — 2026-10-23

**Historical status (2026-10-23): PARTIAL.** At that checkpoint the catalog UI and private action flow used the already applied development schema. There were zero reviewed opportunity records and no direct Supabase REST/Auth verification from this workspace.

Git checkpoints `a4f48f2` and `ece9742` were pushed to `codex/phase14-opportunities`. Vercel preview deployment `dpl_DjaW3RRT4pXUjNmHy91BeoycxyDr` reached READY from `ece9742`. Its protected English and Russian opportunities URLs returned HTTP 200 through the connected Vercel fetch tool and showed true zero-record empty states. The English canonical URL is the preview deployment's HTTPS host; the first preview's localhost canonical bug is fixed. This is a preview, not a production promotion.

## Scope delivered

- Recovered five prerequisite Phase 13 migrations from the existing GitHub branch and the two exact Phase 14 SQL migrations from the connected development migration history. No redundant Phase 14 migration was applied. Generated TypeScript types from the actual development schema.
- RU/KK/EN public search, age/grade/type URL filters, bounded pagination, item detail, eligibility, host, source check date, cost, risk and official application URL. Degree programs and scholarships retain separate routes. Unknown facts are labeled, and UI copy avoids admissions promises.
- Authenticated server actions for idempotent save and versioned plan status, owner-RLS private list, loading/disabled button states, success/error feedback. The existing school profile taxonomy distinguishes school kinds and partnership state in SQL; a dedicated schools interface is not yet shipped.

## Measured checks

| Check                                                                                      | Result                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                            | Final gate passed after preview URL fix: format, ESLint, strict TypeScript, 67 unit/integration tests and production build.                                                                                   |
| `npm run typecheck && npm run test:unit` after cloud types                                 | Passed; 65 tests.                                                                                                                                                                                             |
| Full first `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`        | 58 passed, 2 skipped, 2 failed on missing canonical metadata for the newly routed opportunities path. Fixed metadata.                                                                                         |
| Targeted `npx playwright test tests/e2e/opportunities.spec.ts tests/e2e/marketing.spec.ts` | 18 passed across desktop/mobile, RU/KK/EN, URL/reload, 320px/reduced motion and axe of the opportunity page.                                                                                                  |
| Connected `supabase/tests/opportunities.test.sql`                                          | Nine rollback-only assertions passed: published/draft visibility, age/grade exclusion, anon write denial, cross-user save/plan isolation. Follow-up opportunity, save, plan and fixture user counts all zero. |
| `JETU_ENV=test npm run db:start:database`                                                  | Blocked: `public.ecr.aws` registry returned 403; stopped retries. No local migration replay.                                                                                                                  |
| Supabase advisors                                                                          | Security: four INFO RLS-without-policy tables intentionally deny public reads. Performance: one INFO unindexed opportunity currency FK and unused indexes on empty tables.                                    |
| Vercel preview `dpl_DjaW3RRT4pXUjNmHy91BeoycxyDr`                                          | READY; English and filtered Russian opportunities returned 200, true empty states and HTTPS canonical URLs on the preview host.                                                                               |

## Acceptance review

- **Find and check:** search and detail contracts exist, SQL fixture proves age/grade/publication filtering, and the Vercel preview confirmed a live public REST empty-state response. Actual reviewed item rendering cannot be verified without editorial data.
- **Save, plan and track:** owner RLS and client request contracts exist; authenticated REST round trip and persistence after reload remain unverified.
- **Schools:** separate SQL taxonomy exists for high schools, summer providers and verified partners; dedicated UI and B2B workspace remain outside this delivered slice.
- **Security/UI:** public key only, server identity check, RLS owner policies, bounded reads, no fabricated records; keyboard labels, mobile reflow, reduced motion and axe checked on rendered empty/unavailable screens. Detail and private form visual checks await a real sourced row and session.

## Historical next action (completed on 2026-10-24)

Publish one genuinely reviewed official-source opportunity through the editorial process and verify search → detail → save → reload → plan status under two student accounts on a reachable preview. Then replay local migrations/SQL tests when the image registry is reachable and reassess the Phase 14 gate. Do not start Phase 15 automatically.
