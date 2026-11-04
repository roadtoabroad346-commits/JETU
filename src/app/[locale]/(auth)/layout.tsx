import { BrandLogo } from '@/components/ui/brand';
import { Reveal } from '@/components/ui/reveal';
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
      {/* Decorative light play; transform/opacity only, hidden from
          assistive tech and inert to pointer events. */}
      <div className="auth-aura" aria-hidden="true">
        <span className="auth-aura-orb" />
        <span className="auth-aura-orb auth-aura-orb--accent" />
        <span className="auth-aura-shift" />
      </div>
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
      <Reveal>{children}</Reveal>
    </div>
  );
}
