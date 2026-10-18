# Landing and public information — Phase 06

Master contract: `design-system/jetu-admissions/MASTER.md`. JETU web blue/yellow,
contrast variants, system type and original vector logo remain authoritative.

Purpose: help a student understand JETU's intended journey, see an honestly labeled
concept, learn how to verify opportunities and understand what is currently closed.
Hierarchy: status → promise without an outcome guarantee → guide CTA → demo preview
→ three steps → planned modules → provenance → pricing availability → FAQ → guide CTA.
The main action opens the real localized opportunities guide. It is deliberately
worded as a guide, since personal matching and signup are not live.

Mobile starts with logo, language links and a horizontally scrollable section nav.
Hero copy precedes the concept window in DOM and visual order. At 768px the hero
becomes two columns; at 640px cards become a 2–3 column grid as appropriate. Use
16–20px gutters, a 1248px max width, fluid type and no horizontal page overflow.
The CTA is visible within a 320×700 viewport, including Kazakh/Russian long copy.

The only local state is the matching/essay concept tab. It is explicitly DEMO,
does not call AI or save input, has linked tab/panel IDs, roving arrow/Home/End
keyboard behavior, and keeps the first panel readable with JavaScript disabled.
Tabs stay disabled until hydration; no faux loading or success. Information pages
have no forms, empty catalog cards or payment controls while their integrations
remain absent. The existing route loading/error boundaries and 404 recovery cover
network/render failures; offline static HTML and same-origin links stay readable.

Motion is limited to a short tab panel change and card hover lift via transform;
content never waits for an entrance animation. Reduced motion removes the lift and
transition. Focus is visible, links have meaningful destinations, target heights
are at least 44px where practical, and yellow labels use dark ink. No unverifiable
metric, testimonial, university, mentor profile, price, scholarship or AI answer
is shown.

Actual research: UI/UX Pro Max `--design-system` selected Hero + Features + CTA,
with deep CTA placement; `--domain landing` selected Product Demo + Features,
and `--domain ux` found Reduced Motion/Excessive Motion guidance. The generated
teal/amber palette and network fonts were rejected in favor of the previously
approved JETU contract. Browser/axe/Lighthouse and screenshot evidence is logged
in `docs/design/PHASE_06_EVIDENCE.md`.
