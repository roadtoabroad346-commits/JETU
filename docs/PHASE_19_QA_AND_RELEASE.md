# Phase 19 QA and release — 2026-10-27

**PARTIAL. No production promotion.** Base `00b0be6` / draft PR #4;
branch `codex/phase19-document-vault`. Phase 20 is untouched.

## Development schema

Jetuu `edpuovkgoisyzpguksdi`, matching historical development authorization and
current migration history. Additive reviewed migrations:
`20261027053050_document_vault`, `20261027054005_vault_hardening`,
`20261027054407_vault_integrity`, `20261027054806_vault_recovery`, `20261027055906_vault_quota_boundary`
(all with `phase_19_` names in Git/history). Every migration rehearsed in a rollback
transaction before application. Bucket `student-vault` remains private. Actual
MCP types generated; pinned CI generator parity must be confirmed by the CI artifact.

SQL probes pass 55 + 21 assertions with rollback. A follow-up query confirmed zero
Phase 19 hosted documents, drafts, recommendations or fixture users, zero public
buckets and zero published/verified programs. Advisors: no unindexed foreign keys;
unused indexes reflect an empty product corpus. Authenticated command-definer
warnings are explicit bounded command boundaries; no anonymous definer grant or
service-role browser key was added.

## Local verification

- `npm run check`: initial full gate passed formatting, lint, types, 162
  unit/integration tests and production build. The final complete local gate also passed after the login/HTTP fixes.
- Focused Vault unit/integration: 46 tests passed (file validation, resource limits,
  XSS input, ownership/state-before-provider access, integrity, Unicode/diff, ZIP).
- Synthetic component browser: nine RU/KK/EN cases at 375/768/1440px passed axe,
  overflow, quarantine-disabled controls, word limit/save feedback and reduced motion.
  Twelve actual screenshots are in `docs/evidence/phase19/*-synthetic.png`.
  Vault desktop and Kazakh Writing mobile were visually inspected. These are
  synthetic UI evidence, not live Auth or persistence proof.
- Production dependency audit: zero vulnerabilities.
- Local clean migration replay attempt failed while Docker registered the pinned
  PostgreSQL image (`no space left on device` inside its layer store). No remote
  reset or network restriction bypass was attempted.
- Full browser run initially reached 82/84: the two newly unskipped dashboard checks
  exposed the inherited unconfigured login crash. Proxy and login now fail closed
  with an explicit unavailable sign-in state; the final rerun passed 84/84, including every formerly skipped anonymous route.

## Independent runtime gate

Added `vault-auth-storage` CI job. It starts a disposable local Supabase gateway,
GoTrue, PostgREST and Storage, obtains only local ephemeral keys in memory, creates
confirmed test identities, signs in through actual Auth, attacks cross-user/direct
Storage/signing/quarantine boundaries, tests concurrent writing saves, builds the
configured app and uses two independent signed-in browser contexts. It exercises
save/reload and authenticated download/archive. Fixtures and blobs are cleaned.
Synthetic admin scan promotion in this test is explicitly not a malware verdict.

## Release blockers

- No configured/freshness-monitored real ClamAV worker, retention schedule or proven
  object-backup restore. Hosted uploads stay quarantined until real scanning passes.
- Hosted Auth/REST/Storage remain outside runner network policy. Full local CI can
  prove the local runtime; it cannot prove hosted configuration or cross-device UX.
- Mentor assignment and guardian-consent domain absent: sharing stays unavailable.
- Recommender request/letter authorization is SQL-tested; hosted recommender browser,
  real delivered invitations and institutional integrations remain unverified.
- Reviewed catalog/human editorial approval and Phase 17 generation authority remain
  open. Phase 18 populated attachment/submission regression cannot be claimed hosted.
- Final Git/PR, CI/type parity and commit-matched preview results are recorded below
  when observed; health or a sign-in redirect alone is not privacy acceptance.

## Final checkpoint

