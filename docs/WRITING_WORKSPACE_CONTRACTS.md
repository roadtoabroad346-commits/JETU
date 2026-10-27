# Writing workspace contracts

Private plain-text drafts: essay, SOP, personal statement, CV. UI saves explicitly;
it does not claim autosave. Limits: 100 drafts/owner, 100,000 UTF-8 bytes/content,
4,000 prompt characters, 200 revisions/draft, 120 saves/hour. Prompts and word
limits are user input, not claimed official institutional requirements.

`writing_save` serializes per owner and checks exact expected version. The same
request UUID and same fields replay safely. Different content under that UUID or
a stale/null version fails. Every successful write atomically appends a full
immutable snapshot. Loading an earlier revision changes the editor; explicit Save
creates a new revision. Conflict feedback preserves local text and offers text
export. Unsaved drafts are not written to browser storage.

Word count uses `Intl.Segmenter('und', {granularity:'word'})` word-like segments.
Character count uses Unicode code points. Comparison finds a changed range in
linear time; it is not a linguistic score or PDF visual diff. React text rendering
escapes every draft/name/diff; no `dangerouslySetInnerHTML` or rich HTML is allowed.

The clarity/evidence/structure/specificity/prompt-fit rubric is a student self-review
checklist, not an admissions assessment. No external AI receives writing content.
Text export uses a short-lived local Blob URL. Saving a saved draft to the Vault
uses the normal quarantine pipeline and records an owner-checked draft origin
only when the immutable byte checksum matches the current draft. It does not mark
an application submitted or ready. Application associations are composite-owner FKs.
