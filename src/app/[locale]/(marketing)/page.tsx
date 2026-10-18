import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LanguageLink } from '@/components/ui/language-link';
import { BrandLogo } from '@/components/ui/brand';
import { isLocale, locales, localeNames, messages } from '@/lib/i18n/messages';

type Props = { params: Promise<{ locale: string }> };
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: messages[locale].title,
    description: messages[locale].description,
  };
}

export default async function AvailabilityPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = messages[locale];
  return (
    <div className="page-shell">
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="site-header">
        <a
          href={`/${locale}`}
          className="wordmark"
          aria-label="JETU Admissions"
        >
          <BrandLogo />
          <small>Admissions</small>
        </a>
        <nav className="language-nav" aria-label={t.language}>
          {locales.map((item) => (
            <LanguageLink
              key={item}
              locale={item}
              label={localeNames[item]}
              current={item === locale}
            />
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="intro">
        <div className="intro-copy">
          <p className="status-label">{t.status}</p>
          <h1>{t.title}</h1>
          <p className="intro-description">{t.description}</p>
          <p className="availability">{t.note}</p>
        </div>
        <aside className="brand-panel" aria-label={t.belief}>
          <svg
            viewBox="0 0 400 320"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M28 268H128V198H228V128H328V58H372"
              stroke="var(--accent)"
              strokeWidth="24"
              strokeLinejoin="round"
            />
            <path
              d="M28 224H88V154H188V84H288V14"
              stroke="white"
              strokeOpacity=".35"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
            <circle cx="372" cy="58" r="12" fill="var(--accent)" />
          </svg>
          <p>{t.belief}</p>
        </aside>
      </main>
      <footer className="site-footer">{t.footer}</footer>
    </div>
  );
}
