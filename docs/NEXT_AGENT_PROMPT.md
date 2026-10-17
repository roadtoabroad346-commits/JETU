# Next agent handoff — stop at Phase 04

Current phase: **04/30, PARTIAL**. Do not start Phase 05 automatically.
App/repo root: `/workspace/JETU`; nested `jetu/` is an untouched upload snapshot.
Read AGENTS, master Phase 04, tracker, architecture, decisions, plan, review and log.

Implemented: strict Next/TS/Tailwind/Motion foundation, env validation and typed
Supabase browser/SSR/admin boundaries, localized availability screen, liveness/error
contracts, local-only DB tooling/config/migration/tests, CI/hooks, documentation.
Root app checks, 50 unit/integration and 14 production E2E/axe tests passed; see log
for exact commands, source-copy install and final checkpoint verification.

Blocking issue: this managed Docker daemon uses VFS on a 32GB filesystem. Both full
Supabase and PostgreSQL-only image extraction failed with `no space left on device`.
Only task-created images/temp files were cleaned; no daemon/policy changes or
unrelated Docker pruning. No Supabase DB server ever became ready. SQL replay,
14 pgTAP assertions, advisors and actual generated types therefore did not run.
The DB types file remains explicitly a bootstrap placeholder, NOT generated evidence.
Hosted Supabase credentials are absent and no remote project has been touched.

## Exact next three actions

1. Supply a suitable local/CI Docker environment with enough disk (for example a
   separately provisioned larger disk or ordinary Docker overlay storage). Do not
   change the managed daemon driver or bypass its network policy. Use Node/npm pins,
   run `npm ci`, then `npm run db:start:database` (or full `db:start` on sufficient
   resources). Keep this checkout unlinked and all operations local.
2. Execute `npm run db:reset:local`, `npm run test:db`, then repeat reset + SQL tests
   from zero; fix SQL defects if any. Run `node scripts/db.mjs advisors`,
   `node scripts/db.mjs migrations`, `npm run db:types`; replace the placeholder only
   with successful actual generation. Run `npm run typecheck`, `npm run check`,
   and relevant E2E if app changes. Verify full Auth/Storage local startup separately.
3. Record actual evidence, update tracker/log/handoff, and checkpoint the DB-verified
   state. Mark VERIFIED only after applicable gates pass. Stop and wait for the
   user's explicit next-phase instruction. Phase 05, pitch PDF reconciliation,
   prior Phases 01–03 completion evidence, auth/catalog and deployment are not implied.

No credentials need to be pasted into chat. Full Auth identity/roles/RLS isolation is
Phase 08+, and business data schemas belong to their phases. Public availability
page is intentionally honest about unavailable registration/program discovery.
