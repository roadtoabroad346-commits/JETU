import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BrandLogo } from '@/components/ui/brand';
import { Icon } from '@/components/ui/icon';
import { LanguageLink } from '@/components/ui/language-link';
import { Showcase } from '@/components/design-system/showcase';
import { isLocale, locales, localeNames, messages } from '@/lib/i18n/messages';
import { designMessages } from '@/lib/i18n/design-system';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: designMessages[locale].eyebrow,
    robots: { index: false, follow: false },
  };
}
export default async function DesignSystemPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = designMessages[locale];
  return (
    <>
      <a className="skip-link" href="#main">
        {messages[locale].skip}
      </a>
      <div className="showcase-masthead">
        <div className="page-shell">
          <header className="site-header">
            <a href={`/${locale}`} className="wordmark" aria-label={t.home}>
              <BrandLogo />
              <small>Admissions</small>
            </a>
            <nav
              className="language-nav"
              aria-label={messages[locale].language}
            >
              {locales.map((item) => (
                <LanguageLink
                  key={item}
                  locale={item}
                  label={localeNames[item]}
                  current={item === locale}
                  path="/design-system"
                />
              ))}
            </nav>
          </header>
          <div className="showcase-intro">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p>{t.description}</p>
            <span className="masthead-index" aria-hidden="true">
              <BrandLogo compact />
            </span>
          </div>
        </div>
      </div>
      <main id="main" tabIndex={-1} className="page-shell">
        <p className="showcase-note">
          <Icon name="arrow" />
          {t.previewNote}
        </p>
        <noscript>
          <p>{t.javascriptRequired}</p>
        </noscript>
        <Showcase t={t} locale={locale} />
      </main>
      <footer className="page-shell site-footer">{t.footer}</footer>
    </>
  );
}
