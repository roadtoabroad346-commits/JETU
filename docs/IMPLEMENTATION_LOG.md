# Phase 04 implementation log — 2026-10-17

Status: **PARTIAL**. The application/tooling foundation is implemented and tested;
actual local migration replay, pgTAP, DB advisors and generated database types remain
blocked by the managed Docker VFS filesystem capacity. Do not mark VERIFIED yet.

## Delivered

- Root Next.js 16.4.2 / React 19.3.1 / TypeScript 5.9.3 strict package; Tailwind 4,
  Motion 14, pinned Supabase SDK/SSR/CLI, npm lockfile, Node/npm engine pins.
- Modular source boundaries, route-group reservations, Zod env validation and public
  key/URL safety, typed browser/server/admin factories, structured HTTP Result/errors.
- RU/KK/EN availability page, root redirect, localized document lang and 404,
  loading/error foundations, motion preference, visible focus/skip and native links.
- Supabase local config, CLI-created migration
  `supabase/migrations/20261017145535_foundation_security.sql`, empty seed,
  14-assertion transactional SQL permission suite. **SQL execution is not verified.**
- Local-only CLI guards, explicit no-remote targeting, atomic type-generation output;
  database-only startup using CLI-documented excludes for resource-limited machines.
- ESLint/Prettier/Husky/lint-staged, Vitest, Playwright/axe, secret-free GitHub CI
  with actions pinned to queried upstream v4 commit hashes.
- Audit, plan, architecture, decisions, schema/RLS boundaries, provisional design
  contract, raw actual skill research, first screenshots, test/review/handoff docs.

## Actual commands and results

| Command / check                                                          | Result                                                                                                               |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Node/npm/Python/Docker                                                   | 24.19.0 / 11.9.0 / 3.12.14 / 28.4.0, local Unix daemon VFS                                                           |
| `npm ci`                                                                 | PASS, exit 0; 365 packages installed from lockfile                                                                   |
| `npm ci --prefix work/clean-install`                                     | PASS, exit 0 in clean source copy; Husky correctly reported absent .git                                              |
| `npm run format:check`                                                   | PASS, exit 0 after formatting                                                                                        |
| `npm run lint`                                                           | PASS, exit 0, zero warnings                                                                                          |
| `npm run typecheck`                                                      | PASS, exit 0 (`next typegen` + strict tsc)                                                                           |
| `npm run test:unit`                                                      | PASS, exit 0, 4 files / 50 unit and mocked-adapter/HTTP integration tests                                            |
| `npm run build`                                                          | PASS, exit 0, production App Router routes and proxy compiled                                                        |
| `npm audit --audit-level=high`                                           | PASS, exit 0, 0 vulnerabilities across dependency classes                                                            |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | PASS, exit 0; final run 14/14 in 1.4m                                                                                |
| Axe inside E2E (`@a11y` cases)                                           | PASS, six locale/device audits, no violations reported; `test:a11y` is the subset command                            |
| Real `npm run dev -- --port 3000` HTTP smoke                             | PASS; `/api/health`, `/ru`, `/kk`, `/en` all 200; localized html lang checked                                        |
| Production secret-canary scan                                            | PASS; synthetic admin secret absent from all 13 public `.next/static` files                                          |
| `npx --no-install supabase init`                                         | PASS, generated official local config, then narrowed safely                                                          |
| `npx --no-install supabase migration new foundation_security`            | PASS, CLI-created timestamped SQL file                                                                               |
| `npm run db:start`                                                       | BLOCKED: public.ecr.aws 403; CLI automatically fell back to ghcr.io; image extraction hit ENOSPC; stopped task retry |
| `npm run db:start:database`                                              | BLOCKED: even PostgreSQL-only image extraction hit ENOSPC under VFS/32GB; stopped retry                              |
| `npm run db:reset:local`                                                 | BLOCKED, exit 1, no running local database                                                                           |
| `npm run test:db`                                                        | BLOCKED, exit 1; pgTAP assertions did not execute                                                                    |
| `npm run db:types`                                                       | BLOCKED, exit 1; original placeholder checksum unchanged                                                             |
| `node scripts/db.mjs advisors`                                           | BLOCKED, exit 1, no running local database                                                                           |
| Actual production env / --linked / remote DATABASE_URL guard probes      | PASS; each refused before CLI with exit 1 and redacted message                                                       |
| Remote GitHub Actions / hosted Supabase / deployment                     | NOT RUN, not inferred from local checks or YAML                                                                      |

