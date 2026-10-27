# JETU design system — Phase 05

Phase 17 applies the established tokens to the private roadmap workspace. Its view hierarchy, state and mobile rules are in `design-system/jetu-admissions/pages/roadmap.md`.

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

Phase 19 reuses existing blue/yellow, semantic status colors, 20px panels, 48px
controls and the global reduced-motion contract. Vault/Writing share visible labels,
textual quarantine states, metadata-only binary history, escaped plain-text preview,
inline conflict recovery and reversible revision loading. Native file input is the
keyboard alternative to dropping a file. Word counts and self-review avoid admissions
scoring claims. Actual synthetic component/axe evidence: `docs/evidence/phase19`.
UI/UX Pro Max SKILL and web quick-reference were read; native pro-rules were scoped
appropriately. Its local search package was not installed; existing verified JETU
research and source guidance were reused without claiming a new search ran.
