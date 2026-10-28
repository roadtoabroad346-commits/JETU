# Phase tracker — updated 2026-10-28

## Current recovery checkpoint

This checkpoint supersedes stale deployment statements below. Authority migration
`20261028123545` is applied to Jetuu development; the server secret is configured
for Preview. Commit `5cde7ba` passed all three CI jobs (`40689442104`): 169 unit
tests, 86 production-browser cases, two clean replays with 220 SQL assertions,
types/advisors and 36 disposable real Auth/Storage/browser checks. These are not
hosted user journey evidence. Both QA identities are email-confirmed.

Weekly workload planning now uses saved availability, prerequisite urgency,
completed work and personal dates, with separate official-deadline risk. This is
a derived two-year work estimate; it does not rewrite deadlines or invent grade
rules. Populated synthetic UI checks cover three locales/widths, accessibility,
capacity change/reload and all five views. No whole phase is relabeled VERIFIED.

External gates: enforced package-manager-only networking denies hosted Supabase
and Vercel from this executor; a real editor must review catalog claims and date
conflicts (CATALOG_REVIEW_2026_10_28.md). Country/grade pacing, structured program
document extraction, scanner/purge/backup/consent and later product phases remain
independent work. Existing dated reports below are historical evidence.

**Current: Phase 19 PARTIAL.** Private Vault/Writing and development migrations implemented; scanner/hosted Auth/mentor/editorial gates remain open. See `PHASE_19_QA_AND_RELEASE.md` and `PREVIOUS_PHASE_CLOSURE_19.md`.

Historical Phase 16.5 continuation: same-host/different-scheme matching requests are now
rejected, malformed dates cannot crash recommendation cards, and mobile public
navigation and card feedback were refined. One institution, program and
scholarship remain `draft`/`needs_review`; zero are published. Phase 16 remains
**PARTIAL**. Details: `DESIGN_AUDIT.md`, `PRODUCT_QA_REPORT.md`, and
`PHASE_16_RELEASE_AUDIT.md`.

Current request state: **Phase 17 PARTIAL — local repair prepared on 2026-10-27**.
Server-only generation authority, direct-write guards and completed-graph regeneration
are repaired locally and SQL-tested; the cloud still has the old RPC. No whole earlier
phase is upgraded. Master feature/hosted/editorial/UI/type-drift gates remain explicit
in `PHASE_17_COMPLETION_REVIEW.md`; external synchronization requires approval under
`PHASE_17_DEPLOYMENT_PLAN.md`. Phase 19 work and its independent blockers are preserved.

