# Phase 06 plan — landing, public information, SEO

## Objective and gate

Replace the availability splash with a credible RU/KK/EN public journey. Provide
the 13 requested page paths under locale prefixes, a useful demo preview, clear
current availability, canonical/hreflang/OG/sitemap metadata, and accessible mobile
navigation. Preserve JETU blue/yellow and Phase 05 components. Do not represent the
pitch's prototype records, prices, traction, mentors, AI or outcomes as live.

The Phase 06 master gate asks for a CTA reaching real onboarding and a measured mobile
Lighthouse budget. Neither is presently implemented or defined. These remain open
acceptance items until measured/implemented; a valid informational route is not a
substitute for onboarding. Release status must stay PARTIAL if either remains open.

## Architecture and changes

- Server-rendered marketing pages and shared localized content. Keep only the demo
  preview as a leaf client component; preserve content without JavaScript.
- Reuse semantic tokens, brand assets, locale transport and localized 404/error UI.
  Add a marketing layout, home, static information routes, and a page-specific design
  override. Nav and CTAs point to real routes; unsupported feature actions are not
  offered. Prices and contact/availability are stated plainly.
- SEO: per-page title/description, canonical locale URL, three alternate languages,
  OG/Twitter text and original static graphic, sitemap, robots. Omit unsupported
  Organization/FAQ product claims; only truthful site schema if appropriate.
- Data/API: no product table, Storage object, API mutation or privileged client is
  required. Scholarship discovery remains an editorial explanation/empty state until
  source verification and catalog phases. Thus no migration or new RLS policy.
- Failure paths: unknown slug/locale -> 404, optional missing public URL uses local
  default for development, no-JS retains links/content, demo controls have static
  first panel, reduced motion removes transforms.

## Verification

`npm run check`, `npm run test:e2e` using installed Chromium, targeted axe, locale
and path HTTP assertions, keyboard, 320–1920px overflow, reduced motion, no JS,
metadata/sitemap checks. Attempt mobile Lighthouse and record actual evidence or
precise limitation. Confirm the existing Phase 05 gallery and security tests still
pass. Review all CTAs and claims against route/data availability. No DB tests are
needed absent schema changes; retain prior foundation evidence without relabeling it.

## Decisions before implementation

The verified social-proof set is empty. The pricing page will explain that plans
and checkout are not published, since July pitch amounts are proposals. Public
contact details are not copied from the pitch without an approved public channel.
The demo uses questions and example text, with an explicit demo label; it does not
display university names, match scores or a simulated AI answer. This phase adds no
registration flow across the Phase 08 auth boundary.
