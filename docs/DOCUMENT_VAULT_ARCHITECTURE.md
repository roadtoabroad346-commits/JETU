# Document Vault — Phase 19

`/{locale}/vault` → `/api/vault`, `/upload`, `/file`, `/export` → request-scoped
Supabase client authenticated with `getUser()` → owner RLS + command RPCs.
`/{locale}/writing` → `/api/writing` → optimistic, atomic draft/revision writes.
Applications display real pinned attachment versions without changing submission
or claiming institutional receipt. A link can reference an owned Roadmap target
task for the same program; no task/manual override is rewritten.

## Objects and state

Private bucket `student-vault`; immutable key:
`private/student/<authenticated uid>/<document UUID>/<version UUID>/asset.<ext>`.
Server reserves an exact key under a per-owner transaction lock. `request_id`
binds every reservation argument through SHA-256. Maximum 3 MiB/file, 100 active
metadata documents, 20 versions/document, 100 MiB reserved unpurged bytes and 30
reservations/hour. An interrupted PUT can finish against the same key; no upsert.

`uploading → quarantined → available | rejected`; upload failures become `failed`.
Account-deletion markers block new operations. Files expire after a bounded
retention interval. Archived/deleted/expired documents cannot be downloaded.
Uploading/quarantined/rejected/failed versions cannot be downloaded, attached or
exported, even by their owner. Old available versions stay separately addressable.

Metadata DML is revoked from browser roles. Commands derive `auth.uid()`, check
nested ownership, use empty search paths and receive only required EXECUTE grants.
They intentionally retain reviewed SECURITY DEFINER advisor warnings. Scanner
promotion is service-role-only. Public user-editable claims never grant access.

Storage INSERT matches an existing unexpired upload reservation. SELECT matches
an available version and live document plus Storage's authenticated-get operation.
Listing, signing, overwrite and delete are denied for end users. The app returns
bytes through an authenticated, no-store proxy and checks checksum and permissions
after provider I/O. It never returns reusable Storage tokens. Operation-aware
policy behavior still requires actual Storage HTTP verification; SQL role probes
alone do not establish provider behavior.

## Scanner and reconciliation

`scripts/vault-worker.mjs` downloads private immutable objects with a trusted
server credential; checks size, signature, category and SHA-256 again; runs ClamAV
with execution and expansion limits; promotes only a real exit-0 verdict. A positive
malware result rejects the version. Scanner/provider errors retain quarantine and
retry with exponential backoff (up to six hours). At most 20 scan jobs/run.

No worker, malware database freshness monitor or scheduling infrastructure is
configured in Jetuu. Consequently no uploaded development file is claimed scanned
or safe. `node scripts/vault-worker.mjs --purge-only` runs retention cleanup
independently of scanner availability. Set credentials only in a private worker's
secret manager; never expose the secret to Next/browser runtime unnecessarily.

Cleanup removes objects through the Storage API before marking `purged_at`, handles
abandoned/failed uploads after one hour and expires inactive drafts after 365 days.
Database and blob writes are not one atomic transaction. Repeat the worker safely
after failures; monitor unresolved jobs and purge events. No worker was run against
real student documents in this phase.

## Recommendations

Students create a purpose-specific request tied to their own application and
confirm contact permission. A 256-bit random token is delivered manually, never
emailed by this implementation. Only its hash persists; the link carries the
secret in a fragment and removes it on opening. Sign-in carries this validated single-purpose token in a hidden form field and returns to the Vault; it never accepts an arbitrary redirect URL. A confirmed signed-in account
whose email matches the invited address can redeem once before seven-day expiry.
A recommender can retrieve accepted request context after refresh through a narrow
RPC. Letters belong to the recommender's Vault, with confidential sensitivity.
Students can read status events, never letter IDs, metadata or bytes. Cancellation
prevents later promotion. No recommender letter is exported through student ZIPs.

No verified mentor assignment/guardian-consent domain exists at this baseline.
Mentor sharing is explicitly unavailable; role labels alone grant nothing.

The worker additionally refuses absent/invalid ClamAV database dates and definitions
older than seven days (or more than five minutes in the future). Keep freshclam and
operational alerts configured before enabling the worker; unit freshness fixtures
are not an executed malware scan.
