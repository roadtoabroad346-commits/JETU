import { headers } from 'next/headers';
import { locales, messages, localeNames, isLocale } from '@/lib/i18n/messages';

export default async function NotFound() {
  const candidate = (await headers()).get('x-jetu-locale') ?? 'ru';
  const t = messages[isLocale(candidate) ? candidate : 'ru'];
  return (
    <main className="page-shell boundary">
      <h1>{t.missing}</h1>
      <p>{t.missingBody}</p>
      <nav aria-label={t.language} className="language-nav">
        {locales.map((locale) => (
          <a
            key={locale}
            className="ui-button ui-button--primary"
            href={`/${locale}`}
            lang={locale}
          >
            {localeNames[locale]} · {messages[locale].home}
          </a>
        ))}
      </nav>
    </main>
  );
}