The first lint, @next/env import and dependency-peer issues were fixed and rerun;
see `docs/PHASE_04_REVIEW.md`. Full-stack extraction filled the disk and caused one
intermediate fresh install/build/test attempt to fail ENOSPC. Those failures were
retained as evidence; after removing only task-created images/temporary files,
fresh install and final app checks passed. The database resource blocker remains.
No managed daemon storage driver, network policy, proxy/CA or unrelated user data
was changed. No user table/bucket or remote project was created/modified.

Full raw local logs and exact exit summaries are in ignored `work/` (not production
telemetry). Reviewed screenshots are committed under `docs/evidence/phase04/`.
Final checkpoint/clean-clone verification details are recorded below before handoff.

## Skills and evidence

Caveman was unavailable in cloud/executor/local searches; no full/ultracaveman
command was invented. UI/UX Pro Max SKILL.md and sources were read, real Python
searches executed and raw results saved in `docs/design/UX_PRO_MAX_EVIDENCE.md`.
Cloud runtime/network/Docker guidance was followed. React best-practices and
full-story verification/routing guidance were read during the final review.
Implemented story: URL locale → proxy/header validation → server-rendered dictionary
content → native language navigation; liveness → typed HTTP response. There is no
product API→database path to pretend verified in this phase.

## Release limitations

P0/P1 in a deployed admissions flow cannot be assessed: that flow does not exist.
No known reproducible critical app defect remains in the implemented foundation,
but SQL and full-stack behavior are **unverified**, not assumed correct. Generated
types remain explicitly labeled a bootstrap placeholder; CI's DB type-diff gate
must be satisfied before merging as verified. ESLint 9 upstream support warning
remains documented dependency debt until the a11y plugin supports a newer major.
Pitch-PDF visual comparison, physical-device/screen-reader/zoom review, full product
RLS isolation, and production security/performance/operational approval are pending
their prerequisites and phases. No flawless/production-ready claim is made.

## Checkpoint / clean Git clone verification

Implementation checkpoint: `bb2ed1f`. Feature CSV line endings/status normalized in
`a4fdfeb`; no product source changed. Cloned `a4fdfeb` using
`git clone --no-hardlinks /workspace/JETU work/checkpoint-clone`. In that fresh Git
clone, `npm ci` exited 0 (18s), Husky configured `.husky/_`, and `npm run check`
exited 0: formatting, zero-warning lint, route typegen/strict tsc, 50 tests and
production build all passed. Clone `git status --porcelain` was empty after checks.
Next warned that the parent checkout lockfile was outside this nested clone and
ignored it; the clone's own lockfile/Git boundary was used successfully.

A documentation-only checkpoint records these results and the final PARTIAL status.
Machine-readable evidence: `docs/evidence/phase04/verification.json`. Original nested
`jetu/` and supplied master copy remain unchanged relative to initial HEAD. No push
or deployment was performed. Dev server is left available locally at port 3000.

## Phase 04 continuation — 2026-10-18

User authorized GitHub push and cloud development verification, prohibited remote
reset, data deletion, production changes and Phase 05. No Docker is run in the
managed workspace for this continuation; disposable GitHub Actions PostgreSQL is
the clean-replay target.

Inspected main `94a4a0b` Actions run `39106788546`, database job `117614256039`:
both resets applied `20261017145535_foundation_security.sql`, both pgTAP passes
reported 14/14, security advisors reported `No issues found`, and CLI 2.121.0 type
generation succeeded. The job failed only because the committed file was still a
placeholder. Frontend job `117614256163` passed all gates including browser tests.

Recovered the actual generated source from that job's complete diff (136 lines),
then formatted with pinned Prettier. This is introspected CI output, not manually
invented types. The empty public schema intentionally has no product tables.
The wrapper now formats before its atomic replacement, types participate in format
checks, CI retains the generated file as an artifact, and advisors cover both
security and performance. A fresh CI run must confirm no type drift.

