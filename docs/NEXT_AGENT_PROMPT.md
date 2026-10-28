# Resume MVP recovery — PARTIAL, 2026-10-28

The new catalog review console is at `/{locale}/admin`. Development migrations
`20261028132915` and `20261028133923` install database-enforced editorial roles,
review/publication actions, optimistic concurrency, shared transaction lock and
before/after audit events. The owner selected and received the limited development
reviewer role; see CATALOG_EDITOR_QA.md. The current managed executor still
reports revision 17 with empty allowed hosts and CONNECT 403 despite the user's
separate successful network checks; do not bypass its policy.

User authorized closing remaining MVP gaps. Continue on `codex/mvp-verification`,
draft PR #7, preserving Phases 17–19. The current PHASE_TRACKER checkpoint
supersedes claims that the authority repair is local/unapproved. Hosted migration
`20261028123545` is applied; Preview secret configured; CI `40689442104` is green.
Temporary QA credential files were removed. Never commit or disclose credentials.

Current work adds weekly workload estimates and populated synthetic Roadmap UI
coverage to CI. Human catalog review and enforced HTTP allowlists remain external
gates. User was asked to permit the exact development Supabase and stable Preview
branch alias hosts. Do not bypass the proxy. Do not mark all 30 phases complete:
later features and independent scanner/backup/consent gates remain unbuilt.

## Historical Phase 19 checkpoint

Start at the latest head of `codex/phase19-document-vault`, draft PR #5 stacked on
#4/#3/#2. The latest implementation source anchor is **`472fe5e`** (application recovery); the first full verified gate is `a916e70`. Read exact Master
Phase 19, `PHASE_19_QA_AND_RELEASE.md`, `DOCUMENT_VAULT_ARCHITECTURE.md`,
`DOCUMENT_SECURITY_MATRIX.md` and `PREVIOUS_PHASE_CLOSURE_19.md`. Do not begin
Phase 20, merge the draft stack or promote production while mandatory gates remain.

## Proven checkpoint

CI **40461693194** on `a916e70989048dc12d050313fd9d126ab2fd5524`: all three jobs pass.
163 unit/integration tests + format/lint/types/build; 86 production-browser cases,
zero skips; two clean DB replays with 197 pgTAP assertions each; advisors/type drift;
29 actual disposable GoTrue/Storage/Next/two-browser checks, including real upload,
MIME/size failure, quarantine and owner isolation, draft save/reload and archive
revocation. Ten separate synthetic UI cases pass three locales/widths/axe/reduced
motion and failed-upload retry. See the release report for exact job and preview IDs.

Jetuu development **`edpuovkgoisyzpguksdi`** is synchronized through
`20261027055906_phase_19_vault_quota_boundary`; five new migrations and private
`student-vault` bucket. Hosted rollback SQL: 79 assertions, zero fixtures remain.
Types are the actual pinned CI output; never hand-write them or weaken drift checks.
The local Docker image-layer store failed; CI provides the clean replay evidence.

No earlier whole phase was upgraded to VERIFIED. No-env sign-in, Phase 18 erasure
trigger, idempotency/null-CAS/quota and upload feedback defects were repaired.
The Phase 13/14/18 stale BACKLOG entries are now honest PARTIAL labels.

## Remaining work, narrowly bounded

- No real scanner or purge schedule is configured. Uploaded hosted files remain
  quarantined. `scripts/vault-worker.mjs` requires a private worker credential and
  ClamAV definitions under seven days old; `--purge-only` separates deletion from
  scanner availability. Configure freshclam/monitoring and prove scan outcomes.
- Establish and exercise independent object backup/restore and recovery windows.
- Run actual hosted two-user/recommender/cross-device journeys. Local CI used real
  Auth/Storage but a synthetic administrative scan verdict; it is not malware or
  hosted environment evidence. Do not fabricate credentials or bypass network policy.
- No mentor assignment/guardian-consent model exists: sharing stays unavailable.
  Require real assignment, exact consent, purpose, expiry and revoke proof first.
- Recommendation tokens are 256-bit, email-confirmed, single-use and seven-day.
  Invitations are manual/unsent; letters belong only to recommenders. Students see
  statuses, never sealed blobs. Do not auto-email or submit to universities.
- Human editorial review and the populated application/Roadmap flow remain open:
  development still has zero reviewed/published programs. Never self-approve the
  Pearson/Toronto sample. Phase 17 generation-text authority remains unresolved.

Keep `scripts/db.mjs` local-only. `start-vault-tests` and
`scripts/vault-auth-test.mjs` use an ephemeral local gateway and temporary identities;
no hosted secrets enter CI. A Storage cleanup must precede Auth deletion with the
account-deletion marker held. No live worker or destructive purge was run here.

Latest continuation `472fe5e` makes deleted attachments visible and detachable,
keeping application status unchanged. Local full check still passes 163 tests;
all 11 synthetic component cases and 79 rollback SQL assertions pass. The complete
replay now contains 200 assertions. Inspect current-head CI in PR #5 checks for
the latest remote result; the exact earlier 197-assertion run is preserved above.
No new migration/types were needed. No further product scope is pending beyond
the explicit external acceptance gates listed above.
