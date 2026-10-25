import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { UnifiedSearchRow } from '@/features/search/server';
import {
  matchingProfileSchema,
  preferencesSchema,
  recommend,
  RULES_VERSION,
  weights,
  type Candidate,
  type MatchingPreferences,
  type Recommendation,
  type StructuredRequirement,
  type Verification,
} from './engine';

type Client = SupabaseClient<Database>;
type QueryResult<T> = { data: T | null; error: { message: string } | null };
function required<T>(result: QueryResult<T>): T {
  if (result.error || result.data === null) throw new MatchingUnavailable();
  return result.data;
}
export class MatchingUnavailable extends Error {}
export class MatchingProfileMissing extends Error {}
export class MatchingTimeout extends Error {}

export async function loadCandidatesWithin(client: Client, year?: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      loadCandidates(client, year),
      new Promise<Candidate[]>((_, reject) => {
        timer = setTimeout(() => reject(new MatchingTimeout()), 12000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function loadMatchingState(client: Client, userId: string) {
  const [profileResult, prefsResult] = await Promise.all([
    client
      .from('student_profiles')
      .select('document,version')
      .eq('user_id', userId)
      .maybeSingle(),
    client
      .from('matching_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (profileResult.error || prefsResult.error) throw new MatchingUnavailable();
  const profile = matchingProfileSchema.safeParse(
    profileResult.data?.document ?? {},
  );
  const preferences = preferencesSchema.safeParse(
    prefsResult.data?.preferences ?? {},
  );
  if (!profile.success || !preferences.success) throw new MatchingUnavailable();
  return {
    // student_profiles.document is user editable through owner RLS. A student
    // cannot turn a self-reported exam score into verified evidence there.
    profile: {
      ...profile.data,
      testScores: profile.data.testScores.map((test) => ({
        ...test,
        verified: false,
      })),
    },
    profileVersion: profileResult.data?.version ?? null,
    preferences: preferences.data,
  };
}

function evidence(
  claims: {
    catalog_entity_id: number;
    verification_state_code: string;
    source_id: number;
    effective_from: string | null;
    effective_until: string | null;
  }[],
  sources: Map<
    number,
    {
      canonical_url: string;
      last_checked_at: string;
      is_active: boolean;
      effective_from: string | null;
      effective_until: string | null;
    }
  >,
  id: number,
  now: string,
) {
  const related = claims.filter((item) => item.catalog_entity_id === id);
  if (related.some((item) => item.verification_state_code === 'conflicted'))
    return {
      sourceUrl: null,
      sourceCheckedAt: null,
      verification: 'conflicted' as Verification,
    };
  const verified = related.find((item) => {
    const source = sources.get(item.source_id);
    return (
      item.verification_state_code === 'verified' &&
      source?.is_active &&
      (!item.effective_from || item.effective_from <= now.slice(0, 10)) &&
      (!item.effective_until || item.effective_until >= now.slice(0, 10)) &&
      (!source.effective_from || source.effective_from <= now.slice(0, 10)) &&
      (!source.effective_until || source.effective_until >= now.slice(0, 10)) &&
      new Date(source.last_checked_at).getTime() <= new Date(now).getTime() &&
      new Date(now).getTime() - new Date(source.last_checked_at).getTime() <=
        180 * 86400000
    );
  });
  if (verified)
    return {
      sourceUrl: sources.get(verified.source_id)?.canonical_url ?? null,
      sourceCheckedAt: sources.get(verified.source_id)?.last_checked_at ?? null,
      verification: 'verified' as Verification,
    };
  return {
    sourceUrl: related[0]
      ? (sources.get(related[0].source_id)?.canonical_url ?? null)
      : null,
    sourceCheckedAt: related[0]
      ? (sources.get(related[0].source_id)?.last_checked_at ?? null)
      : null,
    verification: related.length
      ? ('stale' as Verification)
      : ('unverified' as Verification),
  };
}

export async function loadCandidates(
  client: Client,
  year?: number,
): Promise<Candidate[]> {
  const [programResult, scholarshipResult] = await Promise.all([
    client.rpc('unified_catalog_search', {
      p_filters: { type: 'program', sort: 'title', limit: 30, offset: 0 },
    }),
    client.rpc('unified_catalog_search', {
      p_filters: { type: 'scholarship', sort: 'title', limit: 20, offset: 0 },
    }),
  ]);
  const programRows = required(programResult) as unknown as UnifiedSearchRow[];
  const scholarshipRows = required(
    scholarshipResult,
  ) as unknown as UnifiedSearchRow[];
  const programIds = programRows.map((row) => row.entity_id);
  const scholarshipIds = scholarshipRows.map((row) => row.entity_id);
  const [programLinks, languages, cycles, tuitionsResult] = await Promise.all([
    programIds.length
      ? client
          .from('program_eligibility_requirements')
          .select('program_id,eligibility_requirement_id')
          .in('program_id', programIds)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    programIds.length
      ? client
          .from('degree_program_languages')
          .select('program_id,language_code')
          .in('program_id', programIds)
          .limit(150)
      : Promise.resolve({ data: [], error: null }),
    scholarshipIds.length
      ? client
          .from('scholarship_cycles')
          .select('id,scholarship_id,academic_year_start,opens_at,closes_at')
          .in('scholarship_id', scholarshipIds)
          .order('academic_year_start', { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [], error: null }),
    programIds.length
      ? client
          .from('estimated_tuition')
          .select('id,program_id,amount_min,currency_code,billing_period')
          .in('program_id', programIds)
          .limit(150)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const pLinks = required(programLinks);
  const langRows = required(languages);
  const cycleRows = required(cycles);
  const tuitions = required(tuitionsResult);
  if (
    pLinks.length >= 500 ||
    langRows.length >= 150 ||
    cycleRows.length >= 80 ||
    tuitions.length >= 150
  )
    throw new MatchingUnavailable();
  const selectedCycles = scholarshipIds.flatMap((id) => {
    const choices = cycleRows.filter(
      (cycle) =>
        cycle.scholarship_id === id &&
        (!year || cycle.academic_year_start === year),
    );
    return choices[0] ? [choices[0]] : [];
  });
  const cycleIds = selectedCycles.map((cycle) => cycle.id);
  const [intakesResult, scholarshipDeadlineLinksResult] = await Promise.all([
    programIds.length
      ? client
          .from('admission_intakes')
          .select('id,program_id')
          .in('program_id', programIds)
          .limit(150)
      : Promise.resolve({ data: [], error: null }),
    cycleIds.length
      ? client
          .from('scholarship_cycle_deadlines')
          .select('scholarship_cycle_id,deadline_id')
          .in('scholarship_cycle_id', cycleIds)
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const intakes = required(intakesResult);
  const scholarshipDeadlineLinks = required(scholarshipDeadlineLinksResult);
  const intakeIds = intakes.map((item) => item.id);
  const rounds = required(
    intakeIds.length
      ? await client
          .from('application_rounds')
          .select('id,intake_id')
          .in('intake_id', intakeIds)
          .limit(250)
      : { data: [], error: null },
  );
  const roundIds = rounds.map((item) => item.id);
  const programDeadlineLinks = required(
    roundIds.length
      ? await client
          .from('application_round_deadlines')
          .select('application_round_id,deadline_id')
          .in('application_round_id', roundIds)
          .limit(400)
      : { data: [], error: null },
  );
  const deadlineIds = [
    ...new Set(
      [...scholarshipDeadlineLinks, ...programDeadlineLinks].map(
        (item) => item.deadline_id,
      ),
    ),
  ];
  const deadlines = required(
    deadlineIds.length
      ? await client
          .from('deadlines')
          .select('id,due_at,deadline_type')
          .in('id', deadlineIds)
          .limit(500)
      : { data: [], error: null },
  );
  if (
    deadlines.length >= 500 ||
    intakes.length >= 150 ||
    rounds.length >= 250 ||
    programDeadlineLinks.length >= 400 ||
    scholarshipDeadlineLinks.length >= 200
  )
    throw new MatchingUnavailable();
  const [scholarshipLinks, programScholarshipLinks, benefits] =
    await Promise.all([
      cycleIds.length
        ? client
            .from('scholarship_eligibility_requirements')
            .select('scholarship_cycle_id,eligibility_requirement_id')
            .in('scholarship_cycle_id', cycleIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      cycleIds.length
        ? client
            .from('scholarship_program_links')
            .select('scholarship_cycle_id,program_id,relationship_type')
            .in('scholarship_cycle_id', cycleIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      cycleIds.length
        ? client
            .from('scholarship_benefits')
            .select(
              'id,scholarship_cycle_id,coverage_item_code,coverage_percent',
            )
            .in('scholarship_cycle_id', cycleIds)
            .limit(200)
        : Promise.resolve({ data: [], error: null }),
    ]);
  const sLinks = required(scholarshipLinks);
  const psLinks = required(programScholarshipLinks);
  const benefitRows = required(benefits);
  if (
    sLinks.length >= 500 ||
    psLinks.length >= 500 ||
    benefitRows.length >= 200
  )
    throw new MatchingUnavailable();
  const requirementIds = [
    ...new Set(
      [...pLinks, ...sLinks].map((item) => item.eligibility_requirement_id),
    ),
  ];
  if (requirementIds.length >= 500) throw new MatchingUnavailable();
  const evidenceIds = [
    ...requirementIds,
    ...benefitRows.map((item) => item.id),
    ...deadlineIds,
    ...tuitions.map((item) => item.id),
    ...programIds,
    ...scholarshipIds,
  ];
  if (evidenceIds.length >= 1400) throw new MatchingUnavailable();
  const [requirements, tests, citizenships, prerequisites, claims] =
    await Promise.all([
      requirementIds.length
        ? client
            .from('eligibility_requirements')
            .select('id,title,description,requirement_type,is_mandatory')
            .in('id', requirementIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      requirementIds.length
        ? client
            .from('required_tests')
            .select('id,eligibility_requirement_id,test_code,waivers_allowed')
            .in('eligibility_requirement_id', requirementIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      requirementIds.length
        ? client
            .from('citizenship_eligibility')
            .select('eligibility_requirement_id,country_id,eligibility_kind')
            .in('eligibility_requirement_id', requirementIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      requirementIds.length
        ? client
            .from('prerequisites')
            .select(
              'eligibility_requirement_id,prerequisite_type,subject,minimum_value,value_unit',
            )
            .in('eligibility_requirement_id', requirementIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      evidenceIds.length
        ? client
            .from('source_claims')
            .select(
              'catalog_entity_id,verification_state_code,source_id,effective_from,effective_until',
            )
            .in('catalog_entity_id', evidenceIds)
            .limit(1400)
        : Promise.resolve({ data: [], error: null }),
    ]);
  const requirementRows = required(requirements);
  const testRows = required(tests);
  const citizenRows = required(citizenships);
  const prereqRows = required(prerequisites);
  const claimRows = required(claims);
  if (
    requirementRows.length >= 500 ||
    testRows.length >= 500 ||
    citizenRows.length >= 500 ||
    prereqRows.length >= 500 ||
    claimRows.length >= 1400
  )
    throw new MatchingUnavailable();
  const testIds = testRows.map((item) => item.id);
  const countryIds = [...new Set(citizenRows.map((item) => item.country_id))];
  const sourceIds = [...new Set(claimRows.map((item) => item.source_id))];
  const [thresholds, countries, sources] = await Promise.all([
    testIds.length
      ? client
          .from('test_score_thresholds')
          .select('required_test_id,component,minimum_score,maximum_score')
          .in('required_test_id', testIds)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    countryIds.length
      ? client
          .from('countries')
          .select('id,iso2')
          .in('id', countryIds)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    sourceIds.length
      ? client
          .from('official_sources')
          .select(
            'id,canonical_url,last_checked_at,is_active,effective_from,effective_until',
          )
          .in('id', sourceIds)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const thresholdRows = required(thresholds);
  if (
    thresholdRows.length >= 500 ||
    required(countries).length >= 500 ||
    required(sources).length >= 500
  )
    throw new MatchingUnavailable();
  const countryCodes = new Map(
    required(countries).map((item) => [item.id, item.iso2]),
  );
  const sourceMap = new Map(required(sources).map((item) => [item.id, item]));
  const now = new Date().toISOString();
  const deadlineProof = (
    row: UnifiedSearchRow,
    ids: number[],
    kind: 'application' | 'scholarship',
  ) => {
    const record = deadlines.find(
      (item) =>
        ids.includes(item.id) &&
        item.deadline_type === kind &&
        item.due_at &&
        row.deadline_at &&
        new Date(item.due_at).getTime() === new Date(row.deadline_at).getTime(),
    );
    return record
      ? evidence(claimRows, sourceMap, record.id, now)
      : {
          sourceUrl: null,
          sourceCheckedAt: null,
          verification: 'unverified' as Verification,
        };
  };
  const byRequirement = new Map<number, StructuredRequirement>(
    requirementRows.map((item) => {
      const citizenship = citizenRows.filter(
        (row) => row.eligibility_requirement_id === item.id,
      );
      const keys = (kind: string) =>
        citizenship
          .filter((row) => row.eligibility_kind === kind)
          .map((row) => countryCodes.get(row.country_id))
          .filter((value): value is string => Boolean(value));
      const prerequisites = prereqRows.filter(
        (row) => row.eligibility_requirement_id === item.id,
      );
      const degrees = prerequisites.filter(
        (row) =>
          row.prerequisite_type === 'degree' &&
          ['secondary', 'bachelor', 'master'].includes(row.subject ?? ''),
      );
      const gpa = prerequisites.find(
        (row) =>
          row.prerequisite_type === 'other' &&
          row.subject === 'gpa' &&
          row.minimum_value !== null &&
          ['gpa:4', 'gpa:5', 'gpa:100'].includes(row.value_unit ?? ''),
      );
      return [
        item.id,
        {
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.requirement_type,
          mandatory: item.is_mandatory,
          ...evidence(claimRows, sourceMap, item.id, now),
          allowedCitizenships: keys('citizen'),
          excludedCitizenships: keys('excluded_citizen'),
          allowedResidencies: keys('resident'),
          excludedResidencies: keys('excluded_resident'),
          priorDegree:
            degrees.length === 1
              ? (degrees[0]?.subject ?? undefined)
              : undefined,
          minimumGpa: gpa
            ? {
                value: Number(gpa.minimum_value),
                scale: Number(gpa.value_unit?.slice(4)),
              }
            : undefined,
          tests: testRows
            .filter((test) => test.eligibility_requirement_id === item.id)
            .map((test) => {
              const overall = thresholdRows.find(
                (row) =>
                  row.required_test_id === test.id &&
                  row.component === 'overall',
              );
              return {
                code: test.test_code,
                minimum:
                  overall?.minimum_score === null ||
                  overall?.minimum_score === undefined
                    ? null
                    : Number(overall.minimum_score),
                maximum:
                  overall?.maximum_score === null ||
                  overall?.maximum_score === undefined
                    ? null
                    : Number(overall.maximum_score),
                waiversAllowed: test.waivers_allowed,
                unsupportedComponents: thresholdRows.some(
                  (row) =>
                    row.required_test_id === test.id &&
                    row.component !== 'overall',
                ),
              };
            }),
          ambiguousTests:
            testRows.filter(
              (test) => test.eligibility_requirement_id === item.id,
            ).length > 1,
        },
      ];
    }),
  );
  const requirementList = (ids: number[]) =>
    ids.flatMap((id) =>
      byRequirement.has(id) ? [byRequirement.get(id)!] : [],
    );
  const base = (row: UnifiedSearchRow): Candidate => ({
    entityType: row.entity_type as 'program' | 'scholarship',
    id: row.entity_id,
    detailPath: row.detail_path,
    title: row.title,
    subtitle: row.subtitle,
    country: row.country_code,
    degree: row.degree_level,
    major: row.category,
    languages: langRows
      .filter((lang) => lang.program_id === row.entity_id)
      .map((lang) => lang.language_code),
    costAmount: row.cost_amount_min,
    costCurrency: row.cost_currency,
    costPeriod: row.cost_period,
    costVerified: false,
    fundingLabel: row.funding_label,
    coverage: [],
    deadlineAt: row.deadline_at,
    deadlineVerification: 'unverified',
    deadlineSourceUrl: null,
    deadlineCheckedAt: null,
    sourceUrl: row.source_url,
    sourceCheckedAt: row.source_checked_at,
    sourceVerification: evidence(claimRows, sourceMap, row.entity_id, now)
      .verification,
    requirements: [],
  });
  const programs = programRows.map((row) => {
    const tuition = tuitions.find(
      (item) =>
        item.program_id === row.entity_id &&
        Number(item.amount_min) === row.cost_amount_min &&
        item.currency_code === row.cost_currency &&
        item.billing_period === row.cost_period,
    );
    const relevantRounds = rounds.filter((round) =>
      intakes.some(
        (intake) =>
          intake.id === round.intake_id && intake.program_id === row.entity_id,
      ),
    );
    const proof = deadlineProof(
      row,
      programDeadlineLinks
        .filter((link) =>
          relevantRounds.some(
            (round) => round.id === link.application_round_id,
          ),
        )
        .map((link) => link.deadline_id),
      'application',
    );
    return {
      ...base(row),
      costVerified: Boolean(
        tuition &&
        evidence(claimRows, sourceMap, tuition.id, now).verification ===
          'verified',
      ),
      deadlineVerification: proof.verification,
      deadlineSourceUrl: proof.sourceUrl,
      deadlineCheckedAt: proof.sourceCheckedAt,
      requirements: requirementList(
        pLinks
          .filter((link) => link.program_id === row.entity_id)
          .map((link) => link.eligibility_requirement_id),
      ),
    };
  });
  const scholarships = scholarshipRows.map((row) => {
    const cycle = selectedCycles.find(
      (item) => item.scholarship_id === row.entity_id,
    );
    const links = cycle
      ? psLinks.filter((link) => link.scholarship_cycle_id === cycle.id)
      : [];
    const proof = deadlineProof(
      row,
      cycle
        ? scholarshipDeadlineLinks
            .filter((link) => link.scholarship_cycle_id === cycle.id)
            .map((link) => link.deadline_id)
        : [],
      'scholarship',
    );
    return {
      ...base(row),
      deadlineVerification: proof.verification,
      deadlineSourceUrl: proof.sourceUrl,
      deadlineCheckedAt: proof.sourceCheckedAt,
      languages: [],
      requirements: cycle
        ? requirementList(
            sLinks
              .filter((link) => link.scholarship_cycle_id === cycle.id)
              .map((link) => link.eligibility_requirement_id),
          )
        : [],
      coverage: cycle
        ? benefitRows
            .filter(
              (benefit) =>
                benefit.scholarship_cycle_id === cycle.id &&
                (benefit.coverage_percent === null ||
                  benefit.coverage_percent > 0) &&
                evidence(claimRows, sourceMap, benefit.id, now).verification ===
                  'verified',
            )
            .map((benefit) => benefit.coverage_item_code)
        : [],
      linkedProgramIds: links
        .filter((link) => link.relationship_type !== 'excluded')
        .map((link) => link.program_id),
      excludedProgramIds: links
        .filter((link) => link.relationship_type === 'excluded')
        .map((link) => link.program_id),
    };
  });
  return [...programs, ...scholarships];
}

export async function runMatching(
  client: Client,
  userId: string,
  input: MatchingPreferences,
) {
  const [state, configResult, recentResult] = await Promise.all([
    loadMatchingState(client, userId),
    client
      .from('matching_configuration')
      .select('version,weights')
      .eq('is_active', true)
      .single(),
    client
      .from('matching_runs')
      .select('id,created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
  ]);
  const config = required(configResult);
  const recent = required(recentResult);
  if (!state.profileVersion) throw new MatchingProfileMissing();
  if (
    recent.length >= 20 ||
    (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < 30000)
  )
    return { rateLimited: true as const };
  const configured = config.weights as Record<string, unknown>;
  if (
    config.version !== RULES_VERSION ||
    Object.entries(weights).some(([key, value]) => configured?.[key] !== value)
  )
    throw new MatchingUnavailable();
  const candidates = await loadCandidatesWithin(client, input.enrollmentYear);
  const results = recommend(
    candidates,
    state.profile,
    input,
    new Date().toISOString(),
  );
  const now = new Date();
  const slot = Math.floor(now.getTime() / 30000);
  const { error: preferenceError } = await client
    .from('matching_preferences')
    .upsert({
      user_id: userId,
      preferences: input,
      updated_at: now.toISOString(),
    });
  if (preferenceError) throw new MatchingUnavailable();
  const { data: run, error: runError } = await client
    .from('matching_runs')
    .insert({
      user_id: userId,
      profile_version: state.profileVersion,
      rules_version: RULES_VERSION,
      preferences_snapshot: input,
      candidate_count: candidates.length,
      rate_slot: slot,
      created_at: now.toISOString(),
    })
    .select('id')
    .single();
  if (runError || !run) {
    if (
      runError?.code === '23505' ||
      runError?.message.includes('matching daily limit reached')
    )
      return { rateLimited: true as const };
    throw new MatchingUnavailable();
  }
  if (results.length) {
    const { error } = await client.from('matching_results').insert(
      results.map((result, index) => ({
        run_id: run.id,
        user_id: userId,
        entity_type: result.candidate.entityType,
        entity_id: result.candidate.id,
        eligibility: {
          status: result.eligibility,
          rules: result.rules,
          assessedWeight: result.assessedWeight,
          reasons: result.preferenceReasons,
          candidate: result.candidate,
        },
        preference_score: result.preferenceScore,
        rank_order: index + 1,
      })),
    );
    if (error) throw new MatchingUnavailable();
  }
  return {
    rateLimited: false as const,
    runId: run.id,
    results,
    candidateCount: candidates.length,
  };
}

export type MatchingRunResult = Recommendation[];
