import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Field } from '@/components/ui/primitives';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { signIn } from '../actions';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const supabase = await createRequestSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect(`/${locale}/dashboard`);
  const error = Boolean((await searchParams).error);
  const t = authCopy[locale];
  return (
    <main id="main" tabIndex={-1} className="auth-main page-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">JETU / {t.signIn}</p>
        <h1 id="login-title">{t.loginTitle}</h1>
        <p className="auth-lead">{t.loginBody}</p>
        {error && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.invalid}
          </p>
        )}
        <form action={signIn}>
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
