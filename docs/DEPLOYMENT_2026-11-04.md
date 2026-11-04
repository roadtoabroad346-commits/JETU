# Authorized JETU publication — 2026-11-04

The user explicitly requested publication to GitHub, Supabase and Vercel on
2026-11-04. This authorization supersedes older handoff notes that deployment
was not yet authorized. It does not authorize database resets, deletion of
existing data, new paid infrastructure or changes to unrelated projects.

## Exact targets

- GitHub: `roadtoabroad346-commits/JETU`, PR #10 into `main`.
- Vercel: team `impact-hub`, primary project `jetu`
  (`prj_K2cJDAjzZ7KWTAw4m3CfJwmseAl5`). Canonical origin:
  `https://jetu-iota.vercel.app`.
- Supabase: existing **Jetuu**, `edpuovkgoisyzpguksdi`, Seoul region.
- The existing Git-linked `jetu-phase13-preview` project is a secondary deployment;
  it is not a replacement database or a newly purchased environment.

## Reconcile history without replaying hosted SQL

The hosted project contained 43 applied migrations while Git contained only 23.
The linked Supabase `main` reported `MIGRATIONS_FAILED`. Recovered the 20 missing
files under their exact already-applied versions and names from
`supabase_migrations.schema_migrations.statements`. Each file matches the hosted
statement byte length and MD5; see
`evidence/deployment-2026-11-04/migration-history.json`.

These are historical records, not new hosted migrations. No remote SQL was
re-applied, reset or marked repaired. Later phase and `mirror_x` schema history
is preserved without merging its unrelated application code or promoting any
phase to verified. Future migrations must follow the latest recovered version.

## Configuration

- Set production `NEXT_PUBLIC_APP_URL` in primary Vercel project to the canonical
  HTTPS origin. Previously absent, it would default to localhost in callbacks.
- Verified the public Supabase URL and publishable key belong to Jetuu, without
  exporting private credentials.
- Set primary Vercel Authentication to Standard Protection
  (`prod_deployment_urls_and_all_previews`): production domains are public;
  previews and generated deployment URLs retain protection.
- Declared `[remotes.main]` in `supabase/config.toml` for the existing hosted
  project, with the canonical Auth Site URL and exact signup/recovery callback
  URLs for RU/KK/EN. Local defaults and local-only command guards remain intact.
  Remote seed execution is disabled. Hosted application of this configuration
  must be verified; committing configuration alone is not proof it was applied.

## Validation and release state

The pre-release UI commit `e5eb57d` passed both frontend and database jobs in
GitHub Actions run `41827832229`; both existing Vercel previews reached READY.

After history recovery, local PostgreSQL image download exhausted the workspace
filesystem during Docker's vfs layer expansion. The task's start process was
stopped; no local replay result is claimed. The pinned CLI database replay,
pgTAP, advisors and generated-type guard will be checked in GitHub CI before
merging this expanded release candidate.

Publication and final hosted smoke results are pending at this checkpoint.
Hosted email confirmation, SMTP deliverability and two-account owner isolation
must not be reported verified without corresponding real hosted evidence.
The public catalog still lacks an acceptance-ready, reviewed program and
scholarship corpus. Product phase labels remain unchanged.

## Rollback

If the application release fails, roll Vercel back to its previous READY
production deployment and revert the application commit through GitHub. Do not
delete recovered migration files or reset Supabase: those versions were already
applied before this release. Auth configuration can be reverted independently
after checking active callback URLs; keep secrets out of Git and evidence.
