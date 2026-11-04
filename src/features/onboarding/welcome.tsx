import type { Locale } from '@/lib/i18n/messages';
import { JetuMascot } from '@/components/ui/mascot';
import { Icon } from '@/components/ui/icon';
import { journeyCopy } from './journey-copy';

export function StudentWelcome({
  locale,
  signedIn = false,
}: {
  locale: Locale;
  signedIn?: boolean;
}) {
  const t = journeyCopy[locale];
  return (
    <section
      className="student-welcome"
      aria-labelledby="student-welcome-title"
    >
      <JetuMascot />
      <div>
        <p className="journey-overline">JETU / {t.companion}</p>
        <h2 id="student-welcome-title">{t.welcomeTitle}</h2>
        <p>{t.welcomeBody}</p>
        <div className="journey-buttons">
          <a
            className="ui-button ui-button--primary"
            href={`/${locale}/${signedIn ? 'onboarding' : 'signup'}`}
          >
            {t.welcomeAction} <Icon name="arrow" />
          </a>
          <a href={`/${locale}/privacy`}>{t.privacyLink}</a>
        </div>
        <p className="field-help">{t.welcomePrivacy}</p>
      </div>
    </section>
  );
}
