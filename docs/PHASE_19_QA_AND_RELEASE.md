# Phase 19 QA and release — 2026-10-27

**PARTIAL. No production promotion.** Base `00b0be6` / draft PR #4;
branch `codex/phase19-document-vault`. Phase 20 is untouched.

## Development schema

Jetuu `edpuovkgoisyzpguksdi`, matching historical development authorization and
current migration history. Additive reviewed migrations:
`20261027053050_document_vault`, `20261027054005_vault_hardening`,
`20261027054407_vault_integrity`, `20261027054806_vault_recovery`, `20261027055906_vault_quota_boundary`
(all with `phase_19_` names in Git/history). Every migration rehearsed in a rollback
transaction before application. Bucket `student-vault` remains private. Actual
MCP types generated; pinned CI generator parity must be confirmed by the CI artifact.

SQL probes pass 55 + 21 assertions with rollback. A follow-up query confirmed zero
Phase 19 hosted documents, drafts, recommendations or fixture users, zero public
buckets and zero published/verified programs. Advisors: no unindexed foreign keys;
unused indexes reflect an empty product corpus. Authenticated command-definer
warnings are explicit bounded command boundaries; no anonymous definer grant or
service-role browser key was added.

## Local verification

- `npm run check`: initial full gate passed formatting, lint, types, 162
  unit/integration tests and production build. The final complete local gate also passed after the login/HTTP fixes.
- Focused Vault unit/integration: 46 tests passed (file validation, resource limits,
  XSS input, ownership/state-before-provider access, integrity, Unicode/diff, ZIP).
- Synthetic component browser: nine RU/KK/EN cases at 375/768/1440px passed axe,
  overflow, quarantine-disabled controls, word limit/save feedback and reduced motion.
  Twelve actual screenshots are in `docs/evidence/phase19/*-synthetic.png`.
  Vault desktop and Kazakh Writing mobile were visually inspected. These are
  synthetic UI evidence, not live Auth or persistence proof.
- Production dependency audit: zero vulnerabilities.
- Local clean migration replay attempt failed while Docker registered the pinned
  PostgreSQL image (`no space left on device` inside its layer store). No remote
  reset or network restriction bypass was attempted.
- Full browser run initially reached 82/84: the two newly unskipped dashboard checks
  exposed the inherited unconfigured login crash. Proxy and login now fail closed
  with an explicit unavailable sign-in state; the final rerun passed 84/84, including every formerly skipped anonymous route.

## Independent runtime gate

Added `vault-auth-storage` CI job. It starts a disposable local Supabase gateway,
GoTrue, PostgREST and Storage, obtains only local ephemeral keys in memory, creates
confirmed test identities, signs in through actual Auth, attacks cross-user/direct
Storage/signing/quarantine boundaries, tests concurrent writing saves, builds the
configured app and uses two independent signed-in browser contexts. It exercises
save/reload and authenticated download/archive. Fixtures and blobs are cleaned.
Synthetic admin scan promotion in this test is explicitly not a malware verdict.

## Release blockers

- No configured/freshness-monitored real ClamAV worker, retention schedule or proven
  object-backup restore. Hosted uploads stay quarantined until real scanning passes.
- Hosted Auth/REST/Storage remain outside runner network policy. Full local CI can
  prove the local runtime; it cannot prove hosted configuration or cross-device UX.
- Mentor assignment and guardian-consent domain absent: sharing stays unavailable.
- Recommender request/letter authorization is SQL-tested; hosted recommender browser,
  real delivered invitations and institutional integrations remain unverified.
- Reviewed catalog/human editorial approval and Phase 17 generation authority remain
  open. Phase 18 populated attachment/submission regression cannot be claimed hosted.
- Final Git/PR, CI/type parity and commit-matched preview results are recorded below
  when observed; health or a sign-in redirect alone is not privacy acceptance.

## Final checkpoint

Pending final local checks, remote CI and preview. Keep draft/PARTIAL until concrete
results replace this checkpoint. See `DOCUMENT_SECURITY_MATRIX.md` for each of the
25 adversarial requirements and bounded evidence.

Final local `npm run check` passed formatting/lint/types/162 tests/build after fixes. The final synthetic UI rerun passed all nine cases. The final production-browser run passed 84/84 with zero skips.

Final invitation redirect/hash-change regression: 2/2 desktop/mobile cases passed
after preserving a validated invitation through sign-in and clearing stale/invalid
fragment values. The suite now contains 86 cases; the full 84-case run plus the
new two-case production-build regression passed locally.