| Phase | Title                                                            | Status                     | Evidence / dependency                                                                                                                                                                          |
| ----- | ---------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01    | Forensic audit питча, репозитория и продуктовых утверждений      | UNVERIFIED                 | No prior checkpoint or implementation evidence in supplied repo                                                                                                                                |
| 02    | Product strategy, UX research и сфокусированный wedge            | UNVERIFIED                 | No prior checkpoint or implementation evidence in supplied repo                                                                                                                                |
| 03    | Supabase-first modular architecture, ADR и domain boundaries     | UNVERIFIED                 | No prior checkpoint or implementation evidence in supplied repo                                                                                                                                |
| 04    | Репозиторий, зависимости и инженерный фундамент                  | PARTIAL                    | App + CI DB replay/SQL/types and cloud baseline verified; full stack / direct cloud REST unverified; see latest evidence                                                                       |
| 05    | Уникальная визуальная система Jetu и brand identity              | VERIFIED                   | Pitch reconciled; tokens/assets/shared components; RU/KK/EN showcase; 50 unit/integration + 30 E2E, axe, contrast and 6 visual diffs passed; see PHASE_05_REVIEW                               |
| 06    | High-converting landing, SEO и motion                            | PARTIAL                    | 39 localized pages, truthful demo, SEO, Chromium/axe and mobile Lighthouse lab evidence; onboarding/pricing/catalog gates open. See PHASE_06_REVIEW                                            |
| 07    | IA, mobile UX, localization и accessibility                      | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 08    | Supabase Auth, RLS, sessions, roles и onboarding                 | IMPLEMENTED (NOT VERIFIED) | Auth actions/callbacks/session refresh shipped in `6dde0de`; no phase gate or acceptance evidence recorded yet                                                                                 |
| 09    | Полноценный Academic & Personal Profile Builder                  | IMPLEMENTED (NOT VERIFIED) | Dashboard group and `student_profiles` persistence shipped in `4e7e7e0`; unit tests only; no phase gate recorded yet                                                                           |
| 10    | Canonical PostgreSQL Global Admissions Database                  | UNVERIFIED                 | Cloud normalized schema exists; migration SQL recovered, phase acceptance not rechecked                                                                                                        |
| 11    | Data ingestion, верификация, обновления и provenance             | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 12    | University & Program Explorer                                    | PARTIAL                    | Read-only cloud SQL search, pages, filter fixtures; no real reviewed rows; REST proxy 403; see Phase 12 review                                                                                 |
| 13    | Scholarship Intelligence & Financial Aid Explorer                | PARTIAL                    | Recovered scholarship schema/routes/tests; editorial and hosted journey unverified                                                                                                             |
| 14    | Global Opportunities Hub, школы и extracurriculars               | PARTIAL                    | Recovered opportunities schema/routes/tests; full source and real-user acceptance unverified                                                                                                   |
| 15    | Unified Search, Saved Lists и Side-by-side Compare               | PARTIAL                    | Programs/scholarships/opportunities search, private saves and 2–4 program compare implemented; cloud SQL/RLS/10k benchmark and local UI checks pass; live corpus/REST/deploy gates remain open |
| 16    | Explainable Matching Engine v1 + evaluation                      | PARTIAL                    | Deterministic rules/ranking and development RLS tests; one unpublished program/scholarship staged, zero reviewed/published, no hosted Auth/REST E2E                                            |
| 17    | Personalized Roadmap & Gap-to-Action Planner                     | PARTIAL                    | Local authority/regeneration repair with SQL regression proof; master feature, hosted/editorial/UI and exact-CI gates remain. See PHASE_17_COMPLETION_REVIEW.md                                |
| 18    | Admissions Application CRM: от draft до enrollment               | PARTIAL                    | Application CRM recovered from PR #4; audit erasure fix SQL-tested; hosted/editorial gates open                                                                                                |
| 19    | Secure Supabase Document Vault & Writing Workspace               | PARTIAL                    | Private Vault/Writing; 79 rollback SQL assertions; scanning/hosted/mentor gates open                                                                                                           |
| 20    | Jetu AI Coach: grounded assistant with tools                     | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 21    | AI Writing Studio, Essay Coach, CV & Interview Lab               | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 22    | Verified Mentor Network and Review Workflow                      | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 23    | Deadline Engine, Notifications и Calendar                        | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 24    | Student Dashboard & Outcomes Intelligence                        | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 25    | Post-offer Finance, Visa & Enrollment Journey                    | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 26    | B2B School / Counselor Multi-tenant Workspace                    | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 27    | Monetization, Billing, Entitlements & Unit Economics             | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 28    | Operations/Admin Studio, Content Governance & Support            | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 29    | Supabase RLS security, QA, resilience, performance and cost      | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |
| 30    | Production readiness, launch plan, metrics & YC-quality evidence | BACKLOG                    | Not started; requires explicit phase authorization                                                                                                                                             |

## Phase 04 gate

- [x] Scope/plan, root modular Next/TS structure, lockfile and runtime pins.
- [x] Env validation, separated typed client factories and sanitized API contract.
- [x] Local-only DB guards and migration/test/config files.
- [x] Fresh Git-clone npm ci + complete check (format/lint/typecheck/50 tests/build), clean clone tree.
- [x] Actual rendered three-locale browser/axe/keyboard/reduced-motion/no-JS/responsive checks.
- [x] Dev HTTP smoke and public-bundle synthetic secret-canary scan.
- [x] CI configuration without production secrets; hooks and docs.
- [x] Disposable CI PostgreSQL: two clean migration replays and 14 pgTAP assertions per pass; security advisor passed.
- [x] Authorized cloud Jetuu baseline, 14 transactional SQL assertions, both cloud advisors, no leftover probes.
- [x] Actual CI DB types saved instead of placeholder; cloud-generated output saved separately.
- [x] Remote CI inspected; initial failure isolated to placeholder drift, frontend passed. See latest run evidence for rerun.
- [ ] Full local Supabase Auth/Storage/Realtime/email/API runtime; excluded by no-workspace-Docker workflow.
- [ ] Direct cloud REST/SDK round trip: managed proxy CONNECT 403; MCP SQL passed.
- [ ] Supabase changelog index access: proxy 403; current docs consulted through MCP.

