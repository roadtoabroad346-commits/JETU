# Official-source pipeline contract

Phase 17 adds the reusable ingestion boundary in `src/features/ingestion/official-source.ts`; it does not claim a broad crawl or publish unreviewed data. The boundary is jurisdiction-neutral: each adapter declares ISO country coverage, region, education systems, exact HTTPS hosts, parser version, concurrency and request rate. Automated retrieval remains disabled until a dated robots/terms review is recorded.

## Adapter flow

1. Register an explicit host and the countries/education systems it covers. One adapter may cover a government registry, institution, admissions system or scholarship provider; it must not silently follow links onto an unapproved host.
2. Enforce the returned request policy: a one-to-four request concurrency cap, at most sixty requests per minute, conditional requests where supported, and exponential retry only for `429`, `500`, `502`, `503` and `504`. Honor `Retry-After`; stop after five retries.
3. Store retrieval time, canonical URL, adapter/parser version, response fingerprint and academic cycle. Never bypass authentication, CAPTCHAs, paywalls or access controls.
4. Normalize facts as bounded claims with stable natural keys, an official source URL and short evidence excerpt. Preserve date precision and the source value; do not invent time zones, deadlines, eligibility or currency conversions.
5. Use deterministic claim fingerprints. New facts enter `needs_review`; changed facts enter `needs_review` beside prior evidence; identical facts are idempotent. A fetch or model extraction is never verification.
6. Persist through the existing `official_sources`, `source_claims` and `verification_runs` schema. Only a real authorized editor can mark material claims verified and publish catalog entities.
7. Record conflicts rather than choosing a convenient value. Failed parsing, unexpected markup, stale sources and missing cycles go to the editorial queue with trace metadata.

## Initial adapter registry

The architecture supports adapters for Canadian institution pages (`higher_education` and `scholarship_provider`), Kazakhstan government/institution sources (`government_registry`, `secondary_education`, `higher_education`), and UK admissions/provider sources (`higher_education`). These are coverage categories, not assertions that automated collection is legally cleared. Each concrete host remains blocked until its own access policy has been reviewed and a parser fixture has passed.

The current Jetuu development catalog still contains only the Phase 16.5 manual staging sample. No automated fetch or publication was performed in Phase 17/18 because this execution environment cannot complete source-policy review or human editorial approval.
