# Application audit trail

`application_events` and `scholarship_application_events` are append-only owner-scoped history. Authenticated clients receive `SELECT` only; all writes occur inside reviewed `SECURITY DEFINER` RPCs that validate `auth.uid()`, ownership, inputs and expected versions with an empty `search_path`. Update/delete triggers reject history rewrites even for privileged SQL paths.

Program events record creation, status changes, metadata changes, checklist creation/update and scholarship linkage. They retain actor, source type, from/to state, bounded reason/evidence, structured details, idempotency key and server timestamp. Checklist evidence records its origin (`system`, `roadmap` or `manual`) and verification state; generated evidence identity cannot be reassigned.

Submission and decision facts are deliberately `USER_REPORTED`. JETU does not infer an institutional decision from a checklist, matching score, Roadmap task or email. Official facts remain in the separate catalog provenance model (`official_sources` and `source_claims`).

Retention follows the owning account today: owner deletion cascades private application data. Product/legal retention beyond account lifetime is not implemented and must not be implied. The UI timeline is bounded to the newest 200 program events and 100 linked scholarship records; database history remains complete until account deletion.

The six public mutation RPCs are intentionally callable by `authenticated` and therefore appear in Supabase’s generic SECURITY DEFINER warning. This is reviewed architecture, not an accidental grant: underlying tables are read-only to clients, every RPC derives the actor from `auth.uid()`, enforces the owner in every target query and exposes no arbitrary SQL identifiers. Any new RPC must repeat those properties and receive a two-user rollback test.
