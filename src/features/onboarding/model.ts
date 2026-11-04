import { z } from 'zod';

const optionalNumber = (min: number, max: number) =>
  z
    .union([z.literal(''), z.coerce.number().finite().min(min).max(max)])
    .default('');
const countryCode = z
  .union([
    z.literal(''),
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/),
  ])
  .default('');

export const profileFormSchema = z
  .object({
    country: z.string().trim().min(2).max(80),
    studyLevel: z.enum([
      'foundation',
      'associate',
      'bachelor',
      'master',
      'doctorate',
    ]),
    field: z.string().trim().min(2).max(120),
    budget: z
      .union([z.literal(''), z.coerce.number().int().min(0).max(1_000_000)])
      .default(''),
    grade: z
      .enum(['', '8', '9', '10', '11', '12', 'graduate', 'university', 'other'])
      .default(''),
    nationality: countryCode,
    residency: countryCode,
    educationLevel: z
      .enum(['', 'secondary', 'bachelor', 'master', 'other'])
      .default(''),
    graduationYear: z
      .union([z.literal(''), z.coerce.number().int().min(1950).max(2200)])
      .default(''),
    gpa: optionalNumber(0, 100),
    gpaScale: z
      .union([z.literal(''), z.coerce.number().positive().max(100)])
      .default(''),
    ielts: optionalNumber(0, 9),
    toefl: optionalNumber(0, 120),
    hsk: optionalNumber(0, 300),
    topik: optionalNumber(0, 6),
    sat: optionalNumber(400, 1600),
    act: optionalNumber(1, 36),
  })
  .refine(
    (value) =>
      (value.gpa === '') === (value.gpaScale === '') &&
      (value.gpa === '' ||
        value.gpaScale === '' ||
        value.gpa <= value.gpaScale),
    {
      path: ['gpa'],
      message: 'Enter both GPA and its scale; GPA cannot exceed the scale.',
    },
  );

export type ProfileValues = Record<
  keyof z.infer<typeof profileFormSchema>,
  string
>;
export type ProfileSaveState = {
  status: 'idle' | 'error' | 'saved';
  error?: 'invalid' | 'unavailable' | 'conflict' | 'session';
  fields?: string[];
  version?: number;
};
export const initialProfileState: ProfileSaveState = { status: 'idle' };
export const stepFields = [
  ['country', 'grade', 'nationality', 'residency'],
  ['studyLevel', 'field'],
  [
    'educationLevel',
    'graduationYear',
    'gpa',
    'gpaScale',
    'ielts',
    'toefl',
    'hsk',
    'topik',
    'sat',
    'act',
  ],
  ['budget'],
  [],
] as const;

/** Read only known form fields; never assume owner-writable JSON has a safe shape. */
export function profileFormValues(document: unknown): ProfileValues {
  const source =
    document && typeof document === 'object' && !Array.isArray(document)
      ? (document as Record<string, unknown>)
      : {};
  const scores = Array.isArray(source.testScores) ? source.testScores : [];
  const keys = [
    'country',
    'studyLevel',
    'field',
    'budget',
    'grade',
    'nationality',
    'residency',
    'educationLevel',
    'graduationYear',
    'gpa',
    'gpaScale',
    'ielts',
    'toefl',
    'hsk',
    'topik',
    'sat',
    'act',
  ] as const;
  return Object.fromEntries(
    keys.map((key) => {
      const test = scores.find(
        (item: unknown) =>
          item &&
          typeof item === 'object' &&
          'code' in item &&
          item.code === key.toUpperCase(),
      );
      const value =
        test && typeof test === 'object' && 'score' in test
          ? test.score
          : source[key];
      return [
        key,
        typeof value === 'string' ||
        (typeof value === 'number' && Number.isFinite(value))
          ? String(value)
          : '',
      ];
    }),
  ) as ProfileValues;
}

export const accountSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
});
export const registrationSchema = accountSchema.extend({
  name: z.string().trim().min(2).max(80),
  terms: z.literal('on'),
  age: z.literal('on'),
});
export type AccountState = {
  status: 'idle' | 'error' | 'check-email';
  error?: 'invalid' | 'credentials' | 'unavailable' | 'rate';
  fields?: string[];
};
export const initialAccountState: AccountState = { status: 'idle' };
export const privacyVersion = '2026-11-04';
