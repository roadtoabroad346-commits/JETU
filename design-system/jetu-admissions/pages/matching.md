# Matching workspace — Phase 16

Use the existing JETU master tokens. The UI/UX Pro Max design-system search for `student eligibility results dashboard` returned a calm grid style, but its generated orange/blue palette and landing-page hero pattern conflict with JETU's established blue/yellow workspace. Keep white cards on ice blue, navy text, blue actions, yellow only for restrained attention.

- Goal: explain what is known, what is unmet, and what still needs verification before a student acts.
- Hierarchy: profile readiness → preferences → run → ranked results → rule details → source and next actions.
- Layout: one-column mobile, wrapping form grid and result facts on tablet/desktop; no horizontal card carousel.
- Primary action: run or recalculate matching. Save, compare, and details are secondary actions on each real program.
- States: stable skeleton for initial request, live button state for recomputation, explicit empty catalog and retry/error messages.
- Semantics: native labels, fieldset for degree checkboxes, `details` for rule groups, text statuses with color as reinforcement, visible source links.
- Motion: no simulated AI timer, shimmer, or delayed content. Existing focus and reduced-motion rules apply.
- Verification limits: no authenticated visual screenshot was possible in this workspace because hosted Supabase REST/Auth returns proxy 403. API validation and build were exercised; a real browser session remains a release gate.
