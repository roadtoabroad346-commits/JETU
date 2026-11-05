import { redirect } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale, messages } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { signOut } from './actions';
import { searchCopy } from '@/features/search/copy';
import { matchingCopy } from '@/features/matching/copy';
import { getPublicEnv } from '@/lib/env/public';
import { writingCopy } from '@/features/writing/copy';
import { WorkspaceNav } from '@/features/onboarding/workspace-nav';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const config = getPublicEnv();
  if (
    !config.NEXT_PUBLIC_SUPABASE_URL ||
    !config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    redirect(`/${locale}/login`);
  const supabase = await createRequestSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect(`/${locale}/login`);
  const t = authCopy[locale];
  return (
    <div className="dashboard-page">
      <a className="skip-link" href="#main">
        {messages[locale].skip}
      </a>
      <header className="dashboard-header">
        <div className="page-shell dashboard-header-inner">
          <a
            href={`/${locale}`}
            className="wordmark"
            aria-label="JETU Admissions"
          >
            <BrandLogo />
            <small>Admissions</small>
          </a>
          <WorkspaceNav
            label={t.dashboard}
            items={[
              {
                href: `/${locale}/writing`,
                label: writingCopy[locale].title,
                icon: 'book',
              },
              {
                href: `/${locale}/dashboard`,
                label: t.dashboard,
                icon: 'book',
              },
              {
                href: `/${locale}/onboarding`,
                label: t.onboarding,
                icon: 'check',
              },
              {
                href: `/${locale}/saved`,
                label: searchCopy[locale].savedDestination,
                icon: 'search',
              },
              {
                href: `/${locale}/match`,
                label: matchingCopy[locale].title,
                icon: 'arrow',
              },
            ]}
          />
          <form action={signOut}>
            <input type="hidden" name="locale" value={locale} />
            <button className="ui-button ui-button--secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
