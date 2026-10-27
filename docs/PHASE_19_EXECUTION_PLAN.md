# Phase 19 execution plan — 2026-10-27

## Recovered baseline

Start: `00b0be6` from `origin/codex/phases-17-18`, draft PR #4 stacked on #3/#2.
Local `work` was stale at Phase 16; no user modifications existed. New branch:
`codex/phase19-document-vault`. Jetuu development `edpuovkgoisyzpguksdi`
history matches Git through `20261026164713`; only private `profile-evidence`
bucket exists. No production change or Phase 20 work is authorized.

## Acceptance and stages

- [x] Recover latest repository, requirements, development schema and permissions.
- [x] Audit prior gates and repair security defects directly affecting this phase.
- [x] Add private metadata/version/association/writing/recommendation contracts,
      deny-by-default quarantine storage and transactional ownership boundaries.
- [x] Implement bounded validated uploads, scan promotion contract, authenticated
      reads/exports, immutable revisions and owner-scoped application/task links.
- [x] Implement localized Vault and Writing vertical slices, status-only
      recommendation requests, retention controls and truthful unavailable states.
- [x] Attack ownership, state, invitation, MIME, revision and export boundaries;
      replay migrations, generate actual types and run release checks.
- [x] Update evidence/checkpoint; commit, push draft PR and verify CI/preview.

## Bounded contracts and risks

No real malware processor or mail provider is configured. Uploads must remain
quarantined until a trusted scanner verdict binds exact immutable bytes/hash.
No scanner claim, public URL, unrestricted service-role route or confidential
letter access for a student. Mentor access requires an existing verified
assignment model; absent that, deny sharing. Existing signed URLs cannot promise
instant revocation; prefer request-authenticated reads and never issue mentor
storage tokens. Sensitive collection requires explicit purpose and application.

Hosted Auth/REST/Storage are currently excluded by runner network policy; use
available connected tools and CI, never circumvent the policy. Published/reviewed
catalog and editorial approval remain external gates. Test fixtures cannot
substitute for human review or hosted two-user browser evidence.

## Verification matrix

Domain: file signatures/size/active content/Unicode counts/diffs/ZIP traversal.
DB: grants/RLS, A/B metadata/version/draft/link isolation, quarantine/direct
storage denial, idempotency/concurrency, archive/delete and scan race controls.
HTTP: same-origin, bounded payload, verified session, forged identifiers, no-store.
Browser: anonymous protection, locales, mobile/keyboard/reduced motion; populated
Auth journeys only when an authorized actual test environment is available.
Release: `npm run check`, Chromium regression, production dependency audit,
secret/diff review, clean migration replay/type drift via existing CI.

Changed-file and exact-result inventories will be recorded in
`PHASE_19_QA_AND_RELEASE.md`; statuses remain PARTIAL until every required gate passes.

Final implementation anchor `a916e70`: PR #5, green CI 40461693194 (three jobs), 163 unit/integration, 86 browser, 197 SQL assertions per replay and 29 real local Auth/Storage/browser checks. External mandatory gates remain listed in the release report.

Final scoped recovery source `472fe5e`: deleted references stay visible/detachable; local full check, 79 rollback SQL assertions and 11 UI cases pass. Complete replay count is 200; see current PR #5 checks for the remote head gate.
