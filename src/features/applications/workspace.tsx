'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import {
  APPLICATION_STATUSES,
  applicationTransitions,
  scholarshipTransitions,
  type ApplicationStatus,
} from './engine';
import type {
  ApplicationPortfolio,
  ApplicationSummary,
  ApplicationWorkspaceState,
} from './service';
import { applicationsCopy } from './copy';

type ApiPayload<T> = { data?: T; error?: { code: string; message: string } };

async function request<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const payload = (await response.json()) as ApiPayload<T>;
  if (!response.ok || !payload.data)
    throw new Error(payload.error?.code ?? 'REQUEST_FAILED');
  return payload.data;
}

function json(method: string, value: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  };
}

function deadlineLabel(
  item: Pick<
    ApplicationSummary,
    'deadlinePrecision' | 'deadlineAt' | 'deadlineDate' | 'deadlineTimezone'
  >,
  locale: Locale,
  unknown: string,
) {
  if (item.deadlinePrecision === 'instant' && item.deadlineAt) {
    const value = new Date(item.deadlineAt);
    if (Number.isFinite(value.getTime()))
      return `${new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value)} · ${item.deadlineTimezone ?? 'TZ?'}`;
  }
  if (item.deadlinePrecision === 'date_only' && item.deadlineDate)
    return `${item.deadlineDate} · date only`;
  if (item.deadlinePrecision === 'rolling') return 'Rolling';
  return unknown;
}

const boardGroups: Array<{
  id: string;
  statuses: ApplicationStatus[];
}> = [
  { id: 'research', statuses: ['researching', 'shortlisted'] },
  {
    id: 'prepare',
    statuses: ['preparing', 'ready_for_review', 'ready_to_submit'],
  },
  { id: 'submitted', statuses: ['submitted_external_confirmed'] },
  { id: 'review', statuses: ['under_review', 'interview', 'waitlist'] },
  {
    id: 'decision',
    statuses: [
      'offer',
      'accepted',
      'enrollment',
      'rejected',
      'declined',
      'withdrawn',
    ],
  },
];

function ApplicationCard({
  application,
  locale,
}: {
  application: ApplicationSummary;
  locale: Locale;
}) {
  const t = applicationsCopy[locale];
  return (
    <article className="ui-card application-card">
      <div className="application-card__topline">
        <span
          className={`application-status application-status--${application.status}`}
        >
          {t.status[application.status]}
        </span>
        <span>{application.priority}</span>
      </div>
      <h3>{application.programTitle}</h3>
      <p>{application.institutionName}</p>
      <dl className="application-card__facts">
        <div>
          <dt>{t.cycle}</dt>
          <dd>{application.cycleYear}</dd>
        </div>
        <div>
          <dt>{t.readiness}</dt>
          <dd>{application.readiness.percent}%</dd>
        </div>
        <div>
          <dt>{t.deadline}</dt>
          <dd>{deadlineLabel(application, locale, t.deadlineUnknown)}</dd>
        </div>
      </dl>
      <a
        className="ui-button ui-button--secondary"
        href={`/${locale}/applications/${application.id}`}
      >
        {t.open}
      </a>
    </article>
  );
}

