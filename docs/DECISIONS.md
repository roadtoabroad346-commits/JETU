# Phase 04 decisions — 2026-10-17

1. **Root application, single package.** Existing root `src/` and `supabase/` are
   placeholders; nested `jetu/` is a duplicate document upload and empty package.
   Keep it untouched and document the root, rather than introduce a monorepo.
2. **Explicit phase scope.** The direct user request limits work to Phase 04. The
   attachment's all-phase execution command is source context, not authorization to
   start Phase 05. Missing earlier-phase evidence remains unverified.
3. **No fabricated backend.** The temporary public availability page performs no
   admissions transaction. Supabase clients fail explicitly without config; liveness
   does not assert DB readiness. No fake registrations, scholarships, API successes,
   sources, payments, or AI responses.
4. **Latest tested runtime versions, compatible lint peers.** Pin Next/React, Supabase
   SDK/CLI and all direct packages plus npm lockfile. ESLint 10 violated the accessibility
   plugin's peer range, so use compatible ESLint 9.39.5 despite its upstream deprecation
   warning. Remove `eslint-config-next` because its fast-glob/micromatch/braces chain
   had a high advisory with no compatible patched release. Retain explicit TS, Hooks,
   JSX accessibility, and import-boundary rules; Next route type generation and build
   independently validate framework compilation. Track the lint peer upgrade as debt.
5. **Public/server config separation.** Zod errors list field names only. Paired public
   Supabase config is optional until used. Reject nonlocal HTTP, credential-bearing
   URLs, public elevated keys, and sensitive NEXT_PUBLIC variable names. Use a modern
   secret only in the server-only admin factory, not in public request handling.
6. **SSR cache headers are part of the cookie contract.** @supabase/ssr 0.12.7 forwards
   cache-control/expires/pragma with token writes. The route adapter must preserve
   them, update request cookies, and return the same response. No shared SSR singleton
   or silent cookie-write catch. Full authentication remains Phase 08.
7. **Local-only database workflow.** A fixed allowlist, isolated `jetu-local` identity,
   local Unix daemon, env/linked checks and no argument forwarding prevent accidental
   remote use. This guards accidents; it is not an authorization boundary against a
   developer running the raw CLI. CI uses no hosted credentials.
8. **Secure schema baseline without premature domain design.** No product tables in
   Phase 04. Explicit grants and RLS are mandatory later. Prevent default exposure now;
   revoke global PUBLIC EXECUTE separately from schema-specific defaults.
9. **Provisional UI only.** Actual installed cloud UI/UX Pro Max sources were read and
   its scripts executed from an ignored local copy. Follow keyboard/server-rendering
   guidance, preserve JETU blue/yellow, use system fonts for offline Cyrillic/Kazakh
   support. Source pitch PDF is absent; do not claim sampled colors or final logo.
10. **Caveman unavailable.** No matching cloud/executor/local skill was found. Use the
    saved plan, implementation, test/fix, separate review pass and checkpoint; no
    invented full/ultracaveman command or claim of skill execution.
11. **Resource-limited DB verification.** Full-stack image extraction exhausted this
    managed Docker VFS filesystem. Add the CLI-documented PostgreSQL-only startup
    mode for migration/SQL verification. Keep full-stack config and commands; do
    not equate database-only tests with a verified Auth/Storage runtime. Remove only
    task-created images/temporary install copy during recovery, not unrelated data.

12. **Authorized cloud development, no workspace Docker.** On 2026-10-18 the user
    explicitly selected the existing Jetuu project; no separate paid project or
    branch was provisioned. Use MCP with an explicit project ID, public-only ignored
    env, one additive baseline and transactional probes. Disposable CI remains the
    only reset target. Match the local migration filename to the cloud-assigned
    version; preserve all application data. See CLOUD_DEVELOPMENT.md.

## Phase 05 — 2026-10-18

13. **Authoritative checkout first.** User clarified GitHub is complete. Fetch and
    fast-forward from 94a4a0b to bbbd258 before app edits. Read updated AGENTS and
    memory; preserve cloud-development authorization and original Phase 04 PARTIAL
    runtime gate. Actual generated types/pitch are present, not missing placeholders.
14. **Pitch-informed identity with continuity.** Preserve approved web blue/yellow;
    record raster PDF samples separately. New path-drawn Jetu/J assets do not depend
    on a guessed or externally downloaded font. Read all pitch text/overview and
    detailed slides 1/3. Pitch claims are not verified product records.
15. **Contrast variants, same brand.** Primary #0069AE allows white small labels.
    Original ink/brand is 4.463:1; add on-brand #041A2E for small masthead text.
    Keep yellow as accent with dark labels. Large decorative marks are SVG, not text.
16. **A component system is the vertical slice.** Public localized noindex showcase
    uses actual section registry/filter/sort/search and local Zod typography preview.
    No fake scholarships, saves or network errors. No product schema/API needed;
    do not widen into Phase 06 landing or Phase 08 authentication.
