import type { Metadata } from 'next';
import { Field } from '@/components/ui/primitives';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { saveProfile } from '../actions';

export const metadata: Metadata = {
  title: 'Student profile',
  robots: { index: false, follow: false },
};
type ProfileDocument = {
  country?: string;
  studyLevel?: string;
  field?: string;
  budget?: number;
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
  const { data } = userData.user
    ? await supabase
        .from('student_profiles')
        .select('document')
        .eq('user_id', userData.user.id)
        .maybeSingle()
    : { data: null };
  const profile = (data?.document ?? {}) as ProfileDocument;
  const state = await searchParams;
  const t = authCopy[locale];
  return (
    <main id="main" tabIndex={-1} className="dashboard-main page-shell">
      <section className="profile-panel" aria-labelledby="profile-title">
        <p className="eyebrow">JETU / {t.onboarding}</p>
        <h1 id="profile-title">{t.onboardingTitle}</h1>
        <p className="auth-lead">{t.onboardingBody}</p>
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
          <Field
            id="studyLevel"
            name="studyLevel"
            required
            minLength={2}
            maxLength={80}
            label={t.studyLevel}
            defaultValue={profile.studyLevel}
          />
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
