import type { Metadata } from 'next';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const supabase = await createRequestSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const t = authCopy[locale];
  const updated = Boolean((await searchParams).success);
  return (
    <main id="main" tabIndex={-1} className="dashboard-main page-shell">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">JETU / {t.verified}</p>
          <h1>{t.dashboard}</h1>
          <p>{t.dashboardBody}</p>
        </div>
        <span className="ui-badge ui-badge--success">{t.verified}</span>
      </div>
      {updated && (
        <p className="feedback-box feedback-box--success" role="status">
          {t.passwordUpdated}
        </p>
      )}
      <section className="ui-card account-card" aria-labelledby="account-title">
        <h2 id="account-title">{t.signedInAs}</h2>
        <p>{data.user?.email}</p>
        <a
          className="ui-button ui-button--accent"
          href={`/${locale}/onboarding`}
        >
          {t.onboarding}
        </a>
      </section>
    </main>
  );
}
