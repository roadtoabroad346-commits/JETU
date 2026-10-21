import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { listScholarships } from '@/features/scholarships/server';
import { freshness } from '@/features/scholarships/classification';
import { scholarshipCopy } from '@/features/scholarships/copy';
import { MarketingFooter } from '@/components/marketing/footer';

export const dynamic = 'force-dynamic';
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    country?: string;
    awardType?: string;
    sort?: string;
  }>;
};
export default async function ScholarshipCatalog({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const input = await searchParams;
  const q = (input.q ?? '').trim().slice(0, 80);
  const country = /^[A-Z]{2}$/.test(input.country ?? '')
    ? input.country
    : undefined;
  const awardType = [
    'scholarship',
    'grant',
    'fellowship',
    'bursary',
    'waiver',
    'assistantship',
    'other',
  ].includes(input.awardType ?? '')
    ? input.awardType
    : undefined;
  const sort = (
    ['recent', 'title', 'deadline'].includes(input.sort ?? '')
      ? input.sort
      : 'recent'
  ) as 'recent' | 'title' | 'deadline';
  const page = Math.max(
    1,
    Math.min(48, Number.parseInt(input.page ?? '1', 10) || 1),
  );
  const result = await listScholarships({ q, page, country, awardType, sort });
  const t = scholarshipCopy[locale];
  const href = (next: number) =>
    `/${locale}/scholarships/catalog?${new URLSearchParams({ ...(q ? { q } : {}), ...(country ? { country } : {}), ...(awardType ? { awardType } : {}), sort, page: String(next) })}`;
  return (
    <>
      <main id="main" className="page-shell scholarship-main">
        <div className="scholarship-hero">
          <p className="section-kicker">JETU / FUNDING</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <form method="get" className="scholarship-filters">
          <label>
            {t.search}
            <input name="q" defaultValue={q} maxLength={80} />
          </label>
          <label>
            {t.country}
            <input
              name="country"
              defaultValue={country ?? ''}
              maxLength={2}
              pattern="[A-Z]{2}"
              placeholder="KZ"
            />
          </label>
          <label>
            {t.awardType}
            <select name="awardType" defaultValue={awardType ?? ''}>
              <option value="">{t.allTypes}</option>
              {[
                'scholarship',
                'grant',
                'fellowship',
                'bursary',
                'waiver',
                'assistantship',
                'other',
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.sort}
            <select name="sort" defaultValue={sort}>
              <option value="recent">{t.recent}</option>
              <option value="title">{t.byTitle}</option>
              <option value="deadline">{t.byDeadline}</option>
            </select>
          </label>
          <button type="submit" className="ui-button ui-button--primary">
            {t.searchButton}
          </button>
        </form>
        {result.state === 'unavailable' ? (
          <p role="alert" className="scholarship-notice">
            {t.unavailable}
          </p>
        ) : result.data.length === 0 ? (
          <p className="scholarship-notice">{t.empty}</p>
        ) : (
          <>
            <ul className="scholarship-grid">
              {result.data.map((item) => (
                <li className="scholarship-card" key={item.id}>
                  <p className="section-kicker">
                    {item.provider_country_code ?? t.unknown} ·{' '}
                    {item.award_type}
                  </p>
                  <h2>
                    <a href={`/${locale}/scholarships/catalog/${item.slug}`}>
                      {item.title}
                    </a>
                  </h2>
                  <p>{item.provider_name ?? t.unknown}</p>
                  <p>{item.benefit_summary ?? t.unknown}</p>
                  <p>
                    {t.checked}:{' '}
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                    }).format(new Date(item.source_checked_at))}
                    {freshness(item.source_checked_at) === 'review_due'
                      ? ` · ${t.stale}`
                      : ''}
                  </p>
                  {item.deadline_at && (
                    <p>
                      {t.deadlines}:{' '}
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeZone: item.deadline_timezone ?? 'UTC',
                      }).format(new Date(item.deadline_at))}{' '}
                      {item.deadline_timezone}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <nav className="scholarship-pages" aria-label="Pages">
              {page > 1 && <a href={href(page - 1)}>{t.previous}</a>}
              {result.data.length === 20 && (
                <a href={href(page + 1)}>{t.next}</a>
              )}
            </nav>
          </>
        )}
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
