import type { Locale } from '@/lib/i18n/messages';

const formTestCodes = ['IELTS', 'TOEFL', 'HSK', 'TOPIK', 'SAT', 'ACT'] as const;

/** Preserve independent profile fields when the onboarding form saves its own fields. */
export function mergeProfileDocument(
  previous: unknown,
  input: Record<string, string | number>,
  locale: Locale,
) {
  const before =
    previous && typeof previous === 'object' && !Array.isArray(previous)
      ? (previous as Record<string, unknown>)
      : {};
  const merged = { ...before };
  const testScores = Array.isArray(before.testScores)
    ? before.testScores.filter(
        (item: unknown) =>
          item &&
          typeof item === 'object' &&
          'code' in item &&
          typeof item.code === 'string' &&
          !formTestCodes.includes(
            item.code.toUpperCase() as (typeof formTestCodes)[number],
          ),
      )
    : [];
  for (const [key, value] of Object.entries(input)) {
    const code = key.toUpperCase();
    if (formTestCodes.includes(code as (typeof formTestCodes)[number])) {
      if (value !== '')
        testScores.push({ code, score: Number(value), verified: false });
    } else if (value === '') delete merged[key];
    else merged[key] = value;
  }
  return { ...merged, testScores, consent: { accepted: true }, locale };
}
