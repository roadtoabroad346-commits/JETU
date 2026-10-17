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