Cloud/CI database gates are now executable without workspace Docker. Phase 04 remains PARTIAL against the original full-stack gate; do not infer excluded services are verified. See CLOUD_DEVELOPMENT.md and NEXT_AGENT_PROMPT.md for remaining limits. Phase 05 has separate UI evidence below.

## Phase 05 gate — 2026-10-18

- [x] Authoritative GitHub checkout and all project memory/exact master criteria read.
- [x] Actual 8-page pitch inspected; source/web color reconciliation documented.
- [x] Installed UI/UX Pro Max commands/results/hashes; Caveman absence disclosed.
- [x] Semantic colors and scales; original vector Jetu/J assets and SVG favicon.
- [x] All requested component families in localized working showcase; no fake writes.
- [x] Existing availability, boundaries, locale, HTTP/env/security behavior preserved.
- [x] Check passed: format/lint/strict TS/50 unit-integration/production build.
- [x] 30/30 production browser regressions; 10 axe reports: zero violations/incomplete.
- [x] 19 semantic contrast pairs; phone/desktop/landscape/200% text/reduced-motion.
- [x] Six zero-diff screenshots against new Chromium 154 Linux baselines.
- [x] Separate source/security/acceptance review, documentation and local checkpoint.

Scope limits: system Chromium 154.0.8037.57 / Liberation Sans baseline profile;
Playwright's bundled Chromium 156 download returned proxy 403 Domain forbidden.
Do not claim a remote CI run, cross-browser/device certification or production
readiness for this checkpoint. Existing Supabase runtime/network limitations are
unchanged. No Phase 05 DB/API change or remote schema operation was required.

## Phase 06 gate — 2026-10-18

- [x] Explicit phase request, master criteria, project memory, pitch and design contract read; scoped plan saved.
- [x] RU/KK/EN landing and all 12 requested information paths per locale; main links reach valid routes.
- [x] Demo concept clearly labeled, keyboard/reduced-motion behavior; no fabricated records, AI response, partners or outcomes.
- [x] Per-page canonical/hreflang/metadata, OG image, sitemap, robots and truthful WebSite/FAQ schema.
- [x] Noindex by default; public indexing requires explicit server flag and nonlocal canonical origin.
- [x] Format/lint/strict TS/unit tests/build, responsive/no-JS/axe/keyboard/route regressions and local mobile Lighthouse recorded.
- [x] No product tables, data API, privileged browser key, remote DB mutation or migration added; RLS contract preserved.
- [ ] Primary signup CTA reaches a live, secure onboarding flow. Auth is Phase 08 and is not currently implemented.
- [ ] Verified scholarship/program discovery and dated provenance records. Catalog and ingestion are later phases.
- [ ] Approved public pricing/checkout, verified mentor network and official support channel. Current pages state unavailable.
- [ ] Agreed mobile release budgets and deployment/field measurement. Final-build local Lighthouse scored 61–84 across four runs with LCP 2.601–3.766s; localhost SEO is intentionally noindex. See PHASE_06_REVIEW.md.

Phase 06 remains PARTIAL because its master acceptance gate explicitly requires real
onboarding rather than an informational destination. No deployment or Phase 07 work
is implied by this checkpoint. Exact review and metrics: PHASE_06_REVIEW.md.

## Phase 12 gate — 2026-10-21

