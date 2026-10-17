# Phase 04 implementation plan — 2026-10-17

## Objective and scope

Deliver the engineering foundation described in the supplied master, Phase 04 (lines 186–197). The explicit phase request overrides the attachment's instruction to continue all 30 phases. Do not begin Phase 05. Root `/workspace/JETU` is the application/repository root. Preserve the empty, tracked `jetu/` snapshot; it is not a workspace/package. There are no prior approved implementations to migrate. Phases 01–03 have no completion evidence and remain unverified; record the minimum foundation decisions needed here without claiming those phases complete.

## Work packages (in order)

1. Audit, exact master copy, architecture/decision records, skill research evidence.
2. Pin Node/npm and dependencies; strict Next App Router, Tailwind, Motion; ESLint/Prettier/Husky/lint-staged; CI and reproducible lockfile.
3. Validate public/server environments lazily with Zod; isolate typed browser, SSR and privileged clients; fail closed on partial/malformed config and public privileged keys. No credentials required for public build.
4. Initialize Supabase CLI config; migration-first explicit grants/default-privilege baseline; local-only command runner, generated DB types, empty seed, transactional SQL security tests. No product tables or Auth flows before their own phases.
5. Minimal localized RU/KK/EN availability page and accessible loading/error/404 boundaries, using provisional pitch blue/yellow; no unimplemented product CTAs. Liveness endpoint uses typed Result and request ID, no database-readiness claim.
6. Validate fresh install, formatting, lint, typecheck, unit/integration, local migration replay/types/SQL tests, production build, dev smoke, browser/axe/responsive/keyboard/reduced-motion; fix and review each criterion; checkpoint and handoff.

## Architecture, files and contracts

- `src/app/[locale]/(marketing)`: informational foundation page; `(auth)` and `(dashboard)` reserved in README files, no public nonfunctional routes. `src/features`, `components/ui`, `lib`, `server`, `domain` boundaries documented.
- `src/lib/env*`: explicit browser-safe NEXT_PUBLIC values only; privileged parsing in server-only module. No environment dumping or silent fallback to a fake backend.
- `src/lib/supabase/{browser,server,admin}.ts`: parameterized by generated Database. SSR cookies use official @supabase/ssr; admin helper not consumed by any public route. Session identity/role enforcement is Phase 08, not inferred from cookies here.
- `GET /api/health`: `200 { data: { status: 'ok' }, requestId }`, Cache-Control no-store and X-Request-ID. Liveness only. Error helper returns `{ error: { code, message, requestId, fieldErrors? } }` with appropriate non-2xx status; never serializes unknown exceptions.
- `supabase/`: isolated local project identity/ports; baseline migration secures public CREATE, default table/sequence/function access and non-exposed private schema. No business model changes; no student records collected. RLS is required whenever an exposed table is added; no permissive placeholder table/policy.
- `scripts/db.mjs`: fixed allowlist of commands and arguments; local daemon identity and configuration checks; no forwarded arbitrary flags, remote DSN, linked-project or prod reset. CLI migration-new and --local are mandatory. `db:types` replaces target atomically only after success.
- Tests in `tests/{unit,integration,e2e}`, DB tests `supabase/tests`, GitHub workflow `.github/workflows/ci.yml`; docs updated at repo root only. Reports under ignored `work/`; final user-facing report/archive exported to designated output directory.

## UX and failure scenarios

Localize all visible foundation text. Language links preserve valid locale, root redirects to RU, invalid locale/path is 404. Use semantic heading/main/nav, skip link, 44px targets, visible focus, no layout overflow, no content hidden awaiting JS animation, reduced motion. Page has no form, API mutation, fabricated records, AI output or paid action. Loading/error/404 are accessible foundations; future product states are out of scope. Missing Supabase config does not break public page, but invoking any client fails explicitly. Partial config, invalid URL, elevated public key, unexpected CLI args, nonlocal database target and SQL default-privilege leaks must fail closed.

## Measurable release criteria

| Criterion                | Evidence required                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Fresh install/runtime    | Node/npm pin; npm ci in clean tracked copy; dev HTTP smoke                                       |
| Static/build             | format:check, lint, typecheck, production build exit 0                                           |
| Typed boundaries/env/API | positive/negative unit/integration tests, bundle secret-canary check                             |
| Local database           | CLI start, reset replay twice, SQL tests, generated types, unsafe targets rejected               |
| UI scope/quality         | three locales, phone/desktop screenshots, keyboard, reduced motion, axe no violations            |
| CI                       | committed secret-free frontend and local DB jobs; distinguish local execution from remote CI     |
| Handoff                  | tracker all 30 phases, actual commands/exits, unresolved blockers, next agent prompt; Git commit |

Mark VERIFIED only if all applicable gates actually run and pass. Missing network/container permissions may make the phase PARTIAL, never invent a successful Supabase/CI/deployment result. No remote database operation, publication, push, or production deployment is authorized by this phase.
