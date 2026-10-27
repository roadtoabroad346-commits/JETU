# Resume Phase 19 — PARTIAL, 2026-10-27

Branch `codex/phase19-document-vault`, based on `00b0be6` / draft PR #4. Read
`PHASE_19_QA_AND_RELEASE.md`, `DOCUMENT_VAULT_ARCHITECTURE.md`,
`DOCUMENT_SECURITY_MATRIX.md`, `PREVIOUS_PHASE_CLOSURE_19.md` and exact Master
Phase 19. Preserve draft status and do not begin Phase 20.

Jetuu development `edpuovkgoisyzpguksdi` has five additive Phase 19 migrations
through `20261027055906`; bucket `student-vault` is private. Actual types generated;
CI generator parity is an explicit gate. Seventy-six rollback SQL assertions passed,
with no hosted documents/drafts/requests/test identities left. Authenticated command
RPC advisor warnings are bounded, reviewed operations; no anonymous promotion.

Vault/Writing/app attachments/recommendation status are implemented. No scanner,
retention schedule or object backup is configured: files remain quarantined until
an actual trusted scanner passes. Mentor sharing is disabled without assignments
and consent. Recommendation invitations are manual/unsent, email-bound, single-use
and seven-day. Letters belong to recommenders and never enter student attachments.

`node scripts/vault-worker.mjs` needs a trusted private secret and ClamAV;
`--purge-only` separates cleanup from scanning. Do not run it against existing
student data without verifying target/recovery and policy. Local DB commands remain
strictly local. New `start-vault-tests` starts an ephemeral Auth/Storage subset for
`scripts/vault-auth-test.mjs`; no hosted credentials are used by CI. Read final
remote job results in the release report before asserting runtime verification.

Local `npm run check` initially passed 162 tests/build. Nine component-only browser
cases passed three locales at phone/tablet/desktop, axe and reduced motion; screenshots
are explicitly synthetic. Later review repaired inherited no-env sign-in and account
cascade defects; final gate results supersede initial counts. The dedicated local
Auth CI job is intended to prove actual GoTrue/Storage/browser flows; it does not
replace hosted evidence or actual malware scanning. Local image-layer replay failed.

Remaining mandatory gates: real scanner freshness/processing, scheduled purging,
separate blob backup/restore, hosted two-user/recommender tests, verified mentor
assignment/consent before sharing, real reviewed catalog and populated Roadmap/app
journeys. Phase 17 generation text authority remains independently unresolved.
Never self-approve/publish the draft Pearson data to unlock screenshots.
