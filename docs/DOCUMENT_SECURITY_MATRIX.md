# Phase 19 security matrix

SQL: `supabase/tests/vault.test.sql` (55 assertions) and
`vault-associations.test.sql` (21), rollback-only on Jetuu development. These use
synthetic SQL identities; they do not constitute GoTrue/Storage HTTP evidence.
Unit/integration: `tests/{unit,integration}/vault.test.ts` (46 focused tests).
`tests/ui` is explicitly synthetic component QA. `scripts/vault-auth-test.mjs`
uses actual disposable local GoTrue sessions, Storage HTTP and a configured Next
browser; remote CI evidence is recorded separately in the release report.

| Attack / requirement          | Control and proof                                                           | Remaining gate                      |
| ----------------------------- | --------------------------------------------------------------------------- | ----------------------------------- |
| 1 anonymous listing           | no Storage listing grant; SQL anonymous denial                              | actual HTTP CI/hosted               |
| 2 guessed UID/path            | exact reserved immutable key; ownership predicates                          | actual HTTP CI/hosted               |
| 3 A reads B metadata          | owner RLS; SQL A/B zero-row checks                                          | hosted sessions                     |
| 4 cross-user signing          | sign operation denied, no signing API                                       | Storage HTTP                        |
| 5 direct Storage              | private bucket, authenticated-get only                                      | Storage HTTP                        |
| 6 forged path/version         | schema key invariant + server exact path; unit and SQL denials              | hosted                              |
| 7 foreign attachment          | composite owner FKs and command checks; SQL                                 | populated hosted application        |
| 8 foreign draft/history       | read RLS, guarded commands; SQL, HTTP service tests                         | hosted                              |
| 9 malicious mentor            | no assignment domain, all mentor access unavailable                         | future verified assignment workflow |
| 10 revoked mentor             | no mentor entitlement or issued token exists                                | future revoke scenario              |
| 11 TTL/revocation             | no reusable URLs; archive/delete rechecked per request                      | actual provider sign denial         |
| 12 confidential letters       | recommender owns blobs; student has status columns only; SQL                | recommender hosted browser          |
| 13 invite guess/replay/expiry | 256-bit hash, email-confirmed account, one-time lock; SQL                   | actual Auth recommender             |
| 14 MIME/extension             | actual signatures and declared MIME/category agree; unit                    | deployed upload                     |
| 15 exhaustion                 | streamed size/deadline limit, DB quotas, bounded ZIP; unit/SQL              | workload measurement                |
| 16 active/executable          | allowlist, conservative active-content filter, quarantine; unit             | real ClamAV infrastructure          |
| 17 quarantine reads           | no available state until trusted verdict; SQL/server tests                  | Storage HTTP                        |
| 18 XSS                        | safe names, plain text/React escaping, text-only sandboxed preview; unit/UI | real persisted browser payload      |
| 19 cross-user ZIP/traversal   | owner links/version reads, UUID entry names, fixed limits; unit/SQL         | deployed ZIP with real objects      |
| 20 broken relationships       | composite FKs and target/program check; SQL                                 | populated Roadmap journey           |
| 21 metadata mutation          | read-only tables, guarded owner commands; SQL                               | hosted                              |
| 22 publication race           | immutable keys, locks, checksum verdict, post-I/O recheck                   | concurrent provider requests        |
| 23 cache/log leaks            | no-store, no-referrer, no raw errors/content logging; integration           | hosted response/log audit           |
| 24 missing/reused tokens      | strict UUID contracts, bound reservation fingerprint, CAS; unit/SQL         | provider interruption test          |
| 25 public identity URL        | private bucket; no student/path in public preview URL                       | actual public endpoint denial       |

A synthetic trusted scan verdict tests state authorization only. It is never
presented as malware-scanner evidence. No real files were uploaded to the hosted
project during SQL probes. Mandatory unexecuted gates keep Phase 19 PARTIAL.
