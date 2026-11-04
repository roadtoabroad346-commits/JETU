import type { Metadata } from 'next';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { ProfileJourney } from '@/features/onboarding/profile-journey';
import { profileFormValues } from '@/features/onboarding/model';
import { submitProfile } from '../actions';

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
}: {
  params: Promise<{ locale: string }>;
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
  return (
    <ProfileJourney
      locale={locale}
      initial={profileFormValues(data?.document)}
      version={data?.version ?? 0}
      loadFailed={Boolean(error)}
      action={submitProfile}
    />
  );
}
