# Prepared synchronization plan — approval required

No push, PR mutation, cloud migration, environment change, merge or deployment
was executed. The prepared local change is on `codex/phase17-completion`, based
on PR #5 head `3118aea27bdf20083693c057edadff46119aa801`.

1. With approval, push this branch and open a draft PR against
   `codex/phase19-document-vault`. This keeps the existing #2 → #3 → #4 → #5 stack
   intact. Recheck every remote head before writing; never force-push or rebase
   another active branch. Existing PR comments show both `jetu-phase13-preview` and `jetu` are linked;
   a Git push may automatically trigger previews in both projects. Approval to
   push must include that effect. Do not change either integration implicitly.
2. Require all existing CI jobs at the exact new SHA. The database job must run
   two full replays, all nine pgTAP suites (220 assertions), advisors, full
   generated-type drift and strict types. The Auth/Storage job now additionally
   covers target-free Roadmap generation through Next, owner text forgery denial,
   cross-owner denial and a second browser session preserving edits. Those new
   checks have not run here. Fix failures before cloud schema changes.
3. With separate approval, apply only migration
   `20261027102016_phase_17_generation_authority` to Jetuu development
   `edpuovkgoisyzpguksdi`. Verify the 33-version baseline first. This revokes the
   insecure generation contract, so old application generation temporarily fails
   closed until the matching server build is available. Other owner task edits
   remain available. Preserve historical migrations; no reset or sample publication.
4. Confirm the existing server-only SUPABASE_SECRET_KEY is configured securely
   for the intended preview. Never retrieve, print or commit its value. Confirm
   project `prj_ym5uK7EQumiSASSFdO4sSQMM1UxD`, team
   `team_Hg7QYVwD6HqLqLcIERR9pWP3` / `impact-hub`, and exact source SHA.
   With deployment approval, rebuild a preview after schema synchronization.
5. Inspect migration history, new RPC grants, security/performance advisors and
   generated types after application. Execute separately authorized disposable
   hosted acceptance with cleanup. Human-reviewed targets are prerequisites to
   a meaningful populated target journey. Do not claim a generic empty-catalog
   plan proves the full Phase 17 exit test.
6. Leave all PRs draft and do not promote production or merge until the explicit
   acceptance gaps in PHASE_17_COMPLETION_REVIEW.md are closed. Merging the stack
   would include Phase 19's independently blocked scope and requires its own gate.

Rollback: do not restore authenticated generation or weaken the new guards.
If the server build fails, keep generation unavailable and roll forward with a
compatible fix. Restoring an old frontend does not restore the old insecure RPC.
Any database rollback needs a separately reviewed data-preserving migration;
there is no destructive reset in this plan.
