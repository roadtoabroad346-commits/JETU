# Phase 05 implementation plan — 2026-10-18

## Objective and scope

Implement the exact Phase 05 visual-system requirements from the master, using
the direct single-phase request as authorization. The attachment's continuous
30-phase mandate does not authorize Phase 06. Root `/workspace/JETU` is the app;
the preserved `jetu/` snapshot stays untouched. Initial Git tree was clean at `94a4a0b`; user clarified GitHub is authoritative.
Fetched origin and fast-forwarded to `bbbd258` before code changes. Phase 04 remains
PARTIAL (cloud baseline/CI database checks passed; full runtime/direct REST still
unverified); phases 01–03 remain UNVERIFIED.

## Audit and prerequisites

- Next 16.4.2 / React 19.3.1 / strict TS / Tailwind 4 / Motion already pinned.
  `npm ci` succeeded using Node 24.19.0 / npm 11.9.0. No new runtime dependencies.
- Existing public availability page, RU/KK/EN routing, HTTP and Supabase client
  boundaries must continue working. No domain features or live catalog exist.
- Prior cloud-development authorization is documented, but no Phase 05 hosted
  connection is needed. No new data access,
  tables, API mutations, RLS changes, remote DB operations or deployment are needed.
  Local-only wrapper rules and Phase 04 remaining runtime/network gates persist;
  actual generated types and DB baseline are now present in latest GitHub.
- Pitch PDF recovered from latest GitHub, SHA-256 verified against README. Read
  all 8 slides via full extracted text and rendered overview; inspected slides 1/3
  at 1500px. Preserve approved web blue/yellow and document source pixel samples;
  logo is a new original vector identity informed by the pitch.
- Caveman not found in complete cloud catalog, executor catalog or local skill
  paths. Use explicit plan → build → test → fix → separate review → checkpoint.
- Installed UI/UX Pro Max read via cloud skill resources. Actual unchanged search
  sources/data materialized under ignored `work/skills/ui-ux-pro-max` and executed.
  Education research fits; reject generated teal palette/external fonts to preserve
  JETU and offline Cyrillic/Kazakh. Current Next local docs govern framework APIs.

## Architecture and files

1. `src/app/globals.css` + token CSS: semantic colors including contrast-safe action
   blue, 4/8 rhythm, type/elevation/radius/border/chart/icon/breakpoint/motion scales.
   Light theme only. Focus visibility, 44px controls, long content, reduced motion.
2. `public/brand/` vector path wordmark/J-mark + App Router SVG icon. Shared brand
   and UI primitives under `src/components/ui/`; native controls where appropriate.
3. `/{locale}/design-system` server route with localized dictionary and leaf client
   showcase. Button states, pills/badges, tabs, field/select, native modal, tooltip,
   stepper, cards, table/filter, timeline/progress, sidebar, spotlight search,
   skeleton/empty/error/success/disabled. Showcase controls operate on actual
   component-registry data and explicitly local previews, never student records.
4. Reuse identity/tokens/buttons in current availability/loading/error/404 screens.
   No new public marketing flows or unsupported admissions navigation.
5. Save curated `design-system/jetu-admissions/MASTER.md`, showcase override and
   design docs, research logs, screenshots, axe/visual-diff evidence and handoff.

## Contracts, authorization and state

- Showcase is public read-only documentation; all content non-sensitive.
- Shared controls accept typed props and caller-owned state. Dialog uses native
  `showModal`, Escape, focus containment/restoration; no modal auth claims.
- Tabs expose tablist/tab/tabpanel, roving focus, Home/End/arrows. Tooltip dismisses
  with Escape; native selects/inputs have labels and connected error/help text.
- Registry filter/sort/search reflect real component entries; zero matches offers
  reset. Search result selection closes the modal and focuses its real section.
- Form previews validate locally and state explicitly that nothing is saved/sent.
  No network simulation or fabricated submission success. Static pending/error
  specimens are labeled previews. No localStorage of personal data.

## Measurable acceptance / failure tests

- `npm run check`: formatting, ESLint, TS, existing and relevant new tests, production
  build. Existing health/locale/no-JS/reduced-motion/security contracts still pass.
- Production Playwright: RU/KK/EN, 320–1920 reflow plus landscape/200% text; mobile
  and desktop screenshots; axe no applicable violations on showcase and open modal.
- Keyboard: skip link, visible focus, tabs arrows/Home/End, dialog containment,
  Escape + trigger restoration, tooltip Escape, spotlight destination focus.
- Validate empty/long/invalid previews, filter reset, sort toggling, repeated modal
  opens, disabled/pending inertness; no external requests or implied persistence.
- Contrast test actual semantic foreground/background pairs (normal text >=4.5,
  control/focus >=3). Screenshot baseline + repeated pixel-diff capture under same
  Chromium/runtime; distinguish deterministic repeat checks from historical diff.
- Separate review against every Phase 05 item. Document exact pass/fail commands,
  screenshots, measured limits and pitch comparison. Mark PARTIAL if an
  applicable acceptance gate is missing. No claim of production readiness.

## Checkpoint

Update tracker/architecture/decisions/log/next-agent prompt and Phase 05 review.
Commit only task changes after validation; never push or start Phase 06. Copy a
concise report and representative screenshots to the user-facing output directory.
