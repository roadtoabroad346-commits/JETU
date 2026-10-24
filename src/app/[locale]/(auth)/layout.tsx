import { BrandLogo } from '@/components/ui/brand';
import { isLocale, messages } from '@/lib/i18n/messages';
import { notFound } from 'next/navigation';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="auth-page">
      <a className="skip-link" href="#main">
        {messages[locale].skip}
      </a>
      <header className="auth-header page-shell">
        <a
          href={`/${locale}`}
          className="wordmark"
          aria-label="JETU Admissions"
        >
          <BrandLogo />
          <small>Admissions</small>
        </a>
        <a className="auth-home-link" href={`/${locale}`}>
          {messages[locale].home}
        </a>
      </header>
      {children}
    </div>
  );
}
