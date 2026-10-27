# Retention and sharing contract

| Sensitivity  | Categories                                     | Default lifetime | Access                                                           |
| ------------ | ---------------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| academic     | transcript, certificates, tests, portfolio URL | 365 days         | owner only                                                       |
| personal     | CV, essay                                      | 365 days         | owner only                                                       |
| restricted   | identity, financial evidence                   | 90 days          | owner only; concrete purpose and own active application required |
| confidential | recommender-owned letter                       | 90 days          | recommender only; student gets request status                    |

No identity/financial collection is required for onboarding, ordinary Vault use or
Writing. Minor users get the same private defaults; sharing is unavailable while
verified assignments and any necessary guardian consent are absent. These are
product controls, not a declaration of legal compliance or custom end-to-end encryption.

Archive blocks reads while preserving metadata. Restore works only before expiry.
Delete is explicitly confirmed, immediately blocks new authenticated reads and is
irreversible in the UI. Physical blob deletion requires a successful worker run;
metadata/audit evidence remains bounded to necessary non-content fields. Draft
removal deletes draft content and all its revisions. Inactive drafts/revisions
expire after 365 days when the purge worker runs. No document is retained forever
as downloadable by default.

No reusable signed URLs are issued. Storage policies deny signing even for owners;
the proxy authenticates each new request. A response already downloaded or in
flight cannot be recalled. This is not a promise that arbitrary provider signed
URLs can be revoked. If future sharing issues any such tokens, test actual expiry
and revocation behavior before enabling it.

Object backups are independent from DB backups. Document the operator's separate
Storage backup, restore test and recovery window before release. These have not
been configured/proven. Deletion therefore must not be described as immediate
full erasure from provider backups. The Phase 18 event-trigger correction permits
Auth-owner metadata cascades; physical Storage cleanup must precede account removal
with the existing account-deletion marker held throughout.
