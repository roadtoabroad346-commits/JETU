import type { Metadata } from 'next';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { ProfileJourney } from '@/features/onboarding/profile-journey';
import { profileFormValues } from '@/features/onboarding/model';
import {
  ProfileWizard,
  WizardSuccess,
} from '@/features/onboarding/profile-wizard';
import { saveProfile, submitProfile } from '../actions';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        title: authCopy[locale].onboardingTitle,
        robots: { index: false, follow: false },
      }
    : {};
}
export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string; success?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const supabase = await createRequestSupabaseClient();
  const { data: identity } = await supabase.auth.getUser();
  const { data, error } = identity.user
    ? await supabase
        .from('student_profiles')
        .select('document,version')
        .eq('user_id', identity.user.id)
        .maybeSingle()
    : { data: null, error: new Error('Unauthenticated') };
  const initial = profileFormValues(data?.document);
  const query = await searchParams;
  // Preserve main's all-fields server-rendered form as a no-JavaScript fallback.
  if (query.view === 'all')
    return (
      <main id="main" tabIndex={-1} className="dashboard-main page-shell">
        <section className="profile-panel profile-panel--wide">
          {query.success === 'saved' && data && !error ? (
            <WizardSuccess locale={locale} />
          ) : (
            <ProfileWizard
              locale={locale}
              action={saveProfile}
              defaults={initial}
              loadFailed={Boolean(error)}
              invalid={Boolean(query.error)}
              version={data?.version ?? 0}
            />
          )}
        </section>
      </main>
    );
  return (
    <ProfileJourney
      locale={locale}
      initial={initial}
      version={data?.version ?? 0}
      loadFailed={Boolean(error)}
      action={submitProfile}
    />
  );
}
