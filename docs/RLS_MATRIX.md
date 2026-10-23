# Phase 04 grants / RLS boundary

Phase 04 baseline below. No product table was exposed in Phase 04. Cross-student,
mentor, school and catalog authorization are **not implemented or verified** by an
empty schema. They require their own schema/policy/integration tests in later
phases. No public bucket exists.

| Principal                | Public schema CREATE | New table/sequence/function default access | Private schema USAGE |
| ------------------------ | -------------------- | ------------------------------------------ | -------------------- |
| anon                     | Denied               | Denied                                     | Denied               |
| authenticated            | Denied               | Denied                                     | Denied               |
| service_role             | Not a browser role   | No automatic grant from this migration     | Denied               |
| postgres migration owner | DDL owner            | Explicit ownership                         | Owner                |

Future exposed tables must enable RLS before explicit grants. UPDATE needs SELECT,
USING and WITH CHECK. Ownership must use verified auth identity, not editable
metadata. Mentors/tenants require explicit trusted assignment/membership and
consent. Prefer security invoker functions; views must respect caller RLS. Never
grant browser clients arbitrary function execution or private schema access.

The transactional `supabase/tests/foundation.test.sql` checks 14 real baseline
permissions, defaults, direct denial, and absence of public tables without RLS.
These probes are not evidence of real student data isolation.

Verified on 2026-10-18 in disposable CI (two clean replays) and authorized Jetuu
cloud development (transaction rolled back). Both cloud advisors found no issues;
follow-up catalog query confirmed no leftover probes. These default-privilege
assertions cover objects created by postgres, not platform-managed admin roles.

## Later-phase RLS state at HEAD (from migration SQL; unverified live)

Recovered/applied Phase 08–12 migrations follow the same model:

- Every exposed catalog table enables RLS and has explicit policies plus
  explicit `anon`/`authenticated` SELECT grants and `service_role` CRUD;
  browser roles keep CREATE/UPDATE/DELETE denial on reference data.
- `student_profiles`, its `_versions`, attachments and
  `student_account_deletions` are owner-scoped (`auth.uid()` identity via
  SDK-verified token, not editable metadata), with explicit owner SELECT
  SELECT/INSERT/UPDATE/DELETE grants. Writes bump a version through the locked
  SECURITY DEFINER trigger; no service key is used in browser paths.
- One private Storage bucket (`profile-evidence`), non-public, MIME-allowlist,
  depth-1 owner paths, deletion-marker interlock; no public buckets.
- `verification_runs` and `data_revisions`: RLS enabled, **no policies and no
  browser grants** — deliberate deny-all until editorial ingestion exists.
- `fee_breakdown_items` visibility depends on parent-publication RLS evaluated
  inside the policy subquery (works under current PostgREST semantics; document
  before adding a second consumer).

The live cloud application state of any policy change beyond Phase 12 is not
recorded here and must be checked with `supabase migration list` (see
CLOUD_DEVELOPMENT.md drift warning) before future SQL work.
