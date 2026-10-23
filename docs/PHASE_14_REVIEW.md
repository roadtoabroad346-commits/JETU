# Phase 14 review — 2026-10-23

**Status: PARTIAL.** The catalog UI and private action flow are implemented against the already applied development schema. There are zero reviewed opportunity records, and direct Supabase REST/Auth calls from this workspace cannot be verified. No production deployment or real student write was claimed.

Git checkpoint `a4f48f2` was pushed to `codex/phase14-opportunities`. Vercel preview deployment `dpl_8xgU2u6ccxtKTXqG7usA6dANvG5i` reached READY from that exact commit. Its protected `/en/opportunities` URL returned HTTP 200 through the connected Vercel fetch tool and showed the true zero-record empty state. The preview exposed a pre-existing localhost canonical URL caused by missing `NEXT_PUBLIC_APP_URL`; a follow-up code fix now derives a safe preview origin from Vercel's system URL and awaits redeployment.

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

## Acceptance review

- **Find and check:** search and detail contracts exist, SQL fixture proves age/grade/publication filtering, and the Vercel preview confirmed a live public REST empty-state response. Actual reviewed item rendering cannot be verified without editorial data.
- **Save, plan and track:** owner RLS and client request contracts exist; authenticated REST round trip and persistence after reload remain unverified.
- **Schools:** separate SQL taxonomy exists for high schools, summer providers and verified partners; dedicated UI and B2B workspace remain outside this delivered slice.
- **Security/UI:** public key only, server identity check, RLS owner policies, bounded reads, no fabricated records; keyboard labels, mobile reflow, reduced motion and axe checked on rendered empty/unavailable screens. Detail and private form visual checks await a real sourced row and session.

## Next action

Publish one genuinely reviewed official-source opportunity through the editorial process and verify search → detail → save → reload → plan status under two student accounts on a reachable preview. Then replay local migrations/SQL tests when the image registry is reachable and reassess the Phase 14 gate. Do not start Phase 15 automatically.
