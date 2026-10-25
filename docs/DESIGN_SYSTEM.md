# JETU design system — Phase 05

Phase 16.5 continuation: public catalog, unified-search and matching cards now
use the same restrained 220 ms border/shadow/2 px hover feedback on hover-capable
devices. The global reduced-motion contract suppresses these transforms. Mobile
public navigation retains its compact horizontal layout, exposes an arrow cue,
and scrolls keyboard-focused links into view. See `DESIGN_AUDIT.md`.

Canonical contract: design-system/jetu-admissions/MASTER.md; page rules in
pages/availability.md and pages/showcase.md. Tokens: src/styles/tokens.css;
shared components: src/components/ui.

Run npm run build then npm run start; open /{ru,kk,en}/design-system.
The interactive library contains explicitly local specimens. The production
auth/catalog flows that exist at HEAD are documented in docs/ARCHITECTURE.md;
this library itself remains a noindex static specimen.

Original July 2026 pitch inspected. Source reconciliation and actual skill-command
evidence: docs/design/PHASE_05_EVIDENCE.md.
