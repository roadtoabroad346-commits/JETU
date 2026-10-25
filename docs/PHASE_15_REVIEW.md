# Phase 15 review — unified search, saved lists and comparison

Date: 2026-10-25. Status: **PARTIAL**. Scope stops before Phase 16.

## Delivered contract

JETU now has localized unified discovery for source-gated programs,
scholarships and opportunities at `/{locale}/search`, bounded autocomplete at
`/api/search/suggest`, actual scholarship/opportunity details, private saved
items and searches at `/{locale}/saved`, and URL-shareable comparison of two to
four programs at `/{locale}/compare`. Universities are provider context and
remain directly searchable through the Phase 12 explorer; they are not a fourth
unified result type.

Filters cover type, country, degree level, category/field, format, scholarship
funding, opportunity cost and deadline. Sorts are relevance, source recency,
deadline and title. Every order has deterministic type/title/ID tie-breaking.
The UI says eligibility and personal fit were not evaluated; unknown amounts,
deadlines and total cost stay unknown.

## Ranked repaired defects

| Rank | Reproduction before repair                                         | Repair and evidence                                                                             |
| ---- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| P1   | Cloud migration `20261024142350` existed but Git had no file/types | Recovered the exact stored statement; regenerated types                                         |
| P1   | Phase 14 returned eligibility verdicts from age/grade ranges alone | Additive migrations return `within_range` / `outside_range`; SQL assertions and copy audit      |
| P1   | Unified search at 10k took 21,834 ms and 2,604,896 shared hits     | Preaggregated source/facet CTEs and targeted indexes: 327.675 ms browse, 698.999 ms filtered    |
| P1   | No unified app/API/detail/compare/save routes                      | Implemented routes and discriminated server schema; build and browser tests pass                |
| P1   | Private save behavior existed only in schema                       | Re-authenticated actions plus owner RLS; two-user select/update/delete isolation passes         |
| P2   | Phase 13/14 application lists were absent despite recovered schema | Phase 15 supplies truthful public discovery/details only; prior phase statuses remain unchanged |
| P2   | Marketing copy said scholarship search was unavailable             | Copy now describes published-only search without implying records exist                         |
| P2   | Filter option and compare-difference labels were English-only      | Localized native controls and explanations in RU/KK/EN                                          |

Residual prior-phase issue: the separate Phase 12 university detail mapper still
fans out related program reads. Phase 15 comparison uses a fixed batched query
shape and does not copy that N+1 path.

## Security and data integrity

- Public calls use only the public key and `SECURITY INVOKER`; no service key is
  imported into search, autocomplete, detail, count/facet or comparison code.
- Underlying RLS and verified source-claim checks gate all result branches.
  Draft/private/admin content therefore cannot appear in results, counts,
  suggestions or comparison.
- Saved tables grant anonymous users nothing and constrain authenticated reads
  and writes to `auth.uid()`. Uniqueness makes concurrent duplicate saves safe.
- Query, filter, sort, page and compare input use Zod allowlists and numeric
  bounds. SQL receives structured JSON; caller text is never interpolated.
- Fetches are `no-store`, avoiding a shared response cache that could retain a
  subsequently unpublished record. External sources open with `noopener`.

## Actual verification

- `npm run check` passed: formatting, lint, strict TypeScript, **66** unit and
  integration tests, and the production build. `npm audit --omit=dev` reported
  zero vulnerabilities.
- Phase-focused Playwright with system Chromium: **10/10 passed** across desktop
  and mobile projects. Coverage includes RU/KK/EN direct-link reload, axe main
  content, 320px width, reduced motion, invalid comparison and keyboard
  autocomplete selection.
- Cloud pgTAP: **23 assertions passed**, including invoker/grants/indexes,
  factual range outcomes, owner policies and two-user save isolation.
- Final Supabase advisors reported no ERROR/WARN findings. Security retained four
  documented INFO-only deny-by-default tables with no browser grants; performance
  retained unused-index INFO expected with one real public row.
- Fresh cloud-generated TypeScript types structurally match the committed,
  Prettier-formatted type file; all four Phase 15 migration versions match Git.
- Complete Playwright suite: **62 passed, 2 skipped**. The two configured-hosted-
  Supabase anonymous-auth redirect cases were skipped by their existing guard;
  all other foundation, catalog, design, marketing and Phase 15 cases passed.
- Rollback-only cloud benchmark: total 10,003 (10,002 synthetic plus the one
  existing published opportunity); three entity types; composed filters and
  disjoint adjacent pages passed; within-range and outside-range exclusion
  behaved factually; Latin, Cyrillic, Kazakh, diacritic and typo cases each
  returned bounded rows; sampled pages were repeatable; hidden match count zero.
  Fixture rows and disposable Auth users rolled back.
- Local Supabase database-only replay was attempted. Docker pulled most layers
  but failed registration with `no space left on device`; no local SQL result is
  claimed. Browser-managed Chromium download was denied, so `/usr/bin/chromium`
  was used explicitly.

## Why status is PARTIAL

The authorized development database contains one current, source-backed
opportunity and no programs or scholarships; the real corpus is therefore too
sparse to validate mixed results, filters and comparison.
The environment cannot reach hosted Supabase REST/Auth, so a real authenticated
save → reload → second-device flow and live public record navigation were not
observable in a browser. The Vercel connector authenticated to team `Impact hub`;
the only JETU-named project is an unlinked preview, and creating the intended
Git-linked `jetu` project was rejected because the team's GitHub integration is
not installed. No deployment is claimed. These are mandatory end-to-end evidence
gaps, so VERIFIED would be inaccurate.

## Phase 16 contract (do not implement yet)

Phase 16 may consume only the three discriminated searchable kinds and must keep
source URL, `source_checked_at`, freshness and unknown values intact. Program
facts available for later explainable matching are level, field, country,
languages, delivery modes, published tuition, application deadline, linked
funding and published requirements. Scholarship/opportunity filters remain
discovery facts, not eligibility decisions. `within_range` and `outside_range`
are factual range outcomes, not eligibility verdicts. Phase 16 must add its own
rule/evidence model and cannot infer missing
criteria or reuse search relevance as personal fit.
