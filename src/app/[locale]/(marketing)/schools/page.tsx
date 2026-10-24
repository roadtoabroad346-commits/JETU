import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingFooter } from '@/components/marketing/footer';
import { isLocale } from '@/lib/i18n/messages';
import { pageMetadata } from '@/lib/marketing/seo';
import { OpportunityUnavailable } from '@/features/opportunities/server';
import { schoolsCopy } from '@/features/schools/copy';
import { listSchools, type School } from '@/features/schools/server';

export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = schoolsCopy[locale];
  return pageMetadata(locale, 'schools', t.title, t.intro);
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = schoolsCopy[locale];
  let schools: School[] = [];
  let unavailable = false;
  try {
    schools = await listSchools();
  } catch (error) {
    if (error instanceof OpportunityUnavailable) unavailable = true;
    else throw error;
  }
  return (
    <>
      <main id="main" className="page-shell catalog-main">
        <div className="catalog-intro">
          <p className="section-kicker">JETU / {t.title}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <p>{t.note}</p>
          <div className="catalog-filter-actions">
            <a href={`/${locale}/opportunities`}>{t.activities}</a>
            <a href={`/${locale}/for-schools`}>{t.b2b}</a>
          </div>
        </div>
        <section className="catalog-results" aria-label={t.title}>
          {unavailable || schools.length === 0 ? (
            <p className="catalog-state" role="status">
              {unavailable ? t.unavailable : t.empty}
            </p>
          ) : (
            <div className="catalog-list">
              {schools.map((school) => (
                <article className="catalog-card" key={school.id}>
                  <p className="section-kicker">
                    {t.kinds[school.kind as keyof typeof t.kinds] ??
                      t.kinds.other}
                  </p>
                  <h2>{school.name}</h2>
                  {school.verifiedPartner && <p>{t.partner}</p>}
                  <p>
                    {t.source}:{' '}
                    <a
                      href={school.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {school.sourceUrl} ↗
                    </a>
                  </p>
                  <p>
                    {t.checked}:{' '}
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                      timeZone: 'UTC',
                    }).format(new Date(school.checkedAt))}
                  </p>
                  {school.website && (
                    <p>
                      <a
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.website} ↗
                      </a>
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
