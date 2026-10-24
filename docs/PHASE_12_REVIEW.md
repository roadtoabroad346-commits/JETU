# Phase 12 review — 2026-10-21

**Status: PARTIAL.** The catalog explorer reads the normalized Phase 10 schema, but there are zero real reviewed institution/program rows. This workspace's Supabase REST tunnel fails CONNECT 403, so live HTTP rendering cannot be verified. Phase 11 ingestion/editorial publication remains unbuilt.

## Scope and evidence

- Two additive migrations create/update one read-only `SECURITY INVOKER` RPC. It uses existing RLS on every joined table, verified source claims, bounded pagination and stable sorting. The second revision fixes filters across multiple languages, modes and campuses, and includes application-round closing dates. No new tables or browser write grants.
- Synthetic SQL fixture includes failing assertions and rolled back: one published and one draft university/program. Eleven measurements: `1,1,1,1,0,1,0,0,0,1,0` for visible, matching facets, secondary facets, budget match/exclude, deadline match/exclude, draft hidden, wrong country, search match, hidden search. Follow-up query confirmed zero fixture institutions.
- `npm run check`: passed format, ESLint, strict typecheck, 54 unit/integration tests and production build. Cloud-generated database types include the RPC and canonical tables.
- Initial `npm run test:e2e` without system browser path: 6 HTTP tests passed; browser launches failed because bundled Chromium is not installed. With `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`: 45/46 passed; one older marketing test raced streamed hero content, and was corrected to wait for visibility before measuring. Catalog browser tests passed RU/KK/EN on mobile and desktop with axe zero violations, URL/reload persistence and reset link. Affected rerun: 10/10 browser checks passed, including a 320px and reduced-motion check. After the publishable-key header fix and new build, catalog desktop rerun passed 4/4.
- Supabase security advisor reports two INFO RLS-no-policy tables (`data_revisions`, `verification_runs`), both intended without public read policies. Performance advisor reports unused indexes on empty catalog. A transactional one-row synthetic `EXPLAIN ANALYZE` took 36.072 ms with 1,416 shared hits; this is not a production-scale latency baseline and warrants review with real data. REST curl from this host returned CONNECT 403. Local DB image pull returned registry 403 and was stopped.

## Acceptance review

- Working detail relationships and filter logic: SQL fixtures pass representative country, level, major, language, mode, intake, budget, deadline, search and draft isolation. Real REST path is pending. Ranking is withheld because no licensed sourced ranking exists.
- UI: mobile-first branded forms and cards, native controls, visible labels, action feedback through navigation/loading boundary, RU/KK/EN copy, no fake results. The source and review date are visible when data is available. Empty/reset and unavailable states are distinct. Native URL GET state supports back/forward.
- Incomplete: no reviewed real dataset; live program detail pages and financial-aid links cannot be exercised; external REST blocked; auth-backed Save/Compare/Plan not built; full-stack Auth/Storage runtime and scale performance unverified. These keep Phase 12 PARTIAL.

## Next action

Verify the applied RPC through REST in a network-enabled environment, complete official-source editorial review/publication, then rerun browser, detail, filter, RLS and performance tests on real reviewed records before considering VERIFIED. Do not start Phase 13 automatically.
