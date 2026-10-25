# Phase 16 editorial review queue — 2026-10-25

The authorized Jetuu development project now holds one staged institution, one
staged bachelor program, one staged scholarship and its 2027 cycle. All are
`draft`/`needs_review`. There are **zero reviewed or published** institutions,
programs and scholarships. The idempotent staging SQL is
`scripts/phase16-stage-official-sample.sql`; it was run twice and duplicate checks
still returned one row per natural key. It inserts no admissions decisions,
tuition amounts, English scores, or inferred dates.

| Record                                              | Official evidence read                              | Supported facts                                                                                                                            | Review needed                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| University of Toronto Computer Science, St. George  | https://future.utoronto.ca/program/computer-science | St. George, Faculty of Arts & Science, Computer Science BCS major                                                                          | Confirm legal/unit naming, international curriculum requirements, language, intake, tuition and application cycle. The visible prerequisite selector defaults to Ontario, so those requirements were not imported for Central Asian students.                                                |
| Lester B. Pearson International Student Scholarship | https://future.utoronto.ca/pearson-scholarships     | International first-entry undergraduate award, school nomination, tuition/books/fees/residence listed for four years, September 2027 entry | Confirm exact program relationship, eligibility, current dates and conditions. Current timeline lists 2026 deadlines; an older FAQ on the same page still lists 2025 dates. Do not publish a deadline until the conflict is resolved. Living stipend, insurance and travel are not asserted. |

## Publication gate

An editor must compare each staged field with the current official page, record
field-level claims, check school-system and intake specificity, resolve conflicting
dates, and record a completed `verification_runs` entry with a real reviewer ID.
Only then use the existing claim review and entity publication functions. A source
URL or AI-assisted extraction is not human review. Recheck the official pages,
robots policy and reuse terms before any automated collection; this pass used
manual page inspection and stored short factual claims with links only.

The staging script uses natural keys and `ON CONFLICT DO NOTHING` for repeatability.
It never updates an existing human-edited row. Editors should use a controlled
change review for refreshed source data rather than overwriting prior claims.