- [x] Exact Phase 12 criteria, design contract, pitch context and code dependencies inspected; plan saved. Caveman unavailable. UI/UX Pro Max skill read; its cloud search script is unavailable in this workspace.
- [x] Recovered missing Phase 08–10 migration files from authorized development migration history; no duplicate catalog tables.
- [x] Read-only SECURITY INVOKER SQL search, existing RLS/grants and verified source-claim gate; applied migrations `20261021113901` and `20261021114706` to Jetuu development only.
- [x] Server search API and RU/KK/EN explorer/detail routes, URL forms, source/cost/funding/requirements/intake display, actionable error/empty states. Unsupported save/compare/plan controls omitted.
- [x] Synthetic rollback test: published_visible=1, matching_facets=1, secondary_facets=1, budget_match=1, budget_excludes=0, deadline_match=1, deadline_excludes=0, draft_hidden=0, wrong_country=0, search_match=1, hidden_search=0; leftover fixtures=0.
- [x] `npm run check`: format, ESLint, strict TypeScript, 54 unit/integration tests, production build passed. Cloud-generated database types saved.
- [ ] Real reviewed university/program/funding corpus and Phase 11 editorial ingestion/review workflow.
- [ ] Direct Supabase REST/API rendering from this workspace: CONNECT tunnel 403. UI currently shows its verified unavailable state; live records cannot be checked end to end here.
- [ ] Local PostgreSQL replay: container registry denied image pull with 403. Cloud SQL transaction verified function, not clean-room replay of recovered migration chain.

See `docs/PHASE_12_REVIEW.md` for browser/security evidence and outstanding criteria.

## Addendum — 2026-10-23 audit and maintenance pass

A full-repository audit found and fixed defects outside any single phase:

- `npm run check` was failing on Windows (Prettier line-endings); the gate is
  now platform-neutral (`endOfLine: "auto"` + `.gitattributes`). Lint, strict
  typecheck, 62 unit/integration tests, production build and the format gate
  all pass locally at this state.
- Documentation set was out of sync with HEAD (Phases 08–09 shipped while docs
  still described Phase 06-era scope). Status tables, README, architecture,
  schema, RLS/TEST matrices and the feature matrix now reflect actual state
  without upgrading any phase to VERIFIED.
- User-facing copy contradictions fixed: `marketing` copy previously said the
  verified catalog did not exist while `/universities` renders a live search;
  auth/dashboard pages had hardcoded English `<title>` metadata; a DB read
  error in onboarding rendered an empty form silently.
- `scripts/db.mjs` now selects the Docker named pipe on Windows instead of
  failing with a Unix-only `DOCKER_HOST`; CI deduplicates push/PR runs; e2e
  webServer always builds a fresh bundle.

No new phase work is implied by the addendum and no phase was upgraded.

## Addendum — 2026-10-24 Supabase Preview repair

- Supabase MCP reported the Git-linked Jetuu `main` branch as
  `MIGRATIONS_FAILED`; remote history contained sixteen versions while `main`
  contained nine.
- Restored the exact five Phase 13 and two Phase 14 migration files from
  `origin/codex/phase14-opportunities`. Their Git blob hashes match; no cloud SQL,
  data mutation, feature merge, or phase-status change occurred.
- `npm run check` passed: formatting, lint, strict TypeScript, 62 unit/integration
  tests and production build. Local database replay was blocked before execution
  by Docker image-layer registration (`no space left on device`); CI and the
  post-push Supabase Preview are the remaining integration evidence.
- Push run `40093573608` subsequently passed startup, two clean migration resets,
  both pgTAP runs, advisors and type generation. Its sole database-job failure was
  the intentional generated-type drift check. The exact retained CI artifact was
  committed as `src/lib/supabase/database.types.ts`; frontend and Supabase Preview
  were already green.
- At the owner's explicit request, active `main` history was consolidated into a
  single verified root so obsolete per-SHA failures no longer appear in its commit
  list. The former complete chain is recoverable at annotated tag
  `archive-main-before-rewrite-2026-10-24`; phase statuses were not upgraded.

## Phase 15 gate — 2026-10-25

- [x] Master scope reconciled: unified kinds are program, scholarship and
      opportunity; universities remain provider/explorer records; comparison is
      program-only; Phase 16 eligibility/matching is excluded.
- [x] Exact missing Phase 15 cloud migration restored to Git; generated types
      synchronized; misleading Phase 14 eligibility verdicts changed to factual
      `within_range` / `outside_range` through additive migrations.
