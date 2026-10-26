# Application state machine

The Phase 18 application aggregate tracks preparation and user-reported outcomes; it does not submit to, poll or speak for an institution. Every mutation is an authenticated RPC with owner lookup, optimistic version checking and an idempotency key for transitions.

## Canonical program states

`researching → shortlisted → preparing → ready_for_review → ready_to_submit → submitted_external_confirmed → under_review`

From `under_review`, the user may report `interview`, `waitlist`, `offer` or `rejected`. `interview` can return to `under_review` or move to `waitlist`, `offer` or `rejected`. `waitlist` can become `offer` or `rejected`. `offer → accepted → enrollment`; an offer may instead be `declined`. Active states can be `withdrawn`; reopening returns to `researching` with a meaningful explanation. Terminal `rejected`, `declined` and `enrollment` states do not transition.

Product copy may group states as Considering, Preparing, Submitted, Awaiting result and Decision received. Those are presentation aliases only; storage and APIs use the canonical values above. In particular, `submitted_external_confirmed` means the user explicitly reported an external portal submission and supplied evidence. JETU does not claim institution confirmation.

## Transition guards

- `ready_for_review`, `ready_to_submit` and `submitted_external_confirmed` require every mandatory checklist item to be completed.
- External submission requires a checked confirmation plus at least three characters of evidence. The database writes `submitted_at` and immutable `USER_REPORTED` provenance in the same transaction.
- Interview/decision/withdrawal states require a reason. Reopening a withdrawn application requires at least ten characters.
- A result cannot skip the sequence: `accepted` is reachable only from `offer`, and `enrollment` only from `accepted`.
- An expected version prevents stale-tab writes. Replaying the same transition idempotency key returns the existing aggregate without another event.
- When an application has a linked Roadmap submission task, external submission completes that task in the same transaction. Existing Roadmap dependency triggers can reject the operation, rolling back the application transition too.

## Scholarship state machine

Scholarship tracking is a separate aggregate even when linked to a program application:

`researching → preparing → ready_to_submit → submitted_external_confirmed → under_review → awarded | not_awarded`

Preparation states may move backward; active states may be withdrawn and later reopened with an explanation. Scholarship submission has its own explicit confirmation, evidence, timestamp, provenance, version and immutable events. A program application’s status never implies that a scholarship was submitted or awarded.
