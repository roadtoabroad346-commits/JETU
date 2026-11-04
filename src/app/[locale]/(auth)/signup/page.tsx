import type { Metadata } from 'next';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { AccountExperience } from '@/features/onboarding/account-experience';
import { submitSignUp } from '../actions';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        title: authCopy[locale].signUp,
        robots: { index: false, follow: false },
      }
    : {};
}
export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  return (
    <AccountExperience
      locale={locale}
      mode="signup"
      action={submitSignUp}
      initialError={Boolean((await searchParams).error)}
    />
  );
}
