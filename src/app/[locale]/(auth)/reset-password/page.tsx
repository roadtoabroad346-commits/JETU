import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Field } from '@/components/ui/primitives';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { updatePassword } from '../actions';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
};
export default async function ResetPasswordPage({
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
  if (!data?.claims?.sub) redirect(`/${locale}/login?error=recovery`);
  const error = Boolean((await searchParams).error);
  const t = authCopy[locale];
  return (
    <main id="main" tabIndex={-1} className="auth-main page-shell">
      <section className="auth-card" aria-labelledby="reset-title">
        <p className="eyebrow">JETU / {t.forgot}</p>
        <h1 id="reset-title">{t.resetTitle}</h1>
        <p className="auth-lead">{t.resetBody}</p>
        {error && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.invalid}
          </p>
        )}
        <form action={updatePassword}>
          <input type="hidden" name="locale" value={locale} />
          <Field
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            label={t.password}
            hint={t.passwordHint}
          />
          <button
            className="ui-button ui-button--primary auth-submit"
            type="submit"
          >
            {t.updatePassword}
          </button>
        </form>
      </section>
    </main>
  );
}
