import type { Metadata } from 'next';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { saveProfile } from '../actions';
import {
  ProfileWizard,
  WizardSuccess,
  type WizardDefaults,
} from '@/features/onboarding/profile-wizard';

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

const TEST_CODES = ['IELTS', 'TOEFL', 'HSK', 'TOPIK', 'SAT', 'ACT'] as const;

function wizardDefaults(profile: ProfileDocument): WizardDefaults {
  return {
    country: profile.country,
    studyLevel: profile.studyLevel,
    field: profile.field,
    budget: profile.budget,
    nationality: profile.nationality,
    residency: profile.residency,
    educationLevel: profile.educationLevel,
    graduationYear: profile.graduationYear,
    gpa: profile.gpa,
    gpaScale: profile.gpaScale,
    ...Object.fromEntries(
      TEST_CODES.map((code) => [
        code.toLowerCase(),
        profile.testScores?.find((item) => item.code === code)?.score,
      ]),
    ),
  } as WizardDefaults;
}

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
  const saved = Boolean(state.success);
  return (
    <main id="main" tabIndex={-1} className="dashboard-main page-shell">
      <section
        className="profile-panel profile-panel--wide"
        aria-labelledby="profile-title"
      >
        {saved ? (
          <WizardSuccess locale={locale} />
        ) : (
          <ProfileWizard
            locale={locale}
            action={saveProfile}
            defaults={wizardDefaults(profile)}
            loadFailed={loadFailed}
            invalid={Boolean(state.error)}
          />
        )}
      </section>
    </main>
  );
}
