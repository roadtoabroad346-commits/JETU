import type { Metadata } from 'next';
import { Field } from '@/components/ui/primitives';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { requestPasswordReset } from '../actions';

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
};
export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const sent = Boolean((await searchParams).success);
  const t = authCopy[locale];
  return (
    <main id="main" tabIndex={-1} className="auth-main page-shell">
      <section className="auth-card" aria-labelledby="forgot-title">
        <p className="eyebrow">JETU / {t.forgot}</p>
        <h1 id="forgot-title">{t.forgotTitle}</h1>
        <p className="auth-lead">{t.forgotBody}</p>
        {sent && (
          <p className="feedback-box feedback-box--success" role="status">
            {t.recoverySent}
          </p>
        )}
        <form action={requestPasswordReset}>
          <input type="hidden" name="locale" value={locale} />
          <Field
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            label={t.email}
          />
          <button
            className="ui-button ui-button--primary auth-submit"
            type="submit"
          >
            {t.sendLink}
          </button>
        </form>
        <div className="auth-links">
          <a href={`/${locale}/login`}>{t.signIn}</a>
        </div>
      </section>
    </main>
  );
}
