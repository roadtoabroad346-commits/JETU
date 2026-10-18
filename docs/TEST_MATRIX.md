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

Not applicable yet: persistence after student edits, duplicate mutations, cross-user/
cross-tenant business isolation, uploads, OAuth, email delivery, AI, payments, catalog
query performance. No such behavior is enabled. Do not count these as passed tests.
Full Auth/Storage/Realtime stack readiness and remote GitHub CI are separate from
local PostgreSQL/adapter/browser validation; record actual outcomes in the log.

2026-10-18 continuation: disposable CI replay/SQL/advisors/types passed; both cloud
advisors and SQL probes passed. Public cloud env build and 14 production E2E passed.
Direct hosted REST is unverified because workspace proxy CONNECT returns 403.
See verification-2026-10-18.json and CLOUD_DEVELOPMENT.md for exact scope.
