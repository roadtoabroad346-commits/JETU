import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { getPublicEnv } from '@/lib/env/public';
import { AccountExperience } from '@/features/onboarding/account-experience';
import { submitSignIn } from '../actions';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        title: authCopy[locale].signIn,
        robots: { index: false, follow: false },
      }
    : {};
}
export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const env = getPublicEnv();
  if (
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = await createRequestSupabaseClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect(`/${locale}/dashboard`);
  }
  return (
    <AccountExperience
      locale={locale}
      mode="login"
      action={submitSignIn}
      initialError={Boolean((await searchParams).error)}
    />
  );
}
