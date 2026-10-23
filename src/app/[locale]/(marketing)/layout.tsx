import { BrandLogo } from '@/components/ui/brand';
import { MarketingLanguageNav } from '@/components/marketing/language-nav';
import { StructuredData } from '@/components/marketing/structured-data';
import { getPublicEnv } from '@/lib/env/public';
import { isLocale, messages } from '@/lib/i18n/messages';
import { marketing } from '@/lib/i18n/marketing';
import { notFound } from 'next/navigation';

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = marketing[locale];
  return (
    <>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'JETU Admissions',
          url: new URL(
            `/${locale}`,
            getPublicEnv().NEXT_PUBLIC_APP_URL,
          ).toString(),
          inLanguage: locale,
        }}
      />
      <a className="skip-link" href="#main">
        {messages[locale].skip}
      </a>
      <header className="marketing-header">
        <div className="page-shell marketing-header-inner">
          <a
            href={`/${locale}`}
            className="wordmark"
            aria-label="JETU Admissions"
          >
            <BrandLogo />
            <small>Admissions</small>
          </a>
          <nav className="marketing-nav" aria-label={t.nav}>
            {t.navLinks.map(({ slug, label }) => (
              <a key={slug} href={`/${locale}/${slug}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="marketing-account">
            <a className="marketing-login" href={`/${locale}/login`}>
              {locale === 'ru' ? 'Войти' : locale === 'kk' ? 'Кіру' : 'Sign in'}
            </a>
            <MarketingLanguageNav locale={locale} />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
