# JETU Admissions — public site through Phase 06

Next.js App Router, strict TypeScript, Tailwind CSS, Motion, and Supabase. This
checkpoint includes the engineering foundation, a verified local design-system
slice and a localized Phase 06 public site. Phase 06 remains PARTIAL because live
onboarding is absent. It does not implement accounts, catalog, matching, payments
or AI.

## Run locally

Run commands from the Git root, `/workspace/JETU`, **not** `jetu/`.

```sh
nvm install
nvm use
npm --version # packageManager: npm 11.9.0
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Root redirects to `/ru`; `/kk` and `/en` are available.
The 12 information routes under each locale explain the product and current
availability. A labeled concept preview on the landing page saves no data.
Public pages work without Supabase credentials. Supplying only one public Supabase
variable or an invalid/public privileged key fails configuration validation.
Public indexing requires an approved `NEXT_PUBLIC_APP_URL` plus explicit
`JETU_PUBLIC_INDEXING=true`; it is off by default.

```sh
npm run check
npm run start
```

`check` runs formatting, lint, Next route type generation + strict TypeScript, unit/
adapter integration tests, and production build. `start` requires that build.
Node 24.19.0 and npm 11.9.0 were used for this checkpoint. `.nvmrc`, engines,
packageManager, save-exact, and package-lock.json define the reproducible baseline.
No global packages are required.

## Cloud development without workspace Docker

The authorized Jetuu development workflow, credential setup, migration version and
verification limits are in [CLOUD_DEVELOPMENT.md](docs/CLOUD_DEVELOPMENT.md). CI uses
a disposable PostgreSQL database and no hosted secrets. Existing local scripts
remain guarded; cloud setup does not authorize production changes or remote reset.

## Local Supabase

Docker Engine must be running at the local Unix socket (`/var/run/docker.sock`).
This safety baseline is tested on Linux; Windows users should use WSL2 with a local
Docker socket. The wrapper refuses remote Docker contexts/endpoints, hosted database
selectors, a linked project, staging/production envs, and extra CLI arguments.
It reads `.env.local` using Next's env loader before checking these guards.

```sh
npm run db:start
npm run db:reset:local  # DESTRUCTIVE to this project's local dev database only
npm run test:db
npm run db:types
node scripts/db.mjs advisors
node scripts/db.mjs migrations
npm run db:stop        # stops only jetu-local, preserves volumes
```

On resource-limited CI/cloud machines, `npm run db:start:database` uses the CLI's
documented exclusion list to start only Supabase PostgreSQL. It supports migrations,
SQL permission tests and advisors; it does not verify Auth/Storage/Realtime runtime.
Generated types are formatted with pinned Prettier before atomic replacement.
CI compares regenerated types and retains them as an artifact. Type generation
may pull the separate postgres-meta image. The full stack needs
additional disk, especially with Docker's VFS storage driver. Do not change a
managed daemon's storage driver or prune unrelated images to make it fit.

Ports: API 54321, PostgreSQL 54322, Studio 54323, local email inbox 54324;
shadow DB 54320. Project ID is `jetu-local`. Auth, PostgreSQL, Storage, Realtime and
local email are configured; hosted SMTP/OAuth are not. There are no product tables
or buckets in Phase 04. The seed intentionally inserts nothing.

To use an SDK later, inspect local-only `npx --no-install supabase status` privately
and copy the local API URL and publishable key (or legacy anon key) into `.env.local`.
Never paste status output into reports; it may include privileged local keys.
No Phase 04 route needs `SUPABASE_SECRET_KEY`. Do not reuse local credentials remotely.

Migrations are versioned SQL, created with the pinned CLI:

```sh
npx --no-install supabase migration new descriptive_name
```

Iterate on LOCAL SQL, review advisors and policies, commit the migration, reset the
local DB twice to prove replay, run SQL tests, regenerate types, then typecheck.
No `--linked`, `--db-url`, remote reset, push, or production deployment is part of
these scripts. Migration promotion needs a separate reviewed action and environment.
The guard prevents accidental targeting, not a developer intentionally bypassing it.

## Browser and accessibility checks

```sh
npx --no-install playwright install --with-deps chromium
npm run build
npm run test:e2e
npm run test:a11y
```

Alternatively, use an already installed Chromium:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright starts the production server at port 3100. Tests cover three locales,
root redirect/404, language navigation/reload/history, keyboard skip, reduced-motion
mode, no-JS content, 320–1920px overflow, HTTP headers and axe. Mobile is Chromium
device emulation, not a physical-phone or WebKit certification. Reports are in
`playwright-report/` and `test-results/` (ignored). Reviewed screenshots are in docs.

## Boundaries and readiness

- `src/app/[locale]/(marketing)`: public landing and information routes. Auth/dashboard
  groups are reserved without empty working routes. `src/proxy.ts` transports locale
  and checks the current public path set; it is **not** an authentication gate.
- `src/features`: future feature composition; `src/domain`: framework-free contracts;
  `src/server`: server-only orchestration. See `docs/ARCHITECTURE.md`.
- Supabase clients: browser uses public config; server requires a writable cookie
  adapter and forwards SSR cache headers; admin imports `server-only`, disables
  session persistence, and is unused by public code. Full session/auth authorization
  belongs to Phase 08 and must verify identity on every protected server operation.
- `/api/health` is process liveness, not a Supabase readiness probe.
- Public configuration is build-time in Next browser bundles. Rebuild when changing it.
- Dependency updates require lockfile review and `npm ci`, `npm audit`, and all checks.
  ESLint 9 is pinned for the accessibility plugin's peer compatibility; track its
  support status. The vulnerable `eslint-config-next` dependency chain was removed;
  lint uses explicit TS, Hooks, accessibility, and import-boundary rules.
- Headers prevent framing and disable unused browser permissions; CSP is a narrow
  baseline, not a complete nonce-based script policy or a production security claim.

See `docs/PHASE_TRACKER.md`, `docs/IMPLEMENTATION_LOG.md`, and
`docs/NEXT_AGENT_PROMPT.md` for actual validation, limitations and exact next steps.
GitHub CI is configured without production secrets; remote CI is not claimed unless
an actual run is recorded. Phase 04 remote checkpoints are recorded in the log; Phase 05 checkpoint 5a4f26a was pushed to main and
codex/phase05-design-system at the user's explicit request on 2026-10-18.
No application is deployed.

## Product pitch reference

The complete user-provided July 2026 MVP presentation, extracted text, slide
overview and page-indexed project context are preserved in
[docs/pitch](docs/pitch/README.md). Pitch claims and roadmap are reference material,
not evidence of implemented features or achieved traction.

## Phase 05 component library

Open /ru/design-system, /kk/design-system or /en/design-system. The public noindex
library includes brand assets, semantic tokens, shared controls and explicit local
state specimens. Preview text is never sent/saved. No-JS static content/links work;
preview controls stay disabled. See docs/DESIGN_SYSTEM.md and docs/PHASE_05_REVIEW.md.

Screenshot references use Linux system Chromium 154.0.8037.57 and Liberation Sans.
Playwright package browser is Chromium 156; its CDN download was blocked here.
Review/rebaseline intentionally on the target browser/OS when moving references;
do not regenerate baselines just to hide a regression. This checkpoint does not
claim a remote CI run with that bundled browser.

## Phase 06 public site

The landing, all 39 localized URLs, SEO assets and local mobile performance evidence
are documented in docs/PHASE_06_REVIEW.md. The main CTA opens a real guide to
checking opportunities. Registration, personalized results, verified catalog
records, paid plans, mentor booking and contact submission are not open; the site
does not simulate them. Phase 06 cannot be marked VERIFIED until its real onboarding
gate and other listed prerequisites are met.
