import { notFound } from 'next/navigation';
import { MarketingFooter } from '@/components/marketing/footer';
import type { Locale } from '@/lib/i18n/messages';
import { opportunityCopy } from './copy';
import { saveOpportunityAction } from './actions';
import { OpportunitySubmitButton } from './submit-button';
import {
  defaultOpportunityFilters,
  OpportunityUnavailable,
  searchOpportunities,
  type Opportunity,
  type OpportunityFilters,
  opportunityKinds,
} from './server';

const displayDate = (value: string | null, locale: Locale) =>
  value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(value))
    : null;
const displayDeadline = (
  value: string | null,
  timezone: string | null,
  locale: Locale,
) =>
  value
    ? `${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone ?? 'UTC' }).format(new Date(value))} ${timezone ?? 'UTC'}`
    : null;
const range = (min: number | null, max: number | null, unknown: string) =>
  min === null && max === null ? unknown : `${min ?? '…'}–${max ?? '…'}`;
function state(message: string) {
  return (
    <p className="catalog-state" role="status">
      {message}
    </p>
  );
}

export async function OpportunityExplorer({
  locale,
  filters,
  valid,
}: {
  locale: Locale;
  filters: OpportunityFilters;
  valid: boolean;
}) {
  const t = opportunityCopy[locale];
  let rows: Opportunity[] = [];
  let unavailable = false;
  if (valid)
    try {
      rows = await searchOpportunities(filters);
    } catch (error) {
      if (error instanceof OpportunityUnavailable) unavailable = true;
      else throw error;
    }
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.kind) params.set('kind', filters.kind);
    if (filters.age !== '') params.set('age', String(filters.age));
    if (filters.grade !== '') params.set('grade', String(filters.grade));
    params.set('page', String(page));
    return `/${locale}/opportunities?${params.toString()}`;
  };
  return (
    <>
      <main id="main" className="page-shell catalog-main">
        <div className="catalog-intro">
          <p className="section-kicker">JETU / {t.title}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <form
          method="get"
          className="catalog-filters"
          action={`/${locale}/opportunities`}
        >
          <label>
            {t.search}
            <input name="q" maxLength={80} defaultValue={filters.q} />
          </label>
          <label>
            {t.kind}
            <select name="kind" defaultValue={filters.kind}>
              <option value="">{t.all}</option>
              {opportunityKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {t.kinds[kind]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.age}
            <input
              name="age"
              type="number"
              min="5"
              max="35"
              defaultValue={filters.age}
            />
          </label>
          <label>
            {t.grade}
            <input
              name="grade"
              type="number"
              min="1"
              max="13"
              defaultValue={filters.grade}
            />
          </label>
          <div className="catalog-filter-actions">
            <button className="ui-button ui-button--accent" type="submit">
              {t.apply}
            </button>
            <a href={`/${locale}/opportunities`}>{t.reset}</a>
          </div>
        </form>
        <section className="catalog-results" aria-label={t.title}>
          {!valid ? (
            state(t.invalid)
          ) : unavailable ? (
            state(t.unavailable)
          ) : rows.length === 0 ? (
            state(t.empty)
          ) : (
            <div className="catalog-list">
              {rows.map((item) => (
                <article className="catalog-card" key={item.id}>
                  <p className="section-kicker">
                    {t.kinds[item.opportunity_type as keyof typeof t.kinds] ??
                      item.opportunity_type}
                  </p>
                  <h2>
                    <a href={`/${locale}/opportunities/${item.slug}`}>
                      {item.title}
                    </a>
                  </h2>
                  <p>
                    {t.host}: {item.provider_name ?? t.unknown}
                  </p>
                  <p>
                    {t.ageRange}:{' '}
                    {range(
                      item.eligibility_age_min,
                      item.eligibility_age_max,
                      t.unknown,
                    )}{' '}
                    · {t.gradeRange}:{' '}
                    {range(
                      item.eligibility_grade_min,
                      item.eligibility_grade_max,
                      t.unknown,
                    )}
                  </p>
                  <p>
                    {t.close}:{' '}
                    {displayDeadline(
                      item.deadline_at,
                      item.deadline_timezone,
                      locale,
                    ) ?? t.unknown}
                  </p>
                  <p>
                    {t.checked}: {displayDate(item.source_checked_at, locale)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
        {valid && !unavailable && (
          <nav className="catalog-pages" aria-label={t.page}>
            {filters.page > 1 && (
              <a href={pageHref(filters.page - 1)}>{t.previous}</a>
            )}
            {rows.length === 12 && filters.page < 200 && (
              <a href={pageHref(filters.page + 1)}>{t.next}</a>
            )}
          </nav>
        )}
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}

export async function OpportunityDetail({
  locale,
  slug,
  feedback,
}: {
  locale: Locale;
  slug: string;
  feedback?: string;
}) {
  const t = opportunityCopy[locale];
  let item: Opportunity | undefined;
  try {
    item = (await searchOpportunities(defaultOpportunityFilters, slug))[0];
  } catch (error) {
    if (error instanceof OpportunityUnavailable)
      return (
        <main id="main" className="page-shell catalog-main">
          {state(t.unavailable)}
        </main>
      );
    throw error;
  }
  if (!item) notFound();
  return (
    <>
      <main id="main" className="page-shell catalog-main">
        <a href={`/${locale}/opportunities`}>{t.back}</a>
        <p className="section-kicker">
          {t.kinds[item.opportunity_type as keyof typeof t.kinds] ??
            item.opportunity_type}
        </p>
        <h1>{item.title}</h1>
        {item.summary && <p>{item.summary}</p>}
        <p>{t.note}</p>
        {feedback === 'saved' && (
          <p className="feedback-box feedback-box--success" role="status">
            {t.success}
          </p>
        )}
        {feedback === 'error' && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.failure}
          </p>
        )}
        <div className="catalog-detail-grid">
          <section className="catalog-card">
            <h2>{t.eligibility}</h2>
            <p>{item.eligibility_summary ?? t.unknown}</p>
            <p>
              {t.ageRange}:{' '}
              {range(
                item.eligibility_age_min,
                item.eligibility_age_max,
                t.unknown,
              )}
            </p>
            <p>
              {t.gradeRange}:{' '}
              {range(
                item.eligibility_grade_min,
                item.eligibility_grade_max,
                t.unknown,
              )}
            </p>
          </section>
          <section className="catalog-card">
            <h2>{t.host}</h2>
            <p>{item.provider_name ?? t.unknown}</p>
            <p>
              {t.format}:{' '}
              {item.participation_format === 'unknown'
                ? t.unknown
                : t.formats[item.participation_format]}
            </p>
            <p>
              {t.region}: {item.location_text ?? item.country_code ?? t.unknown}
            </p>
            <p>
              {t.fee}:{' '}
              {item.cost_state === 'free'
                ? t.free
                : item.cost_state === 'fee_waiver_available'
                  ? t.waiver
                  : item.cost_state === 'paid'
                    ? `${t.paid}${item.cost_amount_min === null ? '' : ` · ${item.cost_amount_min} ${item.cost_currency_code}`}`
                    : t.unknown}
            </p>
            <p>
              {t.close}:{' '}
              {displayDeadline(
                item.deadline_at,
                item.deadline_timezone,
                locale,
              ) ?? t.unknown}
            </p>
          </section>
        </div>
        {item.risk_summary && (
          <section className="catalog-card">
            <h2>{t.risk}</h2>
            <p>{item.risk_summary}</p>
          </section>
        )}
        <p className="catalog-source">
          {t.source}:{' '}
          <a href={item.source_url} target="_blank" rel="noopener noreferrer">
            {item.source_url} ↗
          </a>{' '}
          · {t.checked}: {displayDate(item.source_checked_at, locale)}
        </p>
        {item.official_application_url && (
          <p>
            <a
              className="ui-button ui-button--accent"
              href={item.official_application_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.official} ↗
            </a>
          </p>
        )}
        <form action={saveOpportunityAction} className="catalog-filter-actions">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="slug" value={item.slug} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnTo" value="detail" />
          <OpportunitySubmitButton
            label={t.save}
            pendingLabel={t.working}
            value="saved"
          />
          <OpportunitySubmitButton
            label={t.plan}
            pendingLabel={t.working}
            value="planned"
          />
        </form>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
