import { describe, expect, it } from 'vitest';
import {
  profileFormSchema,
  profileFormValues,
  registrationSchema,
} from '@/features/onboarding/model';
import { mergeProfileDocument } from '@/features/matching/profile';

const minimal = {
  country: 'Kazakhstan',
  studyLevel: 'bachelor',
  field: 'Computer Science',
};

describe('student journey data contracts', () => {
  it('distinguishes unknown budget from zero and accepts omitted academic results', () => {
    const unknown = profileFormSchema.parse(minimal);
    expect(unknown.budget).toBe('');
    expect(unknown.gpa).toBe('');
    expect(profileFormSchema.parse({ ...minimal, budget: '0' }).budget).toBe(0);
    expect(
      profileFormSchema.safeParse({ ...minimal, budget: '-1' }).success,
    ).toBe(false);
    expect(
      profileFormSchema.safeParse({ ...minimal, budget: '1000001' }).success,
    ).toBe(false);
  });
  it('never infers age, citizenship or completed education from school grade', () => {
    const value = profileFormSchema.parse({ ...minimal, grade: '11' });
    expect(value.educationLevel).toBe('');
    expect(value.nationality).toBe('');
    expect(value).not.toHaveProperty('age');
  });
  it('requires a consistent GPA and scale and bounded exam scores', () => {
    for (const extra of [
      { gpa: 4.8 },
      { gpa: 6, gpaScale: 5 },
      { ielts: 10 },
      { graduationYear: 2026.5 },
    ]) {
      expect(
        profileFormSchema.safeParse({ ...minimal, ...extra }).success,
      ).toBe(false);
    }
    expect(
      profileFormSchema.parse({ ...minimal, gpa: 4.8, gpaScale: 5, ielts: 7.5 })
        .ielts,
    ).toBe(7.5);
  });
  it('reads old profiles and ignores unsafe JSON field shapes', () => {
    const values = profileFormValues({
      ...minimal,
      budget: 0,
      testScores: [{ code: 'IELTS', score: 7 }],
      nationality: { unknown: true },
      country: ['unsafe'],
    });
    expect(values.budget).toBe('0');
    expect(values.ielts).toBe('7');
    expect(values.country).toBe('');
    expect(values.nationality).toBe('');
    expect(profileFormValues(null).field).toBe('');
  });
  it('preserves independent fields and consent while removing an unknown budget', () => {
    const consent = {
      privacyVersion: '2026-11-04',
      acceptedAt: '2026-11-04T10:00:00Z',
    };
    const merged = mergeProfileDocument(
      { budget: 10000, languages: ['kk'], consent },
      profileFormSchema.parse(minimal),
      'ru',
    );
    expect(merged).not.toHaveProperty('budget');
    expect(merged).toHaveProperty('languages', ['kk']);
    expect(merged).toHaveProperty('consent', consent);
    expect(
      mergeProfileDocument({}, profileFormSchema.parse(minimal), 'en'),
    ).not.toHaveProperty('consent');
  });
  it('requires active registration declarations and rejects excessive passwords', () => {
    const account = {
      name: 'Student',
      email: 'student@example.invalid',
      password: 'a long passphrase',
      age: 'on',
      terms: 'on',
    };
    expect(registrationSchema.safeParse(account).success).toBe(true);
    expect(
      registrationSchema.safeParse({ ...account, terms: undefined }).success,
    ).toBe(false);
    expect(
      registrationSchema.safeParse({ ...account, age: undefined }).success,
    ).toBe(false);
    expect(
      registrationSchema.safeParse({ ...account, password: 'x'.repeat(129) })
        .success,
    ).toBe(false);
  });
});