- [x] Localized URL-backed search/filter/sort/pagination, keyboard autocomplete,
      source freshness, truthful empty/error/loading states and real detail links.
- [x] Private saved items/searches with re-authenticated actions, uniqueness and
      owner RLS; program comparison accepts 2–4 IDs and renders sparse/unknown facts.
- [x] Unified RPC remains SECURITY INVOKER, uses allowlisted JSON input, bounded
      pages and no service key/shared response cache; public visibility gates apply
      to rows, counts, suggestions and comparison.
- [x] Performance prerequisite repaired: 10k browse improved from 21,834 ms to
      327.675 ms; representative filtered query measured 698.999 ms.
- [x] Cloud pgTAP 23 and rollback benchmark pass; local unit/build/lint/type
      checks and Phase 15 Chromium desktop/mobile 10/10 pass.
- [ ] Representative reviewed corpus: development has one current opportunity
      and zero programs/scholarships.
- [ ] Hosted REST/Auth browser proof and real save/reload: workspace network
      cannot reach Supabase data plane.
- [ ] Clean local DB replay: Docker image extraction exhausted workspace disk.
- [ ] Vercel deploy: the connector authenticated to `Impact hub`, but creating a
      linked `jetu` project was rejected because its GitHub integration is not installed.

Exact evidence and residual limits: `docs/PHASE_15_REVIEW.md`. Phase 15 is
**PARTIAL**, not VERIFIED. Phase 16 is now authorized; see the Phase 16 gate below.

## Phase 16 gate — 2026-10-25

- [x] Audited Phase 08–15 dependencies; repaired profile save overwriting independent JSON fields and added owner-safe matching contracts. No other unrelated module was rewritten.
- [x] Reused normalized published search, requirement, deadline, benefit, source-claim, tuition and profile data; no fabricated catalog rows persisted.
- [x] Separate deterministic mandatory rule statuses and weighted preference points with explicit evidence, freshness, timestamp and unknown handling. No probability or official decision claim.
- [x] Additive development migrations `20261025081728`, `20261025082123`, `20261025083044`; generated DB types synchronized. Owner RLS, grants, limits, FK/entity guards and configuration stored.
- [x] Authenticated bounded API, 30s/20-per-day limits, timeout, validation, origin check; RU/KK/EN profile/match UI with profile readiness, preferences, explanations, source links, save, compare and retry.
- [x] Cloud transactional SQL: 18 matching RLS/grant/ownership assertions passed; rollback left no fixtures. Local 78 unit/integration, lint, typecheck and production build passed; full Chromium regression passed 64 with four Auth-dependent skips, recorded in `docs/AI_MATCHING_ARCHITECTURE.md` and implementation log.
- [x] Commit `afa3f11` pushed to GitHub `main`; Vercel linked `jetu-phase13-preview` and its commit-matched preview reached READY. Preview `/api/health` returned 200, `/{locale}/match` reached sign-in for an anonymous visitor, and `/en/search` rendered the one real opportunity. Supabase Git-linked `main` branch reported `ACTIVE_HEALTHY` after migrations.
- [ ] Reviewed live programs and scholarships: development project has zero of each. Phase 11/13 editorial coverage is incomplete.
- [ ] Hosted Auth/REST student journey and cross-device result reload: workspace proxy CONNECT 403. Local PostgreSQL image pull from registry: 403.
- [ ] Visual authenticated browser/accessibility proof and full Supabase end-to-end regression.
- [ ] Optional external AI provider: no configured credentials, deterministic explanations only.

**Status: PARTIAL**. Keep this label until a small verified live corpus and reachable Auth/REST runtime prove login → profile → matching → details/save/compare → preference edit/recalculation and two-user isolation. Stop before Phase 17.

## Phase 17 gate — 2026-10-26

