import type { Metadata } from 'next';
import { Field } from '@/components/ui/primitives';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { signUp } from '../actions';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: authCopy[locale].signUp,
    robots: { index: false, follow: false },
  };
}
export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const state = await searchParams;
  const t = authCopy[locale];
  return (
    <main id="main" tabIndex={-1} className="auth-main page-shell">
      <section className="auth-card" aria-labelledby="signup-title">
        <p className="eyebrow">JETU / {t.signUp}</p>
        <h1 id="signup-title">{t.signupTitle}</h1>
        <p className="auth-lead">{t.signupBody}</p>
        {state.error && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.invalid}
          </p>
        )}
        {state.success && (
          <p className="feedback-box feedback-box--success" role="status">
            {t.checkEmail}
          </p>
        )}
        <form action={signUp}>
          <input type="hidden" name="locale" value={locale} />
          <Field
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            label={t.name}
          />
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
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            label={t.password}
            hint={t.passwordHint}
          />
          <label className="check-row">
            <input name="age" type="checkbox" required /> <span>{t.age}</span>
          </label>
          <label className="check-row">
            <input name="terms" type="checkbox" required />{' '}
            <span>{t.terms}</span>
          </label>
          <button
            className="ui-button ui-button--accent auth-submit"
            type="submit"
          >
            {t.signUp}
          </button>
        </form>
        <div className="auth-links">
          <span>
            {t.hasAccount} <a href={`/${locale}/login`}>{t.signIn}</a>
          </span>
        </div>
      </section>
    </main>
  );
}
