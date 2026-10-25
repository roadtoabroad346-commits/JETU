import { z } from 'zod';

export const RULES_VERSION = 'matching-v2';
export const weights = {
  major: 20,
  country: 15,
  language: 15,
  degree: 15,
  funding: 15,
  budget: 20,
} as const;

const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,20}$/);
const iso2 = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/);
const shortText = z.string().trim().min(1).max(120);
const optionalNumber = z.number().finite().nonnegative().optional();

export const testScoreSchema = z.object({
  code,
  score: z.number().finite().nonnegative().max(10000),
  expiresOn: z.iso.date().optional(),
  verified: z.boolean().default(false),
});

export const matchingProfileSchema = z
  .object({
    country: z.string().trim().max(80).optional(),
    studyLevel: z.string().trim().max(80).optional(),
    field: z.string().trim().max(120).optional(),
    budget: optionalNumber,
    nationality: iso2.optional(),
    residency: iso2.optional(),
    educationLevel: z
      .enum(['secondary', 'bachelor', 'master', 'other'])
      .optional(),
    graduationYear: z.number().int().min(1950).max(2200).optional(),
    gpa: z.number().finite().min(0).max(100).optional(),
    gpaScale: z.number().finite().positive().max(100).optional(),
    languages: z
      .array(
        z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z]{2,3}$/),
      )
      .max(10)
      .default([]),
    testScores: z.array(testScoreSchema).max(20).default([]),
  })
  .refine(
    (value) =>
      (value.gpa === undefined && value.gpaScale === undefined) ||
      (value.gpa !== undefined &&
        value.gpaScale !== undefined &&
        value.gpa <= value.gpaScale),
    {
      path: ['gpa'],
      message: 'GPA and scale must be complete and consistent.',
    },
  );
export type MatchingProfile = z.infer<typeof matchingProfileSchema>;

export const preferencesSchema = z.object({
  countries: z.array(iso2).max(10).default([]),
  majors: z.array(shortText).max(10).default([]),
  levels: z
    .array(
      z.enum(['foundation', 'associate', 'bachelor', 'master', 'doctorate']),
    )
    .max(5)
    .default([]),
  languages: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z]{2,3}$/),
    )
    .max(10)
    .default([]),
  fundingRequired: z.boolean().default(false),
  enrollmentYear: z.number().int().min(2020).max(2200).optional(),
  enrollmentTerm: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{0,30}$/)
    .optional(),
});
export type MatchingPreferences = z.infer<typeof preferencesSchema>;

export type RuleStatus = 'MET' | 'NOT_MET' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type Verification = 'verified' | 'unverified' | 'stale' | 'conflicted';
export type RuleResult = {
  id: string;
  status: RuleStatus;
  explanation: string;
  requirement: string;
  sourceUrl: string | null;
  verification: Verification;
  evaluatedAt: string;
  mandatory: boolean;
};
export type Eligibility =
  | 'eligible'
  | 'potentially_eligible'
  | 'not_eligible'
  | 'insufficient_information';
export type StructuredRequirement = {
  id: number;
  title: string;
  description: string;
  type: string;
  mandatory: boolean;
  sourceUrl: string | null;
  verification: Verification;
  allowedCitizenships?: string[];
  excludedCitizenships?: string[];
  allowedResidencies?: string[];
  excludedResidencies?: string[];
  tests?: {
    code: string;
    minimum: number | null;
    maximum: number | null;
    waiversAllowed: boolean;
    unsupportedComponents: boolean;
  }[];
  ambiguousTests?: boolean;
  priorDegree?: string;
  minimumGpa?: { value: number; scale: number };
};
export type Candidate = {
  entityType: 'program' | 'scholarship';
  id: number;
  detailPath: string;
  title: string;
  subtitle: string | null;
  country: string | null;
  degree: string | null;
  major: string | null;
  languages: string[];
  costAmount: number | null;
  costCurrency: string | null;
  costPeriod: string | null;
  costVerified: boolean;
  fundingLabel: string | null;
  coverage: string[];
  deadlineAt: string | null;
  deadlineVerification: Verification;
  deadlineSourceUrl: string | null;
  deadlineCheckedAt: string | null;
  sourceUrl: string;
  sourceCheckedAt: string;
  sourceVerification: Verification;
  requirements: StructuredRequirement[];
  linkedProgramIds?: number[];
  excludedProgramIds?: number[];
};
export type Recommendation = {
  candidate: Candidate;
  eligibility: Eligibility;
  rules: RuleResult[];
  preferenceScore: number | null;
  assessedWeight: number;
  preferenceReasons: string[];
};

