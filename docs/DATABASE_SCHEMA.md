# Database scope at Phase 04

No application tables, business functions, buckets, or records exist. The baseline
migration creates the non-exposed `jetu_private` namespace and restricts default
privileges and public schema creation. Supabase owns Auth/Storage internal schemas;
do not duplicate its identity model. Catalog/profile schemas belong to later phases.

Generated public schema TS types are at `src/lib/supabase/database.types.ts`.
If its header says bootstrap placeholder, type generation has not succeeded and
must not be claimed verified. Only `npm run db:types` may replace it after local
migrations. `supabase/seed.sql` is intentionally empty; pgTAP probes roll back.
