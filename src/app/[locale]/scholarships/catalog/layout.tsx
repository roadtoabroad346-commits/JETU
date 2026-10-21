import { notFound } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand';
import { MarketingLanguageNav } from '@/components/marketing/language-nav';
import { isLocale, messages } from '@/lib/i18n/messages';
import { marketing } from '@/lib/i18n/marketing';

export default async function ScholarshipLayout({
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
            {t.navLinks
              .filter(
                ({ slug }) =>
                  slug === 'scholarships' || slug === 'universities',
              )
              .map(({ slug, label }) => (
                <a key={slug} href={`/${locale}/${slug}`}>
                  {label}
                </a>
              ))}
          </nav>
          <MarketingLanguageNav locale={locale} />
        </div>
      </header>
      {children}
    </>
  );
}
