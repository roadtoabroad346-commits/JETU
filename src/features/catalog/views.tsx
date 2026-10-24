import type { Locale } from '@/lib/i18n/messages';
import { catalogCopy } from './copy';
import type {
  CatalogFilters,
  CatalogProgram,
  CatalogRow,
  CatalogSource,
} from './server';
import {
  CatalogUnavailable,
  getCampus,
  getIntakes,
  getRequirements,
  getFunding,
  getProgram,
  getUniversityById,
  getProgramsForUniversity,
  getSource,
  getUniversity,
  parseFilters,
  searchCatalog,
} from './server';
import { MarketingFooter } from '@/components/marketing/footer';
import { notFound } from 'next/navigation';

function date(value: string | null, locale: Locale) {
  return value
    ? new Intl.DateTimeFormat(
        locale === 'kk' ? 'kk-KZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
        { dateStyle: 'medium' },
      ).format(new Date(value))
    : null;
}
function price(
  amount: number | null,
  currency: string | null,
  period: string | null,
  asOf: string | null,
  locale: Locale,
) {
  const t = catalogCopy[locale];
  if (amount === null || !currency || !period || !asOf) return t.unknown;
  return `${new Intl.NumberFormat(locale === 'kk' ? 'kk-KZ' : locale === 'ru' ? 'ru-RU' : 'en-US', { style: 'currency', currency }).format(amount)} / ${t.period[period as keyof typeof t.period] ?? period} · ${date(asOf, locale)}`;
}
function sourceBlock(source: CatalogSource | null, locale: Locale) {
  const t = catalogCopy[locale];
  return (
    source && (
      <p className="catalog-source">
        <a href={source.official_url} target="_blank" rel="noopener noreferrer">
          {t.source}: {source.publisher}
        </a>{' '}
        · {t.reviewed}: {date(source.reviewed_at, locale)}
      </p>
    )
  );
}
function link(locale: Locale, filters: CatalogFilters, page: number) {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, page }))
    if (value !== '' && value !== undefined) url.set(key, String(value));
  return `/${locale}/universities?${url.toString()}`;
}
const keys = [
  'q',
  'country',
  'city',
  'major',
  'language',
  'exam',
  'intake',
] as const;
export async function CatalogSearch({
  locale,
  input,
}: {
  locale: Locale;
  input: Record<string, string | string[] | undefined>;
}) {
  const t = catalogCopy[locale];
  const parsed = parseFilters(input);
  let rows: CatalogRow[] = [];
  let error = '';
  if (!parsed.success) error = t.invalid;
  else
    try {
      rows = await searchCatalog(parsed.data);
    } catch {
      error = t.unavailable;
    }
  const filters = parsed.success ? parsed.data : null;
  const total = rows[0]?.total_count ?? 0;
  return (
    <>
      <main id="main" tabIndex={-1} className="page-shell catalog-main">
        <div className="catalog-intro">
          <p className="section-kicker">JETU / {t.results}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <form
          action={`/${locale}/universities`}
          method="get"
          className="catalog-filters"
          aria-label={t.search}
        >
          {keys.map((key) => (
            <label key={key}>
              {key === 'q' ? t.search : t[key]}
              <input
                name={key}
                defaultValue={filters?.[key] ?? ''}
                maxLength={80}
              />
            </label>
          ))}
          <label>
            {t.level}
            <select name="level" defaultValue={filters?.level ?? ''}>
              <option value="">—</option>
              {Object.entries(t.levels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.mode}
            <select name="mode" defaultValue={filters?.mode ?? ''}>
              <option value="">—</option>
              {Object.entries(t.modes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
            {t.maxTuition}
            <input
              type="number"
              min="0"
              step="0.01"
              name="maxTuition"
              defaultValue={filters?.maxTuition ?? ''}
            />
          </label>
          <label>
            {t.currency}
            <input
              name="currency"
              maxLength={3}
              pattern="[A-Z]{3}"
              placeholder="USD"
              defaultValue={filters?.currency ?? ''}
            />
          </label>
          <label>
            {t.sort}
            <select name="sort" defaultValue={filters?.sort ?? 'name'}>
              {Object.entries(t.sortNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="catalog-check">
            <input
              type="checkbox"
              name="funding"
              value="yes"
              defaultChecked={filters?.funding === 'yes'}
            />
            {t.funding}
          </label>
          <div className="catalog-filter-actions">
            <button className="ui-button ui-button--primary" type="submit">
              {t.apply}
            </button>
            <a className="ui-button" href={`/${locale}/universities`}>
              {t.reset}
            </a>
          </div>
        </form>
        <section
          className="catalog-results"
          aria-live="polite"
          aria-labelledby="catalog-result-title"
        >
          <h2 id="catalog-result-title">
            {t.results}
            {!error && ` · ${total}`}
          </h2>
          {error ? (
            <div className="catalog-state" role="alert">
              <p>{error}</p>
              <a href={`/${locale}/universities`}>{t.reset}</a>
            </div>
          ) : rows.length === 0 ? (
            <div className="catalog-state">
              <p>{t.empty}</p>
              <a href={`/${locale}/universities`}>{t.reset}</a>
            </div>
          ) : (
            <div className="catalog-list">
              {rows.map((row) => (
                <article className="catalog-card" key={row.id}>
                  <p className="section-kicker">
                    {row.country} · {row.city} ·{' '}
                    {t.levels[row.level as keyof typeof t.levels] ?? row.level}
                  </p>
                  <h3>
                    <a href={`/${locale}/programs/${row.id}`}>
                      {row.program_name}
                    </a>
                  </h3>
                  <p>
                    <a href={`/${locale}/universities/${row.university_slug}`}>
                      {row.university_name}
                    </a>{' '}
                    · {row.major} · {row.teaching_language}
                  </p>
                  <p>
                    {t.cost}:{' '}
                    {price(
                      row.tuition_amount,
                      row.tuition_currency,
                      row.tuition_period,
                      row.tuition_as_of,
                      locale,
                    )}
                  </p>
                  {row.next_deadline && (
                    <p>
                      {t.deadlineLabel}: {date(row.next_deadline, locale)}
                    </p>
                  )}
                  <a
                    className="catalog-more"
                    href={`/${locale}/programs/${row.id}`}
                  >
                    {t.details} →
                  </a>
                </article>
              ))}
            </div>
          )}
          {filters && total > 12 && (
            <nav className="catalog-pages" aria-label={t.pagination}>
              {filters.page > 1 && (
                <a href={link(locale, filters, filters.page - 1)}>
                  {t.previous}
                </a>
              )}
              <span>
                {filters.page} / {Math.ceil(total / 12)}
              </span>
              {filters.page * 12 < total && (
                <a href={link(locale, filters, filters.page + 1)}>{t.next}</a>
              )}
            </nav>
          )}
        </section>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
function ErrorView({ locale }: { locale: Locale }) {
  const t = catalogCopy[locale];
  return (
    <>
      <main id="main" className="page-shell catalog-main">
        <h1>{t.title}</h1>
        <p role="alert">{t.unavailable}</p>
        <a href={`/${locale}/universities`}>{t.reset}</a>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
export async function UniversityDetail({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  let university: Awaited<ReturnType<typeof getUniversity>>;
  let programs: CatalogProgram[];
  let source: CatalogSource | null;
  try {
    university = await getUniversity(slug);
    if (!university) notFound();
    [programs, source] = await Promise.all([
      getProgramsForUniversity(university.id),
      getSource(university.source_id),
    ]);
  } catch (error) {
    if (error instanceof CatalogUnavailable)
      return <ErrorView locale={locale} />;
    throw error;
  }
  const t = catalogCopy[locale];
  return (
    <>
      <main id="main" className="page-shell catalog-main">
        <p className="section-kicker">
          {t.university} · {university.country}
        </p>
        <h1>{university.name}</h1>
        {(university.official_url || source?.official_url) && (
          <p>
            <a
              href={university.official_url || source?.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.official} ↗
            </a>
          </p>
        )}
        {sourceBlock(source, locale)}
        <section className="catalog-results">
          <h2>{t.results}</h2>
          {programs.length ? (
            <div className="catalog-list">
              {programs.map((program) => (
                <article className="catalog-card" key={program.id}>
                  <h3>
                    <a href={`/${locale}/programs/${program.id}`}>
                      {program.name}
                    </a>
                  </h3>
                  <p>
                    {t.levels[program.level as keyof typeof t.levels] ??
                      program.level}{' '}
                    · {program.major} · {program.teaching_language}
                  </p>
                  <p>
                    {t.cost}:{' '}
                    {price(
                      program.tuition_amount,
                      program.tuition_currency,
                      program.tuition_period,
                      program.tuition_as_of,
                      locale,
                    )}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p>{t.noPrograms}</p>
          )}
        </section>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
export async function ProgramDetail({
  locale,
  id,
}: {
  locale: Locale;
  id: string;
}) {
  let program: CatalogProgram | null;
  let university: Awaited<ReturnType<typeof getUniversity>>;
  let campus: Awaited<ReturnType<typeof getCampus>>;
  let source: CatalogSource | null;
  let intakes: Awaited<ReturnType<typeof getIntakes>>;
  let requirements: Awaited<ReturnType<typeof getRequirements>>;
  let funding: Awaited<ReturnType<typeof getFunding>>;
  try {
    program = await getProgram(id);
    if (!program) notFound();
    const rows = await Promise.all([
      getUniversityById(program.university_id),
      program.campus_id ? getCampus(program.campus_id) : Promise.resolve(null),
      getSource(program.source_id),
      getIntakes(program.id),
      getRequirements(program.id),
      getFunding(program.id),
    ]);
    [university, campus, source, intakes, requirements, funding] = rows;
    if (!university) notFound();
  } catch (error) {
    if (error instanceof CatalogUnavailable)
      return <ErrorView locale={locale} />;
    throw error;
  }
  const t = catalogCopy[locale];
  return (
    <>
      <main id="main" className="page-shell catalog-main">
        <p className="section-kicker">
          {t.program} ·{' '}
          {t.levels[program.level as keyof typeof t.levels] ?? program.level}
        </p>
        <h1>{program.name}</h1>
        <p>
          <a href={`/${locale}/universities/${university.slug}`}>
            {university.name}
          </a>{' '}
          · {campus?.city}, {campus?.country}
        </p>
        <div className="catalog-detail-grid">
          <section className="catalog-card">
            <h2>{t.cost}</h2>
            <p>
              {price(
                program.tuition_amount,
                program.tuition_currency,
                program.tuition_period,
                program.tuition_as_of,
                locale,
              )}
            </p>
            <p>
              {t.mode}:{' '}
              {t.modes[program.study_mode as keyof typeof t.modes] ??
                program.study_mode}
            </p>
          </section>
          <section className="catalog-card">
            <h2>{t.requirements}</h2>
            {requirements.descriptions.length ? (
              <ul>
                {requirements.descriptions.map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
            <h3>{t.exams}</h3>
            <p>{requirements.exams.join(', ') || t.unknown}</p>
          </section>
          <section className="catalog-card">
            <h2>{t.intakes}</h2>
            {intakes.length ? (
              <ul>
                {intakes.map((intake, index) => (
                  <li key={index}>
                    {intake.label} · {t.deadlineLabel}:{' '}
                    {date(intake.deadline_at, locale) ?? t.unknown}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
          </section>
          <section className="catalog-card">
            <h2>{t.fundingLabel}</h2>
            {funding.length ? (
              <ul>
                {funding.map((item, index) => (
                  <li key={`${index}-${item.official_url}`}>
                    <a
                      href={item.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
          </section>
        </div>
        {sourceBlock(source, locale)}
        {(university.official_url || source?.official_url) && (
          <p>
            <a
              href={university.official_url || source?.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.official} ↗
            </a>
          </p>
        )}
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
