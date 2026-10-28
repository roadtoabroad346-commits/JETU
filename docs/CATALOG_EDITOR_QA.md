# Catalog editorial console — 2026-10-28

`/{locale}/admin` displays bounded source claims, normalized record snapshots,
parent dependencies and recent audit diffs. Review requires an explicit checkbox
and a human note. Publication is separate from claim review and requires all
claims resolved, a verified active source and published verified parent records.
Rejecting a published claim withdraws its entity; published children must be
withdrawn first. User-entered text is escaped and sources remain HTTPS links.

Authorization is based on database membership tied to `auth.uid()`; no editable
user metadata or browser service key is trusted. Editors can read; reviewers and
admins can review/publish. Client calls remain scoped to the authenticated user.
Memberships cannot be self-granted; audit entries cannot be directly edited by
browser roles. Commands require matching entity revision, claim hash/state and,
for publication, normalized record hash. A transaction advisory lock serializes
the console's graph mutations. Events retain actor ID, note, before/after state.

Development migrations `20261028132915` and `20261028133923` are applied. The
26-assertion rollback suite exercises roles, authorization, attestation, stale
versions, unresolved claims, reviewer identity, audit, atomic withdrawal and the
transaction lock; the MCP response returned the final `ok 26`. Full replay and
generated types must also pass CI. Synthetic UI exercises review, publication,
conflicts, denied/read-only roles, escaped text and axe in RU/KK/EN at three
widths. The user selected `roadtoabroad346@gmail.com` as development catalog
reviewer. Its confirmed Auth identity has the `reviewer` membership; a rollback
SQL role probe returned the reviewer role and 12 queue records. This is not a
real hosted browser-login test.

This is a focused review/publish slice, not all of Phase 11 or Phase 28: editing,
ingestion, role management UI, support/abuse and other operations remain work.
No real catalog entity was published by the tests. Previously confirmed limited
claims and unreviewed conflicting Pearson cycle remain as documented in
CATALOG_REVIEW_2026_10_28.md. Current network policy still blocks hosted login.
