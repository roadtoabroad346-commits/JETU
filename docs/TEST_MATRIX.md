# Phase 04 verification matrix

| Area                    | Positive / negative cases                                                                                                                 | Harness                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Environment             | Absent optional config, paired public values, anon compatibility, malformed/privileged keys, unsafe URLs, partial config, error redaction | Vitest                                       |
| Local DB command guards | Fixed --local reset; reject arbitrary args, hosted selectors, prod env, remote Docker, linked checkout, modified config                   | Vitest                                       |
| SDK boundary            | Public browser key, writable SSR adapter, cookie/cache headers propagated, admin key required, persistence disabled                       | Vitest mocked SDK; not DB integration        |
| HTTP                    | Liveness shape, server request IDs, cache/no internal exceptions, error statuses, unsupported method                                      | Vitest + real HTTP Playwright                |
| SQL baseline            | Explicit/default grants, private schema, public CREATE, actual direct denial, RLS audit                                                   | CI pgTAP twice + cloud transaction: 14 each  |
| Public UX               | 3 locales, reload/history, keyboard skip, target dimensions, 404, no-JS content, reduced-motion mode                                      | Playwright Chromium desktop/device emulation |
| Responsive/a11y         | 320/360/375/390/768/1024/1440/1920 widths; axe AA rules; screenshots at 375/1440                                                          | Playwright + axe + image review              |
| Reproducibility         | npm ci without node_modules/env/build artifacts; format/lint/type/unit/build; lockfile                                                    | Clean source copy + root checks              |
| Secret exposure         | Build with a synthetic admin-secret canary; inspect public chunks/HTML, safety unit cases                                                 | Production build + artifact scan             |

Not applicable yet: duplicate mutations, cross-user/cross-tenant business
isolation, uploads, OAuth, email delivery, AI, payments, query performance at
real corpus scale. No such behavior is enabled. Do not count these as passed
tests. Full Auth/Storage/Realtime stack readiness and remote GitHub CI are
separate from local PostgreSQL/adapter/browser validation; record actual
outcomes in the log.

2026-10-18 continuation: disposable CI replay/SQL/advisors/types passed; both cloud
advisors and SQL probes passed. Public cloud env build and 14 production E2E passed.
Direct hosted REST is unverified because workspace proxy CONNECT returns 403.
See verification-2026-10-18.json and CLOUD_DEVELOPMENT.md for exact scope.

## Phase 05 extension

- Design library: RU/KK/EN; 320/375/768/1024/1440/1920 and 812x375 landscape;
  375px at 200% text; six full-page pixel baselines (desktop/phone per locale).
- Actual semantic color pair ratios; primary hover/focus; axe page and open modal.
- Native modal repeated opens, bidirectional Tab cycle, Escape/restoration, close
  button; tabs arrows/Home/End, hover/focus/click tooltip and Escape.
- Zod invalid/empty/81-character negative, 80-character Kazakh positive, linked
  summary focus, local output, no mutation requests, offline operation and reload.
- Real registry group/query/sort/empty reset, spotlight zero/results/destination
  focus, locale links retain route, no-JS controls disabled and real SVG assets.
- Existing 50 unit/integration and original 14 browser regressions retained.

No new DB data access exists in Phase 05: SQL/policy/cross-user mutation tests are
not applicable to this read-only public library. Prior cloud/CI results are retained;
no remote operation or workspace Docker was needed or run for this phase.

## Phase 08–09 coverage (implemented, pending phase verification)

These regression suites exist in the repo at HEAD; no phase gate has verified
live Supabase Auth/Storage behavior — the environment limit (proxy CONNECT 403)
still applies.

- `tests/unit/auth-redirect.test.ts`: allowlist/explicit-destination contract
  for post-auth navigation.
- `tests/integration/supabase-clients.test.ts`: client factory contracts, now
  including the admin/browser scaffolding that Phase 08+ code paths may adopt.
- `tests/e2e/auth.spec.ts`: account form traffic, feedback states and
  non-enumeration; the anonymous-dashboard redirect assertion is gated with
  `test.skip` to configured-Supabase runs because unconfigured runs fail
  closed with the documented EnvironmentError.
- `tests/unit/catalog.test.ts` + `tests/e2e/catalog.spec.ts`: `catalog_search`
  transport (anon key, POST, no-store, filters) and degraded-mode UI states.
- Phase 12 SQL: synthetic filter/isolation transaction with **eleven**
  assertions recorded in PHASE_TRACKER.md (source claim gate, 11 wrong
  filter/isolation results → error, leftover fixtures = 0).

## Phase 15 extension

| Area                          | Evidence                                                                                              | Outcome                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| URL/API parser                | invalid type/sort/page/deadline, multilingual query, compare IDs                                      | Vitest pass                                                       |
| Search transport              | bounded payload, anon key, no-store, no service role                                                  | Vitest pass                                                       |
| Sparse compare                | unknown fields, max four, fixed batched reads                                                         | Vitest pass                                                       |
| SQL security                  | invoker/grants/RLS/indexes/range truth/two-user save isolation                                        | Cloud pgTAP 23 pass                                               |
| 10k query behavior            | mixed types, composed filters, range truth, scripts/diacritics, typo, stable/disjoint pages, hidden=0 | Cloud rollback benchmark pass                                     |
| Browser/a11y                  | RU/KK/EN reload, axe, 320px, invalid compare, keyboard autocomplete                                   | Chromium desktop/mobile 10 pass                                   |
| Local DB replay               | PostgreSQL-only Supabase startup                                                                      | BLOCKED: Docker VFS disk exhausted during image extraction        |
| Hosted REST/Auth + deployment | real save/reload and production URL                                                                   | NOT RUN: network unavailable; Vercel unlinked and unauthenticated |

Observed development SQL execution was 327.675 ms for a title browse and
698.999 ms for the representative filtered query at 10k rows. These are
environment-specific measurements, not latency guarantees.

Full production-browser regression: 62 passed, 2 skipped. The skipped cases are
the existing anonymous-dashboard redirects gated on reachable hosted Supabase;
all runnable desktop/mobile cases passed.
