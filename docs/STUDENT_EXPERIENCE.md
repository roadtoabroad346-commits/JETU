# JETU student experience — 2026-11-04

User-authorized redesign of registration, sign-in, private onboarding, the home/
dashboard invitation, shared account navigation and privacy. The existing search,
matching and catalog functions remain available. This work does not certify every
historical phase or the entire MVP as FULL AND VERIFIED.

## Delivered experience

- Original JETU vector companion **Джет / Jet**, a blue travelling bird with a
  yellow scarf/backpack. CSS animates its greeting, thinking and celebration;
  motion is finite (under five seconds), never gates input, and is disabled by
  prefers-reduced-motion. No image service, external font or tracker required.
- Short account form: name/email/password, show/hide, password-manager/paste
  support, local/server validation, pending feedback and input retained on error.
  Actual Auth response determines confirmation or private onboarding. Failure
  does not disclose account existence. Fresh consent is unselected and versioned;
  editing academic information cannot manufacture consent.
- Five-step profile: school stage/residence → intended degree/field → optional
  education/GPA/exams → tuition budget with range/presets/exact number → review.
  Decorative emoji accompany native labelled radio choices. Grades never infer
  age, citizenship or completed education. Zero and unknown budget remain distinct.
- Back/edit/skip, full review, explicit JSON download, unsaved-change browser guard,
  no silent localStorage/sessionStorage drafts. Data remains in memory until an
  explicit owner/version-checked server save. Failed saves/conflicts retain inputs.
  Saved confirmation occurs only after a successful server result. Repeat editing
  uses the returned profile version. Existing independent JSON fields are preserved.
- RU/KK/EN account routes, navigation and privacy, phone/tablet/desktop layouts,
  keyboard/focus semantics and reduced motion.
- Privacy policy names **Мырзабек Нұржан**, **Казахстан**, **jetuu1550@gmail.com**,
  supplied by the user. Fourteen sections cover scope/data/purposes/consent/minors,
  providers/transfers/cookies/retention/rights/export/security/matching/changes.
  Manual deletion contact, unconfirmed backup/log retention and cloud-location
  limitations are explicit; no automatic purge or Kazakhstan-only storage is claimed.

## Boundaries and acceptance

| Path                          | Acceptance                                                                   | Verification                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Signup/login                  | Validated fields, active consent, no lost input or fake success              | Production browser failure state, mocked Auth adapter + confirmation component |
| Profile                       | Five steps, real serialized fields, review before save, retry/version checks | Unit/adapter + actual React components with test-only mocked actions           |
| Responsive/a11y/motion        | No overflow at 320/768/1440; labels, focus, axe; reduced motion              | Production pages and separate component browser runner                         |
| Privacy                       | Real supplied contact, accurate implementation and honest limits             | Localized route/link/content checks                                            |
| Actual hosted student journey | Email → account → profile save/reload → matching                             | BLOCKED: CONNECT 403 to hosted Supabase; no workspace runtime credentials      |

`tests/journey` is a test fixture, outside Next application routes. It cannot grant
access to private production pages or access a database. `test:journey-ui` runs it
on localhost with Vite (the existing Vitest dependency, now directly pinned at
8.3.4 for a reproducible test harness). No new production dependency was added.

## Verification

- Baseline `npm run check`: PASS, 83 unit/adapter tests + production build.
- New `npm run check`: PASS, 107 unit/adapter tests + production build after
  integrating the newer main (including its thirteen wizard tests).
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:journey-ui`:
  PASS, six scenarios, including GPA validation, zero/unknown budget, JSON export,
  no submission on entering review, failed save retry, edit/version handling,
  conflict recovery, confirmation and all five steps in three locales with axe.
- Production `npm run test:e2e`: PASS, 80 passed, four hosted-Auth-dependent
  skips (84 total), including registration failure/retry and no-JS server validation.
- `npm ci --no-audit --no-fund`: PASS, clean install of 365 packages, followed by
  the full check above. A separate earlier dry run also resolved the lockfile.
- Direct hosted Auth health check: BLOCKED, proxy CONNECT 403 on 2026-11-04.
- No schema migration, elevated client key, paid service, remote fixture or
  production deployment was introduced. Fresh full `npm audit` still reports
  thirteen moderate development findings inherited through minimatch; no high or
  critical findings. `npm audit --omit=dev` reports zero production vulnerabilities.

The browser tests uncovered and fixed two accessibility/interaction problems:
an inline privacy link needed an underline, and a reused Continue button could
become a submit button during its click. Separate keyed controls and an explicit
regression now ensure review cannot trigger an accidental save. Input labels
exclude helper prose from their accessible names.

Integration with updated GitHub `main` (`a2cc7ac`) preserves the CI type artifact,
manual benchmark relocation, Windows visual baselines and previous all-fields
wizard. The latter is reachable at `/onboarding?view=all` through a no-JavaScript
link and now submits the expected profile version. The primary animated journey
stays separate from this compatibility surface; its copy lives in journey-copy.ts.
Server-rendered forms and public pages wait for complete content rather than
streaming a skeleton that a script-disabled browser cannot reveal. Auth's reveal
wrapper retains its DOM identity during hydration, preserving entered form data.
Mobile header actions were adjusted to retain the visible first hero action.
The compatibility form cannot erase the new grade field it does not expose;
an adapter regression verifies this. Identity-provider outages produce retryable
errors, while expired/absent identity gets the separate sign-in recovery.

Screenshots and raw command evidence: `docs/evidence/student-2026-11-04/`.
Signup/login/privacy captures are actual local production pages. Profile captures
use the real component in the explicitly mocked test fixture, not a hosted account.

Skills applied: UI/UX Pro Max (existing JETU contract, form/a11y/motion guidance),
Lean Build (one coherent journey, existing persistence), Supabase (current Auth
docs, server checks and no privileged client), React Best Practices (hook/focus/
component review). The cloud skill search script was not available; no generated
design search output is claimed.

## Run and verify

`npm ci`, `npm run dev`; visit `/ru/signup`, `/kk/signup`, `/en/signup`, `/en/login`
and `/{locale}/privacy`. A reachable configured Supabase is required for the real
private `/{locale}/onboarding` and dashboard. `npm run check`, `npm run test:e2e`
and `npm run test:journey-ui` are separate gates; the latter proves mocked UI
behavior, not hosted Auth/REST persistence. Use the browser executable override
above if Playwright's managed Chromium is unavailable.
