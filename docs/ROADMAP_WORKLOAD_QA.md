# Weekly workload verification — 2026-10-28

Scope: persisted weekly availability now controls a derived, dependency-aware
work estimate in the Roadmap overview. Long tasks split across weeks, completed
tasks consume no time, urgent submissions propagate urgency to prerequisites,
and personal/internal date risk is distinct from official cutoff risk. Work
after a decision waits until started or personally dated. The engine is bounded
to 104 weeks and reports unresolved work. No official deadline is changed.

Local verification:

- Eight focused scheduling regressions: capacity totals, long work, urgency,
  completed work, dependencies, unknown dates, finite horizon and malformed input.
- Complete application check: 177 unit/integration cases, formatting, ESLint,
  strict TypeScript and production build.
- 24 component-browser cases pass: 13 Roadmap and 11 existing Vault/Writing.
  Roadmap covers RU/KK/EN at 375/768/1440px, axe with zero violations, reduced
  motion, no page overflow, capacity edit/reload, detail dialog/Escape and all
  five populated views. All records are explicitly synthetic test fixtures.
- The component suite is now a required frontend CI step, alongside existing
  production-browser and database/Auth checks.

UI follows the existing JETU tokens and page contract. UI/UX Pro Max accessibility
and responsive defaults guided the text labels, native disclosures and wrapping;
no new visual theme or icon system was introduced. React review checked derived
state without effects, direct imports, keyed collections and no extra fetches.

This closes the weekly-capacity and populated synthetic view coverage sub-gates.
It does not verify real hosted user journeys, country/grade pacing, source
publication or structured program-document extraction. Network permission and
editorial decisions remain explicit dependencies in the tracker.
