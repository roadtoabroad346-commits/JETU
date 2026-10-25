# Phase 15 plan — unified search, saved lists and comparison

Date: 2026-10-24. Scope stops at Phase 15.

## Authoritative reconciliation

The authoritative scope is `docs/JETU_MASTER_PROMPT.md` Phase 15. The user request
emphasizes unified search/filtering/comparison, while the master phase also requires
private saved searches, durable saved catalog items and race-safe save/unsave. This
phase implements those contracts. It does not build Phase 16 matching: every result
uses `not_evaluated` for eligibility/personal fit and filters are factual discovery
criteria, never a claim that a student qualifies.

Searchable public entities are only source-gated `program`, `scholarship` and
`opportunity` records. Universities remain reachable through program cards and the
existing university explorer, but are not a fourth unified result type because the
master Phase 15 names the other three result types. Comparison is program-only.

## Acceptance contract

- One localized `/[locale]/search` route returns a discriminated result schema with
  stable `entity_type + entity_id` identity, factual facets, source URL/freshness,
  deterministic ordering and 20-row bounded pages.
- Query, result type, country, degree level, category, format, scholarship funding,
  opportunity cost, deadline, sort, page and comparison selection are URL-backed.
- Relevance ranks exact title, title prefix, language-neutral PostgreSQL FTS and
  `pg_trgm` similarity, then breaks ties by type, title and ID. Non-relevance sorts
  use source date, deadline or title and the same deterministic tie-break.
- Typo tolerance is best-effort for queries of at least three characters. It is not
  advertised as transliteration. `simple` FTS and trigrams preserve Latin,
  Cyrillic, Kazakh letters and diacritics without English stemming assumptions.
- Autocomplete is debounced, keyboard-operable, bounded to eight public rows and
  uses the same RLS-preserving RPC. It exposes no private history.
- Empty/error/loading states are actionable; invalid URL/API parameters fail closed.
- Comparison accepts two to four unique positive program IDs. Columns show only
  published tuition, deadline, study languages, delivery modes, linked funding,
  published requirements and source recency. Missing/unsupported total cost and
  personal-fit values are explicitly “unknown/not evaluated”.
- Saved searches canonicalize filters and rely on `(user_id, fingerprint)` for
  idempotency. Saved items rely on `(user_id, catalog_entity_id)` and owner RLS;
  save/unsave/update are authenticated server actions and persist across devices.
- No public response, facet/count, autocomplete, comparison or saved-list lookup
  may bypass catalog publication/verification/source policies. No service-role key
  participates in common reads or browser code.
- Keyboard order follows visual order, controls have visible labels/focus, dynamic
  status is announced, touch targets are at least 44px, and comparison intentionally
  scrolls horizontally on narrow screens with a visible instruction.

## Measured targets (not guarantees)

- SQL benchmark budgets on transactional synthetic data are below 400 ms for a
  title-sorted browse page and below 750 ms for the representative filtered
  query at 10k rows in the authorized development database. These budgets were
  set from observed development measurements, not presented as production SLAs.
  `EXPLAIN (ANALYZE, BUFFERS)` measured 327.675 ms / 203,190 shared hits for
  browse and 698.999 ms / 196,287 shared hits for the filtered query after the
  preaggregation rewrite (the original browse plan took 21,834 ms).
- API reads are capped at 20 rows (autocomplete eight, comparison four) and eight
  seconds. Offset is capped by the RPC; no unbounded read is exposed.
- Browser target: no page-level horizontal overflow at 320px; the labeled compare
  region is the sole deliberate horizontal scroller.

## Ranked prerequisite ledger

| Rank | Finding / reproduction                                                     | Evidence before fix                                                                     | Planned closure                                                                          |
| ---- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| P1   | Applied Phase 15 schema missing from Git                                   | Cloud history contains `20261024142350`; checkout stopped at Phase 14                   | Recover the exact stored migration statement; never reapply it                           |
| P1   | Unified result paths had no UI or detail routes                            | No search feature/routes; proxy rejected `/search`, scholarship and opportunity details | Add server contract, routes, detail views and allowlist                                  |
| P1   | Generated database types omit applied Phase 15 objects                     | No `saved_catalog_items`, `saved_searches` or `unified_catalog_search` types            | Regenerate from the authorized database after final SQL                                  |
| P1   | Public Phase 14 RPC labels numeric range outcomes as eligibility verdicts  | `opportunity_search` returned `eligible` / `ineligible` from age and grade alone        | Replace with `within_range` / `outside_range`; UI never asserts eligibility              |
| P1   | Scholarship/opportunity app flows are not shipped despite recovered schema | Marketing pages state unavailable; no list/detail/create/publish UI                     | Phase 15 supplies truthful discovery/detail reads only; keep prior phase status honest   |
| P2   | Existing university detail performs per-program fan-out reads              | `Promise.all(raws.map(mapProgram))`, each mapping issues several REST calls             | Do not reuse it for unified search/compare; record residual prior-phase optimization     |
| P2   | Development corpus is too sparse for mixed real-data validation            | Final inventory: one published opportunity, zero programs and scholarships              | Exercise that real RPC row in SQL and use rollback-only synthetic scale fixtures         |
| P2   | Workspace cannot reach Supabase REST through its restricted proxy          | Prior direct REST CONNECT 403 and current policy excludes Supabase host                 | Prove SQL through MCP and positive transport with mocks; mark live-browser proof blocked |

## Stop condition

Stop after Phase 15 when migration history is reconciled; search/detail/compare/saved
paths are implemented; focused SQL/unit/integration/E2E/a11y/responsive checks run;
docs and generated types match reality; and authorized remotes are attempted with
their actual credentials/configuration. Phase 16 matching is explicitly excluded.