Supabase skill read and current generation/migration documentation consulted through
MCP. The mandatory changelog fetch was attempted but the environment proxy returned
403; no proxy bypass attempted. MCP OAuth project discovery works. `Jetuu`
(`edpuovkgoisyzpguksdi`) is a candidate only until its development purpose is
confirmed; project names alone do not establish authorization to mutate it.

### Cloud authorization and follow-through

The user confirmed use of the existing Jetuu main project for development; no
separate paid project/branch was created. Preflight returned empty migration
history and zero public relations. Applied the unchanged baseline once through
MCP; hosted version is `20261018072531_foundation_security`. Renamed the Git SQL
file to that actual hosted version to prevent future duplicate application; its
SQL content is unchanged. No remote reset/history repair/data deletion occurred.

All 14 cloud pgTAP assertions passed using an aggregate temporary result table with
an exception on any failure, followed by rollback. Follow-up catalog inspection:
zero public relations and zero leftover probes. Security/performance advisors both
returned `lints: []`. MCP generated actual hosted types; original output is retained
in `docs/evidence/phase04/cloud-database.types.txt`. The hosted generator's internal
PostgREST 14.18 metadata differs from the pinned local CLI; app types stay canonical
to the pinned disposable CI generator. Both have the same empty public schema.
Two initial cloud test-harness submissions failed SQL parsing because JavaScript
replacement interpreted `$$`; neither executed statements. Corrected dollar
quoting and reran successfully; no schema repair was required.

Configured ignored `.env.local` (0600) with HTTPS development project URL and modern
publishable key only, no privileged secrets. `JETU_ENV=development` blocks local DB
commands in this configured workspace. Dev smoke returned 200 for `/api/health`,
`/ru`, `/kk`, `/en`, with matching document languages. Direct cloud REST GET was
blocked by proxy CONNECT 403, not reported as a successful SDK round trip.

### Checkpoint and rerun evidence

