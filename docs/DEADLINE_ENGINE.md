# Phase 23 deadline and delivery contract

Canonical official dates remain in `deadlines`; no copied official-event table.
`calendar_deadline_subscriptions` projects explicit watches, saved program /
scholarship / opportunity relationships and active applications. `calendar_events`
is a SECURITY INVOKER projection over those dates, personal events and roadmap
planning dates. Every underlying private relation retains owner RLS. Official
reminders require published verified deadline evidence from an active official
source with current effective dates. Editable roadmap dates remain labelled
suggested planning dates. Missing prerequisite UIs are not fabricated.

`calendar_custom_events` stores date-only personal plans; edits use version CAS.
Cancellation preserves history. An owner can hold 500 personal dates; a database
lock and trigger enforce the limit across concurrent inserts. Calendar queries
are bounded to 500 events, with an explicit truncation message; ICS refuses an
unbounded export. Inbox history uses stable `(created_at,id)` cursor pagination.

## Time policy

UTC instants retain their source zone. DATE-ONLY remains a date, including in ICS;
09:00 in the chosen user zone is an internal reminder time, never a claimed cutoff.
The default display zone is UTC; the user can change it. Reminders subtract local
calendar days, rather than 24-hour durations. PostgreSQL and Temporal both use the
later instant for DST gaps and overlaps. Daily / Monday delivery windows move to
the next permitted local time, then respect quiet hours; equal quiet endpoints
disable quiet hours. Off and pause cancel queued work. These are delivery windows
for separate durable in-app messages, not a consolidated external email digest.

## Persistence and reliability

New accounts receive in-app-only defaults; existing accounts were initialized
without altering any external consent. Preference edits are audited. External
email/push are unavailable, cannot be opted into through this API and are never
queued. No OAuth integration is activated. The inbox becomes `sent` only in the
same transaction that persists its receipt. This is application persistence,
not a claim of vendor delivery.

Private `notification_private.run(now,limit)` uses an advisory transaction lock,
`FOR UPDATE SKIP LOCKED`, a UNIQUE user/event/revision/kind/lead/channel key and
unique receipt job ID. Source revisions cancel obsolete work and create one
source-change correction for a user with a prior sent reminder, retaining the
previous and updated dates. Queued jobs revalidate source visibility, revision,
preferences, categories, mute, cancellation and expiry at dispatch. Future work
is generated in bounded batches; old occurrences are not backfilled (five-minute
jitter allowance is still bounded by opt-in time). Transient database failures
retry with capped exponential delay and fail after five attempts. SQLSTATE only
is retained, without raw payloads. Worker run metadata expires after 30 days;
owner receipts persist until account deletion. No external provider retry or
exactly-once email guarantee is claimed.

The migration installs no cron job. `supabase/ops/phase23-enable.sql` is an explicit
operation for the verified Jetuu development target; do not enable it blindly in
restored test copies. `notification_worker_runs` is privileged-only operational
metadata. SQL below provides queue/backlog and run health without exposing titles:

```sql
select status,count(*),min(planned_at) from public.notification_jobs group by status;
select * from public.notification_worker_runs order by id desc limit 20;
```

## API and export

`GET /api/deadlines` requires a real authenticated session; POST also checks Origin,
strict input schemas and bounded JSON. Owner comes from `getUser`, never input.
User privileges permit receipt timestamps only; forging jobs/inbox content is
denied. Preferences have no external channel fields. Personal events use CAS;
errors retain form input. The header unread badge updates after receipt changes.
Private exports use `no-store`, owner RLS, safe fixed filenames, stable anonymous
UIDs, escaped text, CRLF, UTF-8 75-octet folding and correct all-day/UTC semantics.
Exports contain titles, and UI warns about sharing. Unknown dates are omitted;
no user IDs, private notes or document text are exported. RU/KK/EN UI includes
source links and checks, precision labels, native modal focus/Escape, keyboard
filters and reduced motion.

## Known acceptance limits

Hosted two-account browser login/save/reload/export has not been demonstrated.
Public program/scholarship editorial coverage and previous phase acceptance remain
open. No external channel provider is configured. Phase 24 is not started.
