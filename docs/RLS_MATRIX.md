# Phase 04 grants / RLS boundary

No product table is exposed in this phase. Cross-student, mentor, school and catalog
authorization are **not implemented or verified** by an empty schema. They require
their own schema/policy/integration tests in later phases. No public bucket exists.

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
