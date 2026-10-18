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
