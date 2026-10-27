import { InvitationField } from '@/features/auth/invitation-field';
import { getPublicEnv } from '@/lib/env/public';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Field } from '@/components/ui/primitives';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { signIn } from '../actions';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: authCopy[locale].signIn,
    robots: { index: false, follow: false },
  };
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
  const configured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (configured) {
    const supabase = await createRequestSupabaseClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect(`/${locale}/dashboard`);
  }
  const errorParam = (await searchParams).error;
  const error = Boolean(errorParam);
  const t = authCopy[locale];
  return (
    <main id="main" tabIndex={-1} className="auth-main page-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">JETU / {t.signIn}</p>
        <h1 id="login-title">{t.loginTitle}</h1>
        <p className="auth-lead">{t.loginBody}</p>
        {!configured && <p role="status">{t.notConfigured}</p>}
        {error && (
          <p className="feedback-box feedback-box--error" role="alert">
            {errorParam === 'recovery' ? t.authError : t.invalid}
          </p>
        )}
        <form action={signIn}>
          <InvitationField />
          <input type="hidden" name="locale" value={locale} />
          <Field
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            label={t.email}
          />
          <Field
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            label={t.password}
          />
          <button
            className="ui-button ui-button--primary auth-submit"
            type="submit"
            disabled={!configured}
          >
            {t.signIn}
          </button>
        </form>
        <div className="auth-links">
          <a href={`/${locale}/forgot-password`}>{t.forgot}</a>
          <span>
            {t.noAccount} <a href={`/${locale}/signup`}>{t.signUp}</a>
          </span>
        </div>
      </section>
    </main>
  );
}
