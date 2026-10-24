# Phase 04 screen inventory

| Route                 | Purpose                             | Backend                                |
| --------------------- | ----------------------------------- | -------------------------------------- |
| `/`                   | Redirect to `/ru`                   | No persistence                         |
| `/ru`, `/kk`, `/en`   | Temporary localized availability    | No data or account collection          |
| Invalid route         | Localized 404 with valid home links | HTTP 404                               |
| Segment loading/error | Accessible wait/retry fallback      | Next boundary; no fake provider result |
| `/api/health`         | Process liveness                    | No database-readiness claim            |

Auth/dashboard folders reserve boundaries; they publish no routes or menus.

## Phase 05 addition

/{ru,kk,en}/design-system: public noindex library, server-rendered content with
client previews, no account/business-data collection, no backend API. Original
availability/404/error routes reuse the same brand and controls. SVG browser icon
and /brand/jetu-{mark,wordmark}.svg serve real vector assets.

## Phase 06 public routes

`/` redirects to `/ru`. Each of `/ru`, `/kk`, `/en` now renders the localized
marketing landing with a labeled concept preview and guide links. The following
paths exist under every locale: `about`, `how-it-works`, `scholarships`,
`universities`, `opportunities`, `pricing`, `for-schools`, `mentors`, `faq`,
`contact`, `privacy`, `terms`. They are informational and have no user-data API or
persistence. The opportunities page is a guide while matching is unavailable;
pricing, mentor booking, contact form, school workspace and signup remain closed.
Unknown public paths return HTTP 404 with localized recovery links. `/sitemap.xml`,
`/robots.txt`, and `/opengraph-image` serve SEO assets. Development origin is noindex.
