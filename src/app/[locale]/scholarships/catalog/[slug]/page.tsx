import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { getScholarship } from '@/features/scholarships/server';
import { freshness, serverNow } from '@/features/scholarships/classification';
import {
  scholarshipCopy,
  coverageLabel,
  termLabel,
} from '@/features/scholarships/copy';
import { MarketingFooter } from '@/components/marketing/footer';

export const dynamic = 'force-dynamic';
export default async function ScholarshipDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const result = await getScholarship(slug);
  const t = scholarshipCopy[locale];
  if (result.state === 'ready' && !result.data) notFound();
  if (result.state === 'unavailable')
    return (
      <>
        <main id="main" className="page-shell scholarship-main">
          <h1>{t.title}</h1>
          <p role="alert">{t.unavailable}</p>
          <a href={`/${locale}/scholarships/catalog`}>{t.back}</a>
        </main>
        <MarketingFooter locale={locale} />
      </>
    );
  const {
    row,
    cycles,
    benefits,
    limits,
    funding,
    programs,
    requirements,
    deadlines,
    documents,
    application,
  } = result.data!;
  const checkedAt = await serverNow();
  const date = (value: string, zone: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: zone,
    }).format(new Date(value));
  return (
    <>
      <main id="main" className="page-shell scholarship-main">
        <a href={`/${locale}/scholarships/catalog`}>{t.back}</a>
        <div className="scholarship-hero">
          <p className="section-kicker">
            {row.provider_name ?? t.unknown} ·{' '}
            {row.provider_country_code ?? t.unknown}
          </p>
          <h1>{row.title}</h1>
          <strong>
            {coverageLabel(locale, funding?.funding_label ?? 'unknown')}
          </strong>
          <p>
            {t.checked}: {date(row.source_checked_at, 'UTC')} UTC
          </p>
          {freshness(row.source_checked_at) === 'review_due' && (
            <p className="scholarship-notice">{t.stale}</p>
          )}
          <p>
            {t.method}: {application?.application_method ?? t.unknown};{' '}
            {application?.admissions_linkage ?? t.unknown}
          </p>
          {application?.instructions && <p>{application.instructions}</p>}
          <a
            className="ui-button ui-button--primary"
            href={application?.application_url ?? row.official_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.apply}
          </a>
        </div>
        <div className="scholarship-detail-grid">
          <section>
            <h2>{t.coverage}</h2>
            {benefits.length ? (
              <ul>
                {benefits.map((benefit) => (
                  <li
                    key={`${benefit.scholarship_cycle_id}-${benefit.coverage_item_code}`}
                  >
                    {benefit.coverage_item_code}: {benefit.description}
                    {benefit.coverage_percent !== null
                      ? ` · ${benefit.coverage_percent}%`
                      : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
            {limits.length > 0 && (
              <ul>
                {limits.map((limit, index) => (
                  <li key={`${limit.scholarship_benefit_id}-${index}`}>
                    {limit.amount_min ?? t.unknown}–
                    {limit.amount_max ?? t.unknown} {limit.currency_code ?? ''}{' '}
                    / {limit.limit_period}
                    {limit.renewal_conditions
                      ? ` · ${limit.renewal_conditions}`
                      : ''}
                  </li>
                ))}
              </ul>
            )}
            <p>
              {t.costs}: {funding?.uncovered_costs_note ?? t.unknown}
            </p>
            <p>
              {t.duration}: {funding?.duration_note ?? t.unknown};{' '}
              {funding?.renewal_conditions ?? t.unknown}
            </p>
            {funding?.annual_change_note && <p>{funding.annual_change_note}</p>}
          </section>
          <section>
            <h2>{t.eligibility}</h2>
            {requirements.length ? (
              <ul>
                {requirements.map((requirement) => (
                  <li key={requirement.id}>
                    {requirement.title}: {requirement.description} (
                    {requirement.is_mandatory
                      ? termLabel(locale, 'required')
                      : t.notMandatory}
                    )
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
          </section>
          <section>
            <h2>{t.deadlines}</h2>
            {deadlines.length ? (
              <ul>
                {deadlines.map((deadline) => (
                  <li key={deadline.id}>
                    {deadline.title}:{' '}
                    {deadline.due_at
                      ? `${date(deadline.due_at, deadline.timezone_name ?? 'UTC')} ${deadline.timezone_name ?? 'UTC'}${new Date(deadline.due_at).getTime() < checkedAt ? ` · ${t.passed}` : ''}`
                      : t.unknown}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
          </section>
          <section>
            <h2>{t.documents}</h2>
            {documents.length ? (
              <ul>
                {documents.map((document) => (
                  <li key={document.document_name}>
                    {document.document_name}: {document.requirement_state}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
          </section>
          <section>
            <h2>{t.source}</h2>
            <p>
              <a
                href={row.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.source_url}
              </a>
            </p>
            <p>
              {t.checked}: {date(row.source_checked_at, 'UTC')} UTC
            </p>
          </section>
          <section>
            <h2>{t.detail}</h2>
            <p>
              {cycles.length
                ? cycles
                    .map(
                      (cycle) =>
                        `${cycle.academic_year_start} ${cycle.cycle_code}`,
                    )
                    .join(', ')
                : t.unknown}
            </p>
          </section>
          <section>
            <h2>{t.programs}</h2>
            {programs.length ? (
              <ul>
                {programs.map((program) => (
                  <li key={program.id}>
                    <a href={`/${locale}/programs/${program.id}`}>
                      {program.title}
                    </a>{' '}
                    · {program.degree_level_code}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.unknown}</p>
            )}
          </section>
        </div>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
