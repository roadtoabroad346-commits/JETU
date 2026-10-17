# Phase 04 separate review pass

The implementation was reviewed after the first build/test cycle against the exact
Phase 04 contract. No subagent or Caveman command was used. This is a separate
source/acceptance review pass by the implementing agent, not an external audit.

## Reproducible findings and fixes

1. First lint rejected an anonymous PostCSS default export. Named the config and
   reran lint successfully. No lint rules were disabled to hide that warning.
2. Initial local runner imported CommonJS @next/env via a named ESM import. The real
   CLI invocation failed before execution. Switched to its default export, added it
   as a direct pinned dependency, and reran the runner.
3. ESLint 10 violated the JSX accessibility peer range; returned to the newest
   compatible 9.x. Audit then found a high vulnerability in Next's lint preset's
   fast-glob/braces chain. Replaced that preset with explicit typed/Hook/a11y rules;
   latest dependency audit returns zero vulnerabilities. The ESLint support warning
   remains documented debt, not a vulnerability suppressed with npm flags.
4. Removed nested document tags from locale/not-found layouts: one root html/body,
   locale transported through a request header overwritten by proxy, then validated.
   Real document-lang, header-spoof, unknown-locale and HTTP 404 checks pass.
5. Corrected global 404 language selection from a hardcoded Russian fallback to the
   validated URL locale. Repeated production E2E: 14/14 passed.
6. Read @supabase/ssr 0.12.7 cache-header contract; route adapter now carries cookies
   to request/response and all cache headers to the returned response. Adapter test
   verifies this; no live Auth session-refresh claim is made.
7. PostgreSQL PUBLIC EXECUTE defaults require a global revoke; schema-only revokes
   are insufficient. Applied both relevant default-privilege boundaries. Adjusted
   pgTAP direct-denial probe so its assertion needs no anonymous extension grant.
8. DB script checks actual dotenv-loaded config before Docker/CLI, rejects unsafe
   args/remote env/linked metadata/remote Docker and preserves types on command failure.
   Added database-only startup through documented CLI exclusions after full-stack
   VFS extraction exhausted this cloud filesystem. No daemon/policy bypass or
   unrelated image/data cleanup was performed.
9. Dev smoke confirms liveness and all three localized pages return 200 with matching
   `<html lang>`. Next-generated declaration files are ignored because dev/build use
   different .next type paths; `next typegen` recreates them for fresh installs.
10. Server-secret synthetic canary is absent from all 13 production public static
    files. No public route imports the admin factory or claims DB readiness.

Final database, clean-clone and checkpoint outcomes must be read from the
implementation log/tracker; this review alone is not a VERIFIED release gate.
