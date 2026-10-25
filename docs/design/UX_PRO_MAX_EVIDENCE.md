# UI/UX Pro Max evidence — Phase 04

Read installed cloud `skill://plugins_6ad321e9cfac8191b74df0abe27f5d18/ui-ux-pro-max/SKILL.md`, `scripts/search.py`, core/generator sources and references/quick-reference.md (§1–3 and remaining web rules), plus references/pro-rules.md (native scope considered, not treated as a web standard). The installed cloud files were materialized unchanged in ignored `work/skills/ui-ux-pro-max` for execution, not installed from an unverified npm package. Python 3.12.14 is available; exact Python version is in the command log. No Caveman skill was available in cloud, executor or searched local skills. No full/ultracaveman command was invented.

Actual commands (exit 0):

```sh
python3 work/skills/ui-ux-pro-max/scripts/search.py --help
python3 work/skills/ui-ux-pro-max/scripts/search.py "education admissions accessible" --design-system -p "JETU Admissions" -f markdown
python3 work/skills/ui-ux-pro-max/scripts/search.py "keyboard focus navigation" --domain ux
python3 work/skills/ui-ux-pro-max/scripts/search.py "server client components" --stack nextjs
```

Results inspected: education product fit; Minimalism & Swiss Style is appropriate for the temporary infrastructure page. Keyboard Navigation and Focus States map to its only interactions. Nextjs results require server components by default and leaf client interactions, matching the implemented stack. The generated full marketing CTA pattern is not implemented in Phase 04. Teal/amber palette and external Outfit/Work Sans imports are rejected in favor of supplied JETU blue/yellow and system fonts with Cyrillic/Kazakh glyph coverage and no external font request. These deviations preserve the user’s branding and phase scope. The installed stack reference targets 16.2, so official current Next/Supabase sources and actual 16.4.2 builds govern API correctness.

Script SHA-256:

- `search.py`: `1a7b874eb113ffef4fee130bd5998bbb53c94680695c68fff15fb5286457d776`
- `core.py`: `9fb7d50c86c8e6296f73f356ba00e719e67e8a252f2c1938b38f57964fd08a8a`
- `design_system.py`: `62d3b6d0c8016412ef2d13e2575866bcfe8d96a7045bcbe61d2ee41395bfac22`
- `reasoning_contract.py`: `e31080b59c7dce69caa336ca06e6abcd3fbb45bea993bb43c4661a061820a6a9`

## Raw design-system output

## Design System: JETU Admissions

### Pattern

- **Name:** Hero + Features + CTA
- **Conversion Focus:** Deep CTA placement. For CTA label text, verify at least 4.5:1 against the button fill; use 7:1 only when the product explicitly targets AAA normal-text contrast. Keep focus and component boundaries independently visible. Disable hero parallax under reduced motion and render its static final state.
- **CTA Placement:** Hero (sticky) + Bottom
- **Color Strategy:** Hero: Brand primary or vibrant. Features: Card bg #FAFAFA. CTA: Contrasting accent color
- **Sections:** Hero with headline/image > Value prop > Key features (3-5) > CTA section > Footer

### Style

- **Name:** Minimalism & Swiss Style
- **Mode Support:** Light supported | Dark supported
- **Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential
- **Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools
- **Performance:** cost:low|drivers:none | **Accessibility:** risk:low|requires:contrast-text-4.5,keyboard,visible-focus,reduced-motion

### Colors

| Role             | Hex       | CSS Variable               |
| ---------------- | --------- | -------------------------- |
| Primary          | `#0D9488` | `--color-primary`          |
| On Primary       | `#000000` | `--color-on-primary`       |
| Secondary        | `#2DD4BF` | `--color-secondary`        |
| On Secondary     | `#0F172A` | `--color-on-secondary`     |
| Accent/CTA       | `#D97706` | `--color-accent`           |
| On Accent/CTA    | `#000000` | `--color-on-accent`        |
| Background       | `#F0FDFA` | `--color-background`       |
| Foreground       | `#134E4A` | `--color-foreground`       |
| Card             | `#FFFFFF` | `--color-card`             |
| Card Foreground  | `#134E4A` | `--color-card-foreground`  |
| Muted            | `#E8F1F4` | `--color-muted`            |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border           | `#5EEAD4` | `--color-border`           |
| Destructive      | `#DC2626` | `--color-destructive`      |
| On Destructive   | `#FFFFFF` | `--color-on-destructive`   |
| Ring             | `#0D9488` | `--color-ring`             |

_Notes: Education teal + course amber + grade green_

### Typography

