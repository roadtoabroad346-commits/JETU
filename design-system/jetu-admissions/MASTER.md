# JETU design system 01 — Phase 05

Canonical implementation: src/styles/tokens.css, src/app/globals.css and src/components/ui.
Playground: /{ru,kk,en}/design-system. Light theme only; no automatic dark inversion.

## Pitch reconciliation and identity

Read complete preserved July 2026 pitch text and rendered 8-slide overview; inspect
slides 1 and 3 at 1500px. PDF SHA-256 matches docs/pitch/README.md.
Source uses saturated blue, warm yellow, navy, ice surfaces and rounded white controls.
Raster page-1 samples: RGB(0,142,226) blue, RGB(242,165,12) yellow,
RGB(233,243,252) ice, RGB(23,68,109) prototype navy. These are rendered pixels,
not authoritative original vector color definitions.

Retain approved web brand #008BDF, accent #FFB500, ink #09213A, canvas #F3F9FD.
The small differences preserve prior decisions; do not claim exact PDF hex identity.
Never copy prototype admissions scores/statistics/prices/outcomes as real product facts.
BrandLogo and public/brand SVGs are original path-drawn Jetu letterforms and compact J.
No font dependency or embedded image. Yellow on blue, blue on white, ink on documents.
Clear space: 16px around 112px wordmark, or one-quarter mark height.
Minimum wordmark 96px; compact mark 24px, separate browser SVG icon for 16px.
Decoration inside named links is aria-hidden; standalone images need alt text.

## Semantic colors

| Role                | Token/value                                                 | Pairing                                 |
| ------------------- | ----------------------------------------------------------- | --------------------------------------- |
| Brand field         | --brand #008BDF                                             | --on-brand #041A2E text, yellow graphic |
| Primary action      | --primary #0069AE                                           | --on-primary #FFFFFF                    |
| Primary hover/focus | --primary-hover / --focus #00548B                           | White/light canvas                      |
| Warm action         | --accent #FFB500; hover #E6A300                             | Ink                                     |
| Text                | --ink #09213A; --muted #43556B                              | White/canvas                            |
| Surfaces            | --surface #FFFFFF; --canvas #F3F9FD; --surface-blue #E9F3FC | Ink/muted                               |
| Separator           | --border #C8D8E6                                            | Decorative, not sole control boundary   |
| Control border      | --control-border #71869C                                    | White, >=3:1                            |
| Success             | #17633E on #EAF6EE                                          | Words/check icon too                    |
| Warning             | #785200 on #FFF5D6                                          | Explicit attention label                |
| Danger              | #AD2430 on #FFF0F1                                          | Explicit error + recovery               |

Small original ink on brand measures 4.463:1, below AA; use --on-brand #041A2E
for normal text on blue. Original ink is suitable there only for large text.
Bright brand blue cannot carry normal white text at AA. Use darker primary for
white-labelled buttons. Text pairs >=4.5:1; focus/control/chart marks >=3:1.
Disabled controls use native semantics and are contrast-exempt.
Chart tokens 1–4: primary/warning/success/ink. Add labels/shapes and table alternative;
a palette alone is not an accessible chart.

## Geometry and typography

- 4/8px rhythm: 4,8,12,16,20,24,32,40,48,64. Main layout follows an 8px grid.
- Arial/Helvetica Neue/system sans: offline, no third-party font requests.
  RU/KK specimens cover Ә Ғ Қ Ң Ө Ұ Ү Һ І. Physical-device coverage depends on
  installed fallback; no licensed font is inferred from the pitch.
- Caption 14px; body 16px/1.6; lead 18px; title 24–32px; display 40–80px.
  Heading weights 700–800, body 400, labels 600. Balanced headings; no forced prose
  truncation. Long labels/output wrap. Respect 200% text scaling.
- Radii: 8px small, 12px control, 20px card, 28px panel, 999px pill.
- Elevation: shadow-1 card, shadow-2 help/raised, shadow-dialog modal.
  No decorative gradients, repeated bento or unrelated stock photography.
- Borders: 1px controls/separators, 2px invalid, 3px focus with 5px offset.
- Icons: original consistent SVG outline family, 1.8px stroke, 16/20/24px tokens.
  Contextual semantics; no structural emoji.
- Mobile default; gutters 16–20px; max content 1248px.
  Breakpoints 640px forms/grid, 768px existing home columns, 1024px showcase sidebar;
  1440px QA target. Fluid to 1920px, landscape uses normal page scroll.

## Interaction and motion

- Every enabled action changes an explicit local preview or follows a real URL.
  No fabricated admissions data/network result/persistence.
- Buttons: idle/hover/focus/loading/success/error/disabled. Pending is natively inert
  and aria-busy. Feedback words accompany success/error styling.
- Native fields/selects with visible labels, help/error IDs. Local typography form
  preserves invalid input, focuses linked summary, updates only a local preview.
- Tabs: roving tabindex, arrows/Home/End, linked tabpanel. Stepper: aria-current.
- Native modal: title/description, Escape, Tab/Shift+Tab containment, close control,
  trigger focus restoration. Native top layer owns overlay z-order.
- Tooltip: hover/focus/tap, Escape, hoverable content, description association.
- Sidebar and spotlight link real sections. Search closes modal, changes hash and
  focuses destination. Registry filters/sorts real entries with reset recovery.
- No-JS: content and links remain available; preview controls remain disabled.
- Motion language press: scale .97 / 120ms; CSS feedback 160ms; panel token 220ms.
  No hidden entrance content or scroll choreography. Labeled spinner is a specimen,
  never a timer pretending a request happened.
- Reduced motion disables CSS animation/transitions and Motion press transform.
  Modal opens immediately so focus never waits for animation.

## Evidence

See docs/design/PHASE_05_EVIDENCE.md, docs/evidence/phase05 and browser baselines
under tests/e2e/design-system.spec.ts-snapshots. Education/Minimalism research fits;
generated teal/amber and external Outfit/Work Sans were rejected to preserve JETU,
Cyrillic/Kazakh, and network independence. Page overrides supplement this contract.