17. **Native foundations, explicit keyboard behavior.** Use native input/select,
    progress and dialog. Add modal Tab/Shift+Tab containment because browser native
    cycling can leave content. Native Escape/restoration retained. Roving tabs,
    named errors and hover/focus/tap/Escape tooltip are shared primitives.
18. **No-JS and hydration correctness.** Disable preview controls until hydration.
    Scope automatic loading to marketing; parent loading streamed the showcase
    into hidden content without JS. Static documentation/links remain usable.
19. **Evidence over skill labels.** Installed UI/UX Pro Max was read and actual
    commands executed; raw outputs/hashes retained. Reject generated teal/fonts for
    existing JETU/RU/KK. Caveman unavailable; use saved structured workflow. Existing
    SSR/HTTP/env/security contracts remain under regression. Light theme only.

## Phase 06 — 2026-10-18

20. **Truthful public conversion path.** Phase 08 auth/onboarding and catalog are
    absent. The hero action explicitly offers a working opportunities guide, not a
    simulated signup or match. Keep the master signup exit gate open and phase PARTIAL.
21. **Pitch content stays a hypothesis.** No unverified traction, social proof,
    institution names/scores, scholarship records, prices, mentor profiles or AI
    output are published. The hero's matching/essay concept is labeled DEMO and
    is local-only. Pricing/contact pages explicitly state current unavailability.
22. **One typed public content source.** Server components render localized home and
    12 informational paths per locale. A small Motion tab leaf carries demo state;
    public pages have no product API, table, bucket or new RLS policy.
23. **Explicit SEO release switch.** Canonical URLs come from the configured app
    origin. Indexing requires `JETU_PUBLIC_INDEXING=true` plus a nonlocal origin,
    preventing previews from being indexed by default. Site and FAQ schema state
    only static facts. Public SEO score on localhost is expected to reflect noindex.
24. **HTTP 404 before streaming.** With request-scoped locale headers, React can
    stream a not-found body after sending status 200. The existing Next proxy now
    checks the finite public route set and returns a localized HTML 404 early.
    The allowlist must be extended when a later phase adds routes.
25. **Footer belongs to the page stream.** Initial mobile Lighthouse saw CLS .425
    because the layout footer appeared before streamed main content. Moving the
    footer into both page components yielded CLS 0 in the measured local run.
26. **Skill evidence and phase boundary.** UI/UX Pro Max's actual design-system,
    landing, reduced-motion and Next.js searches were run. Keep the approved JETU
    palette/system font instead of generated teal/hosted fonts. Caveman remains
    unavailable after cloud, executor, local-file and CLI checks; use the saved
    plan → build → test → fix → review → checkpoint process without invented modes.

## Phase 12 — 2026-10-21

27. Reuse the existing normalized Phase 10 development schema. Six migrations were present in cloud history but absent from Git; recover their exact statements under their recorded versions instead of adding duplicate catalog tables. This recovers code history only; it does not verify phases 08–10.
28. Add a read-only `catalog_search` SQL function as `SECURITY INVOKER`, with published/verified RLS visibility and verified source-claim gating. Apply only to the previously authorized Jetuu development project. No remote fixture persists; no production deploy/reset.
29. Keep URL-backed native GET forms and server rendering. Hide save, compare, plan and requirement-check actions until Auth/plan contracts exist. A real catalog with zero reviewed rows shows an empty state; a transport failure shows unavailable. Preserve the existing blue/yellow design contract and locale dictionaries.
30. Mark Phase 12 PARTIAL. Cloud SQL filter and isolation tests pass, but verified public content is empty, direct REST is blocked by this workspace proxy, and Phase 11 ingestion/review is absent. Do not claim end-to-end live data or a production performance baseline.

## Phase 13 — 2026-10-21

30. Extend the existing Phase 10 bigint catalog rather than introduce new scholarship or university tables. The initial Phase 06 worktree was stale against `origin/main` and the connected Jetuu development schema; Phase 13 work is isolated on a branch from current main.
31. Keep externally factual entries draft until an official source claim has been reviewed. A publication trigger rejects recent-source gaps, conflicts and unsupported full-tuition/stipend/comprehensive labels. `unknown` remains an explicit state; no full-ride inference is made from tuition.
32. Public scholarship search is a bounded `SECURITY INVOKER` RPC over existing RLS. Editorial functions are executable only by `service_role` and called from a server route after `auth.getUser()` and DB membership checks. Browser roles have no editorial note/event grants; student saves require owner identity and visible scholarship.
33. Apply only to the previously identified Jetuu development project. Synthetic probes always roll back. No factual listings are seeded without official checked evidence. An empty catalog and incomplete Auth UI keep Phase 13 PARTIAL even after cloud migration.