export function profileReadiness(profile: MatchingProfile) {
  const checks = [
    ['studyLevel', profile.studyLevel],
    ['field', profile.field],
    ['nationality', profile.nationality],
    ['educationLevel', profile.educationLevel],
    ['graduationYear', profile.graduationYear],
    ['budget', profile.budget],
    ['testScores', profile.testScores.length ? true : undefined],
  ] as const;
  const missing = checks
    .filter(([, value]) => value === undefined || value === '')
    .map(([name]) => name);
  return {
    complete: checks.length - missing.length,
    total: checks.length,
    missing,
  };
}

function rule(
  id: string,
  status: RuleStatus,
  explanation: string,
  requirement: string,
  sourceUrl: string | null,
  verification: Verification,
  now: string,
  mandatory = true,
): RuleResult {
  return {
    id,
    status,
    explanation,
    requirement,
    sourceUrl,
    verification,
    evaluatedAt: now,
    mandatory,
  };
}

export function evaluate(
  candidate: Candidate,
  profile: MatchingProfile,
  preferences: MatchingPreferences,
  now: string,
): { eligibility: Eligibility; rules: RuleResult[] } {
  const rules: RuleResult[] = [];
  if (candidate.sourceVerification !== 'verified')
    rules.push(
      rule(
        'catalog_source',
        'UNKNOWN',
        'The catalog source is stale, unverified or conflicting.',
        'Catalog provenance',
        candidate.sourceUrl,
        candidate.sourceVerification,
        now,
      ),
    );
  const checkedAt = new Date(candidate.deadlineCheckedAt ?? '').getTime();
  const evaluatedAt = new Date(now).getTime();
  const deadlineAt = candidate.deadlineAt
    ? new Date(candidate.deadlineAt).getTime()
    : NaN;
  const deadlineVerified =
    candidate.deadlineVerification === 'verified' &&
    Boolean(candidate.deadlineSourceUrl?.startsWith('https://')) &&
    Number.isFinite(deadlineAt) &&
    Number.isFinite(evaluatedAt) &&
    Number.isFinite(checkedAt) &&
    checkedAt <= evaluatedAt &&
    evaluatedAt - checkedAt <= 180 * 86400000;
  rules.push(
    rule(
      'deadline',
      !deadlineVerified || !candidate.deadlineAt
        ? 'UNKNOWN'
        : deadlineAt < evaluatedAt
          ? 'NOT_MET'
          : 'MET',
      !candidate.deadlineAt
        ? 'No verified application deadline is available.'
        : !deadlineVerified
          ? 'Deadline source needs a fresh review.'
          : deadlineAt < evaluatedAt
            ? 'The listed application deadline has passed.'
            : 'The listed application deadline has not passed.',
      candidate.deadlineAt ?? 'Application deadline',
      candidate.deadlineSourceUrl,
      deadlineVerified ? 'verified' : candidate.deadlineVerification,
      now,
    ),
  );

  if (!candidate.requirements.length)
    rules.push(
      rule(
        'requirements_coverage',
        'UNKNOWN',
        'No machine-readable verified admissions requirements are available.',
        'Admissions requirements',
        candidate.sourceUrl,
        'unverified',
        now,
      ),
    );

  for (const requirement of candidate.requirements) {
    const base = `requirement:${requirement.id}`;
    const trusted =
      requirement.verification === 'verified' && Boolean(requirement.sourceUrl);
    const add = (suffix: string, status: RuleStatus, explanation: string) =>
      rules.push(
        rule(
          `${base}:${suffix}`,
          trusted ? status : 'UNKNOWN',
          trusted
            ? explanation
            : 'This requirement has no current verified official evidence.',
          requirement.title,
          requirement.sourceUrl,
          requirement.verification,
          now,
          requirement.mandatory,
        ),
      );
    let interpreted = false;
    const countryRules = [
      [
        'citizenship',
        profile.nationality,
        requirement.allowedCitizenships,
        requirement.excludedCitizenships,
      ],
      [
        'residency',
        profile.residency,
        requirement.allowedResidencies,
        requirement.excludedResidencies,
      ],
    ] as const;
    for (const [kind, actual, allowed, excluded] of countryRules) {
      if (!allowed?.length && !excluded?.length) continue;
      interpreted = true;
      const status = !actual
        ? 'UNKNOWN'
        : excluded?.includes(actual) ||
            (allowed?.length && !allowed.includes(actual))
          ? 'NOT_MET'
          : 'MET';
      add(
        kind,
        status,
        !actual
          ? `${kind} is missing from your profile.`
          : status === 'MET'
            ? `${kind} matches the listed condition.`
            : `${kind} does not match the listed condition.`,
      );
    }
    for (const required of requirement.tests ?? []) {
      interpreted = true;
      const matchingScores = profile.testScores.filter(
        (test) => test.code === required.code,
      );
      const actual = matchingScores[0];
      const status = !actual
        ? 'UNKNOWN'
        : matchingScores.length !== 1 ||
            requirement.ambiguousTests ||
            required.unsupportedComponents
          ? 'UNKNOWN'
          : !actual.verified
            ? 'UNKNOWN'
            : actual.expiresOn && actual.expiresOn < now.slice(0, 10)
              ? 'NOT_MET'
              : (required.minimum !== null &&
                    actual.score < required.minimum) ||
                  (required.maximum !== null && actual.score > required.maximum)
                ? 'NOT_MET'
                : 'MET';
      add(
        `test:${required.code}`,
        status,
        matchingScores.length > 1 ||
          requirement.ambiguousTests ||
          required.unsupportedComponents
          ? 'Duplicate scores, alternative tests or component thresholds need manual review.'
          : !actual
            ? `${required.code} score is missing.`
            : status === 'UNKNOWN'
              ? `${required.code} score has not been verified.`
              : status === 'MET'
                ? `${required.code} score meets the listed threshold.`
                : `${required.code} score is expired or outside the listed threshold.`,
      );
    }
    if (requirement.priorDegree) {
      interpreted = true;
      const status = !profile.educationLevel
        ? 'UNKNOWN'
        : profile.educationLevel === requirement.priorDegree
          ? 'MET'
          : 'NOT_MET';
      add(
        'prior_degree',
        status,
        !profile.educationLevel
          ? 'Prior education level is missing.'
          : status === 'MET'
            ? 'Prior education level matches.'
            : 'Prior education level does not match.',
      );
    }
    if (requirement.minimumGpa) {
      interpreted = true;
      const status =
        profile.gpa === undefined ||
        profile.gpaScale === undefined ||
        profile.gpaScale !== requirement.minimumGpa.scale
          ? 'UNKNOWN'
          : profile.gpa >= requirement.minimumGpa.value
            ? 'MET'
            : 'NOT_MET';
      add(
        'gpa',
        status,
        status === 'UNKNOWN'
          ? 'GPA is missing or uses a grading scale that cannot be compared safely.'
          : status === 'MET'
            ? 'GPA meets the listed threshold.'
            : 'GPA is below the listed threshold.',
      );
    }
    if (!interpreted)
      add(
        'unstructured',
        'UNKNOWN',
        'This requirement is published as text and needs manual review.',
      );
  }

  if (candidate.entityType === 'scholarship') {
    const linked = candidate.linkedProgramIds ?? [];
    const status = 'UNKNOWN';
    rules.push(
      rule(
        'scholarship_program_link',
        status,
        linked.length
          ? 'A program link exists, but student compatibility still needs review.'
          : 'No verified program link is available for this scholarship.',
        'Program compatibility',
        candidate.sourceUrl,
        'verified',
        now,
      ),
    );
    if (preferences.fundingRequired && candidate.coverage.length === 0)
      rules.push(
        rule(
          'funding_coverage',
          'UNKNOWN',
          'Funding components have not been verified.',
          'Funding coverage',
          candidate.sourceUrl,
          'unverified',
          now,
          false,
        ),
      );
  }
  const mandatory = rules.filter((item) => item.mandatory);
  const unmet = mandatory.some((item) => item.status === 'NOT_MET');
  const met = mandatory.some((item) => item.status === 'MET');
  const unknown = mandatory.some((item) => item.status === 'UNKNOWN');
  return {
    eligibility: unmet
      ? 'not_eligible'
      : !met
        ? 'insufficient_information'
        : unknown
          ? 'potentially_eligible'
          : 'eligible',
    rules,
  };
}