Checkpoint `684690aba67ebf8dbabac4acd3daf6cc83bf92a8` pushed to main. Actions
[39107597502](https://github.com/roadtoabroad346-commits/JETU/actions/runs/39107597502)
finished with **both jobs successful**: database `117616706462`, frontend
`117616706700`. Database: two clean local resets in the temporary runner, both
14-assertion SQL runs, security + performance advisors, actual type generation,
artifact upload, zero generated-type diff, typecheck and cleanup all passed.
Frontend: clean npm ci, complete check, audit and production browser suite passed.
This runner used Docker for its disposable CI database; the managed workspace did
not run Docker. No hosted credentials are present in CI.

Workspace `npm ci`, `npm run check`, `npm audit --audit-level=high` (zero findings),
and 14/14 production E2E passed. After public cloud env setup, `npm run check`
passed again. Full local stack, direct cloud REST/SDK, and changelog index access
remain unverified as detailed in CLOUD_DEVELOPMENT and NEXT_AGENT_PROMPT. Original
Phase 04 full-stack gate remains PARTIAL; Phase 05 is not started.

Final review updated architecture/feature/test/RLS matrices to the canonical cloud
migration version and actual results. Repeated production E2E with cloud public
env: 14/14 passed. Invoking the local types wrapper with JETU_ENV=development
returned exit 1 before Docker/CLI execution, as intended. The ignored env was
absent from tracked files and git diff --check passed.

## User-provided pitch archived — 2026-10-18

Saved the original 8-page July 2026 PDF unchanged in docs/pitch (7,300,048 bytes;
SHA-256 recorded in its README), full pdftotext -layout output, an eight-page
rendered overview and a page-indexed context summary. Read all extracted text and
visually inspected all eight rendered slides. Added repository/handoff links for
future context. Market figures, projected traction, pricing and prototype features
are explicitly distinguished from verified implementation. No app/DB changes,
founder outreach or automatic Phase 05 work. Missing attachment is resolved;
formal pitch-to-design reconciliation remains pending.

## Phase 05 — visual system and component library — 2026-10-18

Status: VERIFIED for Phase 05 local design-system acceptance, not production readiness.
Direct request authorizes only Phase 05. Phase 06 was not started; Phase 04 stays
PARTIAL under its existing full-stack gate. No unrelated changes overwritten.

### Source, plan and decisions

Initial workspace HEAD 94a4a0b lagged GitHub. User clarified GitHub is authoritative;
git remote update and git merge --ff-only origin/main advanced to bbbd258 before
app edits. Reread latest AGENTS/memory, cloud evidence and full preserved pitch text /
8-slide overview; inspect slides 1 and 3 at 1500px. PDF hash verified. The first
saved plan's missing-PDF/bootstrap-type assumptions were corrected after the fetch.
Plan: PHASE_05_PLAN.md. Actual research/commands: design/PHASE_05_EVIDENCE.md.
Caveman absent; used saved plan/build/test/fix/separate review/checkpoint fallback.

### Implementation

Added src/styles/tokens.css and shared UI/brand/icon/interactions. New original
vector Jetu/J assets and App Router SVG favicon. Brand blue/yellow retained; primary
and on-brand variants fix small-text contrast. Three-locale noindex showcase at
/{locale}/design-system demonstrates every requested component family. Actual
library-registry filter/sort/search, local Zod text preview, explicit loading/error
specimens; no fake scholarship/application/AI/save. Existing pages/boundaries reuse
new primitives. Automatic loading moved to marketing so no-JS gallery renders.
No new packages, API/data access, migrations, grants, RLS, buckets or credentials.
No remote DB operations, workspace Docker, push or application deployment.

### Verification and fixes

- npm ci: PASS, Node 24.19.0 / npm 11.9.0, lockfile unchanged.
- npm run check: PASS formatting/lint/strict TS/50 unit-integration/production build.
- npm audit --json: PASS, zero vulnerabilities.
- UI/UX Pro Max help/design-system/UX focus/form/Next queries and isolated persisted
  research: PASS. Raw results/hashes saved. Generated teal/fonts deliberately rejected.
- Initial browser runs caught modal Tab cycling, 4.463:1 small ink/blue contrast,
  missing decorative glyph, no-JS streaming and tooltip focus/click sequence issues.
  Fixed them. Test harness fixes covered shorthand colors, required-field name,
  hydration readiness and named alert versus Next route announcer. Initial concurrent
  build/E2E scheduling was removed for final runs. No failed run counted as acceptance.
- PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e --
  tests/e2e/design-system.spec.ts --update-snapshots: PASS 16/16 after fixes.
- PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
  PLAYWRIGHT_JSON_OUTPUT_FILE=work/e2e-final.json npm run test:e2e --
  --reporter=list,json: PASS 30/30, 44.1s; no skipped/flaky/unexpected cases.
  Six newly created baseline images compared at maxDiffPixels=0: all pass.
- After adding explicit reverse modal cycling, targeted --grep 'keyboard tabs':
  PASS 2/2, 7.0s. Ten saved axe reports have zero violations/incomplete findings.
  Nineteen contrast pairs pass (on-brand/blue 4.830:1). RU/KK/EN, 320–1920px,
  landscape, 200% text, reduced motion, no-JS, local offline behavior, negative form
  cases, long Kazakh text, duplicate opens, empty/recovery and reload verified.
- Separate production browser smoke on port 3101: reverse Tab wrap, 20 visible
  controls >=44px height, no console/external requests; viewport/field/modal captures.
  Timing sample is local/unthrottled with cached scripts, not a field/Lighthouse claim.
- git diff --check: PASS. Separate source/security/acceptance review: PHASE_05_REVIEW.

### Limits and checkpoint

System Chromium 154.0.8037.57 / Linux / Liberation Sans used. Attempt to install
Playwright's bundled Chromium 156 through normal proxy failed: HTTP 403 Domain
forbidden for cdn.playwright.dev; no bypass. Target CI browser pixel portability
and remote CI run are not verified for this checkpoint. Review references deliberately
on the target runner; do not refresh them to hide regressions. No physical-device,
manual screen-reader, dark-theme or production-readiness claim. Prior Supabase
runtime/direct REST gaps persist; no new data flow makes SQL/policy tests applicable.

Updated tracker/architecture/decisions/design/feature/test matrices and next-agent
handoff. Checkpoint is a local phase-scoped branch/commit; final response/report
records its actual hash. No automatic Phase 06 or production release.

## Complete repository checkpoint pushed — 2026-10-18

User explicitly requested saving all current files/folders and phase history to
GitHub. Working tree was clean; 149 tracked files included source, tests, design
system, pitch, evidence and prior phase memory/history. Only .env.example is
tracked among env files. Secrets, node_modules, builds and ignored scratch assets
remain excluded rather than being forced into version control.

Fetched origin and verified origin/main was an ancestor of HEAD. Atomic push
succeeded without force: main advanced bbbd258 -> 5a4f26a and branch
codex/phase05-design-system was created at 5a4f26a. This saves all existing project
history/materials through Phase 05, not a claim that phases 01–30 are implemented.
Follow-up documentation records this push; no deployment or new phase execution.

## Phase 06 landing and public site — 2026-10-18

Status: **PARTIAL** against `docs/JETU_MASTER_PROMPT.md`. The landing and 39
localized public pages are implemented. The master exit gate requires a CTA to real
onboarding, which cannot be met until the separate Auth/onboarding work exists. No
verified scholarship catalog, approved public prices, checkout or support channel
was invented. Phase 07 was not started.

### Delivered and decisions

- Replaced the availability splash with a blue/yellow RU/KK/EN landing, mobile
  navigation, labeled interactive Motion concept demo, three-step explanation,
  six planned-capability cards, provenance and pricing clarity, FAQ, and guide CTA.
- Added 12 informational paths per locale, truthful empty/availability wording,
  shared typed copy, accessible language links and current-path preservation.
- Added canonical and alternate metadata, OG/Twitter graphic, sitemap, robots,
  factual structured data, and an explicit `JETU_PUBLIC_INDEXING=true` gate that
  also requires a nonlocal public origin. Unknown public paths return HTTP 404.
- No API, Supabase migration/table/policy/Storage bucket, account flow, data write,
  remote database operation, app deployment or privileged browser key was added.
  Existing Phase 04/05 modules and contracts remain in place.
- `docs/PHASE_06_PLAN.md`, `docs/PHASE_06_REVIEW.md`, updated tracker,
  architecture, decisions and design memory record the acceptance boundary.

### Actual verification

| Check                                                                    | Result                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --ignore-scripts`                                                | PASS; exact lockfile dependencies installed without changing versions.                                                                                                                                                                             |
| `npm run check`                                                          | PASS; Prettier, zero-warning ESLint, Next typegen/strict TypeScript, 51 unit/integration tests and production build.                                                                                                                               |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | PASS, 40/40 desktop/mobile tests, including prior design-system coverage, 39 locale routes, 404/headers, CTA links, keyboard/no-JS/reduced-motion and axe.                                                                                         |
| `npm audit --audit-level=high`                                           | PASS, zero reported vulnerabilities.                                                                                                                                                                                                               |
| `git diff --check`                                                       | PASS.                                                                                                                                                                                                                                              |
| Final-build Lighthouse 13.5.0, Chromium 154, local `next start`          | RU performance 73/LCP 3.234s/TBT 686ms; KK 84/2.755s/458ms; EN 75/2.601s/1000ms; warmed RU repeat 61/3.766s/1718ms. CLS 0, accessibility 100, best practices 100 and local SEO 66 in all four. Compressed reports are in `docs/evidence/phase06/`. |
| Screens at 320/375/1440px                                                | Reviewed and stored in `docs/evidence/phase06/`; no 320px overflow, guide CTA visible above 700px, RU/KK/EN desktop/mobile captures.                                                                                                               |
| Supabase policy, Storage and direct REST tests                           | Not run for this phase: no new database objects or data path. Prior Phase 04 limits still apply.                                                                                                                                                   |

An initial 404 rendered with a 200 HTTP status because Next streamed before
`notFound`; the proxy now rejects unknown public paths before streaming. A first
mobile Lighthouse run had CLS 0.425 because a footer arrived before page content;
moving the footer into each page measured CLS 0 afterward. The first proxy version
blocked `/opengraph-image`; the final browser suite verifies PNG 200. Browser review
also found missing Unicode glyphs and wrapped navigation; SVG icons and shorter
labels fixed these. A prior page iteration scored 96–98 in Lighthouse, but the
final build did not reproduce those scores on the two-core host. The final four
reports, including a warmed repeat, are the performance evidence; no mobile
budget, field sample or deployed result is claimed.

UI/UX Pro Max's actual installed skill, source data and search script were read;
the four executed design/landing/UX/Next searches and applied findings are listed
in `docs/design/PHASE_06_EVIDENCE.md`. Existing brand tokens prevailed over the
skill's generated alternate palette/font. Caveman was searched across available
cloud/executor skills, local files and CLI help, but was unavailable; no Caveman
command or mode was claimed. A structured plan/build/review/checkpoint workflow
was used. No new Phase 07 work or remote release was performed. The local Git
checkpoint hash is recorded in the final handoff.

## Full Phase 00–06 preservation — 2026-10-18

At the user's explicit request, the complete workspace checkout through Phase 06
was copied to `/workspace/JETU_PHASE_00_06_PRESERVED`, including local Git history
and ignored intermediate/build/dependency files. The versioned repository history,
source, original upload, pitch, docs, tests and evidence were saved to GitHub
`main`, `codex/phase06-landing` and the annotated
`phase-00-06-preserved-2026-10-18` tag. GitHub retains the source and history;
local-only caches and `work/` are held in the full workspace copy. No untracked
credential file was present. No Supabase database mutation, deployment or new
feature phase was performed. Exact integrity checks and scope are in
`docs/PHASE_00_06_PRESERVATION.md`.

## Phase 12 — 2026-10-21

- Recovered six previously applied Phase 08–10 development migrations from migration history because Git/origin/main only contained Phase 06. Reused canonical tables; no duplicate catalog schema.
- Added `20261021113901_catalog_explorer.sql` and `20261021114706_catalog_search_multivalue_fix.sql` read-only SECURITY INVOKER RPC, server search/detail adapter, localized university/program pages, URL filters, API, states and scoped styles. Migration applied to authorized Jetuu development project; no data rows changed.
- Synthetic `supabase/tests/catalog.test.sql` ran in a cloud transaction: published_visible=1, matching_facets=1, secondary_facets=1, budget_match=1, budget_excludes=0, deadline_match=1, deadline_excludes=0, draft_hidden=0, wrong_country=0, search_match=1, hidden_search=0. Follow-up leftover fixture count=0. Security advisor: two existing INFO no-policy tables (intentional private write-only histories); performance advisor: unused indexes on empty catalog. One-row synthetic EXPLAIN ANALYZE: 36.072 ms, 1,416 shared hits (not a production baseline).
- `npm run check`: PASS (format, ESLint, strict TypeScript, 54 unit/integration tests, production build). Direct REST curl: CONNECT tunnel 403. Local PostgreSQL Docker startup: registry 403; stopped. Browser: 45/46 first system-Chromium run; fixed a streamed hero timing race; affected rerun 10/10 passed, catalog axe clear on RU/KK/EN mobile/desktop and 320px reduced motion. Initial browser attempt lacked executable path.
- UI/UX Pro Max SKILL.md and existing JETU design contract read; cloud skill search script unavailable in filesystem, so no search result is claimed. Caveman skill/CLI not installed; structured plan/build/review used.

Final Phase 12 recheck: after fixing the publishable-key REST header, `npm run check` passed (54 tests/build). Latest production-build catalog browser rerun: 4/4 desktop tests passed; earlier affected 10/10 desktop/mobile rerun passed. SQL fixture now raises on any of 11 wrong filter/isolation results; it passed under anon and rolled back. No fixture rows persist.

## 2026-10-23 — full-repository audit and maintenance pass (no new phase)

- Audited the whole tree (source, migrations, tests, CI, docs, git history). No
  secrets tracked or in history; `.env` on disk is an empty template; RLS/grant
  discipline, the private bucket and the locked SECURITY DEFINER function are
  compliant.
- Fixed the platform-broken gate: Prettier `endOfLine: "auto"` plus a new
  `.gitattributes` (`* text=auto`). `npm run check` (format/lint/typecheck/62
  unit-integration tests/build) now passes on Windows at a clean checkout.
- Corrected user-facing contradictions: marketing copy claiming no verified
  catalog while `/universities` served a live search; hardcoded English
  metadata on the six auth/dashboard pages; root-layout/metadata reuse of the
  unused `messages` strings; media queries for the missing-page/loading paths
  unchanged.
- Code defects fixed: onboarding silent profile-read failure now renders a
  visible error; catalog deadline sorting is chronological with a lexicographic
  fallback and 500-row union bounds; unstable React keys; duplicate error
  branch in `views.tsx`; redundant dynamic imports; roleless `aria-label`;
  ArrowLeft/ArrowRight asymmetry; proxy auth round-trip on static assets;
  inline `signIn` translation in the marketing layout; dead recovery-error
  copy now rendered on `?error=recovery`.
- Tooling: `turbopack.root` pinned (removes the stray-lockfile warning);
  Playwright validates `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and always
  builds fresh; CI triggers limited to `main` pushes + PRs; db scripts pick
  the Docker named pipe on Windows; Husky `pre-push` runs typecheck + unit
  tests; e2e specs use `baseURL`; db-safety test covers all 12 remote
  selectors; duplicate vitest env cleanup removed; ESLint `@/server/**` deep
  import pattern fixed; `package.json` version 0.4.0 → 0.12.0.
- Documentation synced to HEAD: tracker rows/addendum (Phases 08–09 marked
  IMPLEMENTED, NOT PHASE-VERIFIED), rewritten handoff, README, feature matrix,
  architecture table, design-system note, TEST/RLS matrices, DATABASE_SCHEMA
  later-phase section, CLOUD_DEVELOPMENT drift warning for the unmerged
  Phase 13 branch, corrected master-prompt SHA in REPO_AUDIT, pitch addenda.
- Migration SQL files were NOT edited (applied history is immutable here).
  Long-term hygiene notes (dead superseded definitions, deny-all
  `verification_runs`/`data_revisions`, blanket sequence grant) are documented
  in DATABASE_SCHEMA.md and RLS_MATRIX.md instead.
- Verification recorded: `npm run check` pass; production build pass
  (Turbopack warning resolved); no cloud/remote operation performed.

## Phase 14 — 2026-10-23

- Read project memory, Phase 14 master criteria, pitch context and JETU design contract. UI/UX Pro Max skill and quick reference were read; no mounted search script or Caveman skill/CLI was present.
- Audited clean `work` branch and cloud migration history. Discovered pre-existing applied Phase 13 and Phase 14 migrations absent from this checkout. Recovered five Phase 13 migration files from `origin/codex/phase13-scholarships` and two exact Phase 14 applied statements from the development database. Discarded a redundant local Phase 14 migration draft. Generated actual database TypeScript types through connected Supabase.
- Implemented RU/KK/EN opportunities search/detail, age/grade/type URL filters, official-source and eligibility display, public empty/unavailable states, server-side save/plan actions and private status list. Reused canonical RLS and search RPC. Updated the public nav route and metadata regression test.
- `npm run check` passed after app changes: Prettier, ESLint, strict TypeScript, 65 unit/integration tests and production build. Full first browser run: 58 passed, 2 skipped, 2 failed on missing canonical metadata for the replaced opportunities path. Metadata fixed; targeted rerun recorded in `PHASE_14_REVIEW.md`.
- Rollback-only connected SQL fixture passed nine assertions for published/draft visibility, age/grade filtering, anonymous write denial and cross-user save/plan isolation. Follow-up counts were all zero. Local DB image pull was blocked by registry 403, so no local SQL replay; direct REST/Auth write path remains unverified. Security advisor reports four INFO deny-all editorial tables; performance advisor reports one unindexed opportunity currency FK plus unused indexes on an empty catalog.
- Final `npm run check` after generated types and empty-response handling: format, ESLint, strict TypeScript, 66 unit/integration tests and production build passed. The affected browser rerun passed 18/18 checks.
- Commit `a4f48f2` pushed to `codex/phase14-opportunities`; Vercel preview `dpl_8xgU2u6ccxtKTXqG7usA6dANvG5i` reached READY and returned a real empty catalog over connected fetch. Its canonical URL resolved to localhost because preview app URL was unset; added a validated Vercel preview-origin fallback and a regression test for the next checkpoint.
- Preview-origin follow-up: first unit run exposed an empty-string fallback bug; normalized the configured URL and reran `npm run check` successfully with 67 unit/integration tests and a production build.
- Follow-up commit `ece9742` pushed. Vercel preview `dpl_DjaW3RRT4pXUjNmHy91BeoycxyDr` reached READY; connected fetch of English and filtered Russian opportunities returned HTTP 200 with true empty states and correct HTTPS preview canonical URLs. No production promotion.

## Phase 14 completion — 2026-10-24

- Loaded project memory/master criteria, pitch context, Next 16.4 page/server-action documentation, UI/UX Pro Max and JETU design contract. Read Caveman `lean-build`, `migration`, `verify-and-stop` and `caveman-review` skills. The UI skill's search script was not mounted; its quick reference supplied the review rules.
- Fixed proxy rejection of opportunity detail and private `/dashboard/opportunities`; added route regression tests. Added separate RU/KK/EN RLS-backed school directory and a link from the opportunity page. Fixed Saved status to delete an existing versioned plan action while retaining the save. Files: `src/proxy.ts`, `src/features/opportunities/actions.ts`, `src/features/opportunities/views.tsx`, `src/features/schools/{server,copy}.ts`, `src/app/[locale]/(marketing)/schools/page.tsx`, `tests/unit/proxy-routes.test.ts`, `tests/e2e/opportunities.spec.ts`.
- Reviewed Bow Seat's official 2027 contest overview, FAQ and entry page, then executed `supabase/content/20261024_blue_planet_2027.sql` on the authorized development project. The first attempt rolled back because a verified deadline also needs its own source claim; the corrected transaction succeeded. No schema migration was added. Updated `supabase/tests/opportunities.test.sql` so synthetic assertions target their fixture slug despite real catalog rows.
- `npm run check` passed after school changes: Prettier, ESLint, strict TypeScript, 67 unit/integration tests and production build. After the private-route fix, `npx vitest run tests/unit/proxy-routes.test.ts` passed 2/2; the commit hook passed strict typecheck and 69 unit/integration tests. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` passed 70, skipped 2 on desktop/mobile after an assertion fix; final post-fix rerun is recorded below. The initial targeted run exposed a test-only raw HTML assertion that matched hidden Next 404 boundary text; it was changed to assert rendered `main#main` and rerun.
- Cloud rollback fixture passed 9/9 assertions; anon RPC returned the real item with the sourced June 7 2027 11:59 PM EDT deadline, while age 19 excluded it. Vercel `dpl_3e4dMHyHiHvyzcuWdRrzXVLkonEh` (commit `316ad5b`) and final `dpl_AQd4ZT3uzH7zHdbQpTVbgHyRgqw4` (commit `62a227a`) reached READY. The final protected preview returned HTTP 200 for RU/KK/EN populated detail, age-filtered list and a real empty school directory with correct HTTPS canonical URLs.
- In an ephemeral Vercel sandbox, two temporary Auth users exercised live Supabase Auth/REST and owner RLS: login 200, RPC 200, duplicate saves 201/201 but one row, plan 201, versioned status update 200 to `preparing`, second-account reads zero and cross-owner insert 403. The actual Next detail form returned 303 success and persisted the save; detail/workspace forms returned 303 for planned, preparing, Saved. The private workspace returned 200 after reload. Returning to Saved left one save and zero plan rows. Temporary users, identities and action rows were deleted; final counts were 0/0/0/0 with one reviewed opportunity. Sandboxes were stopped.
- Git commits `316ad5b` and `62a227a` were pushed to `codex/phase14-opportunities`. The exact documentation checkpoint commit and final E2E result are recorded below. No production promotion, PR CI or local migration replay was claimed; local Supabase image registry remained 403.
- Final post-proxy-fix `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: **70 passed, 2 existing skips, exit 0** against a fresh production build.
- Independent review found the school directory's 24-row cap and stale-source exposure. Replaced it with bounded 12-row URL pagination (max page 200), filtered source checks older than 180 days and added invalid-page feedback. `npm run check` passed with 71 unit/integration tests and a production build; affected `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/e2e/opportunities.spec.ts` passed **20/20** across desktop/mobile, including school-page bounds and axe.
- Checkpoint commit `770b17b` pushed to GitHub; Vercel `dpl_Cr3QLXtrABKDrBTEdW75dCDM4nD2` reached READY from that exact SHA. Final preview requests returned 200 for the real detail, school empty state, invalid school page and age-19 exclusion, with correct HTTPS canonical URLs. GitHub showed no failed checks; its Supabase Preview check was skipped, and no PR CI was run.
