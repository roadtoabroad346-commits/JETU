import { describe, expect, it } from 'vitest';
import {
  evaluate,
  matchingProfileSchema,
  profileReadiness,
  rank,
  recommend,
  type Candidate,
  type MatchingProfile,
  type MatchingPreferences,
} from '@/features/matching/engine';
import { mergeProfileDocument } from '@/features/matching/profile';
import { formatMatchingDate } from '@/features/matching/localized';

const now = '2026-10-25T10:00:00.000Z';
const profile: MatchingProfile = {
  nationality: 'KZ',
  educationLevel: 'secondary',
  studyLevel: 'bachelor',
  field: 'Computer Science',
  budget: 10000,
  languages: ['en'],
  testScores: [],
};
const prefs: MatchingPreferences = {
  countries: ['DE'],
  majors: ['Computer Science'],
  levels: ['bachelor'],
  languages: ['en'],
  fundingRequired: false,
};
const candidate: Candidate = {
  entityType: 'program',
  id: 1,
  detailPath: '/programs/1',
  title: 'Computer Science',
  subtitle: 'University',
  country: 'DE',
  degree: 'bachelor',
  major: 'Computer Science',
  languages: ['en'],
  costAmount: null,
  costCurrency: null,
  costPeriod: null,
  costVerified: false,
  fundingLabel: null,
  coverage: [],
  deadlineAt: null,
  deadlineVerification: 'unverified',
  deadlineSourceUrl: null,
  deadlineCheckedAt: null,
  sourceUrl: 'https://example.edu/admissions',
  sourceCheckedAt: '2026-10-01T00:00:00Z',
  sourceVerification: 'verified',
  requirements: [],
};

describe('matching date display', () => {
  it('does not crash or display an invalid deadline', () => {
    expect(formatMatchingDate('invalid-date', 'en')).toBeNull();
    expect(formatMatchingDate(null, 'en')).toBeNull();
    expect(formatMatchingDate('2026-10-25T00:00:00Z', 'en')).toContain('2026');
  });
});
const requirement = {
  id: 7,
  title: 'Nationality',
  description: 'Kazakhstan citizens',
  type: 'citizenship',
  mandatory: true,
  sourceUrl: 'https://example.edu/admissions',
  verification: 'verified' as const,
  allowedCitizenships: ['KZ'],
};

