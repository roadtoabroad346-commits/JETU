import { notFound } from 'next/navigation';
import { MarketingFooter } from '@/components/marketing/footer';
import type { Locale } from '@/lib/i18n/messages';
import { saveCatalogItem, saveSearch } from './actions';
import { SearchAutocomplete } from './autocomplete';
import { searchCopy } from './copy';
import {
  getOpportunityDetail,
  getProgramComparison,
  getScholarshipDetail,
  parseCompareIds,
  parseSearchFilters,
  SearchUnavailable,
  searchUnified,
  type ProgramComparison,
  type SearchEntityType,
  type SearchFilters,
  type UnifiedSearchRow,
} from './server';

const localeTag = (locale: Locale) =>
  locale === 'kk' ? 'kk-KZ' : locale === 'ru' ? 'ru-RU' : 'en-US';

function formatDate(value: string | null, locale: Locale) {
  return value
    ? new Intl.DateTimeFormat(localeTag(locale), {
        dateStyle: 'medium',
      }).format(new Date(value))
    : null;
}

function formatMoney(row: UnifiedSearchRow, locale: Locale) {
  const t = searchCopy[locale];
  if (row.cost_amount_min === null || !row.cost_currency) return t.unknown;
  const number = new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: row.cost_currency,
    maximumFractionDigits: 2,
  });
  const min = number.format(row.cost_amount_min);
  const range =
    row.cost_amount_max === null || row.cost_amount_max === row.cost_amount_min
      ? min
      : `${min}–${number.format(row.cost_amount_max)}`;
  return row.cost_period ? `${range} / ${row.cost_period}` : range;
}

function queryHref(
  locale: Locale,
  filters: SearchFilters,
  changes: Partial<SearchFilters>,
) {
  const values = { ...filters, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== '' && value !== undefined && !(key === 'page' && value === 1))
      params.set(key, String(value));
  }
  const query = params.toString();
  return `/${locale}/search${query ? `?${query}` : ''}`;
}

function compareHref(locale: Locale, filters: SearchFilters, id: number) {
  const current = parseCompareIds(filters.compare) ?? [];
  const ids = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id].slice(0, 4);
  return queryHref(locale, filters, { compare: ids.join(','), page: 1 });
}

const filterKeys = [
  'q',
  'type',
  'country',
  'level',
  'category',
  'format',
  'funding',
  'cost',
  'deadline',
] as const;

function activeFilterLabel(key: (typeof filterKeys)[number], locale: Locale) {
  const t = searchCopy[locale];
  return key === 'q' ? t.query : t[key];
}

function activeFilterValue(
  key: (typeof filterKeys)[number],
  value: string,
  locale: Locale,
) {
  const t = searchCopy[locale];
  if (key === 'type' && value in t) {
    return t[value as SearchEntityType];
  }
  const options: Record<string, string> = {
    bachelor: t.option.bachelor,
    master: t.option.master,
    doctorate: t.option.doctorate,
    associate: t.option.associate,
    foundation: t.option.foundation,
    on_campus: t.option.onCampus,
    in_person: t.option.inPerson,
    online: t.option.online,
    hybrid: t.option.hybrid,
    partial: t.option.partial,
    full_tuition: t.option.fullTuition,
    tuition_stipend: t.option.tuitionStipend,
    comprehensive: t.option.comprehensive,
    free: t.option.free,
    paid: t.option.paid,
    fee_waiver_available: t.option.feeWaiver,
    unknown: t.unknown,
  };
  return options[value] ?? value;
}

function ActiveFilters({
  locale,
  filters,
}: {
  locale: Locale;
  filters: SearchFilters;
}) {
  const t = searchCopy[locale];
  const active = filterKeys.filter((key) => filters[key] !== '');
  if (!active.length) return null;
  return (
    <section className="search-active" aria-label={t.activeFilters}>
      {active.map((key) => (
        <a key={key} href={queryHref(locale, filters, { [key]: '', page: 1 })}>
          <span>
            {activeFilterLabel(key, locale)}:{' '}
            {activeFilterValue(key, filters[key], locale)}
          </span>
          <span aria-label={t.removeFilter}>×</span>
        </a>
      ))}
    </section>
  );
}