export function ApplicationsPortfolio({ locale }: { locale: Locale }) {
  const t = applicationsCopy[locale];
  const [state, setState] = useState<ApplicationPortfolio | null>(null);
  const [view, setView] = useState<'list' | 'board'>('board');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all',
  );
  const [sort, setSort] = useState<
    'deadline' | 'updated' | 'title' | 'priority'
  >('deadline');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [programId, setProgramId] = useState('');
  const [cycleYear, setCycleYear] = useState(
    String(new Date().getUTCFullYear() + 1),
  );

  async function load() {
    try {
      const next = await request<ApplicationPortfolio>('/api/applications');
      setState(next);
      setError('');
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // Locale copy is stable for the mounted route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!programId || saving) return;
    setSaving(true);
    setError('');
    try {
      const next = await request<ApplicationPortfolio>(
        '/api/applications',
        json('POST', {
          programId: Number(programId),
          intakeId: null,
          cycleYear: Number(cycleYear),
          idempotencyKey: crypto.randomUUID(),
        }),
      );
      setState(next);
      setProgramId('');
    } catch {
      setError(t.blocked);
    } finally {
      setSaving(false);
    }
  }

  const metrics = state?.metrics;
  const metricCards = metrics
    ? [
        [t.researchingMetric, metrics.researching],
        [t.preparingMetric, metrics.preparing],
        [t.submittedMetric, metrics.submitted],
        [t.awaitingMetric, metrics.awaitingResult],
        [t.offersMetric, metrics.offers],
      ]
    : [];
  const visibleApplications = useMemo(() => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    const deadline = (application: ApplicationSummary) =>
      application.deadlineAt ?? application.deadlineDate ?? '9999-12-31';
    return [...(state?.applications ?? [])]
      .filter(
        (application) =>
          statusFilter === 'all' || application.status === statusFilter,
      )
      .sort((left, right) => {
        if (sort === 'deadline')
          return deadline(left).localeCompare(deadline(right));
        if (sort === 'updated')
          return right.updatedAt.localeCompare(left.updatedAt);
        if (sort === 'priority')
          return priority[left.priority] - priority[right.priority];
        return left.programTitle.localeCompare(right.programTitle, locale);
      });
  }, [locale, sort, state, statusFilter]);

  return (
    <main id="main" tabIndex={-1} className="page-shell applications-page">
      <header className="applications-hero">
        <div>
          <p className="eyebrow">JETU / CRM</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <div className="applications-view-toggle" aria-label={t.portfolio}>
          <button
            type="button"
            aria-pressed={view === 'board'}
            onClick={() => setView('board')}
          >
            {t.board}
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            {t.list}
          </button>
        </div>
      </header>

      {loading && (
        <div className="application-loading" role="status">
          {t.loading}
        </div>
      )}
      {error && (
        <div className="feedback-box feedback-box--error" role="alert">
          {error}{' '}
          <button
            type="button"
            className="ui-button ui-button--ghost"
            onClick={() => void load()}
          >
            {t.retry}
          </button>
        </div>
      )}

      {state && (
        <>
          <section className="application-metrics" aria-label={t.portfolio}>
            {metricCards.map(([label, value]) => (
              <article
                className="ui-card application-metric"
                key={String(label)}
              >
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </section>

          <section
            className="ui-card application-create"
            aria-labelledby="application-create-title"
          >
            <div>
              <p className="eyebrow">01 / {t.create}</p>
              <h2 id="application-create-title">{t.create}</h2>
              {!state.availablePrograms.length && <p>{t.noPrograms}</p>}
            </div>
            <form onSubmit={(event) => void create(event)}>
              <label className="ui-field">
                <span>{t.chooseProgram}</span>
                <select
                  value={programId}
                  onChange={(event) => setProgramId(event.target.value)}
                  required
                >
                  <option value="">—</option>
                  {state.availablePrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title} ·{' '}
                      {program.subtitle ?? program.countryCode ?? ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ui-field">
                <span>{t.cycle}</span>
                <input
                  type="number"
                  min={2020}
                  max={2200}
                  value={cycleYear}
                  onChange={(event) => setCycleYear(event.target.value)}
                  required
                />
              </label>
              <button
                className="ui-button ui-button--primary"
                disabled={saving || !state.availablePrograms.length}
              >
                {saving ? t.loading : t.create}
              </button>
            </form>
          </section>

          {!!state.applications.length && (
            <section className="application-controls" aria-label={t.portfolio}>
              <label className="ui-field">
                <span>{t.filter}</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as ApplicationStatus | 'all',
                    )
                  }
                >
                  <option value="all">{t.allStatuses}</option>
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t.status[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ui-field">
                <span>{t.sort}</span>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target.value as
                        'deadline' | 'updated' | 'title' | 'priority',
                    )
                  }
                >
                  <option value="deadline">{t.sortDeadline}</option>
                  <option value="updated">{t.sortUpdated}</option>
                  <option value="priority">{t.sortPriority}</option>
                  <option value="title">{t.sortTitle}</option>
                </select>
              </label>
            </section>
          )}

          {!state.applications.length ? (
            <section className="ui-card application-empty">
              <h2>{t.noApplications}</h2>
              <p>{t.externalNotice}</p>
            </section>
          ) : !visibleApplications.length ? (
            <section className="ui-card application-empty" role="status">
              <h2>{t.noFilteredApplications}</h2>
            </section>
          ) : view === 'list' ? (
            <section className="applications-list" aria-label={t.list}>
              {visibleApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  locale={locale}
                />
              ))}
            </section>
          ) : (
            <section className="applications-board" aria-label={t.board}>
              {boardGroups.map((group) => {
                const applications = visibleApplications.filter((application) =>
                  group.statuses.includes(application.status),
                );
                return (
                  <div className="application-column" key={group.id}>
                    <h2>{t.status[group.statuses[0]!]}</h2>
                    <span className="application-column__count">
                      {applications.length}
                    </span>
                    {applications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        locale={locale}
                      />
                    ))}
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
    </main>
  );
}

function checklistTitle(key: string | null, fallback: string, locale: Locale) {
  if (!key?.startsWith('system:')) return fallback;
  const labels: Record<Locale, Record<string, string>> = {
    en: {
      'system:confirm_requirements': 'Confirm current official requirements',
      'system:prepare_materials': 'Prepare required application materials',
      'system:final_review':
        'Review the application before external submission',
    },
    ru: {
      'system:confirm_requirements':
        'Проверить актуальные официальные требования',
      'system:prepare_materials': 'Подготовить обязательные материалы',
      'system:final_review': 'Проверить заявку перед внешней отправкой',
    },
    kk: {
      'system:confirm_requirements': 'Актуалды ресми талаптарды тексеру',
      'system:prepare_materials': 'Міндетті материалдарды дайындау',
      'system:final_review': 'Сыртқы жіберу алдында өтінімді тексеру',
    },
  };
  return labels[locale][key] ?? fallback;
}

export function ApplicationWorkspace({
  locale,
  applicationId,
}: {
  locale: Locale;
  applicationId: string;
}) {
  const t = applicationsCopy[locale];
  const [state, setState] = useState<ApplicationWorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [priority, setPriority] =
    useState<ApplicationSummary['priority']>('medium');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [scholarshipId, setScholarshipId] = useState('');

  function adopt(next: ApplicationWorkspaceState) {
    setState(next);
    setNotes(next.application.notes);
    setReference(next.application.userReferenceId ?? '');
    setPriority(next.application.priority);
  }

  async function load() {
    try {
      const next = await request<ApplicationWorkspaceState>(
        `/api/applications/${applicationId}`,
      );
      adopt(next);
      setError('');
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // applicationId identifies the mounted route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function mutate(url: string, value: unknown) {
    if (saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const next = await request<ApplicationWorkspaceState>(
        url,
        json('POST', value),
      );
      adopt(next);
      setSuccess(t.saved);
      setReason('');
      setEvidence('');
      setConfirmed(false);
    } catch {
      setError(t.blocked);
    } finally {
      setSaving(false);
    }
  }

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state || saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const next = await request<ApplicationWorkspaceState>(
        `/api/applications/${applicationId}`,
        json('PATCH', {
          version: state.application.version,
          notes,
          userReferenceId: reference,
          priority,
        }),
      );
      adopt(next);
      setSuccess(t.saved);
    } catch {
      setError(t.blocked);
    } finally {
      setSaving(false);
    }
  }

  const transitions = state
    ? applicationTransitions[state.application.status]
    : [];
  const facts = state?.application;
  const events = useMemo(() => state?.events ?? [], [state]);

  if (loading)
    return (
      <main id="main" className="page-shell applications-page">
        <div role="status">{t.loading}</div>
      </main>
    );
  if (!state)
    return (
      <main id="main" className="page-shell applications-page">
        <div className="feedback-box feedback-box--error" role="alert">
          {error || t.error}
        </div>
      </main>
    );

  return (
    <main
      id="main"
      tabIndex={-1}
      className="page-shell applications-page application-workspace"
    >
      <a className="application-back" href={`/${locale}/applications`}>
        ← {t.back}
      </a>
      <header className="applications-hero application-workspace__hero">
        <div>
          <p className="eyebrow">JETU / {t.workspace}</p>
          <h1>{state.application.programTitle}</h1>
          <p>
            {state.application.institutionName} ·{' '}
            {state.application.degreeLevel} · {state.application.cycleYear}
          </p>
        </div>
        <span
          className={`application-status application-status--${state.application.status}`}
        >
          {t.status[state.application.status]}
        </span>
      </header>

      {error && (
        <div className="feedback-box feedback-box--error" role="alert">
          {error}
        </div>
      )}
      <p className="application-live" aria-live="polite">
        {success}
      </p>

      <section className="application-workspace-grid">
        <article className="ui-card application-fact-panel">
          <h2>{t.readiness}</h2>
          <strong>{state.application.readiness.percent}%</strong>
          <progress max={100} value={state.application.readiness.percent}>
            {state.application.readiness.percent}%
          </progress>
          <p>
            {state.application.readiness.completed} /{' '}
            {state.application.readiness.total}
          </p>
        </article>
        <article className="ui-card application-fact-panel">
          <h2>{t.deadline}</h2>
          <p>{deadlineLabel(state.application, locale, t.deadlineUnknown)}</p>
          {facts?.sourceUrl ? (
            <a href={facts.sourceUrl} target="_blank" rel="noreferrer">
              {t.source}
            </a>
          ) : (
            <span>{t.unknown}</span>
          )}
        </article>
        <article className="ui-card application-fact-panel">
          <h2>{t.officialPortal}</h2>
          {facts?.portalUrl ? (
            <a
              className="ui-button ui-button--secondary"
              href={facts.portalUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t.officialPortal}
            </a>
          ) : (
            <p>{t.portalUnavailable}</p>
          )}
        </article>
      </section>

      <section
        className="ui-card application-transition"
        aria-labelledby="application-stage-title"
      >
        <div>
          <p className="eyebrow">02 / {t.stage}</p>
          <h2 id="application-stage-title">{t.transition}</h2>
          <p>{t.transitionHelp}</p>
        </div>
        <label className="ui-field">
          <span>{t.reason}</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={2000}
          />
        </label>
        <label className="ui-field">
          <span>{t.evidence}</span>
          <textarea
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            maxLength={2000}
          />
        </label>
        <label className="application-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>{t.confirmSubmission}</span>
        </label>
        <div className="application-transition__actions">
          {transitions.map((status) => (
            <button
              type="button"
              className={
                status === 'submitted_external_confirmed'
                  ? 'ui-button ui-button--primary'
                  : 'ui-button ui-button--secondary'
              }
              disabled={saving}
              key={status}
              onClick={() =>
                void mutate(`/api/applications/${applicationId}/transition`, {
                  version: state.application.version,
                  toStatus: status,
                  reason,
                  evidence,
                  userConfirmed: confirmed,
                  idempotencyKey: crypto.randomUUID(),
                })
              }
            >
              {t.status[status]}
            </button>
          ))}
        </div>
        <aside className="application-truth-note">
          <strong>{t.userReported}</strong>
          <p>{t.externalNotice}</p>
        </aside>
      </section>

      <section
        className="ui-card application-checklist"
        aria-labelledby="application-checklist-title"
      >
        <p className="eyebrow">03 / {t.checklist}</p>
        <h2 id="application-checklist-title">{t.checklist}</h2>
        <ul>
          {state.checklist.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{checklistTitle(item.key, item.title, locale)}</strong>
                <span>
                  {item.mandatory ? t.mandatory : t.optional} ·{' '}
                  {item.verificationState === 'verified'
                    ? t.verified
                    : item.verificationState === 'user_created'
                      ? t.userCreated
                      : t.unknown}
                </span>
                {item.roadmapTaskId && <span>{t.roadmapLinked}</span>}
              </div>
              <button
                type="button"
                className="ui-button ui-button--secondary"
                disabled={saving}
                onClick={() =>
                  void mutate(`/api/applications/${applicationId}/checklist`, {
                    itemId: item.id,
                    version: item.version,
                    title: item.title,
                    status: item.status === 'completed' ? 'todo' : 'completed',
                    mandatory: item.mandatory,
                  })
                }
              >
                {item.status === 'completed' ? t.reopen : t.markDone}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="application-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newItem.trim()) return;
            void mutate(`/api/applications/${applicationId}/checklist`, {
              itemId: null,
              version: null,
              title: newItem,
              status: 'todo',
              mandatory: false,
            }).then(() => setNewItem(''));
          }}
        >
          <label className="ui-field">
            <span>{t.itemTitle}</span>
            <input
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              maxLength={240}
              required
            />
          </label>
          <button className="ui-button ui-button--secondary" disabled={saving}>
            {t.addItem}
          </button>
        </form>
      </section>

      <form
        className="ui-card application-metadata"
        onSubmit={(event) => void saveMetadata(event)}
      >
        <p className="eyebrow">04 / {t.notes}</p>
        <h2>{t.notes}</h2>
        <label className="ui-field">
          <span>{t.reference}</span>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            maxLength={160}
          />
        </label>
        <label className="ui-field">
          <span>{t.priority}</span>
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as ApplicationSummary['priority'])
            }
          >
            {['low', 'medium', 'high', 'critical'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="ui-field application-notes-field">
          <span>{t.notes}</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={12000}
          />
        </label>
        <button className="ui-button ui-button--primary" disabled={saving}>
          {t.save}
        </button>
      </form>

      <section
        className="ui-card application-scholarships"
        aria-labelledby="application-scholarships-title"
      >
        <p className="eyebrow">05 / {t.scholarships}</p>
        <h2 id="application-scholarships-title">{t.scholarships}</h2>
        {state.scholarships.length ? (
          state.scholarships.map((scholarship) => (
            <article className="application-scholarship" key={scholarship.id}>
              <div>
                <h3>{scholarship.title}</h3>
                <p>{t.scholarshipStatus[scholarship.status]}</p>
              </div>
              <div className="application-transition__actions">
                {scholarshipTransitions[scholarship.status].map((status) => (
                  <button
                    type="button"
                    className="ui-button ui-button--secondary"
                    disabled={saving}
                    key={status}
                    onClick={() =>
                      void mutate(
                        `/api/applications/${applicationId}/scholarships/${scholarship.id}/transition`,
                        {
                          version: scholarship.version,
                          toStatus: status,
                          reason,
                          evidence,
                          userConfirmed: confirmed,
                          idempotencyKey: crypto.randomUUID(),
                        },
                      )
                    }
                  >
                    {t.scholarshipStatus[status]}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p>{t.noScholarships}</p>
        )}
        <form
          className="application-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!scholarshipId) return;
            void mutate(`/api/applications/${applicationId}/scholarships`, {
              scholarshipId: Number(scholarshipId),
              scholarshipCycleId: null,
              cycleYear: state.application.cycleYear,
              idempotencyKey: crypto.randomUUID(),
            }).then(() => setScholarshipId(''));
          }}
        >
          <label className="ui-field">
            <span>{t.chooseScholarship}</span>
            <select
              value={scholarshipId}
              onChange={(event) => setScholarshipId(event.target.value)}
              required
            >
              <option value="">—</option>
              {state.availableScholarships.map((scholarship) => (
                <option key={scholarship.id} value={scholarship.id}>
                  {scholarship.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="ui-button ui-button--secondary"
            disabled={saving || !state.availableScholarships.length}
          >
            {t.addScholarship}
          </button>
        </form>
      </section>

      <section
        className="ui-card application-history"
        aria-labelledby="application-history-title"
      >
        <p className="eyebrow">06 / {t.history}</p>
        <h2 id="application-history-title">{t.history}</h2>
        {!events.length ? (
          <p>{t.noHistory}</p>
        ) : (
          <ol>
            {events.map((event) => (
              <li key={event.id}>
                <time dateTime={event.occurredAt}>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(event.occurredAt))}
                </time>
                <strong>
                  {event.toStatus && event.toStatus in t.status
                    ? t.status[event.toStatus as ApplicationStatus]
                    : event.eventType}
                </strong>
                <span>
                  {event.sourceType === 'USER_REPORTED'
                    ? t.userReported
                    : 'JETU'}
                </span>
                {event.reason && <p>{event.reason}</p>}
                {event.evidence && <p>{event.evidence}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
