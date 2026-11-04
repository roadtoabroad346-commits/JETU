import { describe, expect, it } from 'vitest';
import {
  formatTemplate,
  onboardingCopy,
} from '../../src/features/onboarding/copy';
import {
  EDUCATION_LEVELS,
  FIELD_NAMES,
  STEP_FIELDS,
  STEPS,
  STUDY_LEVELS,
  TEST_CODES,
  TEST_RANGE,
  progressFraction,
  validateAll,
  validateField,
  validateStep,
  type WizardValues,
} from '../../src/features/onboarding/steps';

function baseValues(): WizardValues {
  return {
    country: '',
    studyLevel: '',
    field: '',
    budget: '',
    nationality: '',
    residency: '',
    educationLevel: '',
    graduationYear: '',
    gpa: '',
    gpaScale: '',
    ielts: '',
    toefl: '',
    hsk: '',
    topik: '',
    sat: '',
    act: '',
  };
}

const firstKey = (
  field: Parameters<typeof validateField>[0],
  values: WizardValues,
): string | undefined => validateField(field, values)[0]?.key;

describe('onboarding wizard steps model', () => {
  it('keys mirror the server action contract', () => {
    expect(FIELD_NAMES).toEqual([
      'country',
      'studyLevel',
      'field',
      'budget',
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
    ]);
    expect(STUDY_LEVELS).toEqual([
      'foundation',
      'associate',
      'bachelor',
      'master',
      'doctorate',
    ]);
    expect(EDUCATION_LEVELS).toEqual([
      'secondary',
      'bachelor',
      'master',
      'other',
    ]);
    expect(Object.keys(TEST_RANGE)).toEqual([...TEST_CODES]);
    expect(STEP_FIELDS.review).toEqual([]);
  });

  it('requires the four about-step answers with server limits', () => {
    const values = baseValues();
    expect(validateStep('about', values).map((issue) => issue.field)).toEqual([
      'country',
      'studyLevel',
      'field',
      'budget',
    ]);
    values.country = 'Kazakhstan';
    values.studyLevel = 'bachelor';
    values.field = 'Computer Science';
    values.budget = '12 000'.replace(' ', '');
    expect(validateStep('about', values)).toEqual([]);
    values.field = 'x';
    expect(firstKey('field', values)).toBe('textShort');
    values.field = 'a'.repeat(121);
    expect(firstKey('field', values)).toBe('textLong');
  });

  it('budget must be a whole non-negative number under the cap', () => {
    expect(firstKey('budget', { ...baseValues(), budget: '' })).toBe(
      'required',
    );
    expect(
      firstKey('budget', { ...baseValues(), budget: '12000' }),
    ).toBeUndefined();
    expect(firstKey('budget', { ...baseValues(), budget: '-1' })).toBe(
      'budget',
    );
    expect(firstKey('budget', { ...baseValues(), budget: '12.5' })).toBe(
      'budget',
    );
    expect(firstKey('budget', { ...baseValues(), budget: '1000001' })).toBe(
      'budget',
    );
    expect(
      firstKey('budget', { ...baseValues(), budget: '1000000' }),
    ).toBeUndefined();
  });

  it('country codes accept two letters in any case and nothing else', () => {
    expect(
      firstKey('nationality', { ...baseValues(), nationality: 'KZ' }),
    ).toBeUndefined();
    expect(
      firstKey('nationality', { ...baseValues(), nationality: 'kz' }),
    ).toBeUndefined();
    expect(firstKey('nationality', { ...baseValues(), nationality: 'K' })).toBe(
      'code',
    );
    expect(
      firstKey('nationality', { ...baseValues(), nationality: '12' }),
    ).toBe('code');
    expect(
      firstKey('nationality', { ...baseValues(), nationality: 'KZA' }),
    ).toBe('code');
    expect(
      firstKey('residency', { ...baseValues(), residency: '' }),
    ).toBeUndefined();
  });

  it('education level allows the four known values or empty', () => {
    expect(
      firstKey('educationLevel', { ...baseValues(), educationLevel: '' }),
    ).toBeUndefined();
    for (const level of EDUCATION_LEVELS) {
      expect(
        firstKey('educationLevel', { ...baseValues(), educationLevel: level }),
      ).toBeUndefined();
    }
    expect(
      firstKey('educationLevel', { ...baseValues(), educationLevel: 'phd' }),
    ).toBe('code');
  });

  it('graduation year follows the server window', () => {
    expect(
      firstKey('graduationYear', { ...baseValues(), graduationYear: '' }),
    ).toBeUndefined();
    expect(
      firstKey('graduationYear', { ...baseValues(), graduationYear: '2027' }),
    ).toBeUndefined();
    expect(
      firstKey('graduationYear', { ...baseValues(), graduationYear: '1949' }),
    ).toBe('year');
    expect(
      firstKey('graduationYear', { ...baseValues(), graduationYear: '2201' }),
    ).toBe('year');
    expect(
      firstKey('graduationYear', { ...baseValues(), graduationYear: '20.5' }),
    ).toBe('year');
  });

  it('GPA pair rules match the shared refine', () => {
    expect(firstKey('gpa', baseValues())).toBeUndefined();
    expect(firstKey('gpa', { ...baseValues(), gpa: '3.8' })).toBe('gpaPair');
    expect(firstKey('gpaScale', { ...baseValues(), gpaScale: '4' })).toBe(
      'gpaPair',
    );
    expect(
      firstKey('gpa', { ...baseValues(), gpa: '3.8', gpaScale: '4' }),
    ).toBeUndefined();
    expect(
      firstKey('gpa', { ...baseValues(), gpa: '4.5', gpaScale: '4' }),
    ).toBe('gpaLess');
    expect(
      firstKey('gpa', { ...baseValues(), gpa: '101', gpaScale: '110' }),
    ).toBe('gpaValue');
    expect(
      firstKey('gpaScale', { ...baseValues(), gpa: '3.8', gpaScale: '0' }),
    ).toBe('gpaScale');
    expect(
      firstKey('gpaScale', { ...baseValues(), gpa: '3.8', gpaScale: '101' }),
    ).toBe('gpaScale');
  });

  it('self-reported scores follow each per-test window', () => {
    expect(firstKey('ielts', { ...baseValues(), ielts: '9' })).toBeUndefined();
    expect(firstKey('ielts', { ...baseValues(), ielts: '9.5' })).toBe(
      'scoreRange',
    );
    expect(firstKey('sat', { ...baseValues(), sat: '400' })).toBeUndefined();
    expect(firstKey('sat', { ...baseValues(), sat: '300' })).toBe('scoreRange');
    expect(firstKey('sat', { ...baseValues(), sat: '1600' })).toBeUndefined();
    expect(firstKey('sat', { ...baseValues(), sat: '1601' })).toBe(
      'scoreRange',
    );
    expect(firstKey('act', { ...baseValues(), act: '0' })).toBe('scoreRange');
    expect(firstKey('act', { ...baseValues(), act: '36' })).toBeUndefined();
    expect(firstKey('topik', { ...baseValues(), topik: '6' })).toBeUndefined();
    expect(firstKey('topik', { ...baseValues(), topik: '7' })).toBe(
      'scoreRange',
    );
  });

  it('validateAll gates the review step and progress reaches one', () => {
    const complete = {
      ...baseValues(),
      country: 'Kazakhstan',
      studyLevel: 'bachelor',
      field: 'Data systems',
      budget: '12000',
      nationality: 'KZ',
      residency: 'KZ',
      educationLevel: 'secondary',
      graduationYear: '2024',
      gpa: '3.8',
      gpaScale: '4',
      ielts: '7.5',
    } satisfies WizardValues;
    expect(validateAll(complete)).toEqual([]);
    expect(progressFraction(STEPS[0]!)).toBe(0);
    expect(progressFraction(STEPS[STEPS.length - 1]!)).toBe(1);
  });

  it('copy dictionaries stay key-complete across locales', () => {
    const keysFrom = (locale: keyof typeof onboardingCopy) =>
      Object.keys(onboardingCopy[locale]);
    expect(keysFrom('ru')).toEqual(keysFrom('en'));
    expect(keysFrom('kk')).toEqual(keysFrom('ru'));
    const errorKeys = Object.keys(onboardingCopy.en.errorKeys);
    expect(Object.keys(onboardingCopy.ru.errorKeys)).toEqual(errorKeys);
    expect(Object.keys(onboardingCopy.kk.errorKeys)).toEqual(errorKeys);
  });

  it('formatTemplate fills placeholders and keeps unknowns', () => {
    expect(
      formatTemplate(onboardingCopy.ru.progressLabel, {
        n: '2',
        m: '5',
        name: onboardingCopy.ru.stepNames.scores,
      }),
    ).toBe('Шаг 2 из 5: Экзамены');
    expect(formatTemplate('no tokens', {})).toBe('no tokens');
    expect(formatTemplate('{missing}', {})).toBe('{missing}');
  });
});
