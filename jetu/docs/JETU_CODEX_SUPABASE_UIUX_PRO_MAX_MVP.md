# JETU ADMISSIONS — SUPABASE + UI/UX PRO MAX CODEX MASTER PROMPT 2.0
## 30 implementation phases • all enabled actions operational • MVP → scalable architecture

> **THIS FILE IS A DIRECT BUILD INSTRUCTION FOR CODEX.** It replaces the earlier Firebase-oriented prompt entirely. Execute the work inside the open JETU repository. If pasted into Codex, treat every requirement below as part of one continuous engineering mandate. Do not answer with a plan instead of building. Never pretend completion where execution is blocked. Prioritize an exceptional real MVP over unfinished feature breadth.

**ROLE.** Ты — дисциплинированная product-engineering команда: Founding CTO, Staff Engineer, Principal PostgreSQL Architect, Supabase Security Specialist, Senior UX/Product Designer, Motion Designer, AI systems engineer, Data/Admissions researcher, QA automation lead, Accessibility engineer, Product Analytics/YC advisor. Цель: создать **реально функционирующий, доступный, быстрый, надёжный JETU Admissions**, сохранив визуальную ДНК питча. Самостоятельно принимай обратимые инженерные решения и обязательно проверяй их исполнением. Не утверждай «100% без ошибок»: доказывай readiness воспроизводимыми тестами, честно перечисляй внешние ограничения.

**ПРАВИЛО № 0.** Перед началом прочитай весь этот документ, пользовательский репозиторий и все доступные материалы питча. На старте проверь установленный **UI UX Pro Max** и исходный репозиторий; перед созданием UI обязательно используй skill и зафиксируй design system. Проводи product/security audit до архитектурных изменений. Запрещено начинать массово верстать экраны, не проанализировав дизайн и пользовательские сценарии. Любой компонент UI обязан иметь обработчик/реальное состояние, доступность и проверяемую серверную функцию, если заявлено backend-действие.

**PRODUCTION STACK IS FIXED:** Next.js App Router + TypeScript strict + Tailwind + accessible component primitives + Motion + **Supabase (Postgres, Auth, RLS, Storage, Realtime, Edge Functions, Cron, Queues if useful)**. **Никаких Firebase SDK, Firestore, Firebase Auth, Firebase Hosting, SQL Connect.** Исключение: код старого репозитория, подлежащий анализу и контролируемой миграции. Не добавлять вторую БД без доказанной необходимости. Используй актуальные официальные docs перед установкой и пинь протестированные версии зависимостей.

**МЕТОД:** Auditing → design-system-first → threat model → schema/RLS → feature vertical slices → Playwright E2E → visual regression → operational verification → staging go/no-go. Начинай с самой короткой траектории студента от профиля до shortlist+roadmap, но запланируй все функции с учётом архитектуры. Разбей на 30 последовательных фаз ниже; выполняй без прерывания насколько позволяют permissions, context и инструменты, оставляя полезные checkpoint-файлы.

---

## A. Питч, происхождение требований, дизайн


Если файл `Jetu presentation July 2026 11.43.14 AM.pdf` (включая возможный узкий пробел перед AM) доступен в рабочем каталоге, прочитай ВСЕ 8 страниц и визуально проанализируй снимки интерфейсов на слайдах 1 и 3. Если файла нет — не утверждай, что прочитал его; используй только следующую встроенную выдержку и пометь визуальные неточности как требующие сверки.

- Название: **Jetu Admissions**; доменный ориентир из питча: `jetu.kz` (не утверждай владение доменом или работающий production).
- Позиционирование: платформа с AI-инструментами, доводящая школьников Центральной Азии до поступления и стипендий за рубежом.
- Визуальная ДНК: яркий насыщенный голубой фон порядка `#008BDF` (проверь по исходнику), тёплый золотисто-жёлтый акцент/логотип `Jetu` порядка `#FFB500`, глубокий navy, ледяные светло-голубые поверхности, белые скруглённые карточки, контрастная современная типографика; стартап-эстетика, не шаблонный AI/dashboard. Внутренние прототипы показывают аккуратный бело-голубой SaaS с навигацией «База программ | Профиль | Матчинг | План | AI-коуч», индикаторами соответствия и боковой панелью фильтров.
- Core: академический профиль, GPA-конвертер, экзамены (IELTS/SAT и др.), каталог программ, профильный матчинг, college list, AI-коуч для эссе с оценкой по критериям, дорожная карта, дедлайны, живой ментор.
- Дифференциация из питча: доступность, достоверность, работа из регионов, казахский/русский, AI-поддержка 24/7, живые менторы, весь путь до зачисления.
- Бизнес-модель слайда 6 — **исторический ориентир, а не автоматически актуальное коммерческое обещание**: Free, Plus 2 990 ₸/месяц, Mentor 14 990 ₸/месяц, B2B для школ/центров. Уточнить и сделать цены админ-конфигурируемыми. «Безлимитный AI» из слайда 6 не обещать, пока не обеспечены действительные экономические и технические лимиты.
- Числа из презентации (TAM $10+ млрд, SAM ~800 тыс. выпускников, SOM $1,2 млн, цена консультанта до 2 млн ₸, 170 тыс.+ выпускников) рассматривать как **непроверенные заявления питча**, не как факты для публичного сайта. Не выдавать прогнозные 25 000 пользователей/50 подписок и другие пункты исторического roadmap за достигнутые показатели.
- Сохранить узнаваемый характер и бренд Jetu, но создать оригинальную, более зрелую, polished production-реализацию, а не механически скопировать изображения слайдов.


## A2. Продуктовые принципы


JETU — это **Admissions Operating System**, не просто AI-чат, «университетский Википедия-клон» или демонстрация красивых карточек. Непрерывный journey:
`Discover → Onboard → Build Profile → Find Verified Programs/Funding → Evaluate Eligibility → Shortlist → Build Roadmap → Prepare Documents/Essays → Track Applications → Mentor Review → Submit via official channels → Monitor Results → Compare Offers → Enrollment/Visa/Travel Checklist → Alumni Outcome`.

Ключевые персоны: student, parent/guardian с надлежащими разрешениями, verified mentor, school counselor, school organization admin, content researcher, support, platform super-admin. Не путай пользователей разных организаций. Предусмотри безопасный сценарий для несовершеннолетних с минимизацией данных и подходящими ограничениями контактов.

**НИКОГДА:** не выдумывай университеты, стипендии, дедлайны, eligibility, acceptance rates, официальный partnership, решения admissions, вероятности поступления, «гарантии гранта» и успешные отправки заявок. Нельзя заявлять «документ подан» без достоверного подтверждения. Любая рекомендация с ограниченной доказательностью должна быть отмечена.

**Качество > видимость масштаба.** Лучше реальные vertical slices со сквозными тестами, чем 100 кликабельных пустых кнопок. Не превращай MVP в систему из десятков микросервисов: предпочтение — модульный монолит, чёткие доменные модули, event/queue-автоматизация там, где необходима. Финальные архитектурные решения объясняй фактами, ADR и trade-off.


## B. Неизменяемый стек и правила архитектуры

- **Frontend:** Next.js App Router + React + TypeScript strict, server components где подходят; Tailwind, shadcn/ui/Radix-compatible accessible primitives, React Hook Form + Zod; типизированные domain services. Не смешивать server-only код с client bundles; соблюсти SSR caching boundaries.
- **UI Design:** UI UX Pro Max **обязателен до первой реализации**, brand tokens по питчу и skill research; `Motion`/Framer Motion для purpose-driven micro-interactions; исключить тяжёлые UI зависимости. Storybook либо доступная showcase страница для компонентов.
- **Backend:** Supabase hosted PostgreSQL — *единственный источник истины* для каталога, профилей, shortlist, applications, tasks, organization permissions, conversations metadata, entitlement records. `supabase/migrations/*.sql` под version control; generated DB TS types. SQL ограничители и реальные FK, check, unique, indexes, RLS/grants.
- **Auth:** Supabase Auth — email verification/password reset и Google OAuth когда настроено; official `@supabase/ssr` auth cookies (следить за актуальными рекомендациями). Использовать актуальные server-side методы проверки user identity; **никогда не считать только client cookie или `getSession()` достаточной авторизацией**.
- **Security:** enable RLS on EVERY client-exposed table, explicit grants, `auth.uid()`, tenant membership, private `storage.objects` RLS, server authorization defense in depth. `service_role` / secret key — strictly server-only, minimal functions, never expose in Next public env/browser/edge response. Разграничивать чтение опубликованного каталога и доступ к приватным данным.
- **Files:** private Supabase Storage buckets, signed short-lived URLs по allowlist+authorization, MIME+size+content validation, encrypted-at-rest managed storage, upload status, delete policies; signed URL всё равно предоставляет временный доступ, не логировать URL. Cloud AV/validation hook when practical; quarantine uncertain uploads.
- **AI:** only server-side AI Gateway in Next secure route handlers or Edge Function depending runtime; provider adapters; retrieval grounded in verified source DB; evidence citations, data freshness, refusal to invent, rate limits, quotas, token/cost logging without sensitive raw text.
- **Search:** PostgreSQL FTS (`tsvector`), `pg_trgm` and indexed SQL faceting for MVP. Optionally `pgvector` for semantic retrieval *after evaluating need*. User filters/eligibility in deterministic SQL/domain logic, not untrusted LLM SQL. No unbounded `.select('*')` or scans, support paginated ordering.
- **Jobs:** transactional outbox in Postgres; Supabase Cron/`pg_cron`, `pgmq`/Supabase Queues if available and needed; worker idempotency, exponential backoff, DLQ/reconciliation, per-user timezone and DST. Do not rely on client-side timers for deadlines.
- **Realtime:** narrowly scoped Supabase Realtime for notifications and mentor review status; privacy policy and Realtime authorization required; subscriptions cleaned up on unmount and reconnect robustly. All state persists in Postgres, no ephemeral realtime source of truth.
- **Billing:** pluggable authorized provider, webhook signatures and deduplication, paid plan entitlements read from backend. Provider not configured → clear waitlist/disabled state, never fake charge; pricing configurable independently of UI.
- **Hosting:** Vercel or documented compatible Next.js hosting for frontend + Supabase for managed backend; CI GitHub Actions, preview staging, environment isolation. Never directly deploy to production without explicit permission.
- **Observability:** structured request IDs, error reporting w/o PII, query metrics, slow-query review, feature usage funnel, alerts, backup+restore procedure, AI spend guardrails.
- **Testing:** Vitest unit, Playwright E2E, Postgres `pgTAP` or SQL policy/integration tests, a11y axe checks, UI visual snapshots, ESLint/typecheck/build, load+query budget tests. Gate each phase.
- **Developer workflow:** Supabase CLI local stack, migrations in Git, `supabase db reset` LOCAL ONLY, `supabase gen types --lang typescript --local`, dev seed with `is_demo` visibility. Different **development, staging, production** projects and credentials; NEVER run destructive remote reset.

### B1. MVP scope vs follow-up

Ship first with genuinely working critical flows: student auth + onboarding/profile + verified catalog/search + scholarship funding filters + eligibility/matching + shortlist/compare + roadmap/tasks/deadlines + application tracker + secure document upload + grounded AI essay feedback + admin publishing/verification + dashboards + localization and safety. Mentor, B2B, post-offer workflows, payment and complex automation: design and implement if enough time, BUT do not delay the functioning user loop, never label unconfigured components as operational, and never ship broken menu items. Create feature flags & status badges in internal dashboard; don't market unfinished capabilities as available. More advanced AI recommendation, automated admissions submissions, OCR, messaging, calendar OAuth, scraping: behind explicit technical/product gates.

**Definition of MVP**: An unfamiliar student can create an account, fill a profile, find **source-cited** opportunities, understand the eligibility verdict, save and compare programs, create and follow a personalized plan, manage application milestones and upload files privately, and revisit everything across devices — with a responsive polished UI and no critical authorization violations.

---

## C. UI/UX PRO MAX — НЕОБХОДИМЫЙ DESIGN-FIRST ПРОТОКОЛ

UI UX Pro Max (source repository `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`) — обязательный инструмент анализа UX и выбора цветовых систем/типографики/паттернов перед реализацией. Используй реальное содержимое скилла, не просто напиши «использовал skill». У Codex он устанавливается в `.agents/skills/ui-ux-pro-max/` через официальный CLI, а не через выдуманную slash-команду.

**Шаг 0. Проверка наличия:** проверь `.agents/skills/ui-ux-pro-max/SKILL.md`, также при необходимости `~/.agents/skills/ui-ux-pro-max/SKILL.md`. Прочитай SKILL.md **целиком** и относящиеся к задаче справочники, search script и design system guidelines. Проверь, какие инструменты реально доступны.

**Шаг 1. Если отсутствует:** прежде чем устанавливать npm-пакет на машине, спроси разрешение пользователя и проверь наличие Node/Python. После разрешения использовать **официальный** способ (из корня проекта):

```bash
npm install -g ui-ux-pro-max-cli
uipro init --ai codex
```

При неподходящей глобальной установке можно использовать `npx ui-ux-pro-max-cli init --ai codex` после подтверждения. Не устанавливай пакеты скрытно и не подменяй skill собственной фантазией. При невозможности установки: `BLOCKED: UI UX Pro Max not installed`, запроси содействие и предоставь точные шаги; можно проектировать базовую архитектуру параллельно, **но не утверждай skill-driven дизайн**.

