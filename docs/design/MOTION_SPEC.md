# Phase 04 motion

Only language-link press uses Motion: scale to .97, 120ms; no entrance/scroll/loop
animation. `useReducedMotion` removes the press transform and CSS media rules disable
transitions/animations. Public content remains rendered without JS or motion.
Longer sheet/dialog/state-change timings await actual components in later phases.

## Phase 05

Shared press 120ms, feedback 160ms, panel token 220ms. Language press retains Motion;
tab wrappers never hide initial content. Button/field/tab hover and state changes
use CSS color feedback, not reflow. Static skeleton; labeled loading spinner specimen
uses transform rotation and stops in reduced-motion mode. Dialog opens immediately
for deterministic focus; no animation blocks keyboard or submit handling.
