# Actual rendered Phase 23 component evidence

These screenshots show real production components in an explicit test-only Vite
fixture with synthetic rows. They prove rendering, not hosted authentication,
real admissions records or a completed student journey. No fixture route is
included in the Next application. Test source: `tests/journey/deadlines.spec.ts`.

- `dashboard-test-render.png`: EN, 1440px.
- `calendar-mobile-test-render.png`: RU, 390px; compact month and readable agenda.
- `preferences-mobile-test-render.png`: KK, 390px.

Browser tests also render all three locales on phone/tablet/desktop and run axe,
keyboard/modal, URL retention, reduced-motion and failed-save checks.
