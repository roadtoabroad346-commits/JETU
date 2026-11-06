# Mentor security and review contract

Phase 22 extends existing immutable Writing Studio versions and Vault metadata.
Student writing/history policies are unchanged: mentors have no direct SELECT on
writing, applications, Vault tables or Storage. A mentor receives only a server-
validated request and grants for explicitly selected immutable versions. Requests
store a server-read service/price/SLA snapshot and a digest-protected idempotency key.
Grants pin both student and mentor through a composite FK; changing an assignee cannot
silently carry consent. New revisions require a new request and consent.

Identity, expertise, assignment and artifact authority are separate. Private profiles
have draft/submitted/needs_info/verified/rejected/suspended/revoked states. Staff
membership is in `jetu_private.mentor_staff`, with separate verifier and moderator
roles. There is no public membership mutation and no role inference from JWT user
metadata. No real staff, clearance or verified mentor is seeded. Account owners must
appoint appropriate human staff outside the product; this work grants itself no role.

Evidence lives in private `mentor-evidence`. Upload reservation is owner-bound and
expires in 15 minutes; no browser SELECT or signed-link policy exists. Applicant or
verifier can fetch a guarded attachment proxy before retention expiry. Students and
moderators cannot see raw identity evidence. Collect redacted minimum necessary proof;
new evidence expires after 30 days, reviewed evidence after at most seven days.
Expired access is enforced now. A service-only candidate/finish contract and guarded
local retention rehearsal remove Storage objects before redacting metadata. Production
purge scheduling and restore remain operator release gates. Evidence is treated as a potentially hostile attachment; no malware
scan or legal KYC certification is claimed. A human verifier must review identity,
relevant claims, code of conduct and evidence before attesting. Public verified
summary is distinct from self-declared expertise. Decisions preserve actor/reason/time.

Every resource command checks fresh Auth identity, current database trust, active
assignment, safeguarding clearance, blocks, exact resource/version/operation, expiry
and revocation. No JWT refresh is required for suspension. Vault additionally checks
allowlisted category, clean scan state, retention, archive/deletion and exact version.
Restricted IDs/financial documents and confidential recommendations cannot be shared.
Application sharing captures selected checklist/provenance/status fields, never private
notes, account/profile data, confidential letters or automatic status changes.

File previews/downloads go through `/api/mentors/file`, with a fresh grant check both
before and after the Storage fetch, byte-size and SHA-256 checks, no-store, nosniff,
sandbox and no-referrer headers. No mentor signed URLs are issued. A previously
copied response cannot be erased; revocation denies subsequent reads. A preview
necessarily reveals bytes and cannot technically prevent a recipient saving them.
Explicit download consent controls attachment delivery, not DRM. Identity evidence
has its own restricted proxy and is never available to students.

Mutations use bounded JSON, strict discriminated Zod schemas, full Origin checks,
server Auth `getUser`, DB checks/constraints and sanitized errors. A pilot-sized
transaction advisory lock serializes trust, consent, reads, review, capacity and
booking. Request and comment writes use idempotency; status/disposition/admin writes
use revision checks. Audit events cannot be edited by browser roles. An initial
100-request/100-profile directory/queue bound and 1,000-comment cap keep reads finite;
cursor pagination at larger operational volume remains a release gate, not silent
infinite-scroll support.

All student contact currently requires explicit moderator-recorded safeguarding
clearance, including unknown-age users and minors. The moderator reviews local
policy and required guardian/school consent; students cannot self-assert clearance.
No guardian surveillance account or invented jurisdictional law is added. Safety
communication is request-bound, rate-limited, plain text and moderatable, with
coarse contact filtering plus report/block/revoke. Filtering cannot detect every
obfuscated invitation; an accountable moderation operation remains necessary.
Reports have a private new/triaged/investigating/actioned/closed/appealed lifecycle.
A moderator can fetch only the specifically reported comment, with an access event,
and freeze a case-linked mentor. A verifier can require fresh evidence after a
suspension; old revoked grants never revive.
Blocking revokes all assignments with that mentor; cancellation, suspension,
completion and dispute also stop future reads and cancel pending internal bookings.

Human comments pin Unicode code-point offsets and exact quotes on immutable writing
versions, with attributable threaded replies and student-controlled dispositions.
They never overwrite writing. Private partial request drafts persist with revision
checks and recover without granting consent. Studio shows human feedback separately from its local
checks and unavailable AI feature. Rubrics cover clarity, structure, specificity,
evidence, voice, prompt fit and grammar. Readiness outcomes are advice only; suggested
steps never change CRM states or Roadmap tasks. Students revise through the existing
version/compare/restore authority and explicitly share new checkpoints.

Scheduling supports explicit timezone-offset slots, weekly recurrence, blackout
exceptions, overlap rejection, atomic single booking, series/slot cancellation and
truthful meeting-link-pending status. Nonexistent and ambiguous local DST times are
rejected; explicit-offset slots remain available. Reschedule by cancelling and
choosing another slot; these are separate audited actions. No external calendar,
payment, email or notification provider is introduced. Published paid prices remain
visible, but request creation rejects nonzero prices and never creates a charge.
SLA uses elapsed hours from submission, pauses during student action and resumes
with recorded paused seconds. Up to two follow-ups on the same versions restart the
estimate within the original consent window. Consent is never extended silently.
No jurisdictional business-day calendar is claimed.

Rollback: disable mentoring routes and stop issuing grants; preserve private content,
events and existing phases. Do not drop tables or reset a hosted database. Postgres
metadata backups do not include Storage blobs. Test restoration and physical retention
operations in a selected staging environment before promotion.

Account lifecycle: live mentor commands and resource/evidence reads also verify that
Auth membership still exists, because deleting Auth does not invalidate old JWTs.
Auth deletion revokes assignments, cancels bookings, redacts the mentor bio/claims,
and expires evidence for the retention worker. A revoked, non-public profile reference
and pseudonymous historical actor UUIDs preserve student-owned feedback attribution;
they grant no permissions. These historical audit references deliberately do not
cascade with Auth membership. Student deletion still cascades through owned requests,
grants, comments and Writing data. Physical Storage cleanup precedes Auth deletion in
the operator workflow; the retention worker never marks a blob purged while its
Storage record remains. No real account or identity proof was deleted in this task.
