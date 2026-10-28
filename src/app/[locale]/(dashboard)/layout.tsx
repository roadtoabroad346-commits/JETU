import { getPublicEnv } from '@/lib/env/public';
import { redirect } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale, messages } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { signOut } from './actions';
import { searchCopy } from '@/features/search/copy';
import { matchingCopy } from '@/features/matching/copy';
import { roadmapCopy } from '@/features/roadmap/copy';
import { vaultCopy } from '@/features/vault/copy';
import { applicationsCopy } from '@/features/applications/copy';
import { editorCopy } from '@/features/catalog-editor/copy';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    redirect(`/${locale}/login`);
  const supabase = await createRequestSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect(`/${locale}/login`);
  const editorialMembership = await supabase
    .from('catalog_editor_memberships')
    .select('role')
    .eq('user_id', data.claims.sub)
    .maybeSingle();
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
          <nav aria-label={t.dashboard} className="dashboard-nav">
            <a href={`/${locale}/dashboard`}>{t.dashboard}</a>
            <a href={`/${locale}/onboarding`}>{t.onboarding}</a>
            <a href={`/${locale}/saved`}>
              {searchCopy[locale].savedDestination}
            </a>
            <a href={`/${locale}/match`}>{matchingCopy[locale].title}</a>
            <a href={`/${locale}/plan`}>{roadmapCopy[locale].nav}</a>
            <a href={`/${locale}/applications`}>
              {applicationsCopy[locale].nav}
            </a>
            <a href={`/${locale}/vault`}>{vaultCopy(locale).vault}</a>
            <a href={`/${locale}/writing`}>{vaultCopy(locale).writing}</a>
            {editorialMembership.data && (
              <a href={`/${locale}/admin`}>{editorCopy[locale].title}</a>
            )}
          </nav>
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
