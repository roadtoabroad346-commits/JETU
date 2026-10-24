# Phase 06 UI and performance evidence — 2026-10-18

Actual installed `ui-ux-pro-max` SKILL.md, search script, data, and web quick
reference were read. The cloud skill files were copied unchanged to ignored
`work/skills/ui-ux-pro-max` for execution. Commands completed successfully:

```sh
python3 work/skills/ui-ux-pro-max/scripts/search.py 'education admissions credible landing' --design-system -p 'JETU Admissions' -f markdown
python3 work/skills/ui-ux-pro-max/scripts/search.py 'product demo features' --domain landing -n 2
python3 work/skills/ui-ux-pro-max/scripts/search.py 'reduced motion' --domain ux -n 2
python3 work/skills/ui-ux-pro-max/scripts/search.py 'server components routing' --stack nextjs -n 2
```

Matches: Hero + Features + CTA; Product Demo + Features; Reduced Motion and
Excessive Motion; Next.js Server Components by default. The hero, small static
client demo leaf, repeated guide CTA, restrained motion and reduced-motion behavior
follow these matches. Generated teal/amber and hosted fonts conflict with the
established JETU blue/yellow/system-font contract and were not applied.

The eight-slide pitch overview and its preserved text were reviewed. It supports
blue/yellow and the profile → matching / coach concept, but its screenshots,
pricing, market figures, mentor/team statements and traction are not verified live
product evidence. The landing omits these claims or marks the concept as demo.

Browser evidence: production Chromium 154 (system binary), RU/KK/EN at 320–1920px,
keyboard skip and tab operation, deep locale switch, no-JS readability, reduced
motion, CTA route resolution and axe WCAG A/AA checks. Phase 05 six visual baselines
passed unchanged in the earlier full suite. Final exact command counts and measured
Lighthouse values are in `docs/IMPLEMENTATION_LOG.md` and the Phase 06 review.

The four final-build mobile Lighthouse reports are local lab runs against
`next start` on port 3100, using Lighthouse 13.5.0 and system Chromium 154.
Performance scores vary from 61–84 on this two-core host; the individual results
and main-thread blocking measurements are in the Phase 06 review and log. They are
not field Core Web Vitals or a production deployment result. Local localhost URLs
are intentionally noindex, so the Lighthouse SEO category score is limited by
launch configuration. Actual canonical/alternate/sitemap/OG routes were
separately tested in the browser suite.
