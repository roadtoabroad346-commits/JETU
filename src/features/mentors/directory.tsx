'use client';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Icon } from '@/components/ui/icon';
import type { Locale } from '@/lib/i18n/messages';
import { requestData } from '@/features/writing/client';
import { mentorCopy, label } from './copy';
import { serviceKinds, type Mentor } from './contracts';
import { filterMentors } from './domain';
export function MentorDirectory({
  locale,
  query = '',
}: {
  locale: Locale;
  query?: string;
}) {
  const t = mentorCopy[locale],
    reduced = useReducedMotion();
  const [mentors, setMentors] = useState<Mentor[] | null>(null),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void requestData<{ mentors: Mentor[] }>('/api/mentors?directory=1')
      .then((r) => {
        if (active) {
          setMentors(r.mentors);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const params = new URLSearchParams(query),
    selected = mentors?.find((m) => m.id === params.get('mentor')),
    filtered = filterMentors(mentors ?? [], params);
  return (
    <div className="mentor-network">
      <header className="mentor-intro">
        <p className="section-kicker">{t.eyebrow}</p>
        <h1>{selected?.name ?? t.title}</h1>
        <p className="mentor-lead">{t.intro}</p>
        <div className="mentor-actions">
          <a
            className="ui-button ui-button--primary"
            href={`/${locale}/mentoring`}
          >
            {t.workspace}
            <Icon name="arrow" />
          </a>
          <a
            className="ui-button ui-button--secondary"
            href={`/${locale}/mentoring?tab=apply`}
          >
            {t.apply}
          </a>
        </div>
      </header>
      {selected ? (
        <>
          <a href={`/${locale}/mentors`}>{t.back}</a>
          <section className="mentor-panel">
            <h2>{t.profile}</h2>
            <p className="mentor-badge">
              <Icon name="check" />
              {t.verified}
            </p>
            <p>{selected.verifiedSummary}</p>
            <p>{selected.bio}</p>
            <p>
              {selected.languages.join(' · ')} ·{' '}
              {selected.countries.join(' · ')} · {selected.timezone}
            </p>
            <p>{t.self}</p>
            <div className="mentor-tags">
              {selected.expertise.map((e) => (
                <span key={e}>{e}</span>
              ))}
            </div>
            <h2>{t.services}</h2>
            {selected.services.map((s) => (
              <article className="mentor-service" key={s.id}>
                <h3>{label(t, s.kind)}</h3>
                <p>{s.summary}</p>
                <p>{s.deliverables}</p>
                <p>
                  {s.price_minor === 0
                    ? t.free
                    : new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: s.currency,
                      }).format(s.price_minor / 100)}{' '}
                  · {s.turnaround_hours} h
                </p>
                <a
                  className="ui-button ui-button--primary"
                  href={`/${locale}/mentoring?mentor=${selected.id}&service=${s.id}`}
                >
                  {s.price_minor === 0 ? t.request : t.paid}
                </a>
              </article>
            ))}
            <p>{t.sla}</p>
            <p>{t.boundary}</p>
            <p>{t.terms}</p>
            <p>{t.notShared}</p>
          </section>
        </>
      ) : (
        <>
          <form
            method="get"
            className="mentor-stack mentor-panel"
            aria-label={t.filter}
          >
            <label>
              {t.search}
              <input
                name="q"
                defaultValue={params.get('q') ?? ''}
                maxLength={120}
              />
            </label>
            <details
              className="mentor-filter-details"
              open={[
                'language',
                'country',
                'degree',
                'service',
                'price',
                'maxPrice',
                'available',
              ].some((k) => Boolean(params.get(k)))}
            >
              <summary>{t.filter}</summary>
              <div className="mentor-filters">
                <label>
                  {t.language}
                  <select
                    name="language"
                    defaultValue={params.get('language') ?? ''}
                  >
                    <option value="">{t.all}</option>
                    <option value="kk">Қазақша</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label>
                  {t.country}
                  <input
                    name="country"
                    maxLength={2}
                    defaultValue={params.get('country') ?? ''}
                  />
                </label>
                <label>
                  {t.degree}
                  <select
                    name="degree"
                    defaultValue={params.get('degree') ?? ''}
                  >
                    <option value="">{t.all}</option>
                    {['bachelor', 'master', 'phd', 'school'].map((v) => (
                      <option key={v} value={v}>
                        {label(t, v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.service}
                  <select
                    name="service"
                    defaultValue={params.get('service') ?? ''}
                  >
                    <option value="">{t.all}</option>
                    {serviceKinds.map((v) => (
                      <option key={v} value={v}>
                        {label(t, v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.price}
                  <select name="price" defaultValue={params.get('price') ?? ''}>
                    <option value="">{t.all}</option>
                    <option value="free">{t.free}</option>
                    <option value="paid">{t.paid}</option>
                  </select>
                </label>
                <label>
                  {t.maxPrice}
                  <input
                    type="number"
                    name="maxPrice"
                    min={0}
                    defaultValue={params.get('maxPrice') ?? ''}
                  />
                </label>
                <label>
                  {t.sort}
                  <select
                    name="sort"
                    defaultValue={params.get('sort') ?? 'name'}
                  >
                    <option value="name">{t.name}</option>
                    <option value="availability">{t.availability}</option>
                  </select>
                </label>
                <label className="mentor-check">
                  <input
                    type="checkbox"
                    name="available"
                    defaultChecked={params.has('available')}
                  />
                  {t.available}
                </label>
              </div>
            </details>
            <div className="mentor-actions">
              <button className="ui-button ui-button--primary">
                {t.filter}
              </button>
              <a
                href={`/${locale}/mentors`}
                className="ui-button ui-button--secondary"
              >
                {t.reset}
              </a>
            </div>
          </form>
          <p>{t.verifiedOnly}</p>
          {failed ? (
            <section className="mentor-panel" role="alert">
              <h2>{t.unavailable}</h2>
              <button
                className="ui-button ui-button--secondary"
                onClick={() => setRetry((v) => v + 1)}
              >
                {t.retry}
              </button>
            </section>
          ) : mentors === null ? (
            <p role="status">{t.loading}</p>
          ) : filtered.length === 0 ? (
            <section className="mentor-empty mentor-panel">
              <Icon name="book" />
              <h2>{t.empty}</h2>
              <p>{t.emptyBody}</p>
              <a
                className="ui-button ui-button--primary"
                href={`/${locale}/writing`}
              >
                {t.selfReview}
              </a>
              <p className="mentor-muted">{t.noHuman}</p>
            </section>
          ) : (
            <div className="mentor-grid">
              {filtered.map((m) => (
                <motion.article
                  key={m.id}
                  className="mentor-panel mentor-card"
                  whileHover={reduced ? undefined : { y: -3 }}
                >
                  <div className="mentor-avatar" aria-hidden="true">
                    {Array.from(m.name)[0]}
                  </div>
                  <p className="mentor-badge">
                    <Icon name="check" />
                    {t.verified}
                  </p>
                  <h2>{m.name}</h2>
                  <p>{m.verifiedSummary}</p>
                  <p>
                    {m.languages.join(' · ')} · {m.timezone}
                  </p>
                  <div className="mentor-tags">
                    {m.expertise.map((e) => (
                      <span key={e}>{e}</span>
                    ))}
                  </div>
                  <p>
                    {m.services
                      .map(
                        (s) =>
                          `${label(t, s.kind)} · ${s.price_minor === 0 ? t.free : new Intl.NumberFormat(locale, { style: 'currency', currency: s.currency }).format(s.price_minor / 100)} · ${s.turnaround_hours} h`,
                      )
                      .join(' / ')}
                  </p>
                  <a
                    className="ui-button ui-button--primary"
                    href={`/${locale}/mentors?mentor=${m.id}`}
                  >
                    {t.details}
                    <Icon name="arrow" />
                  </a>
                </motion.article>
              ))}
            </div>
          )}
        </>
      )}
      <aside className="mentor-safety">
        <Icon name="check" />
        <div>
          <h2>{t.safety}</h2>
          <p>{t.conduct}</p>
          <a href={`/${locale}/privacy`}>{t.help}</a>
        </div>
      </aside>
    </div>
  );
}
