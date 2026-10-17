# Phase 04 screen inventory

| Route                 | Purpose                             | Backend                                |
| --------------------- | ----------------------------------- | -------------------------------------- |
| `/`                   | Redirect to `/ru`                   | No persistence                         |
| `/ru`, `/kk`, `/en`   | Temporary localized availability    | No data or account collection          |
| Invalid route         | Localized 404 with valid home links | HTTP 404                               |
| Segment loading/error | Accessible wait/retry fallback      | Next boundary; no fake provider result |
| `/api/health`         | Process liveness                    | No database-readiness claim            |

Auth/dashboard folders reserve boundaries; they publish no routes or menus.