Pending final local checks, remote CI and preview. Keep draft/PARTIAL until concrete
results replace this checkpoint. See `DOCUMENT_SECURITY_MATRIX.md` for each of the
25 adversarial requirements and bounded evidence.

Final local `npm run check` passed formatting/lint/types/162 tests/build after fixes. The final synthetic UI rerun passed all nine cases. The final production-browser run passed 84/84 with zero skips.

Final invitation redirect/hash-change regression: 2/2 desktop/mobile cases passed
after preserving a validated invitation through sign-in and clearing stale/invalid
fragment values. The suite now contains 86 cases; the full 84-case run plus the
new two-case production-build regression passed locally.

### Remote checkpoint — implementation `33042da`

Draft PR [#5](https://github.com/roadtoabroad346-commits/JETU/pull/5), stacked on #4.
CI [40458999685](https://github.com/roadtoabroad346-commits/JETU/actions/runs/40458999685):
frontend passed; both clean migration replays and all eight pgTAP suites passed
197 assertions each. The database job then correctly failed type drift because
MCP and the pinned CLI generator differ in ComputedFields/JSON nullability.
The exact CI-generated artifact (SHA-256
`2b553b96dfd0b6ae33a4fe090d6577fb7a9beded41fdebc6459d37a13bcfb7e9`)
was downloaded, checked and adopted unchanged; no drift gate was weakened.

Vercel `dpl_BmpWFBYTDjxrvUtsXRJR5JcXo2sK` for exact `33042da` is READY at
<https://jetu-phase13-preview-i43lvebym-impact-hub.vercel.app>. Connected protected
fetch: health 200; `/en/vault` and `/ru/writing` returned localized sign-in HTML
with private/no-store caching. `/api/vault` remained blocked by Vercel protection
(401 at share-link redirect), so no hosted authenticated API evidence is claimed.

Additional worker hardening rejects absent, invalid or more than seven-day-old
ClamAV definitions. A focused freshness regression passed. Final local complete
check now passes **163** unit/integration tests plus formatting, lint, types and
production build. The real local Auth/Storage CI job is still pending at this
checkpoint; observe its actual outcome before advancing evidence.

### Runtime diagnosis before corrective push

The first actual local GoTrue/Storage job reached browser login, proving that all
15 preceding real-session Storage/metadata/signing/quarantine/draft/concurrent-save
assertions had passed. Browser automation then timed out on an exact label query:
the shared Field includes a required asterisk. Reproduced locally with configured
SSR: exact `getByLabel('Email address')` found zero, the exact accessible textbox
role found one. Corrected that selector and the password-label matcher without
changing application authorization or weakening a security assertion. The complete
browser journey still requires the successor CI verdict.

The ZIP export was also opened by Python's standard ZipFile reader: both entries,
CRC validation and a Unicode text payload passed. No student data was used.

### Corrective validation

CI [40460380110](https://github.com/roadtoabroad346-commits/JETU/actions/runs/40460380110)
on `f935617` passed frontend and the complete database gate, including both 197-assertion
replays, advisors, exact generated-type drift and typecheck. Its runtime browser
job is being observed separately.

Additional review fixed a client feedback defect: an idempotent replay with a stored
`failed` upload must preserve the selected file and prepare a new version, rather
than display a quarantine success. The dedicated synthetic retry regression passes;
the full localized component suite now passes **10/10**. The runtime test additionally
exercises actual browser upload, authenticated MIME/size rejection and quarantine
API denial. Its CI browser setup selects an installed system Chrome when available,
with the standard Playwright installation as a fallback.

The second runtime run reached real browser sign-in, private Vault download, draft
save and the persisted draft list after refresh. Its final text read hit another
exact-label locator issue: a textarea's initial value participates in Playwright's
label-text matching. A minimal Chromium reproduction returned zero exact label
matches and one exact accessible textbox-role match. Corrected the read/fill
locator to the semantic textbox role. The successor gate retains the same strict
content assertion and adds the real upload validation checks above.
