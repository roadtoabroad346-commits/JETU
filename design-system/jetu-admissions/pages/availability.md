# Availability page — Phase 04 only

Purpose: identify JETU and honestly state that registration/discovery are not open.
Hierarchy: brand/language → status → single headline → purpose → availability note →
decorative pathway + belief → footer. No claims of verified catalog, users or results.
Only actions are home/language links, all valid. URL navigation persists locale
through reload/history; no user records or cookies are collected.

Loading/error/404 live in App Router boundaries. No form, mutation, success toast,
empty catalog or offline draft is present, so their product states are not invented.
The error retry calls Next reset; 404 home links remain reachable by keyboard.
Keep the page readable without JS; the decorative illustration is aria-hidden.
Minimum targets 44px, no clipped Kazakh labels, no 320–1920px horizontal overflow.
Reference captures and review: `docs/evidence/phase04/`, `docs/design/UX_QA.md`.

## Phase 05 integration

Shared path-drawn BrandLogo replaces the provisional font wordmark. Error/404 use
shared Button styling; loading uses shared Skeleton. Automatic loading remains
scoped to the marketing route group. No admissions CTA or marketing expansion added.
Phase 05 regression reruns original locale/HTTP/no-JS/keyboard/axe checks; historical
Phase 04 captures remain historical, not silently refreshed baselines.
