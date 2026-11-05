# Phase 21 Writing Studio

Phase 21 extends `writing_drafts` and immutable `writing_versions` from Phase 19.
It does not import unfinished upstream application, Vault, Roadmap or admin screens.
Existing application associations remain composite-owner foreign keys. No writing
operation marks an application submitted or changes a Roadmap task automatically.

`writing_studio_save(jsonb)` is an authenticated, owner-checked atomic command.
The existing command authority pattern is retained: clients can SELECT through
RLS but cannot directly mutate drafts/history/receipts. Auth identity never comes
from request fields or user-editable role claims. All new tables enable RLS with
explicit grants; receipts have no browser access. Mentor sharing is unavailable;
there is no implicit role-based access or public export object.

Autosave: 1.5-second debounce, at least 15 seconds between acknowledged background
saves, and blur/manual flush. Changes during a pending request remain in the editor.
An uncertain request retries its exact UUID and payload; the server checks its
SHA-256 digest and acknowledged revision. Later remote edits make replay conflict.
No silent overwrite, automatic overwrite retry or browser-storage copy of text.
Before-unload warns about unsaved text. Error/offline/conflict states offer TXT
export and a separate project copy. Keep the tab open until a server acknowledgement;
closing a tab cannot guarantee recovery of unacknowledged edits.

Current-row revisions increment on every save. Only creation and explicit checkpoints
append immutable snapshots; restore appends a NEW checkpoint. Limits: 100 projects,
100,000 UTF-8 content bytes, 48KB validated Studio metadata, 16 CV sections, 40 comments,
200 checkpoints/project, 240 writes/hour and 10,000 receipts/owner. Quota failures
preserve input. Existing Phase 19 command limits remain unchanged for its old clients.

List reads omit text/history, use at most 100 project rows and 50 sourced prompts.
History lists at most 200 metadata rows; one selected snapshot is fetched on demand.
Dashboard reads only title, date, identity and Studio flags; it renders no text excerpt.
All private APIs return no-store responses and sanitized errors. Mutations compare
full origins and incrementally bound JSON body bytes. Server calls use getUser.

Plain text only: React escapes content, comments and comparison. Anchors use UTF-16
textarea offsets plus exact quotation and SHA-256 content identity. Any text change
marks the prior review stale; no ambiguous automatic reattachment. Counts use ICU
Unicode word segmentation and Unicode code points, with whitespace excluded only
in the separately labelled count. Diff is a bounded linear changed-range comparison,
not a word-level diff, quality score or admissions prediction.

Local checks identify observable structure/length/repeated-word issues and supply
labelled reflection questions. All five rubric criteria are student self-review.
Review results and dispositions remain private Studio metadata. Suggested duplicate-
word removals require explicit acceptance and have an undo action. Text changes
clear the student-ready flag. Institution-source records are service-written only,
current/verified/dated records are readable. Unknown word limits and AI policy stay
unknown. Expired context cannot be newly selected but must not block saving an
existing draft; no official prompt data or deadline is fabricated.

AI is deliberately unavailable: Phase 20 migrations exist, but no gateway source or
configured provider was found on the recovered branches. No text is sent externally,
no consent is implied and no successful AI feedback is simulated. Provider adapters,
provider schema failures/cancellation/quota tests and a real AI review remain open
release gates. This implementation must remain PARTIAL until those gates close.

CV/activities sections contain user-entered text and validated month ranges, support
button reordering, preview, project duplication and UTF-8 TXT export. Browser print
supports PDF output; no server DOCX/PDF job or ATS score is claimed. Text interview
uses generic localized questions, start/pause/end controls and no microphone API.
Practice is ephemeral unless history is explicitly enabled before starting; opted-in
answers are saved in the same private project. No recording or voice feature exists.

Account deletion cascades through draft, history and receipt FKs. Project archive is
reversible metadata, not data erasure. Existing account/retention policy remains the
source for deletion requests; backups are not verified here. Phase 22 and 24 are not
completed by this work. Rollback disables Studio routes; preserve stored content.
