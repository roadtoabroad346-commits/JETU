# JETU Phase 04 provisional design contract

This is the minimum foundation contract, not completion of Phase 05. Based on the
supplied pitch extract and actual installed UI/UX Pro Max research; no pitch PDF
was present. Full component system, showcase, brand assets and product page
overrides belong to Phase 05 and later phases.

- Brand blue `#008BDF`, yellow `#FFB500`, navy ink `#09213A`, ice canvas `#F3F9FD`,
  white surface, muted ink `#43556B`, border `#C8D8E6`, focus `#00548B`.
- Blue/yellow are source-extract approximations, not sampled or final brand values.
- Do not place normal white text on brand blue without measuring contrast. Use
  navy for panel text and yellow labels. Color never supplies the sole meaning.
- System Arial/Helvetica/sans-serif avoids external downloads, supports Cyrillic and
  Kazakh via available system glyphs. Exact cross-device font coverage still needs
  review on users' devices. No webfont/privacy/network dependency in the scaffold.
- 4/8px spacing rhythm, 16px body minimum, 18px intro, fluid 40–80px headline;
  natural balanced heading wrap; no nonbreaking forced prose or fixed-height text.
- Max content width 1248px, phone gutters 16–20px. One column before 768px, two
  after; all language links wrap, min 44px height, 8px gap.
- Motion communicates language-link press only: scale .97 for 120ms. Reduced motion
  removes transforms and CSS transitions. No hidden initial content or fake timers.
- Semantic main/nav/heading, working skip link, keyboard focus, static native links,
  document lang from validated URL; no unimplemented signup/discovery CTAs.

Research and deviations: `docs/design/UX_PRO_MAX_EVIDENCE.md`.
