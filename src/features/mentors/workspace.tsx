'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Locale } from '@/lib/i18n/messages';
import { requestData } from '@/features/writing/client';
import { mentorCopy, label } from './copy';
import { localDateTimeInput } from './domain';
import { mentorCommand } from './client';
import type { Command, Mentor, Workspace, Material } from './contracts';
import { MentorOnboarding, MentorAdmin } from './onboarding';
import { MentorReview } from './review';
export function MentorWorkspace({
  locale,
  query = '',
}: {
  locale: Locale;
  query?: string;
}) {
  const t = mentorCopy[locale],
    params = new URLSearchParams(query),
    reduced = useReducedMotion();
  const [data, setData] = useState<Workspace | null>(null),
    [mentors, setMentors] = useState<Mentor[]>([]),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [tab, setTab] = useState(params.get('tab') ?? 'student'),
    [selected, setSelected] = useState(params.get('request') ?? ''),
    [reload, setReload] = useState(0);
  const load = useCallback(async () => {
    const [result, directory] = await Promise.all([
      requestData<Workspace>('/api/mentors'),
      requestData<{ mentors: Mentor[] }>('/api/mentors?directory=1'),
    ]);
    setData(result);
    setMentors(directory.mentors);
  }, []);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(
      () =>
        void load().catch(() => {
          if (live) setFailed(true);
        }),
      0,
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [load, reload]);
  async function run(value: Command) {
    setBusy(true);
    setNotice('');
    try {
      await mentorCommand(value);
      await load();
      setNotice(t.saved);
    } catch (error) {
      setNotice(t.failed);
      throw error;
    } finally {
      setBusy(false);
    }
  }
  async function safeRun(value: Command) {
    try {
      await run(value);
    } catch {
      /* Persistent status is shown above the active form. */
    }
  }
  function changeTab(value: string) {
    setTab(value);
    setSelected('');
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    url.searchParams.delete('request');
    window.history.replaceState(null, '', url);
  }
  function open(id: string) {
    setSelected(id);
    const url = new URL(window.location.href);
    url.searchParams.set('request', id);
    window.history.replaceState(null, '', url);
  }
  const r = data?.requests.find((v) => v.id === selected),
    chosen = mentors.find((m) => m.id === params.get('mentor')),
    service = chosen?.services.find((s) => s.id === params.get('service'));
  return (
    <div className="mentor-network">
      <header className="mentor-intro">
        <p className="section-kicker">{t.eyebrow}</p>
        <h1>{t.workspace}</h1>
        <p>{t.notShared}</p>
        <div className="mentor-actions">
          <a
            href={`/${locale}/mentors`}
            className="ui-button ui-button--secondary"
          >
            {t.filter}
          </a>
          <a
            href={`/${locale}/writing`}
            className="ui-button ui-button--secondary"
          >
            {t.writing}
          </a>
        </div>
      </header>
      <nav className="mentor-tabs" aria-label={t.workspace}>
        {[
          ['student', t.student],
          ['mentor', t.mentor],
          ['safety', t.safety],
          ['apply', t.apply],
          ['admin', t.admin],
        ].map(([value = 'student', name]) => (
          <button
            className="ui-button ui-button--secondary"
            aria-current={tab === value ? 'page' : undefined}
            key={value}
            onClick={() => changeTab(value)}
          >
            {name}
          </button>
        ))}
      </nav>
      <p role="status" aria-atomic="true" className="mentor-notice">
        {notice}
      </p>
      {failed && !data ? (
        <section className="mentor-panel" role="alert">
          <h2>{t.unavailable}</h2>
          <button
            className="ui-button ui-button--secondary"
            onClick={() => {
              setFailed(false);
              setReload((v) => v + 1);
            }}
          >
            {t.retry}
          </button>
        </section>
      ) : !data ? (
        <p role="status">{t.loading}</p>
      ) : (
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.16 }}
        >
          {tab === 'apply' ? (
            <MentorOnboarding
              locale={locale}
              data={data}
              run={safeRun}
              busy={busy}
            />
          ) : tab === 'admin' ? (
            <MentorAdmin
              locale={locale}
              data={data}
              run={safeRun}
              busy={busy}
            />
          ) : (
            <>
              {chosen && service && !selected && tab === 'student' && (
                <RequestWizard
                  locale={locale}
                  mentor={chosen}
                  serviceId={service.id}
                  data={data}
                  busy={busy}
                  save={safeRun}
                  submit={async (value) => {
                    setBusy(true);
                    setNotice('');
                    try {
                      const result = await mentorCommand(value);
                      await load();
                      if (result.id) open(result.id);
                      setNotice(t.saved);
                    } catch {
                      setNotice(t.failed);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}
              {r ? (
                <>
                  <button
                    className="ui-button ui-button--secondary"
                    onClick={() => setSelected('')}
                  >
                    {t.back}
                  </button>
                  <MentorReview
                    key={r.id}
                    locale={locale}
                    data={data}
                    request={r}
                    run={run}
                    busy={busy}
                  />
                  <section className="mentor-panel mentor-form">
                    <h3>{t.session}</h3>
                    <p>{t.slotConsent}</p>
                    {!r.revoked_at &&
                      r.student_id === data.actor.id &&
                      mentors
                        .find((m) => m.id === r.mentor_id)
                        ?.slots.map((s) => (
                          <div className="mentor-actions" key={s.id}>
                            <time>
                              {new Date(s.starts_at).toLocaleString(locale, {
                                timeZone: s.timezone,
                              })}{' '}
                              —{' '}
                              {new Date(s.ends_at).toLocaleTimeString(locale, {
                                timeZone: s.timezone,
                              })}{' '}
                              · {s.timezone}
                            </time>
                            <button
                              disabled={busy}
                              className="ui-button ui-button--secondary"
                              onClick={() =>
                                void safeRun({
                                  op: 'book',
                                  request: r.id,
                                  slot: s.id,
                                  key: crypto.randomUUID(),
                                })
                              }
                            >
                              {t.book}
                            </button>
                          </div>
                        ))}
                    {data.bookings
                      .filter((b) => b.request_id === r.id)
                      .map((b) => (
                        <div className="mentor-actions" key={b.id}>
                          {b.starts_at && b.ends_at && b.timezone && (
                            <p className="mentor-booking-time">
                              {new Date(b.starts_at).toLocaleString(locale, {
                                timeZone: b.timezone,
                              })}{' '}
                              —{' '}
                              {new Date(b.ends_at).toLocaleTimeString(locale, {
                                timeZone: b.timezone,
                              })}{' '}
                              · {b.timezone}
                            </p>
                          )}
                          <p>
                            {b.state === 'cancelled'
                              ? t.cancelled
                              : t.pendingLink}
                          </p>
                          {b.state !== 'cancelled' && (
                            <button
                              disabled={busy}
                              className="ui-button ui-button--secondary"
                              onClick={() =>
                                void safeRun({
                                  op: 'cancel_booking',
                                  request: r.id,
                                  id: b.id,
                                })
                              }
                            >
                              {t.cancelBooking}
                            </button>
                          )}
                        </div>
                      ))}
                  </section>
                </>
              ) : (
                <section className="mentor-stack">
                  <h2>
                    {tab === 'mentor'
                      ? t.mentor
                      : tab === 'safety'
                        ? t.safety
                        : t.student}
                  </h2>
                  {tab === 'safety' && <p>{t.conduct}</p>}
                  {!data.clearance && tab === 'student' && (
                    <p className="mentor-notice">{t.clearance}</p>
                  )}
                  {data.requests.filter((v) =>
                    tab === 'mentor'
                      ? v.mentor_id === data.actor.id
                      : v.student_id === data.actor.id,
                  ).length === 0 && <p>{t.noRequests}</p>}
                  {data.requests
                    .filter((v) =>
                      tab === 'mentor'
                        ? v.mentor_id === data.actor.id
                        : v.student_id === data.actor.id,
                    )
                    .map((v) => (
                      <article className="mentor-panel" key={v.id}>
                        <h3>{label(t, v.terms_snapshot.kind)}</h3>
                        <p>{v.goal}</p>
                        <p className="mentor-badge">
                          {v.revoked_at ? t.revoked : label(t, v.status)}
                        </p>
                        <p>
                          {t.due}: {new Date(v.due_at).toLocaleString(locale)}
                        </p>
                        <p>
                          {t.expires}:{' '}
                          {new Date(v.expires_at).toLocaleString(locale)}
                        </p>
                        <div className="mentor-actions">
                          <button
                            className="ui-button ui-button--primary"
                            onClick={() => open(v.id)}
                          >
                            {t.open}
                          </button>
                          {v.student_id === data.actor.id && !v.revoked_at && (
                            <button
                              className="ui-button ui-button--secondary"
                              disabled={busy}
                              onClick={() =>
                                void safeRun({ op: 'revoke', request: v.id })
                              }
                            >
                              {t.revoke}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                </section>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
function RequestWizard({
  locale,
  mentor,
  serviceId,
  data,
  submit,
  save,
  busy,
}: {
  locale: Locale;
  mentor: Mentor;
  serviceId: string;
  data: Workspace;
  submit: (v: Command) => Promise<void>;
  save: (v: Command) => Promise<void>;
  busy: boolean;
}) {
  const t = mentorCopy[locale],
    service = mentor.services.find((s) => s.id === serviceId)!;
  const draft = data.requestDrafts?.find((d) => d.service_id === serviceId);
  const [clock] = useState(() => Date.now());
  const [goal, setGoal] = useState(draft?.goal ?? ''),
    [expires, setExpires] = useState(() =>
      localDateTimeInput(draft?.consent_until ?? Date.now() + 7 * 86400000),
    ),
    [items, setItems] = useState<Material[]>(() =>
      (draft?.items ?? []).flatMap((i) => {
        const m = data.materials.find(
          (m) => m.version === i.version && m.resource === i.resource,
        );
        return m ? [{ ...m, download: i.download }] : [];
      }),
    ),
    [step, setStep] = useState(0),
    [consent, setConsent] = useState(false),
    [key, setKey] = useState(() => crypto.randomUUID());
  const allowed = data.materials.filter((m) =>
    m.type === 'application'
      ? ['readiness', 'documents', 'shortlist'].includes(service.kind)
      : m.type === 'vault'
        ? ['readiness', 'documents', 'cv'].includes(service.kind)
        : ['essay', 'sop', 'scholarship', 'cv', 'readiness'].includes(
            service.kind,
          ),
  );
  const clearance = Boolean(
    data.clearance && new Date(data.clearance.approved_until) > new Date(),
  );
  return (
    <section className="mentor-panel mentor-stack">
      <h2>
        {t.newRequest} · {mentor.name}
      </h2>
      <p>
        {label(t, service.kind)} · {service.price_minor === 0 ? t.free : t.paid}{' '}
        · {service.turnaround_hours} h
      </p>
      <p>{service.deliverables}</p>
      <p>{t.terms}</p>
      <p>{t.sla}</p>
      {!clearance && <p className="mentor-notice">{t.clearance}</p>}
      <form
        className="mentor-form"
        onChange={() => setKey(crypto.randomUUID())}
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 0) {
            setStep(1);
            return;
          }
          void submit({
            op: 'create',
            service: service.id,
            goal,
            expires: new Date(expires).toISOString(),
            items: items.map((i) => ({
              type: i.type,
              resource: i.resource,
              version: i.version,
              download: i.download,
              ...(i.type === 'application'
                ? { expectedVersion: i.expectedVersion }
                : {}),
            })),
            consent: true,
            policy: 'mentor-consent-v1',
            key,
          });
        }}
      >
        {step === 0 ? (
          <>
            <label>
              {t.goal}
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                minLength={10}
                maxLength={2000}
                required
              />
            </label>
            <fieldset>
              <legend>{t.materials}</legend>
              {allowed.length === 0 && (
                <p>
                  {t.noMaterial} <a href={`/${locale}/writing`}>{t.writing}</a>
                </p>
              )}
              {allowed.map((m) => (
                <div key={m.version} className="mentor-material">
                  <label className="mentor-check">
                    <input
                      type="checkbox"
                      checked={items.some((i) => i.version === m.version)}
                      onChange={(e) =>
                        setItems((v) =>
                          e.target.checked
                            ? [...v, m]
                            : v.filter((i) => i.version !== m.version),
                        )
                      }
                    />
                    {m.title} ·{' '}
                    {m.type === 'writing'
                      ? t.materialWriting
                      : m.type === 'vault'
                        ? t.materialVault
                        : t.materialApplication}
                  </label>
                  <a
                    className="ui-button ui-button--secondary"
                    target="_blank"
                    rel="noreferrer"
                    href={`/api/mentors/preview?type=${m.type}&version=${m.version}&locale=${locale}${m.expectedVersion ? `&expectedVersion=${m.expectedVersion}` : ''}`}
                  >
                    {t.preview} · {m.title}
                  </a>
                  {m.type === 'vault' &&
                    items.some((i) => i.version === m.version) && (
                      <label className="mentor-check">
                        <input
                          type="checkbox"
                          checked={
                            items.find((i) => i.version === m.version)
                              ?.download ?? false
                          }
                          onChange={(e) =>
                            setItems((v) =>
                              v.map((i) =>
                                i.version === m.version
                                  ? { ...i, download: e.target.checked }
                                  : i,
                              ),
                            )
                          }
                        />
                        {t.download}
                      </label>
                    )}
                </div>
              ))}
            </fieldset>
            <label>
              {t.expiry}
              <input
                type="datetime-local"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                min={localDateTimeInput(clock)}
                max={new Date(clock + 30 * 86400000).toISOString().slice(0, 16)}
                required
              />
            </label>
            <button
              type="button"
              disabled={busy}
              className="ui-button ui-button--secondary"
              onClick={() =>
                void save({
                  op: 'save_request_draft',
                  service: serviceId,
                  goal,
                  items: items.map((i) => ({
                    type: i.type,
                    resource: i.resource,
                    version: i.version,
                    download: i.download,
                    ...(i.type === 'application'
                      ? { expectedVersion: i.expectedVersion }
                      : {}),
                  })),
                  expires: new Date(expires).toISOString(),
                  revision: draft?.revision ?? 0,
                })
              }
            >
              {t.saveDraft}
            </button>
            <button
              className="ui-button ui-button--primary"
              disabled={
                items.length === 0 &&
                !['interview', 'session', 'shortlist'].includes(service.kind)
              }
            >
              {t.next}
            </button>
          </>
        ) : (
          <>
            <h3>{t.consentPolicy}</h3>
            <dl>
              <div>
                <dt>{t.who}</dt>
                <dd>
                  {mentor.name} · {t.verified}
                </dd>
              </div>
              <div>
                <dt>{t.what}</dt>
                <dd>
                  <ul>
                    {items.map((i) => (
                      <li key={i.version}>
                        {i.title} · {i.download ? t.download : t.acceptedScope}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>{t.why}</dt>
                <dd>
                  {label(t, service.kind)} · {goal}
                </dd>
              </div>
              <div>
                <dt>{t.howLong}</dt>
                <dd>{new Date(expires).toLocaleString(locale)}</dd>
              </div>
            </dl>
            <p>{t.notShared}</p>
            <label className="mentor-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              {t.consent}
            </label>
            <div className="mentor-actions">
              <button
                type="button"
                className="ui-button ui-button--secondary"
                onClick={() => {
                  setStep(0);
                  setConsent(false);
                }}
              >
                {t.back}
              </button>
              <button
                className="ui-button ui-button--primary"
                disabled={
                  busy || !consent || !clearance || service.price_minor > 0
                }
              >
                {t.confirm}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