function SearchCard({
  locale,
  filters,
  row,
}: {
  locale: Locale;
  filters: SearchFilters;
  row: UnifiedSearchRow;
}) {
  const t = searchCopy[locale];
  const compared = (parseCompareIds(filters.compare) ?? []).includes(
    row.entity_id,
  );
  const compareCount = (parseCompareIds(filters.compare) ?? []).length;
  return (
    <article className="search-card">
      <div className="search-card-meta">
        <span className="ui-badge">{t[row.entity_type]}</span>
        <span
          className={`ui-badge ${row.source_freshness === 'stale' ? 'ui-badge--warning' : 'ui-badge--success'}`}
        >
          {row.source_freshness === 'stale' ? t.stale : t.current}
        </span>
      </div>
      <h3>
        <a href={`/${locale}${row.detail_path}`}>{row.title}</a>
      </h3>
      <p>
        {row.subtitle ?? t.unknown}
        {row.country_code ? ` · ${row.country_code}` : ''}
      </p>
      <dl className="search-facts">
        <div>
          <dt>{t.category}</dt>
          <dd>{row.category ?? t.unknown}</dd>
        </div>
        <div>
          <dt>{t.deadline}</dt>
          <dd>{formatDate(row.deadline_at, locale) ?? t.unknown}</dd>
        </div>
        <div>
          <dt>{t.costLabel}</dt>
          <dd>{formatMoney(row, locale)}</dd>
        </div>
        <div>
          <dt>{t.funding}</dt>
          <dd>{row.has_funding ? t.fundingAvailable : t.noFunding}</dd>
        </div>
      </dl>
      <p className="search-eligibility">{t.notEvaluated}</p>
      <p className="search-source">
        <a href={row.source_url} target="_blank" rel="noopener noreferrer">
          {t.source}
        </a>
        {' · '}
        {t.checked}: {formatDate(row.source_checked_at, locale) ?? t.unknown}
      </p>
      <div className="search-card-actions">
        <a
          className="ui-button ui-button--secondary"
          href={`/${locale}${row.detail_path}`}
        >
          {t.details}
        </a>
        <form action={saveCatalogItem.bind(null, locale, row.entity_id)}>
          <button className="ui-button" type="submit">
            {t.saveItem}
          </button>
        </form>
        {row.entity_type === 'program' && (
          <a
            className="ui-button"
            aria-disabled={!compared && compareCount >= 4 ? true : undefined}
            data-selected={compared ? 'true' : undefined}
            href={
              !compared && compareCount >= 4
                ? undefined
                : compareHref(locale, filters, row.entity_id)
            }
          >
            {compared ? t.compareSelected : t.compareAdd}
          </a>
        )}
      </div>
    </article>
  );
}

