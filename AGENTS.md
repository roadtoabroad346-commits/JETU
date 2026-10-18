# JETU engineering handoff

The application root is this repository root, not `jetu/`. Read `docs/NEXT_AGENT_PROMPT.md`,
`docs/PHASE_TRACKER.md`, `docs/DECISIONS.md`, and the exact phase in
`docs/JETU_MASTER_PROMPT.md` before work. The nested `jetu/` directory is an original
uploaded snapshot and is intentionally preserved. Do not initialize a second app there.

Complete only the user-requested phase. Never infer earlier phases were verified from
empty documents. Keep status and real command evidence honest; never claim missing
external integrations or fake admissions records work.

Use Node from `.nvmrc`, npm from packageManager, and the lockfile. Use `npm run check`,
`npm run test:e2e`, and local DB checks appropriate to changes. Browser tests require
a production build; an installed system Chromium may be selected through
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

`scripts/db.mjs` operations remain LOCAL ONLY. The user separately authorized the
existing Jetuu project for Phase 04 cloud development via explicit MCP project ID;
see `docs/CLOUD_DEVELOPMENT.md`. Do not infer production authorization.
Never link, reset, push migrations, or deploy to a remote project without explicit
separate authorization. New exposed tables require RLS and explicit grants; no public
privileged keys, public Storage buckets, or user-editable role claims. Generate DB
types from the actual database; a placeholder must remain labeled until generation succeeds.

Read the installed UI/UX Pro Max skill and the provisional design contract before
UI edits. Pitch-PDF comparison remains pending until the actual file is provided.
Keep unsupported functionality out of navigation. Preserve unrelated user changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
