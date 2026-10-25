import type { Metadata } from 'next';
import { Field } from '@/components/ui/primitives';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { saveProfile } from '../actions';
import { matchingCopy } from '@/features/matching/copy';
import { searchCopy } from '@/features/search/copy';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: authCopy[locale].onboardingTitle,
    robots: { index: false, follow: false },
  };
}
type ProfileDocument = {
  country?: string;
  studyLevel?: string;
  field?: string;
  budget?: number;
  nationality?: string;
  residency?: string;
  educationLevel?: string;
  graduationYear?: number;
  gpa?: number;
  gpaScale?: number;
  testScores?: { code: string; score: number }[];
};
export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const supabase = await createRequestSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = userData.user
    ? await supabase
        .from('student_profiles')
        .select('document')
        .eq('user_id', userData.user.id)
        .maybeSingle()
    : { data: null, error: null };
  const profile = (data?.document ?? {}) as ProfileDocument;
  const loadFailed = Boolean(error);
  const state = await searchParams;
  const t = authCopy[locale];
  const m = matchingCopy[locale];
  const testValue = (code: string) =>
    profile.testScores?.find((item) => item.code === code)?.score;
  return (
    <main id="main" tabIndex={-1} className="dashboard-main page-shell">
      <section className="profile-panel" aria-labelledby="profile-title">
        <p className="eyebrow">JETU / {t.onboarding}</p>
        <h1 id="profile-title">{t.onboardingTitle}</h1>
        <p className="auth-lead">{t.onboardingBody}</p>
        {loadFailed && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.profileLoadError}
          </p>
        )}
        {state.error && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.invalid}
          </p>
        )}
        {state.success && (
          <p className="feedback-box feedback-box--success" role="status">
            {t.saved}
          </p>
        )}
        <form action={saveProfile} className="profile-form">
          <input type="hidden" name="locale" value={locale} />
          <Field
            id="country"
            name="country"
            required
            minLength={2}
            maxLength={80}
            label={t.country}
            defaultValue={profile.country}
          />
          <label className="ui-field" htmlFor="studyLevel">
            <span>{t.studyLevel} *</span>
            <select
              id="studyLevel"
              name="studyLevel"
              required
              defaultValue={profile.studyLevel ?? ''}
            >
              <option value="">—</option>
              {(
                [
                  'foundation',
                  'associate',
                  'bachelor',
                  'master',
                  'doctorate',
                ] as const
              ).map((level) => (
                <option key={level} value={level}>
                  {searchCopy[locale].option[level]}
                </option>
              ))}
            </select>
          </label>
          <Field
            id="field"
            name="field"
            required
            minLength={2}
            maxLength={120}
            label={t.field}
            defaultValue={profile.field}
          />
          <Field
            id="budget"
            name="budget"
            type="number"
            required
            min={0}
            max={1000000}
            inputMode="numeric"
            label={t.budget}
            defaultValue={profile.budget}
          />
          <h2>{m.readiness}</h2>
          <Field
            id="nationality"
            name="nationality"
            maxLength={2}
            label={m.nationality}
            defaultValue={profile.nationality}
          />
          <Field
            id="residency"
            name="residency"
            maxLength={2}
            label={m.residency}
            defaultValue={profile.residency}
          />
          <label className="ui-field" htmlFor="educationLevel">
            <span>{m.educationLevel}</span>
            <select
              id="educationLevel"
              name="educationLevel"
              defaultValue={profile.educationLevel ?? ''}
            >
              <option value="">—</option>
              <option value="secondary">{m.secondary}</option>
              <option value="bachelor">
                {searchCopy[locale].option.bachelor}
              </option>
              <option value="master">{searchCopy[locale].option.master}</option>
              <option value="other">{m.other}</option>
            </select>
          </label>
          <Field
            id="graduationYear"
            name="graduationYear"
            type="number"
            min={1950}
            max={2200}
            label={m.graduationYear}
            defaultValue={profile.graduationYear}
          />
          <Field
            id="gpa"
            name="gpa"
            type="number"
            min={0}
            max={100}
            step="any"
            label={m.gpa}
            defaultValue={profile.gpa}
          />
          <Field
            id="gpaScale"
            name="gpaScale"
            type="number"
            min={0.1}
            max={100}
            step="any"
            label={m.gpaScale}
            defaultValue={profile.gpaScale}
          />
          <h2>{m.testScores}</h2>
          <div className="matching-test-grid">
            {(['IELTS', 'TOEFL', 'HSK', 'TOPIK', 'SAT', 'ACT'] as const).map(
              (code) => (
                <Field
                  key={code}
                  id={code.toLowerCase()}
                  name={code.toLowerCase()}
                  type="number"
                  min={0}
                  max={
                    code === 'IELTS'
                      ? 9
                      : code === 'TOEFL'
                        ? 120
                        : code === 'HSK'
                          ? 300
                          : code === 'TOPIK'
                            ? 6
                            : code === 'SAT'
                              ? 1600
                              : 36
                  }
                  step="any"
                  label={code}
                  defaultValue={testValue(code)}
                />
              ),
            )}
          </div>
          <div className="row">
            <button className="ui-button ui-button--primary" type="submit">
              {t.save}
            </button>
            <a
              className="ui-button ui-button--ghost"
              href={`/${locale}/dashboard`}
            >
              {t.back}
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
