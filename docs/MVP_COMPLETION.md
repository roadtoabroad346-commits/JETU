# MVP completion — 2026-11-03

Status: **PARTIAL**. Implemented fixes are locally checked; release gates below remain open. Scope is the existing admissions MVP:
public RU/KK/EN pages → account/profile → discovery → save/compare → matching.
The pitch's paid services, mentor network and AI coach are outside this release.
User explicitly requested implementation, verification and saving to GitHub.
Old _Codex environments_, not the nested original upload, are the cleanup target.
No available tool lists/deletes those environments; do not substitute repository deletion.

## Acceptance matrix

| Journey                | Expected result / components                                                                  | Verification                                         | Status                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Public discovery       | Localized navigation, responsive pages, URL-backed filters                                    | Production Playwright, axe, keyboard, screenshots    | PASS (local browser scope)                                                  |
| Suggestions            | Current query only, keyboard/touch selection, Escape/blur dismissal, network recovery         | Browser regression with clearly labeled API fixtures | PASS (local browser scope)                                                  |
| Account/profile        | Real sign-in, save/reload, owner isolation                                                    | Hosted Auth/REST and two accounts                    | BLOCKED: proxy CONNECT 403; no workspace credentials                        |
| Save/compare           | Persist private selections, compare published sourced facts                                   | Local tests + real two-account journey               | Real journey BLOCKED                                                        |
| Matching               | Validate preferences, preserve edits on failure, retry correct operation, explain results     | Unit/browser checks + actual profile/catalog/run     | Local checks PASS; real integration BLOCKED                                 |
| Motion/accessibility   | Consistent token durations, transform/opacity, reduced motion, focus and status announcements | Browser computed styles, axe, 320/768/1440px         | PASS (local browser scope)                                                  |
| Repository/environment | Verified commit saved remotely; newest workspace identifiable                                 | Git remote SHA; environment management               | Save branch: codex/mvp-quality-2026-11-03; environment deletion unavailable |

## Findings and acceptance

| Priority | Impact / location                                                                                    | Reproduction and cause                                                                                       | Fix acceptance / verification                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| P1       | Real admissions flow cannot be verified                                                              | Auth URL returns CONNECT 403 from managed proxy; previous handoff reports no published programs/scholarships | Reachable authorized Auth/REST and sourced corpus; never substitute fixtures for real integration                         |
| P2       | Autocomplete shows obsolete choices; can reopen after dismissal (`features/search/autocomplete.tsx`) | Change query while suggestions visible, Escape during request or Tab away; old results/open state retained   | No stale options, late reopen, nested interactive controls or dangling ARIA; browser fixtures including delayed responses |
| P2       | Matching retry loses entered preferences (`features/matching/workspace.tsx`)                         | Failed POST → retry invokes GET and replaces draft                                                           | Retry POST with retained valid draft; errors and pending state accessible                                                 |
| P2       | Matching invalid codes produce generic outage message                                                | Country/term format accepted by UI but rejected by API schema                                                | Shared schema before request, localized field errors, focus invalid field                                                 |
| P2       | Invalid Playwright executable claims fallback but uses missing path (`playwright.config.ts`)         | Set nonexistent override                                                                                     | Actual fallback to managed Chromium; config import with nonexistent path PASS                                             |
| P3       | Search/matching state changes lack consistent motion                                                 | Open suggestions, matching loading/result state                                                              | Token-driven finite feedback; static reduced-motion alternative                                                           |

Baseline: `npm run check` PASS (format/lint/types, 78 tests, production build).
Production Chromium baseline: 64 passed, four Auth-dependent skips. Supabase management reports ACTIVE_HEALTHY;
this does not establish reachable student-facing Auth/REST.

## Additional confirmed finding

P1: an old profile form could overwrite a newer profile because saving re-read the
latest version and then unconditionally upserted its stale fields. Reproduce with
two tabs loaded at version N, save one, then save the other. The form now submits
its rendered version, and the server compares both before and during UPDATE.
First saves use INSERT, never an overwriting upsert. Conflict messages are localized;
failed reads disable submission. Five adapter tests pass. Six real development SQL
assertions pass in a rolled-back transaction: valid CAS, stale CAS rejected, winner
preserved, two history versions, cross-owner reads and writes denied. Follow-up
query confirmed zero test users. This is SQL evidence, not a hosted login test.

## Research and chosen improvements

Fetched current sources through the allowed network on 2026-11-03:

- [WAI-ARIA combobox pattern](https://github.com/w3c/aria-practices/blob/main/content/patterns/combobox/combobox-pattern.html): implemented Escape/Tab dismissal,
  input-held focus, active-descendant cleanup and keyboard reopening. W3C document
  license; independently implemented behavior, no copied library, service cost or
  extra data sharing. Small maintenance cost within the existing React component.
- [Motion](https://github.com/motiondivision/motion): maintained React-compatible
  MIT project already in the stack. For these small feedback transitions, existing
  CSS tokens suffice: transform/opacity, 120/160/220ms, finite loading pulse, explicit
  reduced-motion opt-out. No extra package, subscription or privacy surface.
- [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
  retrieved via connected docs: retain authenticated owner filtering and RLS when
  adding a version predicate. No new infrastructure or changed access policy.

A new hosted search engine or animation framework offers no demonstrated benefit
for the current tiny published corpus, so neither was introduced. The Supabase
changelog URL returned proxy 403; this is recorded rather than claimed as read.
UI/UX Pro Max reference rules and React Best Practices were used; no local skill
search execution is claimed.

## Verification evidence and limits

- **PASS** baseline `npm run check`: format/lint/types, 78 tests, production build.
- **PASS** baseline production E2E: 64 passed, 4 Auth-dependent skips.
- **PASS** final `npm run check`: format/lint/types, 83 tests, production build.
- **PASS** final production E2E: 70 passed, four Auth-dependent skips (74 total). New tests use mocked suggestion
  responses, not real catalog retrieval. An initial regression run had four test
  failures because an unscoped option selector also selected native filter options;
  the selectors were narrowed to the suggestion listbox and rerun. The next run
  exposed a real axe nested-interactive violation in the original suggestion markup;
  the option semantics were moved onto the link and that regression was rerun.
- **PASS** actual MatchingWorkspace browser component with mocked API: validation
  prevents POST, invalid field focus, retained draft after 503, identical POST retry,
  success announcement, initial GET retry, 401 login recovery, responsive 320/768/1440
  and axe. Screenshots were inspected at phone and desktop widths. See evidence folder.
- **PASS** `npm audit --omit=dev --json --fetch-retries=0 --fetch-timeout=20000`:
  zero production vulnerabilities.
- **FAIL** full dependency audit: 13 moderate affected development packages, all
  from minimatch advisory GHSA-g3hv-75wg-m249; zero high/critical. The advisory
  requires minimatch >=11.0.1 while the pinned lint toolchain consumes older majors.
  npm proposes incompatible tool downgrades; no forced downgrade or unreviewed
  major override applied. This tooling debt remains explicit.
- **PASS** hosted project metadata ACTIVE_HEALTHY and read-only corpus inventory:
  degree program and scholarship remain drafts; one published opportunity.
- **BLOCKED** hosted Auth/REST: `curl -I --max-time 20
https://edpuovkgoisyzpguksdi.supabase.co/auth/v1/health` returns CONNECT 403.
  Real registration/email/login/profile persistence/matching/save/compare/two-account
  browser integration is not certified. Workspace runtime reports no configured secrets.
- **NOT RUN** clean DB replay/full local Supabase, physical devices/WebKit,
  production deployment and performance certification. No schema change in this pass.
- **BLOCKED** deleting old Codex environments: available tools only inspect the
  currently attached environment. There is no list/delete capability. User must
  remove old environments in Codex settings after retaining the workspace containing
  this GitHub checkpoint; their names/contents were not available for comparison.

No database records were published, no production deployment was requested, and no
existing environment or repository copy was deleted. The original `jetu/` upload
was explicitly excluded by the user's clarification.

## Reproduce

From repository root with Node 24.19.0 / npm 11.9.0: `npm ci`, `npm run check`,
then `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`.
`npm run dev` serves `/ru`, `/kk`, `/en`; `/en/search` exercises URL-backed filters.
A configured, reachable Supabase plus reviewed published data and two real test
accounts is required to validate `/en/onboarding`, `/en/match`, `/en/saved` end to end.
For the isolated matching UI check, copy the evidence harness to `work/matching-browser.mjs`
and run `node work/matching-browser.mjs`; it uses Vite already installed by the pinned
Vitest dependency and serves only localhost. Its API/action boundary is explicitly mocked.

## GitHub checkpoint

Saved on branch `codex/mvp-quality-2026-11-03`, based on `6b0657c` from `main`.
The commit includes code, tests and this evidence. A draft PR targets `main`;
merging/deployment is not claimed. Keep this branch/checkpoint when selecting the
current Codex environment; tools cannot compare or remove the other environments.