export function rank(
  candidate: Candidate,
  profile: MatchingProfile,
  prefs: MatchingPreferences,
) {
  const reasons: string[] = [];
  let earned = 0;
  let assessed = 0;
  function factor(
    weight: number,
    known: boolean,
    matches: boolean,
    reason: string,
  ) {
    if (!known) return;
    assessed += weight;
    if (matches) {
      earned += weight;
      reasons.push(reason);
    }
  }
  const majors = prefs.majors.length
    ? prefs.majors
    : profile.field
      ? [profile.field]
      : [];
  factor(
    weights.major,
    majors.length > 0 && Boolean(candidate.major),
    majors.some((value) =>
      candidate.major?.toLowerCase().includes(value.toLowerCase()),
    ),
    'Preferred field matches.',
  );
  factor(
    weights.country,
    prefs.countries.length > 0 && Boolean(candidate.country),
    prefs.countries.includes(candidate.country ?? ''),
    'Preferred country matches.',
  );
  factor(
    weights.language,
    prefs.languages.length > 0 && candidate.languages.length > 0,
    prefs.languages.some((value) => candidate.languages.includes(value)),
    'Preferred teaching language matches.',
  );
  const levels = prefs.levels.length
    ? prefs.levels
    : profile.studyLevel
      ? [profile.studyLevel.toLowerCase()]
      : [];
  factor(
    weights.degree,
    levels.length > 0 && Boolean(candidate.degree),
    levels.includes(candidate.degree ?? ''),
    'Preferred degree level matches.',
  );
  factor(
    weights.funding,
    prefs.fundingRequired &&
      candidate.entityType === 'scholarship' &&
      candidate.coverage.length > 0,
    candidate.coverage.includes('tuition'),
    'Source-backed tuition funding is listed.',
  );
  factor(
    weights.budget,
    profile.budget !== undefined &&
      candidate.costVerified &&
      candidate.costAmount !== null &&
      candidate.costCurrency === 'USD' &&
      candidate.costPeriod === 'academic_year',
    candidate.costAmount !== null &&
      profile.budget !== undefined &&
      candidate.costAmount <= profile.budget,
    'Listed annual tuition is within the stated budget; living costs are separate.',
  );
  return {
    preferenceScore: assessed ? earned : null,
    assessedWeight: assessed,
    preferenceReasons: reasons,
  };
}

export function recommend(
  candidates: Candidate[],
  profile: MatchingProfile,
  preferences: MatchingPreferences,
  now: string,
): Recommendation[] {
  const priority: Record<Eligibility, number> = {
    eligible: 0,
    potentially_eligible: 1,
    insufficient_information: 2,
    not_eligible: 3,
  };
  const uniqueCandidates = [
    ...new Map(
      candidates.map((candidate) => [
        `${candidate.entityType}:${candidate.id}`,
        candidate,
      ]),
    ).values(),
  ];
  return uniqueCandidates
    .map((candidate) => ({
      candidate,
      ...evaluate(candidate, profile, preferences, now),
      ...rank(candidate, profile, preferences),
    }))
    .sort(
      (a, b) =>
        priority[a.eligibility] - priority[b.eligibility] ||
        (b.preferenceScore ?? -1) - (a.preferenceScore ?? -1) ||
        b.assessedWeight - a.assessedWeight ||
        a.candidate.entityType.localeCompare(b.candidate.entityType) ||
        a.candidate.id - b.candidate.id,
    );
}
