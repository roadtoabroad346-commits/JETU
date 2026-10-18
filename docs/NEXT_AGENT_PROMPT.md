# Next agent handoff — stop at Phase 04

Current phase: **04/30, PARTIAL** under the original full-stack gate.
Do not start Phase 05 automatically. App/repo root is `/workspace/JETU`; preserve
nested `jetu/`. Read AGENTS, master Phase 04, tracker, decisions and the latest log.

The user authorized existing Jetuu (`edpuovkgoisyzpguksdi`) for development, with
no remote reset, data deletion or production deployment. See CLOUD_DEVELOPMENT.md.
No workspace Docker was used in the continuation. MCP OAuth works; ignored
`.env.local` contains a modern publishable key only, with `JETU_ENV=development`
so local DB commands fail closed. No separate paid project/branch was created.

The old main CI failure was generated types versus placeholder. Actual generation
output is now committed; Prettier runs before atomic replacement. Advisors check
security and performance, generated types are retained as a CI artifact, and CI
continues to compare them for drift. Do not remove the comparison to hide failure.

Cloud baseline `20261018072531_foundation_security` applied once. The unchanged SQL
file was renamed to that cloud-assigned canonical version. All 14 transactional
pgTAP assertions passed; probes rolled back and no public tables remain. Cloud
security and performance advisors returned no findings. Cloud-generated output is
saved separately from pinned CI types; see CLOUD_DEVELOPMENT.md for metadata differences.

Remaining gates: full local Auth/Storage/Realtime/email/API stack startup has not
been run; this workspace workflow explicitly excludes Docker. Direct HTTPS REST
from this workspace is blocked by the managed proxy (CONNECT 403); MCP success does
not prove browser/SDK connection. Request the supported network configuration
change if that test becomes required; do not bypass the proxy. Supabase changelog
fetch was likewise blocked. Auth/session and product row-isolation flows remain
future phase scope, not completed tests. No physical-phone/WebKit certification.

Use disposable CI for twice-clean migration replay and 14 pgTAP assertions per
pass, both advisors, generated-type drift and frontend checks. Never reset the
hosted project. Consult the latest verification evidence and Actions links in
IMPLEMENTATION_LOG.md before assuming the latest pushed commit passed. Finish
only Phase 04's remaining authorized verification, then stop for user direction.