describe('matching eligibility', () => {
  it('treats absent requirements and deadlines as insufficient information', () => {
    const result = evaluate(candidate, profile, prefs, now);
    expect(result.eligibility).toBe('insufficient_information');
    expect(result.rules.every((rule) => rule.status === 'UNKNOWN')).toBe(true);
  });
  it('blocks a known citizenship mismatch even with perfect preference fit', () => {
    const item = {
      ...candidate,
      requirements: [{ ...requirement, allowedCitizenships: ['US'] }],
    };
    expect(evaluate(item, profile, prefs, now).eligibility).toBe(
      'not_eligible',
    );
    expect(rank(item, profile, prefs).preferenceScore).toBe(65);
    expect(recommend([item], profile, prefs, now)[0]?.eligibility).toBe(
      'not_eligible',
    );
  });
  it('keeps missing, self-reported, expired and unconvertible test data separate from a proven pass', () => {
    const item = {
      ...candidate,
      requirements: [
        {
          ...requirement,
          tests: [
            {
              code: 'IELTS',
              minimum: 6.5,
              maximum: null,
              waiversAllowed: false,
              unsupportedComponents: false,
            },
          ],
        },
      ],
    };
    expect(
      evaluate(item, profile, prefs, now).rules.find(
        (rule) => rule.id === 'requirement:7:test:IELTS',
      )?.status,
    ).toBe('UNKNOWN');
    expect(
      evaluate(
        item,
        {
          ...profile,
          testScores: [{ code: 'IELTS', score: 7, verified: false }],
        },
        prefs,
        now,
      ).rules.find((rule) => rule.id === 'requirement:7:test:IELTS')?.status,
    ).toBe('UNKNOWN');
    expect(
      evaluate(
        item,
        {
          ...profile,
          testScores: [
            {
              code: 'IELTS',
              score: 7,
              expiresOn: '2026-01-01',
              verified: false,
            },
          ],
        },
        prefs,
        now,
      ).rules.find((rule) => rule.id === 'requirement:7:test:IELTS')?.status,
    ).toBe('UNKNOWN');
    expect(
      evaluate(
        item,
        {
          ...profile,
          testScores: [{ code: 'IELTS', score: 7, verified: true }],
        },
        prefs,
        now,
      ).rules.find((rule) => rule.id === 'requirement:7:test:IELTS')?.status,
    ).toBe('MET');
    expect(
      evaluate(
        item,
        {
          ...profile,
          testScores: [
            {
              code: 'IELTS',
              score: 7,
              expiresOn: '2026-01-01',
              verified: true,
            },
          ],
        },
        prefs,
        now,
      ).eligibility,
    ).toBe('not_eligible');
  });
  it('does not fail a user against unverified or conflicting source text', () => {
    const item = {
      ...candidate,
      requirements: [
        {
          ...requirement,
          verification: 'conflicted' as const,
          allowedCitizenships: ['US'],
        },
      ],
    };
    expect(
      evaluate(item, profile, prefs, now).rules.find(
        (rule) => rule.id === 'requirement:7:citizenship',
      )?.status,
    ).toBe('UNKNOWN');
  });
  it('checks a source-backed deadline independently', () => {
    const item = {
      ...candidate,
      requirements: [requirement],
      deadlineAt: '2026-10-24T23:59:00Z',
      deadlineVerification: 'verified' as const,
      deadlineSourceUrl: 'https://example.edu/deadline',
      deadlineCheckedAt: '2026-10-01T00:00:00Z',
    };
    expect(evaluate(item, profile, prefs, now).eligibility).toBe(
      'not_eligible',
    );
    expect(
      evaluate(
        { ...item, deadlineAt: '2026-11-01T23:59:00Z' },
        profile,
        prefs,
        now,
      ).eligibility,
    ).toBe('eligible');
  });
  it('does not treat a malformed sourced deadline as an open application', () => {
    const item = {
      ...candidate,
      requirements: [requirement],
      deadlineAt: 'invalid-date',
      deadlineVerification: 'verified' as const,
      deadlineSourceUrl: 'https://example.edu/deadline',
      deadlineCheckedAt: '2026-10-01T00:00:00Z',
    };
    expect(
      evaluate(item, profile, prefs, now).rules.find(
        (rule) => rule.id === 'deadline',
      )?.status,
    ).toBe('UNKNOWN');
  });
  it('requires manual resolution of duplicate exam scores', () => {
    const item = {
      ...candidate,
      requirements: [
        {
          ...requirement,
          tests: [
            {
              code: 'IELTS',
              minimum: 6.5,
              maximum: null,
              waiversAllowed: false,
              unsupportedComponents: false,
            },
          ],
        },
      ],
    };
    const result = evaluate(
      item,
      {
        ...profile,
        testScores: [
          { code: 'IELTS', score: 8, verified: true },
          { code: 'IELTS', score: 5, verified: true },
        ],
      },
      prefs,
      now,
    );
    expect(
      result.rules.find((rule) => rule.id === 'requirement:7:test:IELTS')
        ?.status,
    ).toBe('UNKNOWN');
  });
  it('never converts an unknown GPA scale into a pass or failure', () => {
    const item = {
      ...candidate,
      requirements: [{ ...requirement, minimumGpa: { value: 3.5, scale: 4 } }],
    };
    expect(
      evaluate(
        item,
        { ...profile, gpa: 90, gpaScale: 100 },
        prefs,
        now,
      ).rules.find((rule) => rule.id === 'requirement:7:gpa')?.status,
    ).toBe('UNKNOWN');
    expect(
      evaluate(item, { ...profile, gpa: 3.2, gpaScale: 4 }, prefs, now)
        .eligibility,
    ).toBe('not_eligible');
  });
  it('does not advertise a scholarship as eligible from a program link alone', () => {
    const item: Candidate = {
      ...candidate,
      entityType: 'scholarship',
      linkedProgramIds: [1],
      coverage: ['tuition'],
      requirements: [requirement],
    };
    expect(
      evaluate(item, profile, prefs, now).rules.find(
        (rule) => rule.id === 'scholarship_program_link',
      )?.status,
    ).toBe('UNKNOWN');
    expect(evaluate(item, profile, prefs, now).eligibility).toBe(
      'potentially_eligible',
    );
  });
  it('has deterministic scoring, tie breaking, and explicit assessed weight', () => {
    const first = { ...candidate, id: 2 };
    const second = { ...candidate, id: 1 };
    expect(rank(candidate, profile, prefs)).toMatchObject({
      preferenceScore: 65,
      assessedWeight: 65,
    });
    expect(
      recommend([first, second], profile, prefs, now).map(
        (item) => item.candidate.id,
      ),
    ).toEqual([1, 2]);
    expect(recommend([first, first], profile, prefs, now)).toHaveLength(1);
  });
  it('uses only sourced annual USD tuition for a budget preference', () => {
    const item = {
      ...candidate,
      costAmount: 9000,
      costCurrency: 'USD',
      costPeriod: 'academic_year',
      costVerified: true,
    };
    expect(rank(item, profile, prefs)).toMatchObject({
      preferenceScore: 85,
      assessedWeight: 85,
    });
    expect(
      rank({ ...item, costVerified: false }, profile, prefs),
    ).toMatchObject({ preferenceScore: 65, assessedWeight: 65 });
    expect(rank({ ...item, costAmount: 11000 }, profile, prefs)).toMatchObject({
      preferenceScore: 65,
      assessedWeight: 85,
    });
  });
  it('reports readiness without treating zero budget as missing', () => {
    expect(profileReadiness({ ...profile, budget: 0 }).missing).toContain(
      'testScores',
    );
    expect(profileReadiness({ ...profile, budget: 0 }).missing).not.toContain(
      'budget',
    );
  });
  it('rejects inconsistent GPA pairs loaded from a profile document', () => {
    expect(matchingProfileSchema.safeParse({ gpa: 3.8 }).success).toBe(false);
    expect(
      matchingProfileSchema.safeParse({ gpa: 5, gpaScale: 4 }).success,
    ).toBe(false);
  });
  it('preserves unrelated profile fields, clears removed optional fields and marks edited scores unverified', () => {
    const merged = mergeProfileDocument(
      {
        achievements: ['olympiad'],
        nationality: 'KZ',
        testScores: [
          { code: 'GRE', score: 320, verified: true },
          { code: 'IELTS', score: 8, verified: true },
        ],
      },
      { country: 'KZ', nationality: '', ielts: 7, toefl: '' },
      'en',
    );
    expect(merged).toMatchObject({
      achievements: ['olympiad'],
      country: 'KZ',
      locale: 'en',
    });
    expect(merged).not.toHaveProperty('nationality');
    expect(merged.testScores).toEqual([
      { code: 'GRE', score: 320, verified: true },
      { code: 'IELTS', score: 7, verified: false },
    ]);
  });
});
