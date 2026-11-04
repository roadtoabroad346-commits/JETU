// Pure profile-wizard model shared by the client component and unit tests.
// Compatibility field names/ranges for the original all-fields questionnaire.
// The authoritative shared server schema is now onboarding/model.ts; the main
// journey supports additional school-stage and unknown-budget states. These
// helpers retain the original form's client feedback and never authorize a save.

export const STUDY_LEVELS = [
  'foundation',
  'associate',
  'bachelor',
  'master',
  'doctorate',
] as const;

export const EDUCATION_LEVELS = [
  'secondary',
  'bachelor',
  'master',
  'other',
] as const;

export const TEST_CODES = [
  'IELTS',
  'TOEFL',
  'HSK',
  'TOPIK',
  'SAT',
  'ACT',
] as const;

export const TEST_RANGE: Record<
  (typeof TEST_CODES)[number],
  { min: number; max: number }
> = {
  IELTS: { min: 0, max: 9 },
  TOEFL: { min: 0, max: 120 },
  HSK: { min: 0, max: 300 },
  TOPIK: { min: 0, max: 6 },
  // The server coerce schema starts SAT at 400 and ACT at 1.
  SAT: { min: 400, max: 1600 },
  ACT: { min: 1, max: 36 },
};

export const FIELD_NAMES = [
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
] as const;

export type FieldName = (typeof FIELD_NAMES)[number];

export type WizardValues = Record<FieldName, string>;

export type ErrorKey =
  | 'required'
  | 'textShort'
  | 'textLong'
  | 'budget'
  | 'code'
  | 'year'
  | 'gpaPair'
  | 'gpaValue'
  | 'gpaScale'
  | 'gpaLess'
  | 'scoreRange';

export type FieldIssue = { field: FieldName; key: ErrorKey };

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function isBlank(value: string): boolean {
  return value.trim() === '';
}

// Step order and members. Names/ids stay identical to the server form keys so
// the same server action, merge logic and readiness checks accept the data.
export const STEPS = [
  'about',
  'background',
  'academics',
  'scores',
  'review',
] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_FIELDS: Record<StepId, readonly FieldName[]> = {
  about: ['country', 'studyLevel', 'field', 'budget'],
  background: ['nationality', 'residency', 'educationLevel', 'graduationYear'],
  academics: ['gpa', 'gpaScale'],
  scores: TEST_CODES.map((code) => testFieldName(code)) as readonly FieldName[],
  review: [],
};

function testFieldName(code: (typeof TEST_CODES)[number]): FieldName {
  return code.toLowerCase() as FieldName;
}

export function validateField(
  field: FieldName,
  values: WizardValues,
): FieldIssue[] {
  const value = values[field] ?? '';
  const issue = (key: ErrorKey): FieldIssue => ({ field, key });
  switch (field) {
    case 'country':
      if (isBlank(value)) return [issue('required')];
      if (value.trim().length < 2) return [issue('textShort')];
      if (value.trim().length > 80) return [issue('textLong')];
      return [];
    case 'field':
      if (isBlank(value)) return [issue('required')];
      if (value.trim().length < 2) return [issue('textShort')];
      if (value.trim().length > 120) return [issue('textLong')];
      return [];
    case 'studyLevel':
      return STUDY_LEVELS.includes(value as (typeof STUDY_LEVELS)[number])
        ? []
        : [issue('required')];
    case 'budget': {
      if (isBlank(value)) return [issue('required')];
      const budget = parseNumber(value);
      // Server stores an integer USD amount.
      if (
        budget === null ||
        !Number.isInteger(budget) ||
        budget < 0 ||
        budget > 1_000_000
      )
        return [issue('budget')];
      return [];
    }
    case 'nationality':
    case 'residency':
      // The server stores a trimmed uppercased two-letter country code, so any
      // two-letter alphabetic entry converts cleanly.
      if (isBlank(value)) return [];
      if (!/^[A-Za-z]{2}$/.test(value.trim())) return [issue('code')];
      return [];
    case 'educationLevel':
      if (isBlank(value)) return [];
      return EDUCATION_LEVELS.includes(
        value as (typeof EDUCATION_LEVELS)[number],
      )
        ? []
        : [issue('code')];
    case 'graduationYear': {
      if (isBlank(value)) return [];
      const year = parseNumber(value);
      if (
        year === null ||
        !Number.isInteger(year) ||
        year < 1950 ||
        year > 2200
      )
        return [issue('year')];
      return [];
    }
    case 'gpa': {
      if (isBlank(value) && isBlank(values.gpaScale ?? '')) return [];
      if (!isBlank(value) && isBlank(values.gpaScale ?? ''))
        return [issue('gpaPair')];
      const gpa = parseNumber(value);
      if (gpa === null) return [issue('gpaPair')];
      if (gpa < 0 || gpa > 100) return [issue('gpaValue')];
      const scale = parseNumber(values.gpaScale ?? '');
      if (scale !== null && gpa > scale) return [issue('gpaLess')];
      return [];
    }
    case 'gpaScale': {
      if (isBlank(value) && isBlank(values.gpa ?? '')) return [];
      if (isBlank(value)) return [issue('gpaPair')];
      const scale = parseNumber(value);
      if (scale === null || scale <= 0 || scale > 100)
        return [issue('gpaScale')];
      if (isBlank(values.gpa ?? '')) return [issue('gpaPair')];
      const gpa = parseNumber(values.gpa ?? '');
      if (gpa !== null && gpa > scale) return [issue('gpaScale')];
      return [];
    }
    default: {
      // Test score fields: optional, but any value must sit in the range.
      const code = field.toUpperCase() as (typeof TEST_CODES)[number];
      const range = TEST_RANGE[code];
      if (isBlank(value)) return [];
      const score = parseNumber(value);
      if (score === null || score < range.min || score > range.max)
        return [issue('scoreRange')];
      return [];
    }
  }
}

export function validateStep(step: StepId, values: WizardValues): FieldIssue[] {
  return STEP_FIELDS[step].flatMap((field) => validateField(field, values));
}

export function validateAll(values: WizardValues): FieldIssue[] {
  return FIELD_NAMES.flatMap((field) => validateField(field, values));
}

/** 0 for the first step, 1 for the final (review) step. */
export function progressFraction(step: StepId): number {
  const index = STEPS.indexOf(step);
  return index / (STEPS.length - 1);
}
