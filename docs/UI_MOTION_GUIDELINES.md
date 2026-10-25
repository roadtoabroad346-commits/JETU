# Phase 16.5 motion contract

The existing Motion dependency handles small press interactions. CSS now gives catalog, unified-search and matching cards a shared 220 ms border/shadow/2 px hover response on devices that support hover. This uses the approved `--duration-panel`, `--ease-out`, `--shadow-2` and control-border tokens. It does not delay navigation, simulate matching progress or hide content before hydration.

Global `prefers-reduced-motion: reduce` disables transitions/animations; the card rule also requires `no-preference`. Keyboard focus remains a 3 px outline with 5 px offset, independent of hover. The mobile header has a right-edge scroll cue, scrolls natively and can expose the final link through keyboard focus without JavaScript.

Before extending motion: verify real loaded result cards with reviewed staging data, inspect mobile performance, and test reduced-motion and keyboard paths. Avoid opacity-only information, long entrance choreography and animation on unverified content.