**Шаг 2. Дизайн-исследование:** если доступен `.agents/skills/ui-ux-pro-max/scripts/search.py`, сначала проверь его `--help`, затем выполни, адаптируя реальные параметры к текущей версии:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "education technology university admissions scholarship discovery SaaS dashboard" --design-system --persist -p "JETU Admissions"
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "higher education admissions workflow trust-centered onboarding" --domain ux
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "search filters card data table scholarship opportunities" --domain ux
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "responsive forms multistep application" --stack react
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "dashboard progress academic planner" --domain chart
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "responsive typography buttons contrast focus" --domain typography
```

Если команды или flags изменились, следовать установленной версии, не подделывать результаты. Сохрани фактический поиск и результат в `docs/design/UX_PRO_MAX_EVIDENCE.md`. Design-system generator может дать generic цвета — **переопредели их для Jetu blue + yellow из оригинального питча** и зафиксируй обоснованные отклонения.

**Шаг 3. Создай реальный дизайн-контракт:** `design-system/jetu-admissions/MASTER.md` + page-specific overrides landing, onboarding, catalog, scholarships, matching, dashboard, plan, applications, essay, mentor, admin; `docs/design/TOKENS.md`, `MOTION_SPEC.md`, `UX_QA.md`, `SCREEN_INVENTORY.md`, `PAGE_USER_JOURNEYS.md`. У каждой страницы: цель, content hierarchy, desktop/mobile structure, primary action, loading/empty/error/offline, keyboard and screen reader semantics, interaction timing, responsive breaks, visual screenshot approval evidence.

**Шаг 4. Skill применяется постоянно:** перед каждой новой страницей прочитай MASTER + соответствующий override, выполни узкие searches по UI pattern, реализуй, проверь реальную страницу скриншотами в браузере и сделай revision. Нет утверждения «использовал Pro Max», если не было читки файла, генерации guidance и visual QA.

**Шаг 5. Style direction:** сохранить характер слайдов 1 и 3 Jetu: насыщенный открытый blue (#008BDF **как предварительный ориентир; сверить pixel sample**), yellow (#FFB500 **ориентир**), navy, ледяной blue tint, white surface. Идеал: editorial landing + dense-but-calm premium software tool, сильный typographic hierarchy, ясные диаграммы и изящные motion microinteractions. Не копировать чужой бренд или UI со screenshot pixel-by-pixel.

**Шаг 6. Motion:** интерфейс должен чувствоваться живым без излишней анимации: 120–220ms button affordance, 180–300ms sheet/dialog, скромный 280–450ms content reveal *ориентиры*; `prefers-reduced-motion`, `transform/opacity`, avoid layout thrash, long-running JS scroll listeners, infinite shimmer. Tooltip on keyboard, actions work during/after animation, no stale state. LCP section content never waits for motion.

**Шаг 7. UI acceptance:** Contrast WCAG 2.2 AA; labels; visible focus; target sizes appropriate; 320/360/375/390/768/1024/1440/1920px layouts; RU/KZ long text; no clipped chips, overlapping CTA, sticky footer obscuring content, overflow; touch usability; automated axe + manual keyboard + at least one real mobile browser preview; screenshot diff. Display usability matters as much as beauty.

**Шаг 8. Branding assets:** original vector wordmark `Jetu` and J mark, SVG favicon, accessible logo alt, export variants and copyright check; do not claim exact slide vectors if they are not supplied. All chart badges must carry a meaning in text, never color alone; no generic AI purple gradients or illustration carousels without real purpose.

---

## D. Product integrity, source trust and UX ownership

1. Jetu не обещает гарантированного поступления, не выдаёт магическую вероятность acceptance и не ставит оценку ценности личности школьника. `Fit score` — объяснимый product metric, не вероятность. Человеческие решения и требования различаются по странам/циклам.
2. **Источники приоритета:** official university admission/funding pages, official government scholarship sites, official ministry/organization documents, dated verified program terms; third-party directories — discovery only. A claim records source URL/URL hash, captured time, review date, relevant cycle, verification state, editor ID and evidence. `is_verified = true` only after reviewed official evidence.
3. Все страны, публичные названия учебных заведений, названия грантов, условия и дедлайны на published pages — source-cited. Unknown data UI explicitly shows «Проверить на официальном сайте»; no AI-generated citations. `Last reviewed` and `deadline local timezone` clearly shown. Mock data visible as **DEMO** and excluded from public verified filters.
4. Consent/privacy of minors: minimize collection, age-appropriate controls, parental/guardian participation where required, safe mentor communications, reporting/blocking, data retention and deletion, no publication of minors' educational files. Legal obligations and cross-border transfer require qualified local review before broad launch; avoid invented legal compliance claims.
5. Pricing from slide 6 (Free, Plus 2,990 KZT, Mentor 14,990 KZT) is historical pitch reference only; make internal plan configuration, do not advertise unlimited AI or live mentor access until economically and operationally supportable.
6. No fabricated user counts, revenue, testimonials, partnerships, acceptance rates, official school accreditations, verified scholarship counts, YC endorsements or investment. Mark expectations vs observed traction. Only user-provided verified evidence becomes public claim.
7. Each added feature has **ownership**: route → UX → domain service → SQL schema → RLS → integration tests → E2E → telemetry → docs. Unimplemented feature is removed/hidden from public navigation, not just a dead link.
8. **No harmful educational advice:** do not pretend to be lawyer/immigration officer; visa and immigration steps sourced and labeled informational. Do not auto-send personal documents to external admissions or vendors without explicit consent.
9. **Safe AI:** No fabricating applicant achievements, grades, essays, recommendations or scholarship eligibility. Coach supports drafting/editing and independent user voice. AI never changes eligibility and official submission statuses based only on model text.
10. YC-level quality means sharp wedge, reliable core experience, real user interviews and measurable usefulness. It does not mean an app that merely has 30 tabs; do not trade correctness for inflated scope.

---
## E. Codex execution protocol — implement, don't pretend

1. `git status` / inspect repo; never overwrite uncommitted user work. Read present README, migrations, config, `.agents/skills`, pitch PDF and source UI screenshots when available. Inventory existing features before edits.
2. Generate `docs/REPO_AUDIT.md` (`EXISTING`, `PARTIAL`, `MISSING`, `BROKEN`, `UNVERIFIED`), `docs/PHASE_TRACKER.md` with phases 01–30 and blockers, and `docs/FEATURE_MATRIX.csv` with acceptance criteria, route, service, tables/policies, tests, implementation status.
3. For each phase: inspect existing code → write 3–7 concrete engineering tasks → implement code and migrations → run tests → test at UI route in browser when available → fix issues → log actual outcomes → checkpoint. **No jumping forward while core gate fails**.
4. Preserve `docs/DECISIONS/*.md` ADR: query/search, auth, RLS strategy, AI safety, hosting, queue, pricing, localization, data trust. No microservices overarchitecture for MVP.
5. At each phase write a concise log: files changed, actual run commands/exit codes, screenshots if captured, missing credentials and unverified features. Never claim testing performed merely because files exist.
6. Centralize configs. Secrets in environment and proper secret manager; `.env.example` without real keys. Separate dev/staging/prod and app feature flags with secure defaults.
7. If no Supabase project credentials, run on local Supabase stack (if container runtime available); if no Docker, build SQL migrations and tests and **mark runtime tests blocked**; do not replace with fake persistence. OAuth, email provider, payments and real external source ingestion require real configuration.
8. When session/context limits hit, write `docs/NEXT_AGENT_PROMPT.md` with exact current phase, diff summary, commands/results, next three actions, outstanding blockers. Do not restart the project in next session.
9. Never deploy to production, purchase packages/services, expose data, send emails to real addresses, apply to schools, charge payments, or migrate/destructively reset a remote database without approval.
10. Engineering release gate: no unresolved P0/P1 in core flows; security checks, typecheck, lint, build, unit/integration/E2E pass in environment where run. For external-blocked gates, state precise limitation and do not call production-ready.

### E1. Files that must be maintained

`README.md`, `AGENTS.md`, `.env.example`, `docs/PRD.md`, `docs/REPO_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/RLS_MATRIX.md`, `docs/SOURCE_POLICY.md`, `docs/SEARCH_MATCHING.md`, `docs/AI_SAFETY.md`, `docs/PRIVACY_SAFETY.md`, `docs/PHASE_TRACKER.md`, `docs/FEATURE_MATRIX.csv`, `docs/TEST_MATRIX.md`, `docs/COSTS.md`, `docs/GO_LIVE.md`, `docs/YC_READINESS.md`, `docs/IMPLEMENTATION_LOG.md`, `docs/NEXT_AGENT_PROMPT.md`, `docs/design/*`, `supabase/migrations/*`, `supabase/seed.sql`, `tests/*`.

**Status definitions:** `IMPLEMENTED_AND_TESTED` / `IMPLEMENTED_UNTESTED` / `DEMO_ONLY` / `INTEGRATION_NOT_CONFIGURED` / `BLOCKED` / `BACKLOG`. Update status truthfully in both user-facing product and internal documentation. Do not label a demo stub as launched feature.

---

# 30 IMPLEMENTATION PHASES — EXPANDED ENGINEERING CONTRACT
## ФАЗА 01 — Forensic audit питча, репозитория и продуктовых утверждений
**Сделай:** перечисли структуру repo, framework, existing integrations, feature inventory, ошибки, secrets risk, устаревшие dependencies и текущее покрытие тестов. Сверь каждый UI/feature и обещание слайда 1–8 с кодом. Разметь `PITCH_FACT`, `PITCH_HYPOTHESIS`, `NEW_PROPOSAL`, `NEEDS_VERIFICATION`. Создай visual reference board из слайдов 1 и 3 и таблицу design deltas.
**Артефакты:** `AUDIT.md`, feature gap matrix, `docs/PITCH_TRACEABILITY.md`, P0 security list.
**Готово, когда:** понятно, что реально существует, что предлагается добавить, а что пока нельзя утверждать.

**Дополнительные задачи:** Составь evidence matrix со строками `pitch slide → claim/UI → confidence → source/owner → current repo evidence → planned change`. Для дизайна сделай цветовую съёмку слайда, разбери CTA/nav/cards/matching percentages/AI-essay critique и зафиксируй оригинальную бренд-ДНК. Проведи аудит опасных env secrets и зависимостей без публикации секретов; зафиксируй тестовые пробелы. Найди ссылки на устаревшие технологии и составь план перехода к Supabase. **Exit test:** можно точно показать, что реально есть в коде, что исключительно в питче, и где отсутствуют источники; ни одно утверждение о текущем продукте не вымышлено.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 02 — Product strategy, UX research и сфокусированный wedge
**Сделай:** сформулируй JTBD/ICP для казахстанского школьника, который ищет финансирование abroad; три рабочих пути: `Find Full Funding`, `Find Best-Fit Programs`, `Manage Applications`. Раздели функциональность на `MVP launch`, `V1 growth`, `V2 expansion`. Определи differentiation от агентств и общих AI-сервисов: **verified data + explainable matching + end-to-end workflow + mentor accountability**. Разработай North Star Metric: количество реально подтверждённых и корректно завершённых application milestones, а не просто открытий AI-чата. Добавь validation experiments, retention loop, activation funnel и риск feature bloat.
**Артефакты:** PRD, user journeys, service blueprint, milestone KPIs.
**Готово, когда:** каждый экран связан с действием пользователя, ценностью и измеряемой гипотезой.

**Дополнительные задачи:** Опиши personas: ученик с ограниченным бюджетом, ученик с сильным портфолио, родитель, наставник, консультант школы и catalog editor. Для каждого JTBD сформулируй 3 главных jobs, blockers, accessible mobile journey; приоритизируй P0/P1/P2, напиши `NOT DOING` list. Определи 6 важнейших KPI: eligible verified opportunities discovered, profile activation, matched-to-shortlist, shortlist-to-application, weekly active planning, verified outcome. **Exit test:** каждой P0-функции соответствует сценарий, измерение успеха и тест; не перегружай первый релиз неиспользуемыми вкладками.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 03 — Supabase-first modular architecture, ADR и domain boundaries
**Сделай:** выбери modular monolith с обособленными доменами `identity`, `profile`, `catalog`, `funding`, `matching`, `planner`, `applications`, `documents`, `ai`, `mentoring`, `organizations`, `billing`, `admin`, `notifications`. Построй Mermaid C4 context/container diagrams, sequence diagrams (`profile→match`, `save scholarship→plan`, `application→reminder`, `mentor review`). ADR: PostgreSQL RLS and role boundaries, Next rendering, search, queues, cache, auth, pricing. Определи API contracts/errors, transactions, outbox/idempotency, config, staging/prod separation, observability.
**Готово, когда:** для каждого типа данных указан source of truth, права, write path, read path, cache invalidation и failure strategy.

**Дополнительные задачи:** Напиши схему зависимостей доменов `auth`, `profiles`, `catalog`, `funding`, `eligibility`, `search`, `roadmaps`, `applications`, `documents`, `ai`, `mentoring`, `orgs`, `admin`, `billing`, `notifications`, `analytics`. Рисуй C4, ER diagram, transaction boundaries, authorization & outbox sequence. Укажи data owner, API path, cache key/version, invalidation, observability, worst failure; обоснуй SQL-only state на MVP. Отдельно опиши `public catalog read` vs `private student workspace`. **Exit test:** каждая запись знает owner и транзакционную границу; нет скрытой зависимости от админ-ключа на клиенте.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 04 — Репозиторий, зависимости и инженерный фундамент
**Сделай:** создай/приведи в порядок Next.js+TS строгую структуру `src/app/(marketing)`, `(auth)`, `(dashboard)`, `src/features/*`, `src/components/ui`, `src/lib`, `src/server`, `src/domain`, `supabase/functions`, `supabase/migrations`, `tests`, `scripts`, `docs`. Добавь ESLint, Prettier, path aliases, Zod env validation, `.env.example`, Supabase CLI local stack, formatting hooks, CI baseline. Не разрушай рабочий стек, если он уже есть; мигрируй аккуратно.
**Готово, когда:** fresh install, typecheck, lint, local dev и production build воспроизводимы по README.

**Дополнительные задачи:** Реализуй `supabase/` migration-first, typed DB client wrappers (`browser`, `server`, `admin-only`), env runtime validation, structured API error model, monorepo only if demonstrated benefit. Поставь prettier/eslint scripts, `test:unit`, `test:db`, `test:e2e`, `test:a11y`, `db:reset:local`, `db:types`, `build`; GitHub CI without production secrets. Fix consistent Node runtime and package manager lockfile. **Exit test:** clean clone installs, executes lint/typecheck/build and local migrations; accidental use of production database fails closed.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 05 — Уникальная визуальная система Jetu и brand identity
**Сделай:** сохрани hero blue + солнечный yellow + белые/light-blue интерфейсы из питча. Построй точные design tokens: colors, spacing 4/8, 8px grid, typography, elevation, radius, shadows, border, charts, icons, responsive breakpoints, light theme (dark mode опционален). Создай оригинальное векторное typographic logo `Jetu` и компактную `J` mark на основе брендового характера, favicon, skeletons, empty states. Компоненты: buttons(primary blue / warm yellow), pill, tabs, inputs, selectors, badges, dialogs, stepper, cards, tooltips, data table, filters, timeline, progress, sidebar, spotlight search. Не используй декоративный emoji вместо иконок, placeholder gradient cards, шаблонный bento на каждом экране и нерелевантные stock images.
**Готово, когда:** Storybook или component showcase доказывает одинаковость UI, а contrast/focus/keyboard/hover states проверены.

**Дополнительные задачи:** Используй UI UX Pro Max **фактически**: скриншоты из питча, genre research, `MASTER.md` с page overrides, command log. Создай semantics (`primary`, `accent`, `surface`, `ink`, `border`, `success`, `warning`, `danger`, `focus`), dark theme optional, typography с поддержкой кириллицы/казахских символов, logo assets, components showcase. Buttons real states (`idle`, `hover`, `focus`, `loading`, `success`, `error`, `disabled`), long content behavior. **Exit test:** desktop and phone screenshots, axe report, keyboard inspection and visual diff; design is recognizably Jetu, not generic startup theme.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 06 — High-converting landing, SEO и motion
**Сделай:** разработай оригинальный premium landing на `jetu.kz`-подобной структуре: hero с анимированными реалистичными (не ложными) превью matching/essay dashboard, social proof ТОЛЬКО если подтверждён, how-it-works 3 шага, scholarships discovery, AI coach, roadmap, mentor, B2B, clear pricing, FAQ, trust/provenance. Заголовок про путь от профиля до оффера без обещаний гарантированного поступления. Motion: аккуратное staggered reveal, progress animations, hover microinteractions, scroll-linked только когда безопасно; `reduced-motion` fallback. Создай public pages: `/`, `/about`, `/how-it-works`, `/scholarships`, `/universities`, `/opportunities`, `/pricing`, `/for-schools`, `/mentors`, `/faq`, `/contact`, `/privacy`, `/terms`. Metadata, sitemap, OpenGraph, canonical, structured data по назначению.
**Готово, когда:** Lighthouse mobile проходит согласованные бюджеты и CTA реально ведут в onboarding, а не `#`.

**Дополнительные задачи:** Landing user path `understand → trust → preview real product → discover scholarship → sign up`. Add interactive demonstrative previews with DEMO DATA label if synthetic, hero CTA `Подобрать возможности`, how it works, verified records methodology, why AI cannot guarantee admissions, pricing (editable), FAQs and school CTA. SEO SSR proper locale routing/hreflang/canonical and static content schema when true. Use motion with reduced motion fallback; no auto-play motion blocking CTA. **Exit test:** all CTA lead to valid routes; no metrics/testimonials/partners invented; mobile LCP in budget or documented measured gap.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 07 — IA, mobile UX, localization и accessibility
**Сделай:** структуру публичного сайта и app shell: desktop sidebar/topbar, мобильное bottom navigation с адекватным количеством пунктов, search, breadcrumbs, quick actions, empty/error/loading states. Основные разделы: `Обзор`, `База программ`, `Стипендии`, `Возможности`, `Матчинг`, `Мой список`, `Мой план`, `Заявки`, `AI-коуч`, `Документы`, `Менторы`. Полная локализация `ru`, `kk`, `en` через ключи сообщений, pluralization, locale-aware dates/currencies. Не оставлять русский текст жёстко в JSX; настроить fallback переводов и QA. WCAG 2.2 AA как целевой стандарт, фокус клавиатуры, labels, screen readers, accessible graphs.
**Готово, когда:** ключевые flows работают 360px–desktop, клавиатурой и на 3 локалях без broken layouts.

**Дополнительные задачи:** IA navigation grouping: Explore (universities/scholarships/opportunities), Prepare (matching/plan/essays), Apply (applications/documents), Support (mentor/AI), Settings. On mobile bottom tabs no more than practical few, overflow in More; full keyboard navigation. Implement RU/KK/EN dictionaries, no language-mixed statuses; locale-aware date/time/currency, timezone settings, search query transliteration. Empty/error/permission denied states are empathetic actionable. **Exit test:** all P0 routes in 3 languages work at 320px and 1440px and with keyboard + screen reader labels.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 08 — Supabase Auth, RLS, sessions, roles и onboarding
**Сделай:** email signup/login/verification/password recovery, Google sign-in если доступно; protected routes и server authorization; безопасный session-cookie flow при SSR; signout of all sessions по возможности. Роли user/mentor/counselor/org_admin/editor/support/super_admin из серверных claims+membership, но не из клиентского поля. Student onboarding wizard: страна гражданства/проживания, текущий класс/год выпуска, уровень обучения, желаемые страны, majors, бюджет, need-based/merit funding, предпочтения языка, readiness. Создай consent/privacy dialogs, age-appropriate mode, guardian path с надлежащей авторизацией.
**Готово, когда:** разрешения нельзя обойти прямым URL, Supabase PostgREST query или подменой роли.

**Дополнительные задачи:** Supabase Auth PKCE/SSR integration, verified identity on server, auth trigger for minimal `profiles` row, no recursive unsafe trigger; email change, password reset, provider callbacks, logout/revoked sessions. Protected pages check server authentication; RLS `profiles.id = auth.uid()`; tenant roles ONLY in trusted membership join, never editable user metadata. Invite codes bound to identity with expiry. Age-aware consent and privacy controls; restrict open adult/minor contact. **Exit test:** anonymous cannot access private API/storage; role spoof/tenant cross-read forbidden; OAuth absence is clearly marked external blocker.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 09 — Полноценный Academic & Personal Profile Builder
**Сделай:** academic history по локальным системам оценки (в т.ч. 5-бальная в Казахстане), institution type, GPA с прозрачной формулой/assumptions, ranking if verified, predicted/actual graduation, IELTS/TOEFL/Duolingo, SAT/ACT, HSK/TOPIK, олимпиадные достижения, проекты, volunteering, leadership, extracurriculars, awards, intended degree & study language. Приложение должно учитывать неподтверждённые оценки отдельно от official results. Profile completeness score — за заполненность, а не психологическую оценку человека. Versioning профиля, source attachments, portable export.
**Готово, когда:** пользователь может заполнять/редактировать/удалять профиль и видеть, как изменения влияют на eligibility.

**Дополнительные задачи:** Structured admissions profile: current grade + expected graduation, citizenship(s)/residency, budget in currency and funding coverage needed, academic scale, predicted vs actual results, exams, achievements, goals, languages, portfolio, preferences, constraints; privacy labels. Conversion GPA is illustrative formula with transparency; region-specific requirements sourced. Use autosave debounce with version/optimistic locking, long-form recovery, undo where safe. **Exit test:** save → browser reload → typed retrieval; incomplete profile yields unknown eligibility rather than false reject; account deletion removes private objects using defined workflow.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 10 — Canonical PostgreSQL Global Admissions Database
**Сделай:** проектирование PostgreSQL schema с сущностями: `countries`, `regions`, `cities`, `institutions`, `campuses`, `institution_accreditations`, `institution_names_translations`, `academic_units`, `degree_levels`, `fields_of_study`, `degree_programs`, `program_delivery_modes`, `languages_of_instruction`, `admission_intakes`, `application_rounds`, `eligibility_requirements`, `required_tests`, `test_score_thresholds`, `prerequisites`, `estimated_tuition`, `cost_of_living`, `fee_currency`, `financial_aid_schemes`, `scholarships`, `scholarship_cycles`, `scholarship_benefits`, `scholarship_program_links`, `coverage_items`, `funding_limits`, `deadlines`, `official_sources`, `source_claims`, `verification_runs`, `translation_entries`, `opportunity_tags`, `data_revisions`, `publication_status`. Нужные M:N join tables, FK, uniqueness, indexes, lifecycle. Не моделировать множество нормализуемых связей как один огромный JSONB-объект. Для PostgreSQL реализовать серверные авторизованные операции, миграции и typed SDK по актуальным official docs.
**Готово, когда:** каталог поддерживает реальные многомерные связи university ↔ campus ↔ degree ↔ intake ↔ funding и подтверждённые источники.

**Дополнительные задачи:** Implement normalized ER for institutions, campuses, programs, intake, application rounds, degree, test thresholds, scholarships, funding benefits, citizenship eligibility, nomination routes, deadlines, fee breakdown, sources/claims, review history, opportunity records; include `verification_state`, `last_checked_at`, `effective_from`, `effective_until`. FK cascade policies carefully; unique natural constraints, indexes, tenant-safe views. Build secured seed importer and content validations. **Exit test:** local SQL migrations replay twice from zero deterministically (idempotent initialization), invalid FK/duplicate rejects, `public` only published verified objects; each displayed claim backed by source row.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 11 — Data ingestion, верификация, обновления и provenance
**Сделай:** ingestion pipeline от официальных сайтов университетов/стипендий, открытых API/feeds и разрешённых партнёров; соблюдать ToS/robots/licensing, при отсутствии права — ручная загрузка. Source URL + publisher + first_seen/last_checked + effective_date + academic_cycle + last_verified + confidence based on evidence (не модельная фантазия), reviewer, full revision history. Парсинг в staging → validation → entity resolution/dedup → diff → review → publish → search index refresh. Защита от outdated 2026/2027 deadlines и путаницы годовых cycles; cron recrawl with backoff и dead-letter. Три уровня статуса `VERIFIED`, `NEEDS_REVIEW`, `ARCHIVED`; флаги conflict/unknown. У каждого важного факта — видимая ссылка на официальный источник. Fake seed data допускаются ТОЛЬКО с явным `DEMO` label.
**Готово, когда:** можно импортировать тестовый датасет, обнаружить дубликат/изменение дедлайна, запросить review и проследить origin каждого поля.

**Дополнительные задачи:** Ingestion pipeline `discovery → collect → parse → normalize → dedupe → evidence attach → diff → manual editorial review → publish`. Respect robots/ToS/rate limits; never crawl login walls or fabricate provenance. Parse stage records raw URL, timestamp, locale, extracted snippet/structure, confidence and ingestion method. On dispute/conflict label `REQUIRES_REVIEW` not verified. Automatic staleness rules by application season and changes to cycle. **Exit test:** duplicate URLs and changed deadlines handled without overwriting prior snapshots; stale published claims highlighted to user; rollback works.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 12 — University & Program Explorer
**Сделай:** каталоги бакалавриата/магистратуры/колледжей/подготовительных программ, где релевантно; institution pages и programs pages, filters по стране/городу/уровню/major/языку/стоимости/формату/requirements/intake/deadline/funding. Представлять размер стоимости с валютой, периодом и датой оценки. Университетские рейтинги показывать только с законными актуальными источниками, методологией, годом и licensing; иначе не показывать. CTA: `Сохранить`, `Сравнить`, `Проверить требования`, `Добавить в план`, `Официальный сайт`. Пустое состояние при отсутствии проверенных данных.
**Готово, когда:** детальная страница работает на реальных отношениях из SQL, все фильтры и сортировки протестированы.

**Дополнительные задачи:** Explorer facets country/city, bachelor/master, majors, language, tuition, published deadline, study mode, entrance exams, budget, intake, ranking (ONLY if sourced); search and results use server pagination, stable sorting and canonical detail links. Program pages show requirements, total cost context, scholarship relationships, official source and freshness. `/universities/[slug]`, `/programs/[id]`. **Exit test:** filters yield reproducible correct SQL results on fixture records; back/forward restores search state; zero results give meaningful reset action; no empty button.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 13 — Scholarship Intelligence & Financial Aid Explorer
**Сделай:** глобальная база scholarships, grants, tuition waivers, full-funded/full-ride, partial scholarship, stipend, research assistantships (когда доступны для выбранного уровня), government/university/private aid. Строго отделить `Full tuition`, `Tuition + stipend`, `Comprehensive`, `Partial` и `Unknown`; не именовать full-ride без доказательства покрытия проживания/питания/страхования и т.д. Отдельные поля nationality, residency, target_degree, grade/age criteria, income criteria, languages, tests, major, universities, duration, renewal conditions, funding cap, application route, admissions linkage, cycle/deadline/timezone, official link, last_verified. Показывать скрытые расходы и годовые изменения. Сравнение, сохранение, watchlist, eligibility checklist и reminders.
**Готово, когда:** система не путает funding type и на каждом scholarship detail видны источники, покрытия, ограничения и дата проверки.

**Дополнительные задачи:** Funding categories with explicit cost coverage tags: tuition, living stipend, accommodation, travel, insurance, fees, renewal/grade conditions, duration. Precisely separate `full tuition` vs `fully funded` vs `full ride` and conditional funding. Cross-link scholarship schemes to programs/intakes and nationality restrictions; note nominating body/state quotas if sourced. **Exit test:** fixture proves full tuition never shown as full ride; expired scholarship hidden or marked, conflicting info cannot be published as verified without reviewer.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 14 — Global Opportunities Hub, школы и extracurriculars
**Сделай:** единый модуль возможностей: olympiads, hackathons, summer/research schools, academic competitions, exchange programs, volunteering, internships, student conferences, awards, essay contests, coding contests и mentorship/portfolio programs. Избегать нерелевантных и возрастно-недоступных возможностей; хранить eligibility, сроки, форму участия, region/online, fee/free, host, official registration URL, verified. `Schools` отдельно поддерживает партнёрские школы/образовательные учреждения (B2B), high schools и summer schools, не смешивая эти типы. Сохранять как profile-building plan actions без обещаний влияния на решение комиссии.
**Готово, когда:** opportunity можно найти, проверить, сохранить, добавить в road map и отслеживать статус.

**Дополнительные задачи:** Opportunity types: exchange/FLEX-like, UWC/high schools, summer programs, research, volunteering, contests, internships, portfolio projects, gap-year. Each type has age, eligibility, cost, location, format, sponsor/official apply URL, risk flags and closing date. Do not recommend age-inappropriate options or unsupported international travel claims; link to official application mechanism where known. **Exit test:** UI clearly differentiates university degree program from scholarships and extracurricular opportunity; age/grade filters work.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 15 — Unified Search, Saved Lists и Side-by-side Compare
**Сделай:** глобальный поиск программ, стипендий, opportunities с типом результата, typo tolerance (если есть поисковый движок), facets, chips, sorting, saved searches, pagination/cursors. Отдельный shortlist/college list: `Dream / Target / Safer` допустимы лишь как **пользовательские организационные метки**, а не обещания вероятности; пользователь может переименовать. Таблица сравнения 2–4 программ по eligibility, deadlines, total costs, available funding, study language, source recency и personal fit. `Save`/`unsave` устойчиво к гонкам и sync across devices.
**Готово, когда:** поиск предсказуем, filters URL-shareable и список persist после перезагрузки.

**Дополнительные задачи:** Debounced suggest/autocomplete with keyboard controls, search history private, saved search idempotent, result comparison 2–4 columns with mobile card/scroll UI, source badges and deadline comparisons. Build normalized filter query schema and URL state persistence. No superuser query bypass for common searches. **Exit test:** 5k/10k seeded synthetic rows allow indexed search and stable pagination; compare shows only sourced facts and unknowns; no unbounded reads.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 16 — Explainable Matching Engine v1 + evaluation
**Сделай:** server-side deterministic eligibility engine с типизированными hard constraints: degree, citizenship, age when legally relevant, grad year, language, required tests, deadlines, funding, required curriculum, geography. `Eligible / Potentially eligible / Ineligible / Unknown data` отдельно от ranking. Soft ranking: course fit, budget, funding coverage, language, user preference, required preparation; configurable weights + rule explanations. UI в духе питча с progress/match cards, НО **проценты 94%, 91% — не статистические шансы admission**. Если используешь 0–100, явно назови «индекс соответствия» с методологией и не подменяй вероятность. Не исключай кандидата по пропущенному необязательному полю. Показывай `Почему подходит`, `Что не хватает`, `Что проверить`, `Источник`. Offline evaluation fixtures, calibration, fairness tests, false eligibility suppression.
**Готово, когда:** для каждой рекомендации детерминированно воспроизводимы условия и reason codes, а несовместимые scholarships не рекламируются как доступные.

**Дополнительные задачи:** Three-stage engine: hard constraints (`yes/no/unknown` with reasons), weighted soft fit score (preferences & thresholds), funding feasibility. `Fit 84/100` may represent transparent scoring rubric but is **not** admission chance; display components and missing-data sensitivity. Support test waiver, conditional offers, multiple citizenships, test expiry, gap year, uncertain deadlines. Store model/rules version and source snapshots. **Exit test:** deterministic tests with known eligibility fixtures, snapshots and explanations; changing IELTS causes recompute; no AI-fabricated probability.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 17 — Personalized Roadmap & Gap-to-Action Planner
**Сделай:** календарно-событийный персональный план по циклам, странам и программам: preparation, language tests, SAT/CSCA/HSK where relevant, extracurricular evidence, document preparation, recommendations, essays, application fees, interviews, visa, enrollment. Привязывай каждую задачу к official deadline и timezone, показывай buffer dates и priority. Имеется dependency graph: не завершать `submit` до готовности обязательных документов. Templates by country/system и индивидуальная генерация списка задач. `What should I do next?` на основе confirmed profile gaps, а не random AI to-do. Канбан + timeline + checklist + calendar.
**Готово, когда:** пользователь может вести индивидуальный план от 0% до финального milestone с реальными зависимостями.

**Дополнительные задачи:** Roadmap generator maps verified program deadlines + user grade + missing requirements into milestones: exams, shortlist research, academic documents, essays, references, payments, translations, interviews, enrollment. Tasks dependencies, weights, dates, locale/TZ, progress and `why this task`. Mark optional vs mandatory and reschedule when dates change; no gamification pressure if deadline missed. **Exit test:** plan survives refresh and two devices; overrides don't erase manual tasks; blocked dependencies and missed dates surfaced correctly.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 18 — Admissions Application CRM: от draft до enrollment
**Сделай:** сущность application workspace для каждой программы, с state machine `researching → shortlisted → preparing → ready_for_review → ready_to_submit → submitted_external_confirmed → under_review → interview → offer/waitlist/rejected → accepted/declined → enrollment`, а также `withdrawn`; переходы с validation. Хранить deadline, official submission portal, application fee, waiver, assigned mentor, checklist, notes, official reference ID (если предоставлено пользователем), submission timestamp, confirmation evidence, decisions, scholarship outcomes. Возможность мультипрограммной подачи, batch tasks и country-specific flows. Внешние заявления не отправлять автоматически без официальной интеграции, отдельного явного согласия и подтверждения. Ни один UI-статус не должен ложно утверждать отправку.
**Готово, когда:** у пользователя есть настоящий application tracker с данными, переходами и audit trail.

**Дополнительные задачи:** Application stages `considering → researching → preparing → ready_to_apply → externally_submitted (user-confirmed) → awaiting_result → decision_received → accepted/declined/withdrawn`; independently record scholarship application. Store official portal URL and external applicant tracking reference only when entered by user. Event log append-only statuses + evidence; never auto-submit official applications. **Exit test:** transitions audited; user cannot access another applicant's tracking; 'submitted' displays confirmation provenance not self-proclaimed integration.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 19 — Secure Supabase Document Vault & Writing Workspace
**Сделай:** файловое хранилище для transcript, certificate, passport/ID при действительной необходимости, resume/CV, essay/SOP/personal statement, recommendations status, language certificates, portfolio URLs, financial evidence. Отдельные классы чувствительности и retention; не собирать документы заранее без необходимости. Drag/drop, preview safe file types, virus scan hook, size/MIME checks, authorized download, revision history, version compare, application-specific mapping, export ZIP по разрешению. LOR request workflow без чтения конфиденциальных писем, которые должны оставаться private; sender-controlled submissions и статус. Word count и forms rubric. Для minors — privacy-forward safeguards.
**Готово, когда:** невозможно прочитать чужой документ по угаданному storage path/URL; права тестируются.

**Дополнительные задачи:** Supabase private document vault with `private/student/<uid>/<doc_id>/<version>` logical paths (enforce policy on actual storage object names), filetype/maxsize/content check, statuses `uploading/quarantined/available/deleted`, private encrypted documents and expiry-aware shares. Document types transcript/passport/reference/CV/essay/test; versions and reference associations. Server-side signed URL for mentor only if explicit, time-scoped assignment valid. **Exit test:** tampering path, cross-user signed-URL request, oversized, wrong filetype and revoked mentor denied. Note object backup separate from DB backup.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 20 — Jetu AI Coach: grounded assistant with tools
**Сделай:** multilingual AI coach ru/kk/en, server-side gateway, structured outputs, tool-calling с **минимально необходимыми** правами; tools `get_profile`, `search_verified_programs`, `search_verified_scholarships`, `read_deadline`, `explain_match`, `draft_plan`, `list_required_docs`, `summarize_application_status`. Retrieval из актуального verified catalog с цитатами на official URL, source year и last_verified. Разделять facts from sources vs personalized recommendations vs model suggestions; корректно отвечать `не знаю/надо проверить`. Не предоставлять юридически окончательных immigration/visa решений. Защита от prompt injection в scraped content, содержимое документов не превращать в инструкции системному агенту. Token usage quotas, per-user cost budget, rate limits, moderation, streaming, errors, conversation history controls, privacy settings. Запрещённые claims: admitted guaranteed, scholarship secured, official decision, made-up deadline.
**Готово, когда:** промпт-тесты показывают отсутствие выдуманных deadlines/awards, изоляцию пользователей и сохранение citations.

**Дополнительные задачи:** Server-side AI gateway: task-type prompt schemas, resource budget, user consent, quoted official evidence with structured provenance IDs; platform tools `searchPrograms`, `getScholarship`, `checkEligibility`, `getDeadlines`, `summarizePlan`, never arbitrary SQL or untrusted tool invocations. Poisoned documents treated as data, not instructions. Stream responses with abort/timeout; retry idempotently and display `cannot verify` where applicable. **Exit test:** prompt injection/evidence mismatch/cost-limit/timeout tests; AI isn't allowed to change high-stakes statuses without user confirmation.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 21 — AI Writing Studio, Essay Coach, CV & Interview Lab
**Сделай:** AI writing workflow на базе прототипа Jetu: ввод критерия, исходный текст, actionable rubric (clarity, structure, specificity, evidence, voice), локальные comments по отрывкам, версия до/после, concise editing suggestions, revision history и progress tracking; без фальшивых точных «оценок поступления». Modules: personal statement, supplemental essays, motivation letter/SOP, scholarship essay, CV/resume, activities descriptions, email templates to admissions offices, interview preparation (text and opt-in voice where feasible). По умолчанию human-authored/student-authored content; AI помогает с обратной связью, не выдумывает achievements, credentials, referees or life stories. Plagiarism/integrity warnings, institution-specific AI rules if verifiable.
**Готово, когда:** draft сохраняется, review помогает конкретным улучшениям и не подменяет личную историю абитуриента.

**Дополнительные задачи:** Essay editor with autosave versions, prompt/wordcount constraints, school-specific requirements sourced, rubric such as specificity, structure, motivation, evidence, grammar; feedback addresses text without making admissions promises. Offer change suggestions rather than fabricate personal accomplishments. CV/activities export, SoP and recommendation-letter preparation templates with permission boundaries, interview practice text mode. **Exit test:** version diff restores and rollback, draft cannot leak to mentor without grant, AI feedback when unconfigured is visibly unavailable rather than fake scores.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 22 — Verified Mentor Network and Review Workflow
**Сделай:** mentor onboarding + verification workflow, expertise tags, degree/country/language skills, experience evidence, availability, pricing visibility, queue. Student mentor-request, scoped access to selected items, async comments, essay revision approval, application readiness audit, scheduling (calendar integration optional) и session summaries. Identity and rights checks, abuse-reporting/moderation; для несовершеннолетних — безопасная коммуникация внутри платформы, необходимые ограничения и согласия; не публиковать персональные контакты. SLA, review status, transparent payment and refund policy if paid.
**Готово, когда:** mentor видит только явно назначенных студентов/документы, а все действия протоколируются.

**Дополнительные задачи:** Mentor identity verification by admin; service type, languages, availability, review queue, assignment consent, notes and comments, document permissions per assignment not blanket profile. Mentors cannot initiate unrestricted DM with a minor; guardian/school safeguarding configuration and report/block tooling. No fabricated mentor profiles/credentials. **Exit test:** assigned mentor sees only allowed student/work; revoked assignment instantly blocks new reads; feedback author is auditable.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 23 — Deadline Engine, Notifications и Calendar
**Сделай:** notification inbox/email/push по поддерживаемым каналам; in-app guaranteed delivery semantics, notification preferences, unsubscribe, quiet hours, dedup, retries, timezone, digest schedule, reminders T−30/T−14/T−7/T−1, change alerts on source updates. Calendar day/week/month и iCal export; Gmail/calendar integrations опциональны и только при отдельном OAuth согласии. Не отправлять оповещения о непроверенных дедлайнах как о гарантированных. Уведомления должны переживать повторный job run без дублей.
**Готово, когда:** deadline изменение приводит к правильному reschedule и одно событие не порождает 10 писем.

**Дополнительные задачи:** Cron jobs from DB deadlines + user preferences + timezone; opt-in email for reminders if SMTP configured. Multiple reminders with dedupe `user+event+scheduled_time+channel`, timezone DST test, retries/failed sends surfaced in admin metrics. In-app persistent notification center with accessible unread count; calendar ICS export, and OAuth sync only after consent/config. **Exit test:** delivery tracked as `queued/sent/failed`, never claim delivered when vendor unavailable; duplicate cron executions yield one logical notification.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 24 — Student Dashboard & Outcomes Intelligence
**Сделай:** Jetu dashboard premium уровня: следующий лучший шаг, timeline до дедлайнов, статус profile completeness, saved shortlist, active applications, funding opportunities, recent mentor reviews, AI coach shortcut, progress charts, streaks только как мягкие учебные элементы без манипулятивных UX-паттернов. Отдельные widgets: total estimated tuition vs verified aid vs remaining costs (с допущениями), document readiness, upcoming tasks, submitted confirmations. Конверсионные воронки и cohort analytics агрегировано, доступы scoped. Empty states полезны и показывают first action.
**Готово, когда:** новый пользователь получает конкретный onboarding CTA, опытный видит актуальное состояние, всё data-driven.

**Дополнительные задачи:** Dashboard must answer `what next / which deadlines / how many eligible options / what changed`. Include progress by plan tasks and application statuses, deadline countdown, saved matches, alerts about source updates, suggested next actions and finance estimate; screenshot-ready but not overwhelming. Data derived from SQL views/functions scoped to user, not unreliable client aggregates. **Exit test:** refresh and cross-device data accurate; empty first-login instructs next action, not fabricated charts.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 25 — Post-offer Finance, Visa & Enrollment Journey
**Сделай:** offer comparison: tuition, verified net cost, stipend, cost of living, housing/insurance/transport estimates, duration, renewal criteria, deposit deadlines, conditions for acceptance. Валютные конверсии показывать с датой курса и не смешивать фактическую стоимость с оценочной. Post-offer checklist: accept offer, housing, pre-enrollment documents, embassy/visa official links, travel preparation, university orientation. Информация о визе — ориентир с официальными источниками и явным disclaimer, не legal advice. Поддержка нескольких offers и shareable summary только после согласия владельца.
**Готово, когда:** road map продолжается после `Offer received`, а продукт действительно сопровождает до enrollment.

**Дополнительные задачи:** Separate offer verified/user-entered statuses, conditional admission, scholarships awarded vs sought, net cost estimation with currency/date note, deposit deadlines. Post-offer country-specific checklist for visa, enrollment, housing, insurance, pre-departure sourced, not legal advice. Document official websites and manual verification prompts. **Exit test:** no visa approval claims; finance estimates separate source data from user assumptions; order statuses and deadlines coherent.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 26 — B2B School / Counselor Multi-tenant Workspace
**Сделай:** organizations, membership/invitations, counselor↔student assignment, cohorts, cohort intake year, school dashboard, bulk progress (при соблюдении приватности), student risk flags based on deadlines/docs (не несправедливые алгоритмические оценки), task templates, exports, reports, seat management, permissions, organization branding only where configured. Multi-tenant schema + auth boundaries, immutable audit records, user data portability и offboarding. Student/guardian consent where required before school accesses records; avoid automatic exposure of personal essays to all school staff.
**Готово, когда:** тест подтверждает нулевой cross-tenant leakage между школами A/B.

**Дополнительные задачи:** Org schema `organizations`, `organization_memberships`, `student_org_links`, `cohorts`, `mentor_assignments`, `school_reports`, `invitations`. All data scopes require org membership verified in DB and student consent. Teachers can't see students from other schools; aggregate dashboards enforce group-size privacy suppression if appropriate. Org deletion/revocation workflows and audit. **Exit test:** create two organizations + duplicate user identities and prove no cross-tenant data leakage in SQL policy tests and E2E.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 27 — Monetization, Billing, Entitlements & Unit Economics
**Сделай:** feature entitlements через конфигурацию, стартовые названия Free / Plus / Mentor из питча; reference prices 2 990 ₸ и 14 990 ₸ только как `draft`, включать фактическую платёжную обработку после проверки местного провайдера, юридических условий, возраста и credentials. Отказаться от misleading «безлимитности» без fair-use policy. Quotas на AI credits, documents, saved lists, mentor reviews по реальной себестоимости; graceful upsell в естественный момент, без блокировки доступа к своим документам. Billing adapter, webhook idempotency, subscriptions/trials/cancel/refund, invoicing и B2B seats, taxes/legal settings как configurable. Cohort LTV/CAC, gross margin, AI cost/user, conversion, churn и scholarship activation KPIs.
**Готово, когда:** платный доступ контролируется на сервере, а unsupported payment представлен как `not configured`, а не фейковая покупка.

**Дополнительные задачи:** Plan entitlements and feature gates driven from trusted DB `plans/subscriptions/entitlements`, billing adapter with provider selection legal/regional review, webhook signature and idempotency. Free never trapped in useless onboarding; fair AI quotas, visible consumption and pricing details. Paywall cannot expose sensitive student info; currencies KZT display with source if conversion. **Exit test:** role/pricing cannot be edited by browser, replayed payment webhook doesn't activate twice; no payment UI success when provider absent.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 28 — Operations/Admin Studio, Content Governance & Support
**Сделай:** separate protected `/admin`: moderators, content researcher, approvals, data sources, import history, provenance diffs, publishing workflow, verified badge policy, deadlines nearing expiration, user reports, abuse queue, mentor verification, support tickets, feature flags, pricing drafts, org approvals, operational metrics, error dashboards. RBAC permission matrix: `read`, `write`, `publish`, `review`, `impersonate` (prefer support view-only, heavily audited), `manage_billing`, `manage_roles`; super-admin critical actions require safeguards. Все изменения источников, предложений и статуса публикации аудируются.
**Готово, когда:** каталог живёт и поддерживается через админку без ручного редактирования production БД.

**Дополнительные задачи:** `/admin` with verified role, sources review queue, duplicate merging, publish/unpublish and revision history, RBAC actions with two-person approval for destructive bulk updates where appropriate, dispute reporting, stale source alerts, mentor vetting, suspended accounts, exports/deletion. User-facing support ticket statuses and response. Implement source-first editing with review comments and clear publish log. **Exit test:** anonymous/editor cannot escalate to admin; published updates reflect in catalog with cache invalidation; audit records correct actor and diff.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 29 — Supabase RLS security, QA, resilience, performance and cost
**Сделай:** threat model (OWASP Top 10, authorization/IDOR, CSRF, SSRF, XSS, path traversal, prompt injection, privilege escalation), PostgreSQL RLS tests/local containers, PostgreSQL authorization tests, session replay prevention where applicable, rate limits, bot protection and session protections suitable for Supabase, CSP, secure headers, content sanitization, strict file access, service-role API key least privilege, Secret Manager, no PII in logs, age-specific safeguards, data export/deletion, retention/backups/restore drill. Testing pyramid: domain unit, schema validation, PostgreSQL + Supabase RLS/SQL integration, E2E Playwright critical flows (signup→profile→match→save→plan→application→review), visual regression across desktop/mobile, localization, WCAG checks, load test plausible usage patterns, chaos/retry tests for jobs. Performance goals as **target budgets, not fake measured claims**: usable fast on mid-range Android/3G-4G, LCP ≤2.5s at p75 where feasible, INP ≤200ms at p75, CLS ≤0.1, data search low-latency with pagination, bounded backend reads. Document costs by projected DAU/MAU, Postgres query/compute usage and connection pool load, AI model usage, image/storage, egress. Configure quotas and billing alerts.
**Готово, когда:** CI checks honestly pass, no P0/P1 critical bugs, isolation and disaster recovery are verified or explicitly blocked.

**Дополнительные задачи:** Threat model OWASP, least privileges/grants, RLS for all `public` / exposed schemas including storage, SQL function `SECURITY DEFINER` safeguards and `search_path`, session auth and CSRF analysis, rate limits, cost abuse, SSRF on ingest, XSS on essays, sanitized markdown, idempotency on uploads/webhooks. Test `anon`, `studentA`, `studentB`, `mentor scoped/unscoped`, `schoolA/B`, `catalog editor`, `admin`. Load tests and explain/analyze critical queries, secrets audit, privacy export/delete and restore drill. **Exit test:** minimum CI gates green in actual environment, no known P0/P1 security/data loss bugs, performance budgets measured not advertised.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.

## ФАЗА 30 — Production readiness, launch plan, metrics & YC-quality evidence
**Сделай:** production checklist, staging smoke tests, Vercel/approved Next.js host deployment plan, custom domain instructions, SSL, migrations, secrets, Supabase hosting and payment provider billing prerequisites, rollout/rollback, monitors, runbooks/on-call, public support/privacy/terms, student/mentor/B2B demo account using synthetic data only. Deliver documented launch sequence `alpha → closed beta → public beta → GA` with clear go/no-go. Build analytics dashboard for activation/retention/conversion/verified scholarship opportunities and completed applications. Define 10–20 user interviews, willingness-to-pay research, cohort retention, student results with consent, school pilots, acquisition channels, pricing experiments; avoid fabricating traction. Make `YC_READINESS.md`: 1-sentence problem, why now, what users love, unique data/ops advantage, defensibility, revenue, velocity, real metrics, biggest risk, demo script (2–3 minutes). YC acceptance cannot be guaranteed and is NOT a product acceptance criterion.
**Готово, когда:** можно показать сквозную работающую demo-to-staging систему, ясный статус production blockers, и реальные метрики вместо маркетинговых обещаний.

**Дополнительные задачи:** Release candidate tagged on a branch, reproducible staging with synthetic test identities and verified source samples. Verify all critical paths in browsers, responsive 3 locales, `sitemap`, `robots`, `privacy`, support and documented operations; mobile poor-network trial. Launch checklist: smoke, migration dry run, backup, rollback, alerts, rate limits, vendor credentials and lawful consent. YC pack: clear problem evidence, focused wedge, 2-minute demo, real outcomes/interviews, activation funnel and retention, unit costs, why now, why Jetu unique. **Exit test:** `GO` only when acceptance matrix matches tests; if external blockers, label `CONDITIONAL NO-GO`, provide action owners. YC investment cannot be promised.

**Phase release checklist:**
- [ ] Functional UI states (for user-facing phases); design spec or backend verification for infrastructure-only phases.
- [ ] Server/domain contracts, validation, RLS/grants and tests where data access exists; never fake writes or success.
- [ ] Keyboard/mobile a11y and i18n for UI phases; meaningful unit/integration/E2E for every implemented behavior.
- [ ] Change log, screenshots if available, measured test results, and explicit unresolved blockers in `PHASE_TRACKER.md`.


# APPENDIX I — IMPLEMENTATION-READY PRODUCT & TECHNICAL CONTRACTS

> Treat this appendix as mandatory requirements. Keep API routes/domain types flexible based on existing repo, but the behavioral acceptance contracts and security invariants are not optional. Do not generate giant duplicate files or duplicate conflicting schemas. Prefer canonical migration files, domain tests, small reusable components, and architecture decision records.

## I.1. Product modules and user-interface inventory (every CTA must act)

| Feature / page | Minimum screen and data | Primary interaction | Persisted effect | Failure handling |
|---|---|---|---|---|
| Landing `/` | Jetu value, credible feature previews, trust, pricing, FAQ | Start free / discover | anonymous navigation -> signup | offline links, disabled external-only CTAs |
| Auth `/login`, `/register`, `/auth/callback` | credentials/OAuth, terms, onboarding handoff | Sign up / sign in | Supabase Auth identity | verification, wrong code, rate-limit, stale session |
| Onboarding `/onboarding` | country, degree, study interests, funding, tests | Next / Back / Save | `student_profiles` + preferences | draft preservation, validation, keyboard |
| Profile `/app/profile` | academic, tests, budget, goals, accomplishments | Update / attach evidence | versioned source-of-truth rows | merge conflict, unverified values |
| Home `/app` | next milestone, shortlisted items, deadlines, changes | Resume plan | dashboard queries and state | first-time prompt, retry |
| Universities `/universities` | card/table search, key facets | Filter / open | search URL/search history optional | empty/reset, stale source badges |
| Programs `/programs/[id]` | intake, cost, requirements, eligibility | Save / compare | shortlist join | ineligible, unknown, deleted |
| Scholarships `/scholarships` | searchable funding database | Filter by full-ride etc. | saved filters/list | stale eligibility, unmet criteria |
| Scholarship `/scholarships/[id]` | eligible citizenship/degree, coverage, steps, URL | Save / add to plan | `shortlist`, tasks | contradictory source, closed cycle |
| Opportunities `/opportunities` | nondegree programs/schools/contests | Explore / save | opportunity watch/saved item | age limits, outdated source |
| Match `/app/match` | eligibility explanations and factors | Compute / tune preferences | match snapshot, shortlist | unverified inputs and unknown |
| Saved `/app/shortlist` | saved programs, notes, comparison | Compare / remove / reorder | idempotent persisted rows | duplicates, conflicting saves |
| Planner `/app/plan` | milestones, task dependencies, deadline dates | Complete / reschedule | plan tasks + event | late dates, retries, timezone |
| Applications `/app/applications` | stages and list of requirements | Add / progress / confirm external submission | application events + evidence | illegal transition, missing evidence |
| Files `/app/documents` | private document vault + versions | Upload / preview / share with assigned mentor | storage + docs metadata | unauthorized, infected, expired URL |
| AI coach `/app/coach` | cited Q&A grounded to verified records | Ask / save result | safe session metadata, consent | AI provider unavailable/timeout |
| Essay editor `/app/essays` | drafts, revision history and feedback | Save / get suggestions / restore | essay revisions + AI feedback | hallucinated claims, limit reached |
| Mentors `/app/mentors` | verified mentor offers and review requests | Request review | trusted assignment + scoped access | no mentor or unavailable schedule |
| Notifications `/app/notifications` | due tasks, changes, delivery outcomes | Mark read / snooze | persistent inbox + preferences | vendor not configured |
| Offers `/app/offers` | real offer evidence, funding comparison | Update / compare | `offers` + next steps | manual vs verified distinction |
| Billing `/app/billing` | plan status, usage, invoices when available | Upgrade or join waitlist | entitlements/billing events | payment adapter absent |
| Schools `/school/*` | role-scoped caseload, cohorts, reports | Invite / assign / review | organization tenant scoped | guardian/consent and cross-org denial |
| Admin `/admin/*` | editorial review, source integrity, users/support | Review / publish / revert | audit + content version | no verified source; immutable history |
| Legal/help | support, privacy, terms, report content, export/delete | Contact / report / export/delete | ticket/consent lifecycle | legitimate support channels only |

**For each page** define states: `loading`, `ready`, `empty`, `no-access`, `not-found`, `partial-data`, `offline`, `saving`, `success`, `retryable-error`, `hard-error`. A `toast` never substitutes for persisted backend outcome. If provider or feature unavailable, hide CTA or show honest explanation and actionable configuration/waitlist link; do not create dummy success.

## I.2. Canonical PostgreSQL schema specification (start lean but extensible)

Use PostgreSQL migrations and strong types. Prefer UUID PK (`gen_random_uuid()` where supported), `timestamptz` UTC for events, `date` + IANA zone when date-only applies, `numeric`/integer minor units for currency, normalized ISO countries/currencies, text keys for supported locales. Put `created_at`, `updated_at`, `created_by`, `status`, `source_id` only where semantically needed; store update triggers reliably. Restrict mutable status enums with `CHECK` constraints or explicit lookup tables and migration path.

**Catalog/verification schema (readable publicly only after publication and publication rules):**
- `countries (iso2 pk, name_en, region, ...translations)`; `cities (id, country_iso2, name, tz_id)`; `institutions (id, slug unique, country_iso2, legal_name, public_name, official_site, institution_type, accreditation_status, verification_state, published_at)`; `campuses (id, institution_id, city_id, campus_name)`.
- `academic_fields (id, code, parent_id)`; `programs (id, institution_id, campus_id nullable, degree_level, field_id, language_code, delivery_mode, title, length_months, admissions_url, is_published)`; `program_intakes (id, program_id, cycle_year, start_date, application_status, deadline_id, visibility_state)`.
- `requirements (id, intake_id, category, requirement_type, operator, threshold_value, threshold_unit, subject, applies_to, evidence_claim_id, confidence)`; `required_documents (id, intake_id, document_type, extra_notes, mandatory)`; `test_requirements (id, intake_id, exam_code, section_code nullable, min_score numeric, waiver_rule_ref)`.
- `scholarship_providers (id, name, official_url, country, provider_type)`; `scholarships (id, slug, name, provider_id, scope, coverage_class, verification_state, is_published)`; `scholarship_cycles (id, scholarship_id, cycle_year, open_at, close_at, timezone, renewal_requirements, verified_at)`; `scholarship_programs (scholarship_id, program_id)`; `scholarship_eligibility (id, scholarship_cycle_id, rule_kind, rule_payload, source_claim_id)`.
- `scholarship_benefits (id, scholarship_cycle_id, benefit_type, amount, currency, frequency, cap, conditions, guaranteed_or_possible)`; `financial_costs (id, program_intake_id, cost_kind, amount_min, amount_max, currency, frequency, source_claim_id)`; `coverage_requirements (id, scholarship_cycle_id, label)`.
- `opportunity_providers (id, official_url, name)`; `opportunities (id, provider_id, category, title, eligibility_age_min/max nullable, country, online_flag, cost, currency, next_deadline, official_apply_url, verification_state, published_at)`; `opportunity_rules`, `opportunity_deadlines`, `opportunity_tags`.
- `official_sources (id, source_type, canonical_url, host, first_seen_at, last_fetched_at, publisher, source_language, trust_level, capture_hash, archival_reference nullable)`; `source_claims (id, source_id, entity_kind, entity_id, field_key, text_or_json_value, statement_excerpt, captured_at, cycle, effective_at, verification_status)`; `verification_events (id, source_claim_id, actor_id, action, notes, old_value_hash, new_value_hash, created_at)`; `catalog_revisions`, `catalog_conflicts`, `catalog_import_batches`.
- `catalog_translations (entity_type, entity_id, locale, field, value, translation_status)` with proper unique composite key. Prefer credible language-specific titles; never machine-translate an official program name as if it were official.

**Private student domain (RLS owner-based):**
- `profiles (id uuid pk references auth.users(id), display_name, preferred_locale, timezone, ... minimal public profile)`; `student_profiles (user_id unique, graduation_year, grade_system, GPA data, intended_degree, funding_preference, target_countries, revision)`; `student_citizenships`, `student_exams`, `student_achievements`, `student_preferences`, `student_academic_records`; link to `auth.users` safely and handle deletion.
- `shortlist_items (id, user_id, target_type, target_id, position, notes, created_at, unique(user_id,target_type,target_id))`; `saved_searches`; `compare_sets`; `match_runs (id, user_id, input_snapshot, engine_version, data_version, result_summary, created_at)`; `match_results (run_id, target_type, target_id, verdict, fit_score nullable, uncertainty, factor_explanation, official_claim_refs)`.
- `plans (id, user_id, name, status, generated_for_cycle, generation_version)`; `plan_tasks (id, plan_id, owner_id, title, task_kind, deadline_at, deadline_timezone, dependency_graph_ref, completion_state, source_claim_id nullable)`; `task_events`; `user_notification_preferences`.
- `applications (id, user_id, program_intake_id nullable, scholarship_cycle_id nullable, external_portal_url, user_reference_id nullable, status, deadline_snapshot, conditions_snapshot, claimed_submission_at nullable)`; `application_events (id, application_id, actor_id, from_status, to_status, justification, evidence_ref, at)`; `application_requirements`, `application_documents`, `application_notes`, `offers`.
- `documents (id, owner_user_id, storage_path, filename, mime_type, detected_type, bytes, checksum, upload_status, visibility, current_version_id)`; `document_versions (id, document_id, storage_path, checksum, created_at, scan_status)`; `document_shares (id, document_id, recipient_user_id, assignment_id, scope, expires_at, revoked_at)`; no client ability to set `scan_status=clean`.
- `essay_drafts (id, user_id, application_id nullable, prompt_snapshot, current_revision_id)`; `essay_revisions (id, draft_id, user_id, content, word_count, created_at)`; `ai_feedback (id, draft_id, revision_id, type, model_id, rubric_json, evidence_json, created_at)`; `ai_usage_ledger`, `ai_sessions`, `ai_message_metadata` with retention and consent, not indiscriminate raw text logs.
- `notifications (id, user_id, type, title, body, target_route, read_at, sent_at, status)`; `notification_jobs (id, user_id, reference, channel, planned_at, idempotency_key unique, status, attempts, last_error_code)`; `activity_events`, `audit_events`, `support_tickets`.

**Mentor, tenant, operations, billing (permissions never inferred solely from client fields):**
- `mentors (user_id, public_bio, verified_at, verifier_user_id, allowed_languages, status)`; `mentor_assignments (id, mentor_user_id, student_user_id, permissions, consented_at, revoked_at)`; `mentor_reviews`, `mentor_sessions` (server-managed); `mentor_reviews` reference accessible document draft versions.
- `organizations (id, name, school_type, country, status)`; `organization_memberships (org_id, user_id, role, approved_at, status, unique(org_id,user_id))`; `student_org_links (id, org_id, student_user_id, consent_state, guardian_consent_status when required, valid_until)`; `cohorts`, `cohort_students`, `school_reports`; organization IDs server issued.
- `admin_roles (user_id, role, granted_by, granted_at)` or centralized DB membership with strongly server-managed role writes; `content_reviews`, `publishing_jobs`, `audit_events`, `feature_flags`, `pricing_plans`, `subscriptions`, `entitlements`, `billing_webhook_events` unique provider IDs, `support_tickets`, `report_queue`.
- `job_outbox (id, aggregate_type, aggregate_id, event_type, payload, dedupe_key, created_at, processed_at)`; `background_job_attempts`. Enforce durable idempotency even if message delivery is repeated after visibility timeout.

**Schema design details:**
- Never use `is_admin` boolean from user self-edited `profiles`. Privileged role grants only by protected server workflow with audit event.
- Catalog `slug` uniqueness; immutable entity UUID; merge aliases instead of breaking saved user relations. Soft-delete published entries with `archived_at` and redirect/trace, don't cascade-delete user application history.
- Published entities must have at least one current official claim for each high-stakes value (deadline, eligibility, funding), or field displays `unverified/unknown`.
- Financial aid and degree program are separate objects. Multiple citizenships, two passport constraints, overlapping funding schemes, multiple cycles, eligibility exceptions all need explicit relational support.
- Store versioned snapshots in application when source terms change, preserve revision and expose update alerts; do not allow public catalog edit to rewrite student history.
- Add indexes for `user_id`, `(user_id, status)`, foreign keys, dates, `is_published`, `country`, `(program_id,cycle_year)`, `(scholarship_id,cycle_year)`, `source_claims(entity_kind,entity_id,field_key)`, appropriate FTS vectors.
- Use SQL `EXPLAIN (ANALYZE, BUFFERS)` on a seeded *non-sensitive local* database for high-traffic queries; optimize based on real plan, not guessed indexes.

## I.3. Postgres grants, RLS and server access — hard gates

Create `docs/RLS_MATRIX.md` with operation matrix `SELECT/INSERT/UPDATE/DELETE/RPC/Storage` for these principals: anonymous browser, authenticated student, another student, verified assigned mentor, unassigned mentor, invited counselor, admin of org A, org B, content editor, platform admin, background worker. For every exposed table explicitly grant only required permissions and enable RLS; views should be `security_invoker=true` where needed or moved to non-exposed schema; `SECURITY DEFINER` functions must set safe `search_path`, enforce `auth.uid()` authorization, and carefully restrict `EXECUTE` grants.

**Sample baseline policy pattern (adapt table/column names to final schema):**

```sql
-- Illustrative pattern: only after table and grants are defined.
alter table public.shortlist_items enable row level security;
revoke all on table public.shortlist_items from anon;
grant select, insert, update, delete on table public.shortlist_items to authenticated;

create policy "student can read own shortlist"
on public.shortlist_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "student can add own shortlist"
on public.shortlist_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "student can update own shortlist"
on public.shortlist_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "student can delete own shortlist"
on public.shortlist_items for delete to authenticated
using ((select auth.uid()) = user_id);
```

Critical review: SQL grants and RLS are BOTH required. This example is a pattern, not complete migration; actual FK/domain policies and schema-qualified function permissions still need tests. When `user_id` is user-supplied, verify it matches auth identity; constraints prevent referencing unpublished/invalid items where required. Keep `service_role` key ONLY in server-only modules with explicit code ownership. Don't make browser writes to protected audit/publishing/billing/verification tables; these belong to trusted service operations and policies.

**Negative security test suite MUST cover:**
1. A reads A shortlist/profile/documents/tasks; B cannot read A even with guessed UUID and direct REST URL.
2. Insert/update with spoofed `user_id` of B is denied; SQL injection and elevated admin claim in user metadata ineffective.
3. Unauthenticated REST cannot enumerate profiles, teacher rosters, essays, invoices, storage object paths.
4. Assigned mentor sees only approved fields; revocation immediately removes access on direct query and on signed URL issuance; existing signed URLs have bounded expiration and must not be treated as revocable instantly without architecture support.
5. Org A counselor cannot discover Org B student by ID, search endpoint, realtime channel or join; tenant owner cannot edit platform-admin roles.
6. Approved catalog editor can edit draft records only via protected API, cannot publish restricted objects without reviewer permission.
7. Published catalog visibility follows status and verified source policy; unpublished draft and raw source imports excluded from anonymous access.
8. Storage `private-documents` denies public listing; uploader cannot forge owner directory; file must be tied to verified DB document metadata.
9. Auth callbacks validate redirect allowlists; password reset token handling can't redirect offsite.
10. `service_role` key never bundled into JS, HTML, maps, logs, error stacks or preview deployment secrets.
11. Real-time subscriptions must honor row visibility; no leaking notifications via broadcast channels.
12. Concurrent state transitions preserve authorization and idempotency.

## I.4. API contracts and server orchestration

Keep query/search catalog reads inexpensive and cacheable; all profile/application/document writes have a well-defined mutation handler with Zod schemas and owner validation. Proposed endpoints (adapt Next route handlers vs validated Supabase RPC as appropriate):

```text
GET    /api/catalog/universities?country=&q=&degree=&cursor=
GET    /api/catalog/programs?country=&field=&funding=&deadlineBefore=
GET    /api/catalog/scholarships?coverage=&citizenship=&degree=&cursor=
GET    /api/catalog/opportunities?type=&age=&country=&cursor=
GET    /api/catalog/{type}/{id}                 # public published records only
POST   /api/onboarding/save                     # authenticated & rate-limited
PATCH  /api/profile                            # allowed fields + revision check
POST   /api/matching/run                       # source-derived constraints
GET    /api/matching/{runId}                    # owner-scoped
POST   /api/shortlist                           # idempotent save
DELETE /api/shortlist/{id}                      # owner-scoped delete
POST   /api/roadmaps/generate                   # deterministic base plan
PATCH  /api/tasks/{id}                          # owner/assignment check
POST   /api/applications                        # audited creation
PATCH  /api/applications/{id}/status            # guarded state machine
POST   /api/documents/upload-intent             # MIME/size/owner validate
POST   /api/documents/{id}/download-url         # per-object owner/assignment
POST   /api/essays/{id}/review                  # AI quota/consent/input
POST   /api/ai/coach                            # grounded tools and limits
POST   /api/mentor/review-request               # assignment/consent
POST   /api/billing/webhooks/{provider}         # signature verified
POST   /api/admin/catalog/{id}/review           # role & evidence policy
POST   /api/admin/catalog/{id}/publish          # protected + audited
```

**Common API response:** typed `Result<T>` with `data` OR `error`: `code`, `message`, `requestId`, optional `fieldErrors`, never internal SQL stack; HTTP status semantics `400/401/403/404/409/422/429/5xx`, no `200` for failed mutation. Accept UUID/slug as IDs but validate parse; provide cursor pagination with stable sort+tie-breaker. Each operation has a single canonical write path. Use database transaction for multirow updates; client should only optimistically update when rollback supported. Reject client-supplied `owner_id`/`role` in privileged mutations.

**Delete semantics:** distinguish `archive` vs `hard delete`; account deletion with planned cleanup of Auth, private objects and dependent records; database deletion alone does not delete file bytes from Storage. File objects must be manipulated through Storage API. If cancellation midway: retry and report partial status.

**Error taxonomies:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `DATA_STALE`, `ELIGIBILITY_UNKNOWN`, `LIMIT_REACHED`, `CONFLICT`, `RATE_LIMITED`, `PROVIDER_NOT_CONFIGURED`, `PROVIDER_TIMEOUT`, `INTERNAL_ERROR`. User-friendly localized messages plus next action. No silent catch or success toast on failure.

## I.5. Matching/eligibility specification (repeatable, explainable, source-grounded)

A recommended program cannot be ranked as eligible without evaluating cycle-specific hard requirements and marking missing/unverified info. Represent result as:

```ts
type EligibilityVerdict = 'eligible' | 'ineligible' | 'unknown' | 'needs_review';
type EligibilityFactor = {
  key: 'citizenship'|'degree'|'grade'|'language'|'exam'|'budget'|'deadline'|'prerequisite'|'other';
  verdict: EligibilityVerdict;
  requiredValue?: string;
  actualValue?: string;
  evidenceClaimIds: string[];
  reasonCode: string;
};
type MatchExplanation = {
  verdict: EligibilityVerdict;
  factors: EligibilityFactor[];
  fitScore: number | null;      // preference alignment, NOT admission chance
  coverageScore: number | null; // must distinguish funded components
  missingInformation: string[];
  rulesVersion: string;
  dataVersion: string;
};
```

Algorithm: normalize verified user profile inputs; look up active sources and current cycle; evaluate mandatory `yes/no/unknown`; if any hard `ineligible` → exclude from eligible group, but optionally show in explorative list with clear reason; if unknown hard criterion → `unknown` not eligible; else soft ranking across selected country/field/budget/teaching language; funding fit calculated separately and transparently. Do NOT translate a 94% compatibility display from pitch into a 94% admission chance. If data contradict official source: mark `needs_review`, show source links and recommendation to confirm with university.

Fixture tests: citizen from Kazakhstan vs ineligible country, grades with unconvertible scales, bachelor's vs master's mismatch, IELTS omitted, expired test, waived exam, foundation year, Chinese-taught language prereq, funding that covers tuition but no lodging, gap before next cycle, scholarship separate deadline, exam score updated midway, missing official URL. QA should prove deterministic explanations without AI.

## I.6. Verified data publishing and freshness policy

Pipeline design: source discovery → fetch public authorized content if access permitted → schema parser → preserve raw evidence reference, canonical URL, capture hash and verified publisher → normalized candidate → duplicate/contradiction detection → preview diff → human review & approve → publish with revision → invalidation and student change notice. Untrusted documents and third-party snippets cannot set verified state. Content automation must respect origin ToS, robots policy, no scraping bypass or bulk login crawling.

Priority at MVP: small editorially validated dataset for **a narrow initial country+degree+funding slice** is better than a million false data points. Public pages may show limited verified catalog and an honest `coverage expanding` note. Start with manually verified 10–30 meaningful records if sufficient official data is available, then ingestion later; do not claim any fixed count until implemented. Seeding mock `Demo University` is allowed locally, with is_demo label and excluded from production.

Track changes per year: 2026 deadline is NOT silently copied to 2027; scholarship awards may change. When in doubt display `Не подтверждено для набора 2027` and official source. Verification SLA and staleness age are policy-driven and country/cycle-specific, not universal magic constants. Verified badges must mean exactly what the policy says and no more.

## I.7. Money, applications and student safety

- Budget fields: KZT/USD/EUR/local currencies with stored ISO and explicit exchange rate retrieval date when calculating. All amounts in minor units or SQL `numeric`; currency conversions are estimates, never fake real-time.
- Scholarship coverage meter displays `Tuition`, `Living`, `Housing`, `Flight`, `Insurance`, `Fees` and categorizes `covered / conditional / not covered / unknown`. `full tuition` **not** same as `full ride`.
- University and scholarship applications track separate steps and official portal destination, with explicit `Externally submitted (user-confirmed)` state and supporting evidence. Never create a fake integration that claims application submitted to university.
- For personal statements, feedback helps user write **true original stories**; prompts should not generate fabricated volunteering, leadership or grades. Mentor/reviewer outputs maintain revision/audit history.
- Age 13–17 safeguarding: no unrestricted private mentor-student chat or sharing of home addresses/passports to unrelated parties; cautious alerts around sending sensitive docs. Add reporting, restricted document access, deletion, and consent/versioned privacy settings. Parent/guardian access should be scoped and opt-in, not a blanket surveillance account.
- Visas, permits and immigration checklists require official country/consulate guidance, date/version and clearly informational disclaimer.

# APPENDIX II — UI/UX, MOTION, ACCESSIBILITY & QUALITY AT LAUNCH

## II.1. Jetu identity from presentation — art direction, not a generic theme

**Hero:** energetic confident Jetu blue, bold warm yellow wordmark, white high-contrast H1, a credible product window illustrating both matching and essay critique with real/demo-labeled content, nav leads to visible working app, primary CTA located above fold. Use blue as expansive brand color on landing, not on every dense data table. Typical screens: soft powder-blue background, white cards with subtle shadow/border, navy body text, blue controls, yellow as distinctive warm attention accent. Keep Jetu recognizable across pages without relentless blue-on-blue blocks.

**Premium UX traits:** accessible high information scent, rhythm in card dimensions, less clutter, stable alignment, concise microcopy, sensible skeleton placement, good density, meaningful whitespace, scale and balance. On shortlist/matching users need decision-relevant details not an ornamental activity feed. On dense admin tables prefer clarity over showcase animation. Logo: professionally draw an original Jetu wordmark and small J-mark, preserve brand personality; never use copyrighted unrelated university marks without rights.

**Design tokens:** use semantic CSS custom properties and a documented token package: brand/main; accent; text strong/secondary/placeholder; background canvas/surface/elevated; border, focus ring, positive/caution/error; motion duration/easing; spacing 4-point rhythm; typography scale; card radius 12–20px range depending component; shadows gentle and scalable; line height at readable range. Values are initial design hypotheses subject to sampling PDF and actual skill guidance. Provide tokens as code, CSS, Figma-like markdown spec and screenshot catalog.

**Responsive structure:**
- 320–480: one-column cards, search filters in accessible drawer with chips in wrapped groups; primary task visible without 4 screens of scrolling; bottom tabs and accessible More for additional routes.
- 481–767: one-to-two responsive cards; sticky controls only if they don't cover content; no horizontal overflow except clearly designed comparisons.
- 768–1023: compact sidebar and main region; readable text column; table layout may switch.
- 1024–1440+: sidebar/top nav, search + results, optional secondary detail pane, clear left-right content hierarchy. Avoid thin-text columns and massive empty sections.
- 1920/ultrawide: max content width with purposeful intentional margin, not 2000px-wide reading line.

**Icon system:** Lucide or same accessible vector family, consistent size/stroke. Icon-only button needs `aria-label`, tooltip not only on mouse, visible keyboard focus. Avoid emojis as interface icons. If flags, use neutral codes or well-styled pictograms accessible to assistive tech.

**Interaction contract:**
- Button `Save scholarship`: immediate busy state, disabled against double click, optimistic if safe, persistence under unique constraint, on failure restore prior UI and show retry.
- Filter chip: keyboard-selectable, visible `aria-pressed`/selected state, URL search changes, results update with no unannounced scroll jump; clear all resets.
- File upload: progress, file validation, cancel/retry, safe preview, success only after storage+metadata commit and access verification.
- Matching progress: show actual rule computation progress only if meaningful, no fake 3-step AI analysis timer; display source, factor interpretation and unknown reasons.
- Roadmap task: inline edit, server-confirmed completion, reorder with keyboard alternative, error banner for stale version.
- AI essay feedback: text selection and quoted context, suggested revision applies only on user click, diff is reversible and final draft authored by user.
- Compare mode: no more than 4 meaningful profiles; accessible comparison on mobile, highlight equal vs different fields with explanatory text.
- Modal/dialog: trap focus appropriately, escape close, scroll locking, transition cleanup and return focus to trigger.
- Toast/in-app banner: concise actionable summary; no endless queue, screen reader accessible live region without aggressive interruption.

**Motion language:** active button spring/damped effect only when desirable, hover lift constrained, content cards fade/translate very subtly, progress bars animate only after data loaded, source update alerts appear without flicker. Avoid full-viewport parallax and mandatory intro animation. Use reduced-motion check in `MotionConfig`/CSS, and leave focus and click flows reliable during interrupted transitions.

**UX Pro Max evidence:** skill output should never be the sole proof. Collect design rationale, actual screen captures (desktop/mobile), axe results, keyboard QA and 5-minute task performance observations where feasible; document deviations. Design system evolves from research + pitch constraints + accessibility, not random color refreshes.

## II.2. Visual acceptance matrix

| Screen | Must look and behave right | QA assertions |
|---|---|---|
| Landing | clear blue/yellow Jetu identity, product preview, high-quality hierarchy | CTA functional, hero legible at 320px, no layout shifts, reduced motion |
| Auth | clean form with humane error messages | error summary, password toggles, keyboard, autofill |
| Profile | high-trust multi-step with progress and autosave | lost-network restores draft; long KZ labels no clipping |
| Catalog | fast search, clear filters and result cards | URLs shareable, facet counts consistent with results |
| Scholarships | financing clarity + confidence labels | full ride != full tuition, screen reader reads components |
| Matching | visually confident factor breakdown; no bogus chance | each factor source accessible; unknown states explicit |
| Roadmap | one next action / deadlines hierarchy | due date accessible in words not color only |
| Applications | intuitive timeline and evidence trail | cannot accidentally mark externally submitted |
| AI Essay | spacious editor + scored criterion only as advisory feedback | diff + undo + source text focus restoration |
| Dashboard | calm, useful `what next` not metric overload | no fabricated stats, empty first day is useful |
| Admin | high-density accessible table and review split-view | role checks, publish confirmation and rollback |
| Mobile | native-feeling responsive web | touch targets and keyboard, no hidden controls |

Add screenshots using Playwright at 375 × 812, 768 × 1024, 1440 × 900 (and spot check 320 and 1920). Keep reference snapshots version-controlled only if no PII and repo size tolerates. Validate 200% zoom, OS dark-mode handling (even when light theme remains), RU/KK/EN, screen readers when feasible.

## II.3. Accessibility and typography requirements

- Target WCAG 2.2 AA (including meaningful accessible names, form errors, landmark structure, labels, focus visible, screen-reader-friendly status), verify rather than assert perfect certification.
- Colors pass contrast via automated test and manual review, focus indicator discernible on blue/white/yellow, no semantic color-only statuses.
- Check Cyrillic and Kazakh characters: Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І; selected fonts must actually include glyph support and appropriate weight/line height; avoid silent glyph fallback breaking brand.
- No text in bitmap-only UI for app content, no invisible placeholder-only form labels; avoid auto-advancing forms on selection when it surprises users.
- Error banners may contain details without disclosing internal exception or user PII. `aria-live` restrained. Restore focus after dialogs/filter panels close. Tooltips on touch also accessible.
- Disabled buttons explain missing prerequisites rather than inaccessible dead ends; don't use disabled controls for upsells with no explanation.
- Content hierarchy helps first-time applicants understand terms like `full tuition`, `tuition waiver`, `stipend`, `conditional offer`, `external application portal` with concise expandable glossary.

# APPENDIX III — QUALITY ASSURANCE, RELIABILITY, PERFORMANCE, COST

## III.1. Test pyramid and release evidence

**Unit tests** cover: currency formatting, date/time windows, URL validation, filename sanitation, matcher hard/soft rules, funding classifier, GPA transparent conversion, state transition guards, plan dependencies, source version evaluator, AI provider payload constraints, tenant role helpers. Prefer table-driven tests and property-based tests where helpful for edge cases.

**DB/integration** with local Supabase and fresh migrations: RLS positive/negative, FK/unique constraints, SQL search facets, save transaction, source publication, profile update race, notification idempotency, mentor assignment revoke, storage object policy, outbox retry, payment event dedupe, rate limits if implemented. Prefer `pgTAP`/`supabase test db` where supported, otherwise documented database test harness. Create test identities with safe seed; never use production keys.

**E2E Playwright** mandatory critical flows:

1. `new RU student → registration → email verified in test runtime → onboarding → profile saved → matching → verified source info → shortlist → personalized plan → reload returns persisted data`.
2. `change IELTS score → match verdict changes with source evidence; add note and compare 2 scholarships; none mislabeled full ride`.
3. `scholarship source changed in admin → reviewer approves → published revision appears and applicant receives update alert; old application snapshot remains`.
4. `add application → add requirement → upload document → create essay draft → request authorized review → user confirms external submission → read audit timeline`.
5. `student B attempts other student's profile/application/doc read → HTTP/RLS deny`.
6. `unassigned mentor denied → assigned mentor authorized scoped review → revoke → denied`.
7. `school A counselor cannot see school B cohort; org memberships tested including direct REST`.
8. `AI provider timeout/unconfigured → honest error and no phantom token charge; existing draft intact`.
9. `offline/slow network → draft not lost, error state actionable, retry without duplicate record`.
10. `expired scholarship, unsupported country, missing language exam, impossible tuition costs → explicit unknown/ineligible, not false eligible`.
11. `keyboard-only complete onboarding, open/close filter panel, search, select result, save, no trap/focus loss`.
12. `mobile 375px and desktop 1440px each critical journey; 3 locales with unusual long field labels`.
13. `billing unconfigured shows unavailable; webhook malformed/replayed cannot grant entitlement`.
14. `delete account/export process responds as documented; partial deletes and retries logged`.

**Negative cases** should be present in code, not as prose only: rate limiting too many AI requests, invalid UUID, stale revision conflict, network dropout mid-upload, malware/unrecognized file, extreme Unicode, timezone near midnight, duplicate click, deleted scholarship, empty list, huge catalog cursor, expired session, cross-tenant aggregate queries.

**Visual regression** screenshot before and after modifications with tolerance for fonts; stable synthetic fixtures; ensure snapshots not taken before animations settle and reduced-motion can be used for deterministic visual tests. Fail CI on meaningful changed pixels only after human triage.

**Security gates:** no client-shipped privileged secret; RLS/exposed grant audit script; dependency vulnerability scanning; SSRF risk in ingestion; prompt injection in source docs; signed URL expiry; secure cookies; permission-based server data access; logs PII redaction; no clickable third-party HTML content unsanitized.

**Continuous integration gate proposal:**

```text
on PR / staging branch:
  verify formatting + ESLint
  tsc --noEmit (strict)
  unit test (nonflaky)
  Supabase local start in CI and migrations clean reset
  RLS policy + integration test suite
  Next.js production build
  Playwright browser E2E smoke (gated for migration and service availability)
  axe critical-page accessibility audit
  dependency vulnerability/security review
  visual snapshot on changed UX pages (human review for intended changes)
```

Never present an unavailable CI result as green. For blocked steps save screenshots, logs, exit code, and owner action to unblock. Release gate requires actual execution, not merely presence of YAML.

## III.2. Quantitative performance targets (targets, not claims)

- Public mobile LCP p75 goal ≤ 2.5s, INP p75 ≤ 200ms, CLS p75 ≤ 0.1 where feasible with real-user field measurement after launch; local Lighthouse is only a lab proxy.
- API p95 for indexed catalog query under realistic seeded load: target ≤ 500ms **in-region**, record actual environment and query plan; remote network reality may differ.
- Avoid over-fetching, browser-bundled catalog dictionaries of 100k rows, N+1 queries and waterfalls; use server fetching and cache correctly partitioned by locale/user context. Private user pages never accidentally share cross-user cache response.
- Matching run latency: deterministic rules first; target interactive responsive path, progressive result count if background calculation; avoid AI blocking recommendation retrieval.
- Optimize Core Web Vitals without sacrificing legibility; lazy load non-critical illustrations, image sizes, fonts self-host only when licensing allows; lazy heavy charts; motion disabled for performance-sensitive devices.
- Watch Postgres CPU/load, row read counts, storage bandwidth, Edge Function invocation quotas, DB connection pool, realtime concurrency, AI token cost and email sends; define monthly budget and alert thresholds by MAU tier (100 / 1,000 / 10,000 / 100,000), **model estimates not factual costs**.
- On database/AI/provider downtime: document fallback behavior; no silent data loss, bounded retries, degraded search/UI with clear status. Backup/restore should include Storage separately if platform backups cover only Postgres data.
- API abuse prevention with IP/user/resource-level rate limiting and monetization quotas. Protect expensive matching and AI calls from unauthenticated scripted use; use least privilege on workers.

## III.3. Security threat model checklist

- Auth: token refresh, malformed cookie, logout/revoked session, OAuth callback allowlist, email verification, CSRF for cookie-authenticated mutations (analyze chosen app patterns), password recovery spam.
- Database: RLS/grants per exposed table, overbroad `SECURITY DEFINER` functions, default grants, permissive views, JSON body authorization, IDOR via UUID, cross-tenant joins, unsafe bulk update, SQL injection via dynamic filter/order.
- File: path spoof, signed link leakage, malicious upload, huge file, MIME mismatch, metadata direct edits, stale delete, mentor retention, public cache of private object.
- AI: user-supplied source prompt injection, instruction mixing, citation hallucinations, false rankings, secret/system prompt exposure, student profile prompt contamination, data leak to LLM vendor without permitted contract/consent, runaway token spending.
- Ingestion: third-party URL SSRF, PDF/HTML parser threats, robots/ToS violations, poisoning, duplicate source conflicts, expired cycles and unauthorized external edits.
- Billing: event spoof/replay, client forging entitlement, underflow/overflow amounts, race on subscription downgrade, payment not fully configured.
- Operational: leaked staging credentials, public static env values, incorrect prod/staging URLs, insufficient rollback, database migration locks, rate spikes, absence of restore drill.
- Children's and adolescents' information: age-aware defaults, restrict outreach/mentoring and sharing, guardian consent when required, safe reporting, no gamified pressured claims on acceptance odds.

## III.4. Minimum monitoring, data governance, and disaster recovery

- `requestId` propagated through gateway, services and DB queries; structured logs contain event and status, not student essay text/passport content or raw OAuth tokens.
- Platform admin can see failed jobs, stale verified sources, recent publish errors, auth outage indicators, AI budget usage, content disputes, support tickets, plan/billing provider status. Every chart grounded in actual rows.
- Audit logs protected append-only from ordinary roles with retention and access limits. Sensitive exports have expiry and permissions.
- Periodic backups for DB and objects (evaluate project plan and storage retention); document restore drill and realistic RPO/RTO objectives, not magical zero recovery loss.
- GDPR-like principles where applicable (data minimization, export/delete, purpose limitation); legal compliance for Kazakhstan and target market must be confirmed by qualified review, not asserted by implementation alone.

# APPENDIX IV — YC-LEVEL PRODUCT EXPERIMENTS WITHOUT FAKE TRACTION

## IV.1. Narrow wedge and differentiating advantage

Start Kazakhstan/Russian + Kazakh with international students who prioritize real scholarships. Existing pitch's strongest promise is a path from confusion to clarity: reliable sources, multilingual UX, explanation of requirements, a plan, real mentor support. **Design the product as a trusted action system, not an AI content generator.**

First 20-minute activation experiment: Onboard one student, expose three clearly relevant programs or honestly explain why none pass hard requirements, provide fully cited scholarship coverage, allow save and first plan milestone. Calculate median time to first useful saved opportunity (with actual instrumentation once users exist). Later expand program coverage and AI assistance based on interviews.

**Metrics definitions (event taxonomy):**
- `signup_completed` → meaningful sign-up, never counted before verified identity if verification required.
- `profile_ready` → predefined minimum data set complete; not a vanity completion score.
- `verified_opportunity_viewed` → user opens published page with valid official source proof.
- `matching_explained` → eligible/unknown result explanation actually rendered to student.
- `shortlist_created` → persisted shortlist entry.
- `roadmap_first_task_completed` → first plan step persisted and completed.
- `application_prepared` → all mandatory checklist tasks marked ready by student; not third-party submitted.
- `application_user_confirmed_submission` → external submission user confirmed with explicit provenance.
- `offer_recorded` → self-reported vs verified clearly differentiated.
- `source_conflict_reported` → data trust improvement loop.
- `mentor_review_completed` → verified mentor response in app.

Retention and growth: D1/D7/D30 activated students, WAU/MAU by active meaningful action, time-to-match, match-to-save, save-to-plan, plan-to-application, verified content coverage and source refresh. Log event schema version and consent; avoid storing identity attributes that analytics don't need. Dashboards use honest cohort denominators.

**Evidence pack for accelerator:** 1-minute problem story grounded in interviews, crisp differentiation vs consultant/chat/global AI, actual working demo of profile→verified scholarship→plan, qualitative feedback with consent, real cohort metrics, gross margin economics of AI+research+mentors, how verified content and workflow data improve usefulness while respecting privacy, user pain observed in regions, product velocity, roadmap backed by priorities, legal/age safeguards. Do not invent outcomes or promise YC investment.

## IV.2. Non-goals for MVP

- No automatic university application submission unless authorized official API agreements and legal review.
- No manufactured admission probability from vague similarity scores.
- No bulk scraping behind logins or evading terms of university portals.
- No student private data sharing to external mentors or third-party AI without defined need/consent.
- No fake payment gateway, mentor sessions, real-time chat, source verified badge, or push/email success when not connected.
- No dozens of microservices, proprietary ML training pipeline, mobile native apps, VR campus tours or 3D landing effects before student core loop works.
- No publishing unverified marketing claims from 2026 pitch or future planned traction as achieved.

## IV.3. Prioritization and bounded delivery

**P0 CORE:** Auth/onboarding/profile, catalog with verified sources, scholarships and accurate coverage, deterministic matching, shortlist/compare, personalized plan, application tracker, private docs, admin editorial publish, strong Jetu design, RU+KK+EN readiness, RLS and core E2E.

**P1 CONDITIONAL MVP:** AI coach with safe basic grounded queries, essay feedback, notifications/ICS, mentor review if verified mentors actually exist, school counselor pilot, post-offer guides and outcomes.

**P2 GROWTH:** richer AI, semantic recommendations via `pgvector` if useful, counselor multi-tenant at scale, payments with real provider, many official countries, automated ingestion, student-to-mentor appointments, institutional reporting and API integration with schools.

The **30 phases are engineering tracks**, not 30 independent public features. A phase can be executed as schema/adapter/feature-flag scaffold with complete tests but not publicly claimed as shipped if external integration absent. Release only P0 routes that pass gates; feature flags are server authoritative. For dependencies, defer costly/low-value additions rather than force a superficial implementation to satisfy a high phase count.

# APPENDIX V — DELIVERY, ENVIRONMENT, MIGRATIONS, HANDOFF

## V.1. Suggested repository layout (adapt after audit)

```text
/
├── AGENTS.md
├── README.md
├── package.json / lockfile
├── .env.example
├── .github/workflows/{ci.yml,preview.yml,release.yml}
├── .agents/skills/ui-ux-pro-max/SKILL.md       # if installed for Codex
├── design-system/jetu-admissions/MASTER.md
├── design-system/jetu-admissions/pages/*.md
├── src/
│   ├── app/[locale]/(public)/*
│   ├── app/[locale]/(auth)/*
│   ├── app/[locale]/(student)/*
│   ├── app/[locale]/(schools)/*
│   ├── app/[locale]/(admin)/*
│   ├── app/api/{auth,catalog,matching,applications,documents,ai,...}/*
│   ├── features/{onboarding,profile,catalog,funding,matching,plan,applications,documents,essays,ai,mentors,billing,admin}/
│   ├── components/{ui,layout,illustrations,charts}/
│   ├── lib/{supabase,security,validation,i18n,observability}/
│   ├── server/{catalog,profiles,matching,documents,ai,notifications,admin}/
│   ├── domain/{types,contracts,schemas,errors}/
│   └── styles/*
├── supabase/
│   ├── config.toml
│   ├── migrations/*.sql
│   ├── seed.sql
│   ├── tests/*.sql
│   └── functions/{ingest,notify,...}/*
├── tests/{unit,integration,e2e,visual,security}/*
└── docs/{PRD.md,DATA_MODEL.md,RLS_MATRIX.md,ARCHITECTURE.md,SOURCE_POLICY.md,TEST_MATRIX.md,PHASE_TRACKER.md,YC_READINESS.md,...}
```

Verify Next.js route group and `[locale]` layouts against current Next release; don't create route collisions. Keep SSR server-only helpers isolated. `supabase/functions` may be empty for MVP if Next server routes + Cron are enough; do not invent unnecessary functions.

## V.2. Local setup, essential env variables and secrets behavior

Prefer current documented `supabase init`, `supabase start` with Docker/container runtime, migration files, `supabase db reset` local, `supabase gen types --lang typescript --local`, `pnpm dev` or selected package manager. Never run a linked remote reset. Explicit remote promotion requires approval and dry-run review. Only production deployment after authorization and completed gates.

`.env.example` may include *names* and documentation, never actual values; e.g.:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=                  # or publishable key per project version
SUPABASE_SERVICE_ROLE_KEY=                     # server-only if essential
AI_PROVIDER_API_KEY=                            # server-only, not necessary for base MVP
NEXT_PUBLIC_APP_URL=http://localhost:3000
SENTRY_DSN=                                     # optional
MAIL_PROVIDER_API_KEY=                          # optional, server-only
PAYMENT_PROVIDER_SECRET=                        # only if user authorizes provider integration
PAYMENT_WEBHOOK_SECRET=                         # only after provider setup
```

Check correct key names for the installed Supabase SDK version; some installations use publishable/secret key names. Secrets never in `NEXT_PUBLIC_` except explicitly safe public/publishable client values. `service_role` or secret key may bypass RLS, so server-only and least-use. Do not send actual credentials in logs/screenshots or commit them. Password/Google OAuth may need human console configuration.

## V.3. Local deterministic demo data vs public verification

Provide automated idempotent fixture creation for two students, one legitimate mentor, one unassigned mentor, two school orgs, two counselors, one editorial reviewer, no production PII; 5 universities, 10 degree programs, 12 scholarships (full-ride/tuition-only/partial/unknown/expired mix), 5 non-degree opportunities, 20 deadlines and 10 test profiles. **ALL fixtures synthetic**, not real universities, clearly marked `is_demo = true`/`draft` and never imported to public verified catalog in production. If external official data can be obtained and verified, promote only after source review and explicit publication.

Use stable seeded IDs for Playwright, a deterministic clock abstraction for deadline tests, locale/timezone cases including Almaty and international destination timezones, and fake payment/email/AI adapters only in test environment with explicit labels. Test data should not require paid services.

## V.4. End-of-phase status report template

```text
JETU — PHASE 0X / 30
Status: DONE | BLOCKED | IN_PROGRESS
Implemented in repo: <precise file paths>
Runtime environment: local | staging (no production assumptions)
DB migrations: <names, schema and grants>
RLS: <policies created and denied/allowed cases tested>
UI UX Pro Max: <skill path consulted; design MASTER + page override; evidence links>
Tests actually executed: <commands and exit codes>
Browser QA: <viewport, route, keyboard and visual output>
Known defects: <P0/P1/P2 with reproduction>
External prerequisites: <none, OR exact blockers>
Next: <3 concrete instructions>
```

## V.5. MVP launch go/no-go criteria

A **GO** requires ALL of the following in actual staging with controlled data:

- Fresh install, reproducible migrations, TS/lint/build, tests and major E2E run with reported results, no unresolved P0/P1 security or data-loss errors.
- Every public enabled navigation item leads to operational flow or informational page with working CTA. If a feature has an unfinished backend, it is not falsely advertised as operational.
- Signup/auth/profiles/catalog/eligibility/shortlist/plan/application/documents work after reload and across browsers with user access controls; multiple users remain isolated.
- Catalog high-stakes facts (deadline, eligibility, finances) have official evidence or unmistakably show unknown/unverified/demo; no fake full-ride or admission probabilities.
- Jetu design from original slides + actual UI UX Pro Max guidance is implemented with screenshots, mobile responsive and measured accessibility/performance testing.
- At least RU/KZ app-critical screens complete; EN fallback and key user flow checked; no unlabeled English-only error states in RU/KZ where avoidable.
- User data stored privately, configurable retention/export/deletion, correct storage policies, safe mentor defaults, no leaking keys, documented support path.
- Real services show their actual configured readiness; payment, outbound email, AI or school dashboards can remain gated but not claim to work without their dependencies.
- Monitoring, rate limits, cost caps, backup/restore notes, migration rollback strategy, privacy/legal review checklist and owner approvals are documented.
- A realistic end-to-end demo can be completed in under ~3 minutes with synthetic data and verbal identification of which records are demos.

**NO-GO** if RLS bypasses, unauthorized document access, fake user successes, corrupt data migration, unreliable submission state, unreviewed source masquerading as verified, or critical UI navigation failures. Unknown blockers clearly called out, not hidden under impressive dashboards.

## V.6. Short startup pitch position

> Jetu Admissions makes international admissions and scholarship discovery actionable for students in Central Asia: verified opportunities, explainable eligibility, personalized plans and application tracking — accessible in Kazakh, Russian and English. It combines rigorous source integrity with a useful admissions workspace and optional human mentoring, rather than promising acceptance chances it cannot know.

Core defensibility hypothesis: verified structured content, carefully modeled regional requirements, culturally/language-accessible workflows, and actual student outcomes (only with consent). Competitive advantage must be validated by adoption and continued use, not asserted from visuals alone.

## V.7. Reference sources for implementation (read current docs, verify version)

- UI UX Pro Max official repository: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- UI UX Pro Max Codex installer: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/README.md`
- Supabase SSR/Auth: `https://supabase.com/docs/guides/auth/server-side`
- Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase Storage policies: `https://supabase.com/docs/guides/storage/security/access-control`
- Supabase CLI and migrations: `https://supabase.com/docs/guides/local-development/cli-workflows`
- Supabase Queues (if useful): `https://supabase.com/docs/guides/queues`
- Supabase Cron (if useful): `https://supabase.com/docs/guides/cron`

The above are documentation pointers, not assurances of a product environment's current configuration or any third-party sponsorship.

---
# FINAL EXECUTION COMMAND — START IN REPOSITORY NOW

1. Inspect Jetu repository + any provided 8-page pitch PDF and earlier Jetu prompt; do not assume missing assets exist. Confirm whether UI UX Pro Max skill is installed; READ SKILL.md and use it first, or request install permission and mark blocker.
2. Run audit, design research, produce saved design system, and report only the top five meaningful findings. Create migration plan from old Firebase code if it exists; *do not* keep Firebase dependencies in production architecture.
3. Initialize / repair Next.js + Supabase local stack. Write base schema, grants, RLS tests, auth SSR, layout and component foundation. Implement STUDENT end-to-end P0 first and verify in browser.
4. Carry out Phases 01–30, one phase at a time, using gates. If context ends, save `docs/NEXT_AGENT_PROMPT.md`. If credentials need user action, stop that integration only and work on independent slices without inventing availability.
5. Return at each milestone: what was actually created, real commands/tests and exit codes, issues fixed, remaining P0/P1 defects, blockers, updated user-facing screenshots, next three actions. Never say 'done' merely because code compiles.
6. End with working dev/staging access instructions and a truthful IMPLEMENTED/DEMO/EXTERNAL/BLOCKED table, not claims of flawless operation or guaranteed YC success.

**MISSION:** Build JETU, a source-trustworthy, excellent UI/UX Pro Max-driven, secure and useful Central Asian admissions operating system. A beautiful product plus correctly working workflows and user trust will beat an impressive but hollow demo.