- [x] Deterministic owner-scoped Roadmap schema, dependency DAG, regeneration merge and RU/KK/EN timeline/board/list views recovered from `codex/phase17-roadmap`.
- [x] Applied development migrations `20261026072804` and `20261026073138`; prior remote CI passed two clean replays, 66 pgTAP assertions per replay, advisors, generated types, frontend and Chromium checks.
- [x] Reusable official-source adapter contract now enforces jurisdiction/system metadata, exact host allowlists, conservative rate/concurrency limits, legal-review gating, backoff, evidence excerpts and deterministic change review.
- [ ] Reviewed published program/scholarship targets, hosted two-user Auth persistence, populated responsive/axe proof and independent generation-authority closure.

**Status: PARTIAL.** The Phase 18 continuation does not upgrade the inherited Roadmap evidence or fabricate editorial coverage.

## Phase 18 gate — 2026-10-26

- [x] RU/KK/EN application portfolio (board/list/metrics/create) and detail workspace (source/deadline/readiness, notes/reference/priority, checklist, guarded state controls, explicit submission confirmation, scholarship tracker and event timeline).
- [x] Five owner-RLS tables with read-only client grants, six bounded authenticated command RPCs, optimistic versions, idempotent state changes, append-only events and generated database types.
- [x] Canonical program and independent scholarship state machines; mandatory checklist readiness; user-reported submission/outcome provenance; Roadmap submission-task completion remains subject to its dependency trigger.
- [x] Jetuu development migrations `20261026164251`, `20261026164434`, `20261026164713`; rollback-only SQL reached 28 assertions and left no fixtures. `npm run check` passed 116 tests/build; desktop API-boundary Chromium passed.
- [x] Remote CI run `40391982239`: two clean resets/replays and all pgTAP passed; advisors, generated-type drift and typecheck passed. This runner's local Docker daemon remained unavailable.
- [ ] Real populated workspace, hosted two-user browser/cross-device persistence, authenticated responsive screenshots and axe: development has zero published/verified programs and scholarships.
- [x] Draft PR #4 and commit-matched `cdc5a7e` Vercel preview: READY; health/home/login/search returned 200 and anonymous plan/applications rendered sign-in.

**Status: PARTIAL.** Exact evidence and residual gates: `PHASE_18_QA.md`, `APPLICATION_STATE_MACHINE.md`, `APPLICATION_AUDIT_TRAIL.md` and `RELEASE_REPORT_PHASE_17_18.md`.

## Phase 19 gate — 2026-10-27

- [x] Latest Phase 17/18 draft branch recovered without merging unrelated PRs.
- [x] Private immutable Vault, quarantine/scan authority, checksums, associations,
      retention/archive/delete, bounded ZIP and safe text preview contracts implemented.
- [x] Confidential email-bound recommendation request/status and recommender-owned
      storage; no mentor entitlement without a verified assignment/consent model.
- [x] RU/KK/EN plain-text Writing with explicit saves, Unicode counts, revisions,
      conflict protection, self-review and text/Vault export.
- [x] 79 development rollback SQL assertions, focused domain/service tests and
      synthetic mobile/tablet/desktop axe/visual checks. See release report.
- [ ] Real scanner/purge scheduling, object-backup restore and hosted two-user,
      mentor/recommender, application/Roadmap and cross-device acceptance.
- [ ] Final remote CI/preview results: tracked in `PHASE_19_QA_AND_RELEASE.md`.

**Status: PARTIAL.** No prior whole phase is newly VERIFIED. Do not begin Phase 20
or promote to production while mandatory privacy gates remain open.

Phase 19 first fully observed source gate: `a916e70`, draft PR #5, green CI `40461693194`.
163 unit/integration; 86 browser cases (zero skipped); two clean DB replays,
197 pgTAP assertions each; type drift/advisors; 29 real disposable Auth/Storage/Next
browser checks. Ten synthetic localized/axe/retry cases also pass. This closes
specific runtime/isolation/replay gates; real scanning, hosted/mentor/recommender,
backups and editorial acceptance remain open. Full phase status stays **PARTIAL**.

Final application recovery source `472fe5e`: removed attachments stay visible and
can be detached without changing application status. Local full checks (163),
11 synthetic UI cases and 79 hosted rollback assertions pass; complete replay is
now 200 assertions. Current-head CI lives in PR #5 checks. External gates and
PARTIAL status are unchanged.
