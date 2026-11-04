'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { JetuMascot } from '@/components/ui/mascot';
import { Icon } from '@/components/ui/icon';
import { authCopy } from '@/lib/i18n/auth';
import type { Locale } from '@/lib/i18n/messages';
import { journeyCopy } from './journey-copy';
import {
  accountSchema,
  registrationSchema,
  initialAccountState,
  privacyVersion,
  type AccountState,
} from './model';

type Props = {
  locale: Locale;
  mode: 'signup' | 'login';
  action: (state: AccountState, data: FormData) => Promise<AccountState>;
  initialError?: boolean;
};

export function AccountExperience({
  locale,
  mode,
  action,
  initialError = false,
}: Props) {
  const t = journeyCopy[locale];
  const a = authCopy[locale];
  const signup = mode === 'signup';
  const [state, formAction, pending] = useActionState<AccountState, FormData>(
    action,
    initialError
      ? { status: 'error', error: 'credentials' }
      : initialAccountState,
  );
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    terms: false,
    age: false,
  });
  const [show, setShow] = useState(false);
  const [fields, setFields] = useState<string[]>([]);
  const [localError, setLocalError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [dismissedConfirmation, setDismissedConfirmation] =
    useState<AccountState | null>(null);
  const errors = [...fields, ...(state.fields ?? [])];
  useEffect(() => {
    if (state.status === 'error') {
      const invalidField = state.fields?.[0];
      const control = invalidField
        ? formRef.current?.querySelector<HTMLElement>(
            `[name="${invalidField}"]`,
          )
        : null;
      (control ?? errorRef.current)?.focus();
    }
  }, [state]);

  function validate(event: FormEvent<HTMLFormElement>) {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = (signup ? registrationSchema : accountSchema).safeParse(
      data,
    );
    if (!result.success) {
      event.preventDefault();
      const invalid = result.error.issues.map((issue) => String(issue.path[0]));
      setFields(invalid);
      setLocalError(true);
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${invalid[0]}"]`)
        ?.focus();
    } else {
      setFields([]);
      setLocalError(false);
    }
  }

  if (state.status === 'check-email' && state !== dismissedConfirmation)
    return (
      <main
        id="main"
        tabIndex={-1}
        className="account-experience page-shell account-confirmation"
      >
        <JetuMascot mood="celebrate" />
        <section
          className="account-form-panel"
          aria-labelledby="confirmation-title"
        >
          <p className="eyebrow">JETU / {t.companion}</p>
          <h1 id="confirmation-title">{t.confirmTitle}</h1>
          <p role="status">{t.confirmBody}</p>
          <p className="journey-note">{t.confirmHint}</p>
          <div className="journey-buttons">
            <a
              className="ui-button ui-button--primary"
              href={`/${locale}/login`}
            >
              {a.signIn}
            </a>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => setDismissedConfirmation(state)}
            >
              {t.editEmail}
            </button>
          </div>
          <a href={`/${locale}/forgot-password`}>{a.forgot}</a>
        </section>
      </main>
    );

  return (
    <main id="main" tabIndex={-1} className="account-experience page-shell">
      <aside className="account-story" aria-label={t.companion}>
        <p className="eyebrow">{t.signupEyebrow}</p>
        <h2>{t.hello}</h2>
        <p>{t.helloBody}</p>
        <div className="account-mascot-stage">
          <span className="mascot-halo" />
          <JetuMascot mood={pending ? 'thinking' : 'welcome'} />
          <span className="mascot-label">{t.companion}</span>
        </div>
        <ul className="account-benefits">
          {t.benefits.map((item, index) => (
            <li key={item}>
              <span aria-hidden="true">
                <Icon
                  name={(['book', 'check', 'arrow'] as const)[index] ?? 'check'}
                />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </aside>
      <section className="account-form-panel" aria-labelledby="account-title">
        <p className="journey-overline">
          {signup ? '01 / JETU ID' : 'JETU ID'}
        </p>
        <h1 id="account-title">{signup ? a.signupTitle : a.loginTitle}</h1>
        <p className="journey-note">{signup ? t.signupLead : t.loginLead}</p>
        {(localError || state.status === 'error') && (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="feedback-box feedback-box--error"
            role="alert"
          >
            {t.errors[localError ? 'invalid' : (state.error ?? 'unavailable')]}
          </div>
        )}
        <form
          ref={formRef}
          action={formAction}
          onSubmit={validate}
          noValidate
          aria-busy={pending}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="privacyVersion" value={privacyVersion} />
          <fieldset className="journey-fieldset" disabled={pending}>
            <legend className="sr-only">{signup ? a.signUp : a.signIn}</legend>
            {signup && (
              <label className="ui-field" htmlFor="account-name">
                <span>{a.name}</span>
                <input
                  id="account-name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={values.name}
                  aria-invalid={errors.includes('name')}
                  aria-describedby={
                    errors.includes('name') ? 'account-error-hint' : undefined
                  }
                  onChange={(e) =>
                    setValues({ ...values, name: e.target.value })
                  }
                />
              </label>
            )}
            <label className="ui-field" htmlFor="account-email">
              <span>{a.email}</span>
              <input
                id="account-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={320}
                value={values.email}
                aria-invalid={errors.includes('email')}
                aria-describedby={
                  errors.includes('email') ? 'account-error-hint' : undefined
                }
                onChange={(e) =>
                  setValues({ ...values, email: e.target.value })
                }
              />
            </label>
            <label className="ui-field" htmlFor="account-password">
              <span>{a.password}</span>
            </label>
            <div className="password-control">
              <input
                id="account-password"
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete={signup ? 'new-password' : 'current-password'}
                required
                minLength={8}
                maxLength={128}
                value={values.password}
                aria-invalid={errors.includes('password')}
                aria-describedby="password-help"
                onChange={(e) =>
                  setValues({ ...values, password: e.target.value })
                }
              />
              <button
                type="button"
                aria-controls="account-password"
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? t.hidePassword : t.showPassword}
              </button>
            </div>
            <p id="password-help" className="field-help">
              {t.passwordHelp}
            </p>
            {signup && values.password.length > 0 && (
              <p
                className={`password-feedback ${values.password.length >= 8 ? 'is-ready' : ''}`}
                role="status"
              >
                {values.password.length >= 8
                  ? t.passwordReady
                  : t.passwordShort}
              </p>
            )}
            {errors.length > 0 && (
              <p id="account-error-hint" className="field-error">
                {t.errors.invalid}
              </p>
            )}
            {signup && (
              <>
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="age"
                    required
                    checked={values.age}
                    aria-invalid={errors.includes('age')}
                    onChange={(e) =>
                      setValues({ ...values, age: e.target.checked })
                    }
                  />
                  <span>{a.age}</span>
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="terms"
                    required
                    checked={values.terms}
                    aria-invalid={errors.includes('terms')}
                    onChange={(e) =>
                      setValues({ ...values, terms: e.target.checked })
                    }
                  />
                  <span>{t.agreement}</span>
                </label>
                <p className="account-legal-links">
                  <a
                    href={`/${locale}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.privacyLink} <Icon name="arrow" />
                  </a>
                  <a
                    href={`/${locale}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.termsLink} <Icon name="arrow" />
                  </a>
                </p>
              </>
            )}
          </fieldset>
          <button
            className="ui-button ui-button--primary auth-submit"
            type="submit"
            disabled={pending}
            aria-busy={pending}
          >
            {pending
              ? signup
                ? t.pending
                : t.loginPending
              : signup
                ? a.signUp
                : a.signIn}
            <Icon name="arrow" />
          </button>
        </form>
        {signup && <p className="account-privacy-note">{t.accountPrivate}</p>}
        <div className="auth-links">
          <span>
            {signup ? a.hasAccount : a.noAccount}{' '}
            <a href={`/${locale}/${signup ? 'login' : 'signup'}`}>
              {signup ? a.signIn : a.signUp}
            </a>
          </span>
          {!signup && <a href={`/${locale}/forgot-password`}>{a.forgot}</a>}
        </div>
      </section>
    </main>
  );
}
