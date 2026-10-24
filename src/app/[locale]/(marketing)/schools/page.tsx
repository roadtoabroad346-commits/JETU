import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingFooter } from '@/components/marketing/footer';
import { isLocale } from '@/lib/i18n/messages';
import { pageMetadata } from '@/lib/marketing/seo';
import { OpportunityUnavailable } from '@/features/opportunities/server';
import { schoolsCopy } from '@/features/schools/copy';
import {
  listSchools,
  schoolPage,
  type School,
} from '@/features/schools/server';

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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = schoolsCopy[locale];
  const query = await searchParams;
  const parsedPage = schoolPage.safeParse(query.page);
  const page = parsedPage.success ? parsedPage.data : 1;
  let schools: School[] = [];
  let hasNext = false;
  let unavailable = false;
  if (parsedPage.success)
    try {
      ({ schools, hasNext } = await listSchools(page));
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
          {!parsedPage.success || unavailable || schools.length === 0 ? (
            <p className="catalog-state" role="status">
              {!parsedPage.success
                ? t.invalid
                : unavailable
                  ? t.unavailable
                  : t.empty}
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
        {parsedPage.success && !unavailable && (page > 1 || hasNext) && (
          <nav className="catalog-pages" aria-label={t.title}>
            {page > 1 && (
              <a href={`/${locale}/schools?page=${page - 1}`}>{t.previous}</a>
            )}
            {hasNext && page < 200 && (
              <a href={`/${locale}/schools?page=${page + 1}`}>{t.next}</a>
            )}
          </nav>
        )}
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