export async function UnifiedSearchPage({
  locale,
  input,
}: {
  locale: Locale;
  input: Record<string, string | string[] | undefined>;
}) {
  const t = searchCopy[locale];
  const parsed = parseSearchFilters(input);
  let rows: UnifiedSearchRow[] = [];
  let error = '';
  if (!parsed.success) error = t.invalid;
  else {
    try {
      rows = await searchUnified(parsed.data);
    } catch {
      error = t.unavailable;
    }
  }
  const filters = parsed.success ? parsed.data : null;
  const total = rows[0]?.total_count ?? 0;
  const counts = rows[0]?.type_counts ?? {
    program: 0,
    scholarship: 0,
    opportunity: 0,
  };
  const compareIds = filters ? (parseCompareIds(filters.compare) ?? []) : [];
  return (
    <>
      <main id="main" tabIndex={-1} className="page-shell search-main">
        <header className="search-intro">
          <p className="section-kicker">JETU / {t.search}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>
        <form
          action={`/${locale}/search`}
          method="get"
          className="search-filters"
          aria-label={t.filters}
        >
          <SearchAutocomplete
            locale={locale}
            label={t.query}
            hint={t.queryHint}
            suggestionsLabel={t.suggestions}
            loadingLabel={t.loadingSuggestions}
            emptyLabel={t.noSuggestions}
            defaultValue={filters?.q ?? ''}
            type={filters?.type ?? ''}
          />
          <label>
            {t.type}
            <select name="type" defaultValue={filters?.type ?? ''}>
              <option value="">{t.all}</option>
              <option value="program">{t.program}</option>
              <option value="scholarship">{t.scholarship}</option>
              <option value="opportunity">{t.opportunity}</option>
            </select>
          </label>
          <label>
            {t.country}
            <input
              name="country"
              maxLength={2}
              pattern="[A-Za-z]{2}"
              defaultValue={filters?.country ?? ''}
            />
          </label>
          <label>
            {t.level}
            <select name="level" defaultValue={filters?.level ?? ''}>
              <option value="">—</option>
              <option value="bachelor">{t.option.bachelor}</option>
              <option value="master">{t.option.master}</option>
              <option value="doctorate">{t.option.doctorate}</option>
              <option value="associate">{t.option.associate}</option>
              <option value="foundation">{t.option.foundation}</option>
            </select>
          </label>
          <label>
            {t.category}
            <input
              name="category"
              maxLength={80}
              defaultValue={filters?.category ?? ''}
            />
          </label>
          <label>
            {t.format}
            <select name="format" defaultValue={filters?.format ?? ''}>
              <option value="">—</option>
              <option value="on_campus">{t.option.onCampus}</option>
              <option value="in_person">{t.option.inPerson}</option>
              <option value="online">{t.option.online}</option>
              <option value="hybrid">{t.option.hybrid}</option>
              <option value="unknown">{t.unknown}</option>
            </select>
          </label>
          <label>
            {t.funding}
            <select name="funding" defaultValue={filters?.funding ?? ''}>
              <option value="">—</option>
              <option value="partial">{t.option.partial}</option>
              <option value="full_tuition">{t.option.fullTuition}</option>
              <option value="tuition_stipend">{t.option.tuitionStipend}</option>
              <option value="comprehensive">{t.option.comprehensive}</option>
              <option value="unknown">{t.unknown}</option>
            </select>
          </label>
          <label>
            {t.cost}
            <select name="cost" defaultValue={filters?.cost ?? ''}>
              <option value="">—</option>
              <option value="free">{t.option.free}</option>
              <option value="paid">{t.option.paid}</option>
              <option value="fee_waiver_available">{t.option.feeWaiver}</option>
              <option value="unknown">{t.unknown}</option>
            </select>
          </label>
          <label>
            {t.deadline}
            <input
              type="date"
              name="deadline"
              defaultValue={filters?.deadline ?? ''}
            />
          </label>
          <label>
            {t.sort}
            <select name="sort" defaultValue={filters?.sort ?? 'relevance'}>
              <option value="relevance">{t.relevance}</option>
              <option value="recent">{t.recent}</option>
              <option value="deadline">{t.deadlineSort}</option>
              <option value="title">{t.titleSort}</option>
            </select>
          </label>
          {filters?.compare && (
            <input type="hidden" name="compare" value={filters.compare} />
          )}
          <div className="search-filter-actions">
            <button className="ui-button ui-button--primary" type="submit">
              {t.apply}
            </button>
            <a className="ui-button" href={`/${locale}/search`}>
              {t.clear}
            </a>
          </div>
        </form>
        {filters && <ActiveFilters locale={locale} filters={filters} />}
        {filters && (
          <form
            className="save-search-form"
            action={saveSearch.bind(null, locale, JSON.stringify(filters))}
          >
            <label>
              {t.saveName}
              <input name="name" required minLength={1} maxLength={80} />
            </label>
            <button className="ui-button" type="submit">
              {t.saveSearch}
            </button>
          </form>
        )}
        {filters && compareIds.length > 0 && (
          <aside className="compare-tray" aria-label={t.compareTitle}>
            <p>
              <strong>
                {t.compareTitle}: {compareIds.length}/4
              </strong>
              <span>{t.compareHint}</span>
            </p>
            {compareIds.length >= 2 && (
              <a
                className="ui-button ui-button--accent"
                href={`/${locale}/compare?ids=${compareIds.join(',')}`}
              >
                {t.compareOpen}
              </a>
            )}
          </aside>
        )}
        <section
          className="search-results"
          aria-live="polite"
          aria-labelledby="search-results-title"
        >
          <div className="search-results-heading">
            <h2 id="search-results-title">
              {t.results}
              {!error && ` · ${total}`}
            </h2>
            {!error && total > 0 && (
              <p aria-label={t.counts}>
                {t.program}: {counts.program} · {t.scholarship}:{' '}
                {counts.scholarship} · {t.opportunity}: {counts.opportunity}
              </p>
            )}
          </div>
          {error ? (
            <div className="search-state" role="alert">
              <p>{error}</p>
              <a href={`/${locale}/search`}>{t.clear}</a>
            </div>
          ) : rows.length === 0 ? (
            <div className="search-state">
              <h3>{t.empty}</h3>
              <p>{t.emptyHelp}</p>
              <a href={`/${locale}/search`}>{t.clear}</a>
            </div>
          ) : (
            <div className="search-list">
              {rows.map((row) => (
                <SearchCard
                  key={`${row.entity_type}:${row.entity_id}`}
                  locale={locale}
                  filters={filters!}
                  row={row}
                />
              ))}
            </div>
          )}
          {filters && total > 20 && (
            <nav className="search-pages" aria-label={t.pagination}>
              {filters.page > 1 && (
                <a
                  href={queryHref(locale, filters, { page: filters.page - 1 })}
                >
                  {t.previous}
                </a>
              )}
              <span>
                {filters.page} / {Math.ceil(total / 20)}
              </span>
              {filters.page * 20 < total && filters.page < 241 && (
                <a
                  href={queryHref(locale, filters, { page: filters.page + 1 })}
                >
                  {t.next}
                </a>
              )}
            </nav>
          )}
        </section>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}

function compareValue(program: ProgramComparison, key: string, locale: Locale) {
  const t = searchCopy[locale];
  switch (key) {
    case 'provider':
      return program.subtitle ?? t.unknown;
    case 'country':
      return program.country_code ?? t.unknown;
    case 'level':
      return program.degree_level
        ? activeFilterValue('level', program.degree_level, locale)
        : t.unknown;
    case 'category':
      return program.category ?? t.unknown;
    case 'languages':
      return program.languages.length
        ? program.languages.join(', ')
        : t.unknown;
    case 'format':
      return program.formats.length
        ? program.formats
            .map((value) => activeFilterValue('format', value, locale))
            .join(', ')
        : t.unknown;
    case 'tuition':
      return formatMoney(program, locale);
    case 'totalCost':
      return t.unknown;
    case 'deadline':
      return formatDate(program.deadline_at, locale) ?? t.unknown;
    case 'funding':
      return program.has_funding ? t.fundingAvailable : t.noFunding;
    case 'fit':
      return t.notEvaluated;
    case 'source':
      return `${program.source_freshness === 'current' ? t.current : t.stale} · ${formatDate(program.source_checked_at, locale) ?? t.unknown}`;
    default:
      return t.unknown;
  }
}

export async function ProgramComparePage({
  locale,
  idsInput,
}: {
  locale: Locale;
  idsInput: string | string[] | undefined;
}) {
  const t = searchCopy[locale];
  const ids = parseCompareIds(idsInput);
  let programs: ProgramComparison[] = [];
  let error = !ids || ids.length < 2 ? t.compareInvalid : '';
  if (!error) {
    try {
      programs = await getProgramComparison(ids!);
    } catch {
      error = t.unavailable;
    }
    if (!error && programs.length !== ids!.length) error = t.compareMissing;
  }
  const fields = Object.keys(t.field) as Array<keyof typeof t.field>;
  return (
    <>
      <main id="main" tabIndex={-1} className="page-shell compare-main">
        <header className="search-intro">
          <p className="section-kicker">JETU / {t.compareTitle}</p>
          <h1>{t.compareTitle}</h1>
          <p>{t.sparse}</p>
        </header>
        {error ? (
          <div className="search-state" role="alert">
            <p>{error}</p>
            <a href={`/${locale}/search`}>{t.search}</a>
          </div>
        ) : (
          <div
            className="compare-scroll"
            role="region"
            aria-label={t.compareTitle}
          >
            <table className="compare-table">
              <caption>{t.compareHint}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.field.provider}</th>
                  {programs.map((program) => (
                    <th scope="col" key={program.entity_id}>
                      <a href={`/${locale}${program.detail_path}`}>
                        {program.title}
                      </a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => {
                  const values = programs.map((program) =>
                    field === 'requirements'
                      ? JSON.stringify(
                          program.requirements.map((item) => [
                            item.title,
                            item.description,
                            item.isMandatory,
                          ]),
                        )
                      : compareValue(program, field, locale),
                  );
                  const same = new Set(values).size === 1;
                  return (
                    <tr
                      key={field}
                      data-comparison={same ? 'same' : 'different'}
                    >
                      <th scope="row">
                        {t.field[field]}
                        <small>{same ? t.same : t.different}</small>
                      </th>
                      {programs.map((program) => (
                        <td key={program.entity_id}>
                          {field === 'requirements' ? (
                            program.requirements.length ? (
                              <ul>
                                {program.requirements.map((item) => (
                                  <li key={`${item.title}:${item.description}`}>
                                    <strong>{item.title}</strong> —{' '}
                                    {item.description} (
                                    {item.isMandatory
                                      ? t.required
                                      : t.conditional}
                                    )
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              t.unknown
                            )
                          ) : field === 'source' ? (
                            <a
                              href={program.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {compareValue(program, field, locale)}
                            </a>
                          ) : (
                            compareValue(program, field, locale)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}

function DetailShell({
  locale,
  kicker,
  title,
  sourceUrl,
  checkedAt,
  children,
}: {
  locale: Locale;
  kicker: string;
  title: string;
  sourceUrl: string;
  checkedAt: string;
  children: React.ReactNode;
}) {
  const t = searchCopy[locale];
  return (
    <>
      <main id="main" tabIndex={-1} className="page-shell search-detail">
        <p className="section-kicker">JETU / {kicker}</p>
        <h1>{title}</h1>
        {children}
        <p className="search-source">
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {t.source}
          </a>
          {' · '}
          {t.checked}: {formatDate(checkedAt, locale) ?? t.unknown}
        </p>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}

export async function ScholarshipDetailPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  let item;
  try {
    item = await getScholarshipDetail(slug);
  } catch (error) {
    if (error instanceof SearchUnavailable)
      return <SearchError locale={locale} />;
    throw error;
  }
  if (!item) notFound();
  const t = searchCopy[locale];
  return (
    <DetailShell
      locale={locale}
      kicker={t.scholarshipTitle}
      title={item.title}
      sourceUrl={item.source_url}
      checkedAt={item.source_checked_at}
    >
      <dl className="detail-facts">
        <div>
          <dt>{t.provider}</dt>
          <dd>{item.provider_name ?? t.unknown}</dd>
        </div>
        <div>
          <dt>{t.awardType}</dt>
          <dd>{item.award_type}</dd>
        </div>
        <div>
          <dt>{t.deadline}</dt>
          <dd>
            {formatDate(item.deadline_at, locale) ?? t.unknown}
            {item.deadline_timezone ? ` · ${item.deadline_timezone}` : ''}
          </dd>
        </div>
        <div>
          <dt>{t.coverage}</dt>
          <dd>{item.benefit_summary ?? t.unknown}</dd>
        </div>
      </dl>
      <a
        className="ui-button ui-button--primary"
        href={item.official_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t.officialApply}
      </a>
    </DetailShell>
  );
}

function range(min: number | null, max: number | null, unknown: string) {
  if (min === null && max === null) return unknown;
  if (min !== null && max !== null)
    return min === max ? String(min) : `${min}–${max}`;
  return min !== null ? `${min}+` : `≤ ${max}`;
}

export async function OpportunityDetailPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  let item;
  try {
    item = await getOpportunityDetail(slug);
  } catch (error) {
    if (error instanceof SearchUnavailable)
      return <SearchError locale={locale} />;
    throw error;
  }
  if (!item) notFound();
  const t = searchCopy[locale];
  return (
    <DetailShell
      locale={locale}
      kicker={t.opportunityTitle}
      title={item.title}
      sourceUrl={item.source_url}
      checkedAt={item.source_checked_at}
    >
      {item.summary && <p className="detail-summary">{item.summary}</p>}
      <p className="search-eligibility">{t.notEvaluated}</p>
      <dl className="detail-facts">
        <div>
          <dt>{t.provider}</dt>
          <dd>{item.provider_name ?? t.unknown}</dd>
        </div>
        <div>
          <dt>{t.category}</dt>
          <dd>{item.opportunity_type}</dd>
        </div>
        <div>
          <dt>{t.format}</dt>
          <dd>{item.participation_format}</dd>
        </div>
        <div>
          <dt>{t.location}</dt>
          <dd>{item.location_text ?? item.country_code ?? t.unknown}</dd>
        </div>
        <div>
          <dt>{t.costLabel}</dt>
          <dd>
            {item.cost_state}
            {item.cost_amount_min !== null
              ? ` · ${item.cost_amount_min}${item.cost_currency_code ? ` ${item.cost_currency_code}` : ''}`
              : ''}
          </dd>
        </div>
        <div>
          <dt>{t.deadline}</dt>
          <dd>{formatDate(item.deadline_at, locale) ?? t.unknown}</dd>
        </div>
        <div>
          <dt>{t.ageRange}</dt>
          <dd>
            {range(
              item.eligibility_age_min,
              item.eligibility_age_max,
              t.unknown,
            )}
          </dd>
        </div>
        <div>
          <dt>{t.gradeRange}</dt>
          <dd>
            {range(
              item.eligibility_grade_min,
              item.eligibility_grade_max,
              t.unknown,
            )}
          </dd>
        </div>
        <div>
          <dt>{t.eligibilityFacts}</dt>
          <dd>{item.eligibility_summary ?? t.unknown}</dd>
        </div>
        <div>
          <dt>{t.risk}</dt>
          <dd>{item.risk_summary ?? t.unknown}</dd>
        </div>
      </dl>
      {item.official_application_url && (
        <a
          className="ui-button ui-button--primary"
          href={item.official_application_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.officialApply}
        </a>
      )}
    </DetailShell>
  );
}

function SearchError({ locale }: { locale: Locale }) {
  const t = searchCopy[locale];
  return (
    <>
      <main id="main" className="page-shell search-main">
        <h1>{t.search}</h1>
        <div className="search-state" role="alert">
          <p>{t.unavailable}</p>
          <a href={`/${locale}/search`}>{t.search}</a>
        </div>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
