# Phase 19 QA and release — 2026-10-27

**PARTIAL. No production promotion; Phase 20 untouched.**

Branch `codex/phase19-document-vault`, based on `00b0be6` / draft PR #4.
Implementation and corrective commits: `33042da`, `f935617`, **`a916e70`**.
Draft PR [#5](https://github.com/roadtoabroad346-commits/JETU/pull/5) remains stacked
on #4, which remains stacked on #3/#2. Remote source SHA was verified after push.
No unrelated branch was merged or force-pushed.

## Verified release checks

[CI 40461693194](https://github.com/roadtoabroad346-commits/JETU/actions/runs/40461693194)
on exact `a916e70989048dc12d050313fd9d126ab2fd5524`: **all three jobs passed**.

| Gate                      | Observed result                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run check`           | Format, ESLint, strict TypeScript, 163 unit/integration tests, production build pass                             |
| Production Playwright     | 86/86 desktop/mobile Chromium cases pass; zero skips                                                             |
| Clean database replay     | Two resets/replays; eight pgTAP suites, 197 assertions each pass                                                 |
| Database release controls | Advisors, generated-type drift and typecheck pass                                                                |
| Actual local Auth/Storage | 29 checks pass using real GoTrue sessions, Storage HTTP, Next API and two independent signed-in browser contexts |
| Synthetic component QA    | 10/10; RU/KK/EN at 375/768/1440px, axe, reduced motion, overflow, quarantine and failed-upload retry             |
| Dependencies              | Full and production-only high-severity audits: zero vulnerabilities                                              |
| ZIP compatibility         | Standard Python ZipFile reader validates entries, CRC and Unicode payload                                        |
| Secret/diff review        | No new credential values; existing unit secret canaries only; `git diff --check` passes                          |

The actual Auth/Storage job used Chrome **155.0.8059.39**. It proved owner retrieval,
anonymous/direct-public denial, quarantine denial, B/mentor-role isolation, signing
denial even for the owner, cross-user draft rejection, one-winner concurrent writes,
real browser upload, MIME/signature/size rejection, private no-store downloads,
draft save/reload and archive revocation. It printed 15 SDK/RPC assertions passed,
then 29 total checks passed. All three temporary Auth users and their blob objects
were removed. Its service-role clean verdict was **synthetic state-authorization
evidence only**, never a real malware scan.

Ten component-only cases and twelve screenshots under `docs/evidence/phase19`
are explicitly synthetic. Desktop Vault and Kazakh mobile Writing were visually
inspected. These are useful UI evidence, not proof of hosted Auth or editorial data.

## Supabase development target

Jetuu **`edpuovkgoisyzpguksdi`**, matching current history and prior explicit
development authorization. Five additive migrations, each rehearsed transactionally:

- `20261027053050_phase_19_document_vault`
- `20261027054005_phase_19_vault_hardening`
- `20261027054407_phase_19_vault_integrity`
- `20261027054806_phase_19_vault_recovery`
- `20261027055906_phase_19_vault_quota_boundary`

Bucket `student-vault` is private. Hosted rollback SQL passes **55 + 21 assertions**.
Follow-up counts: zero Phase 19 hosted documents, versions, drafts, requests or
fixture identities; zero public buckets and zero exposed tables without RLS.
No unindexed foreign-key advice remains. Security advice retains four older
intentional deny-by-default INFO findings and 18 reviewed authenticated command
SECURITY DEFINER WARNs. No anonymous definer grant or browser service key was added.

Pinned CLI types came from the exact clean CI-generated artifact, SHA-256
`2b553b96dfd0b6ae33a4fe090d6577fb7a9beded41fdebc6459d37a13bcfb7e9`.
The first CI correctly caught MCP/CLI ComputedFields/JSON-nullability shape drift;
the actual artifact replaced that output, and successor drift gates pass unchanged.
Local replay could not start because Docker's internal image-layer store ran out
of space; the two successful clean CI replays provide the independent alternative.

## Preview

Exact source commit `a916e70` reached READY as
`dpl_FaamwgZyYFdYmXoaJh6mXudULAeL`:
<https://jetu-phase13-preview-omt50cqyx-impact-hub.vercel.app>.
Team `Impact hub`, project `jetu-phase13-preview`, Git source branch matches,
`target: null` (preview). Commit-matched protected smoke returned health 200; `/en/vault` and `/kk/writing` returned localized sign-in HTML with private/no-store caching. A Vercel-protected API fetch
remained 401 at the sharing redirect; this is not claimed as application Auth proof.
No protection setting was disabled and no production domain was promoted.

## Prior closure and review fixes

- Fixed the inherited unconfigured sign-in crash and removed obsolete anonymous
  route skips; anonymous protected routes and login recovery now have real tests.
- Fixed Phase 18 audit triggers blocking legitimate Auth-owner metadata cascades,
  retaining append-only enforcement while the owner exists. Storage cleanup remains
  a separate required prior step; account/backups erasure is not claimed.
- Bound idempotency to every upload argument, fixed null-version CAS bypass and
  included the pending file in the hard byte budget. Scanner definitions must be
  present and no more than seven days old before promotion.
- Failed-upload replays preserve input and prepare a new version; they cannot show
  quarantine success. Browser failures in early CI were diagnosed as strict label
  selectors and corrected to accessible roles without relaxing the content assertions.
- Corrected stale Phase 13/14/18 tracker BACKLOG labels to evidenced PARTIAL.
  **No previous whole phase was newly marked VERIFIED.**

## Mandatory open gates

1. Configure a trusted real ClamAV worker with freshclam/alerts, scan processing and
   retention/purge scheduling. Hosted files must remain quarantined until it passes.
2. Configure and exercise separate blob backup/restore and documented recovery
   windows; database backups do not establish object recovery or full erasure.
3. Execute hosted two-user/recommender Auth/Storage and cross-device journeys. The
   runner's hosted network restriction remains; real local CI is clearly distinguished.
4. Establish verified mentor assignments and exact consent/expiry/revocation before
   sharing. Current mentor sharing is unavailable, with no reusable URLs issued.
5. Obtain actual human-reviewed catalog data and verify populated application/Roadmap
   attachments/readiness/submission regressions. Phase 17 generation-text authority
   remains an independent blocker. Never self-publish the staged Pearson records.

Contracts and all 25 attack requirements: `DOCUMENT_SECURITY_MATRIX.md`,
`DOCUMENT_VAULT_ARCHITECTURE.md`, `DOCUMENT_RETENTION_AND_SHARING.md`,
`WRITING_WORKSPACE_CONTRACTS.md` and `PREVIOUS_PHASE_CLOSURE_19.md`.
