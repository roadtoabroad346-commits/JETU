# Phase 16.5 product and design audit — 2026-10-25

Scope: routes and components present on `codex/phase16-5-hardening`. Source inspection, production Chromium at 320/375/1440 px, RU/KK/EN public routes, and the existing axe checks inform this audit. Private, authenticated screens were code-reviewed but could not be rendered against a signed-in staging account. The development database has no published programs or scholarships, so populated catalog and recommendation cards could not be visually checked with real data.

The current design contract is `design-system/jetu-admissions/MASTER.md`, the approved blue/yellow tokens in `src/styles/tokens.css`, and page overrides. UI/UX Pro Max guidance was checked for keyboard focus, touch targets, responsive overflow, restrained motion and reduced-motion behavior. The existing palette and Latin/Cyrillic system-font stack remain appropriate; no new font or decorative asset was needed.

## Section review

Each row covers functionality (F), usability (U), hierarchy (H), responsive layout (R), accessibility (A), loading (L), motion (M), security (S), data accuracy (D), integration (I), errors (E), empty state (Ø), mobile use (Mb), and consistency (C). `✓` means checked in runnable local browser or automated tests; `c` means code-reviewed only; `b` means blocked by staging Auth or reviewed data; `!` identifies a concrete issue below. These are evidence scopes, not certification.

| Existing section                      | F   | U   | H   | R   | A   | L   | M   | S   | D   | I   | E   | Ø   | Mb  | C   | Notes                                                                       |
| ------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --------------------------------------------------------------------------- |
| Landing and information pages         | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | c   | c   | ✓   | ✓   | ✓   | ✓   | ✓   | Localized routes and compact hero checked; conversion cannot be measured.   |
| Sign-up, login, recovery              | c   | c   | c   | c   | c   | c   | c   | c   | b   | b   | ✓   | c   | c   | c   | Sign-up and recovery tested; login needs configured Auth to render.         |
| Onboarding and student profile        | c   | c   | c   | c   | c   | c   | c   | c   | b   | b   | c   | c   | c   | c   | Private page requires hosted Auth.                                          |
| University and program explorer       | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | c   | b   | b   | ✓   | ✓   | ✓   | ✓   | URL filters and recovery tested; no published program row.                  |
| University and program details        | c   | c   | c   | c   | c   | c   | c   | c   | b   | b   | c   | c   | c   | c   | Detail relations exist; real row display unverified.                        |
| Scholarship discovery and details     | c   | c   | c   | c   | c   | c   | c   | c   | b   | b   | c   | c   | c   | c   | Source-backed staging only; funding display unverified live.                |
| Opportunity discovery and details     | c   | c   | c   | c   | c   | c   | c   | c   | c   | b   | ✓   | ✓   | c   | c   | A prior preview found one published opportunity; local REST is unavailable. |
| Unified search, filters, autocomplete | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | c   | c   | ✓   | ✓   | ✓   | ✓   | ✓   | URL state, keyboard suggestions and 320 px reflow tested.                   |
| Program comparison                    | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | c   | c   | b   | c   | ✓   | ✓   | ✓   | ✓   | Invalid/empty compare checked; real side-by-side values await data.         |
| Saved items and searches              | c   | c   | c   | c   | c   | c   | c   | c   | b   | b   | c   | c   | c   | c   | Owner RLS was tested in earlier transactional SQL, not live browser.        |
| Matching and explanations             | c   | c   | c   | c   | c   | c   | c   | c   | b   | b   | ✓   | c   | c   | c   | Deterministic engine unit-tested; real recommendation render blocked.       |
| Dashboard and private navigation      | c   | c   | c   | c   | c   | c   | c   | c   | b   | b   | c   | c   | c   | c   | Anonymous behavior awaits reachable Auth.                                   |
| Public navigation and localization    | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | c   | c   | ✓   | ✓   | ✓   | ✓   | ✓   | RU/KK/EN links and keyboard focus checked.                                  |
| Editorial review and ingestion        | c   | c   | c   | c   | c   | c   | c   | c   | b   | c   | c   | c   | c   | c   | Staging SQL and source claims exist; no complete editor UI or human review. |
| Backend services and RLS              | c   | c   | —   | —   | —   | c   | —   | c   | b   | c   | c   | —   | —   | —   | 77 public tables have RLS enabled; this is not a two-user Auth test.        |

## Prioritized issues

| Priority        | Finding                                                                                                      | Status / evidence                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 release gate | No human-reviewed published program or scholarship; draft source claims cannot be advertised as verified.    | Open. Development counts: one draft institution, one draft program, one draft scholarship, zero published.                                                                              |
| P0 release gate | No real two-user Auth and owner-isolation browser run.                                                       | Open. Four Auth-dependent browser cases remain skipped without staging credentials/endpoint.                                                                                            |
| P1              | Matching POST accepted an Origin with the same host but a different scheme.                                  | Fixed by checking both host and protocol. Cross-scheme 403 regression passes.                                                                                                           |
| P1              | A malformed deadline could crash matching result rendering after the engine correctly classified it UNKNOWN. | Fixed with safe date formatting and unit regression. Populated result page remains blocked by catalog/auth.                                                                             |
| P2              | On narrow screens the horizontal public navigation hid later links without a visible scroll treatment.       | Right-edge arrow cue and thin scrollbar added; 320 px keyboard focus scrolls the final link into view. Wrapping all links was rejected after it broke the compact-hero visibility gate. |
| P2              | Catalog and matching cards lacked common interaction feedback.                                               | Shared restrained hover elevation/border treatment added for hover-capable devices. Reduced-motion users get no card transform.                                                         |
| P2              | Private pages and populated cards lack a visual review against live records.                                 | Open until staged Auth and editorial publication; do not claim a finished redesign.                                                                                                     |
| P3              | Large filter forms require substantial vertical scrolling on a phone.                                        | Open; progressive disclosure needs user testing and verified facet data before redesign.                                                                                                |

## Design decision

Keep the proven brand colors, typography, semantic states, 48 px controls, responsive grids and native URL forms. The current pass refines feedback and prevents a mobile navigation trap. A wider redesign of populated program, scholarship and recommendation cards should follow editorial publication and real rendered screenshots; styling empty states as if data existed would hide the release blocker.