- **Heading:** Outfit
- **Body:** Work Sans
- **Mood:** geometric, modern, clean, balanced, contemporary, versatile
- **Best For:** General purpose, portfolios, agencies, modern brands, landing pages
- **Google Fonts:** https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap
- **CSS Import:**

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
```

### Key Effects

Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

## Raw UX search

## UI Pro Max Search Results

**Domain:** ux | **Query:** keyboard focus navigation
**Source:** ux-guidelines.csv | **Found:** 3 results

### Result 1

- **Category:** Accessibility
- **Issue:** Keyboard Navigation
- **Platform:** Web
- **Description:** Web users need complete keyboard navigation with visible focus on every operable control
- **Do:** Keep tab order aligned with visual order and test every action without a pointer
- **Don't:** Keyboard traps or illogical tab order
- **Code Example Good:** tabIndex for custom order
- **Code Example Bad:** Unreachable elements
- **Severity:** High

### Result 2

- **Category:** Interaction
- **Issue:** Focus States
- **Platform:** All
- **Description:** Keyboard focus, including controls inside a modal, needs a visible indicator
- **Do:** Use a visible focus ring on every interactive control, including modal controls
- **Don't:** Remove focus outline without replacement
- **Code Example Good:** focus:ring-2 focus:ring-blue-500
- **Code Example Bad:** outline-none without alternative
- **Severity:** High

### Result 3

- **Category:** Accessibility
- **Issue:** Focus Not Obscured (Enhanced)
- **Platform:** Web
- **Description:** WCAG 2.2 AAA requires keyboard focus to remain fully visible
- **Do:** Keep the entire focused component unobscured by author-created content
- **Don't:** Present this enhanced AAA criterion as an AA requirement or allow persistent UI to hide any part of focus
- **Code Example Good:** close persistent overlay before focus moves behind it
- **Code Example Bad:** sticky footer covers half the focused button
- **Severity:** Medium

## Raw Next.js search

## UI Pro Max Stack Guidelines

**Stack:** nextjs | **Query:** server client components
**Source:** stacks/nextjs.csv | **Found:** 3 results

### Result 1

- **Category:** Rendering
- **Guideline:** Use Server Components by default
- **Description:** Server Components reduce client JS bundle
- **Do:** Keep components server by default
- **Don't:** Add 'use client' unnecessarily
- **Code Good:** export default function Page()
- **Code Bad:** ('use client') for static content
- **Severity:** High
- **Docs URL:** https://nextjs.org/docs/app/building-your-application/rendering/server-components
- **Applies To:** nextjs 16.2
- **Status:** active
- **Verified At:** 2026-08-13

### Result 2

- **Category:** Rendering
- **Guideline:** Push Client Components down
- **Description:** Keep Client Components as leaf nodes
- **Do:** Client wrapper for interactive parts only
- **Don't:** Mark page as Client Component
- **Code Good:** <InteractiveButton/> in Server Page
- **Code Bad:** ('use client') on page.tsx
- **Severity:** High
- **Docs URL:** https://nextjs.org/docs/app/building-your-application/rendering/client-components
- **Applies To:** nextjs 16.2
- **Status:** active
- **Verified At:** 2026-08-13

### Result 3

- **Category:** Rendering
- **Guideline:** Mark Client Components explicitly
- **Description:** 'use client' for interactive components
- **Do:** Add 'use client' only when needed
- **Don't:** Server Component with hooks/events
- **Code Good:** ('use client') for onClick useState
- **Code Bad:** No directive with useState
- **Severity:** High
- **Docs URL:** https://nextjs.org/docs/app/building-your-application/rendering/client-components
- **Applies To:** nextjs 16.2
- **Status:** active
- **Verified At:** 2026-08-13

# Phase 16 matching research — 2026-10-25

Read the installed cloud UI/UX Pro Max `SKILL.md`, `quick-reference.md`, and `pro-rules.md` (native rules scoped out for this web screen). The canonical search script and its bundled data were retrieved from the installed skill into ignored `work/skills/ui-ux-pro-max/`, then executed with Python 3; no invented command or package install was used.

Successful commands:

```sh
python3 work/skills/ui-ux-pro-max/scripts/search.py --help
python3 work/skills/ui-ux-pro-max/scripts/search.py 'education admissions matching dashboard trustworthy' --design-system -p 'JETU Admissions' -f markdown
python3 work/skills/ui-ux-pro-max/scripts/search.py 'student eligibility results dashboard' --design-system -p 'JETU Admissions' -f markdown
python3 work/skills/ui-ux-pro-max/scripts/search.py 'error summary validation' --domain ux
python3 work/skills/ui-ux-pro-max/scripts/search.py 'keyboard focus navigation' --domain ux
python3 work/skills/ui-ux-pro-max/scripts/search.py 'server client forms loading' --stack nextjs
```

Raw outputs are in ignored `work/phase16-uipro-*.txt`. Relevant matches: Minimalism & Swiss Style, focusable error summary/inline errors, keyboard navigation and visible focus, server components by default. Generator suggested a marketing hero and non-JETU palettes; the matching page follows the existing `MASTER.md` instead. The API route is retained for the requested interactive recalculation contract despite the stack search's general Server Action preference. See `design-system/jetu-admissions/pages/matching.md`.
