'use client';
import { useRef, useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import type { Locale } from '@/lib/i18n/messages';
import { Icon } from '@/components/ui/icon';
import { JetuMascot } from '@/components/ui/mascot';
import { deadlineCopy } from './copy';
import {
  categories,
  eventDate,
  filterEvents,
  preferencesSchema,
  type CalendarEvent,
  type Preferences,
} from './model';
import type { DeadlineWorkspaceData } from './service';

type Section = 'dashboard' | 'calendar' | 'inbox' | 'settings';
const hrefs = {
  dashboard: 'dashboard',
  calendar: 'calendar',
  inbox: 'notifications',
  settings: 'notification-settings',
};
export function DeadlineWorkspace({
  locale,
  section,
  initial,
  initialError = false,
  today,
  query = '',
}: {
  locale: Locale;
  section: Section;
  initial: DeadlineWorkspaceData | null;
  initialError?: boolean;
  today: string;
  query?: string;
}) {
  const t = deadlineCopy[locale];
  const [data, setData] = useState(initial);
  const [loadError, setLoadError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(() => {
    const p = new URLSearchParams(query);
    return {
      q: p.get('q')?.slice(0, 120) ?? '',
      category: categories.includes(
        p.get('category') as (typeof categories)[number],
      )
        ? p.get('category')!
        : '',
      status: ['active', 'completed', 'canceled', 'superseded'].includes(
        p.get('status') ?? '',
      )
        ? p.get('status')!
        : '',
      sort: ['deadline', 'title', 'recent'].includes(p.get('sort') ?? '')
        ? p.get('sort')!
        : 'deadline',
      verified: p.get('verified') === '1',
    };
  });
  const [view, setView] = useState(() => {
    const v = new URLSearchParams(query).get('view');
    return v && ['day', 'week', 'month', 'agenda'].includes(v) ? v : 'month';
  });
  const [date, setDate] = useState(() => {
    const d = new URLSearchParams(query).get('date');
    try {
      return d ? Temporal.PlainDate.from(d).toString() : today;
    } catch {
      return today;
    }
  });
  const [inboxMode, setInboxMode] = useState('all');
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [draft, setDraft] = useState<Preferences | null>(
    initial?.preferences ?? null,
  );
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(today);
  const dialog = useRef<HTMLDialogElement>(null);
  const formDialog = useRef<HTMLDialogElement>(null);
  function updateUrl(nextFilters = filters, nextView = view, nextDate = date) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(nextFilters))
      if (v && !(k === 'sort' && v === 'deadline'))
        p.set(k, v === true ? '1' : String(v));
    p.set('view', nextView);
    p.set('date', nextDate);
    window.history.replaceState(null, '', `${location.pathname}?${p}`);
  }
  function changeFilters(value: Partial<typeof filters>) {
    const next = { ...filters, ...value };
    setFilters(next);
    updateUrl(next);
  }
  async function reload() {
    setBusy(true);
    try {
      const r = await fetch('/api/deadlines', { cache: 'no-store' });
      const json = await r.json();
      if (!r.ok || !json.data) throw new Error();
      setData((previous) => ({
        ...json.data,
        inbox: [
          ...json.data.inbox,
          ...(previous?.inbox ?? []).filter(
            (old) =>
              !json.data.inbox.some(
                (current: { id: string }) => current.id === old.id,
              ),
          ),
        ],
      }));
      window.dispatchEvent(
        new CustomEvent('jetu:unread', { detail: json.data.unread }),
      );
      setDraft(json.data.preferences);
      setLoadError(false);
      return true;
    } catch {
      setLoadError(true);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function olderMessages() {
    const last = data?.inbox.at(-1);
    if (!last || busy) return;
    setBusy(true);
    setError('');
    try {
      const p = new URLSearchParams({
        before: last.created_at,
        before_id: last.id,
      });
      const r = await fetch(`/api/deadlines?${p}`, { cache: 'no-store' });
      const result = await r.json();
      if (!r.ok || !result.data) throw new Error();
      setData((previous) =>
        previous
          ? {
              ...previous,
              inbox: [...previous.inbox, ...result.data.inbox],
              inboxHasMore: result.data.inboxHasMore,
            }
          : previous,
      );
    } catch {
      setError(t.saveError);
    } finally {
      setBusy(false);
    }
  }
  async function mutate(payload: unknown) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        setError(r.status === 409 ? t.conflict : t.saveError);
        return false;
      }
      if (
        payload &&
        typeof payload === 'object' &&
        'action' in payload &&
        payload.action === 'receipt' &&
        'id' in payload
      ) {
        const receipt = payload as {
          id: string;
          read?: boolean;
          archive?: boolean;
        };
        setData((previous) =>
          previous
            ? {
                ...previous,
                inbox: previous.inbox.map((n) =>
                  n.id === receipt.id
                    ? {
                        ...n,
                        ...(receipt.read !== undefined
                          ? {
                              read_at: receipt.read
                                ? new Date().toISOString()
                                : null,
                            }
                          : {}),
                        ...(receipt.archive !== undefined
                          ? {
                              archived_at: receipt.archive
                                ? new Date().toISOString()
                                : null,
                            }
                          : {}),
                      }
                    : n,
                ),
              }
            : previous,
        );
      }
      setNotice(t.savedMessage);
      await reload();
      return true;
    } catch {
      setError(t.saveError);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function openEvent(e: CalendarEvent) {
    setError('');
    setSelected(e);
    dialog.current?.showModal();
  }
  function newEvent(e: CalendarEvent | null = null) {
    dialog.current?.close();
    setEditing(e);
    setFormTitle(e?.title ?? '');
    setFormDate(e?.due_date ?? date);
    setError('');
    formDialog.current?.showModal();
  }
  const zone = data?.preferences.timezone ?? 'UTC';
  const events = filterEvents(data?.events ?? [], filters, zone);
  const activeEvents = (data?.events ?? [])
    .filter((e) => e.status === 'active' && (eventDate(e, zone) ?? '') >= today)
    .sort(
      (a, b) =>
        (eventDate(a, zone) ?? '9999').localeCompare(
          eventDate(b, zone) ?? '9999',
        ) || a.event_key.localeCompare(b.event_key),
    );
  const formatDate = (s: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${s}T12:00:00Z`));
  function eventLabel(e: CalendarEvent) {
    return e.origin === 'official'
      ? e.verified
        ? t.official
        : t.unknown
      : e.origin === 'derived'
        ? t.derived
        : t.personal;
  }
  function eventCard(e: CalendarEvent) {
    return (
      <button
        type="button"
        className="deadline-event"
        key={e.event_key}
        onClick={() => openEvent(e)}
      >
        <span className={`deadline-dot deadline-dot--${e.category}`} />
        <span>
          <strong>{e.title}</strong>
          <small>{eventLabel(e)}</small>
        </span>
        <time>
          {eventDate(e, zone) ? formatDate(eventDate(e, zone)!) : t.unknown}
        </time>
        <Icon name="arrow" />
      </button>
    );
  }
  function empty(message = t.empty) {
    return (
      <div className="deadline-empty">
        <JetuMascot className="deadline-mascot-small" />
        <h2>{message}</h2>
        <p>{t.emptyBody}</p>
        <button
          className="ui-button ui-button--primary"
          onClick={() => newEvent()}
        >
          {t.newEvent}
        </button>
      </div>
    );
  }
  const cursor = Temporal.PlainDate.from(date);
  const start =
    view === 'month'
      ? cursor
          .with({ day: 1 })
          .subtract({ days: cursor.with({ day: 1 }).dayOfWeek - 1 })
      : view === 'week'
        ? cursor.subtract({ days: cursor.dayOfWeek - 1 })
        : cursor;
  const dayCount = view === 'month' ? 42 : view === 'week' ? 7 : 1;
  const days = Array.from({ length: dayCount }, (_, i) =>
    start.add({ days: i }),
  );
  const exportParams = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(filters).map(([k, v]) => [
        k,
        v === true ? '1' : v === false ? '' : String(v),
      ]),
    ),
    timezone: zone,
  });
  return (
    <main id="main" tabIndex={-1} className="page-shell deadline-workspace">
      <header className="deadline-heading">
        <div>
          <p className="journey-overline">
            JETU / {t[section === 'settings' ? 'settings' : section]}
          </p>
          <h1>
            {section === 'dashboard'
              ? t.title
              : section === 'settings'
                ? t.control
                : t[section]}
          </h1>
          <p>
            {section === 'dashboard'
              ? t.subtitle
              : section === 'settings'
                ? t.controlBody
                : t.personalHint}
          </p>
        </div>
        <button
          className="ui-button ui-button--primary"
          disabled={busy || !data}
          onClick={() => newEvent()}
        >
          <Icon name="plus" />
          {t.newEvent}
        </button>
      </header>
      <nav className="deadline-tabs" aria-label={t.dashboard}>
        {(['dashboard', 'calendar', 'inbox', 'settings'] as const).map((s) => (
          <a
            key={s}
            href={`/${locale}/${hrefs[s]}`}
            aria-current={section === s ? 'page' : undefined}
          >
            <Icon
              name={
                s === 'calendar'
                  ? 'calendar'
                  : s === 'inbox'
                    ? 'bell'
                    : s === 'settings'
                      ? 'settings'
                      : 'book'
              }
            />
            {t[s]}
            {s === 'inbox' && data ? (
              <span className="deadline-count">{data.unread}</span>
            ) : null}
          </a>
        ))}
      </nav>
      <p className="deadline-feedback" role="status">
        {notice}
      </p>
      {error ? (
        <p role="alert" className="feedback-box">
          {error}
        </p>
      ) : null}
      {loadError ? (
        <section className="deadline-empty" role="alert">
          <h2>{t.loadError}</h2>
          <button
            className="ui-button ui-button--primary"
            disabled={busy}
            onClick={reload}
          >
            {busy ? t.loading : t.retry}
          </button>
        </section>
      ) : !data ? (
        <p role="status">{t.loading}</p>
      ) : (
        <>
          {data.truncated ? <p className="feedback-box">{t.limited}</p> : null}
          {section === 'dashboard' ? (
            <>
              <section className="deadline-next">
                <div>
                  <p className="journey-overline">{t.next}</p>
                  <h2>{data.hasProfile ? t.nextMatch : t.nextProfile}</h2>
                  <p>{t.nextBody}</p>
                  <a
                    className="ui-button ui-button--accent"
                    href={`/${locale}/${data.hasProfile ? 'match' : 'onboarding'}`}
                  >
                    {data.hasProfile ? t.nextMatch : t.nextProfile}
                    <Icon name="arrow" />
                  </a>
                </div>
                <JetuMascot />
              </section>
              <section className="deadline-stats" aria-label={t.dashboard}>
                {[
                  {
                    label: t.saved,
                    value: data.saved,
                    path: 'saved',
                    icon: 'search' as const,
                  },
                  {
                    label: t.applications,
                    value: data.applications,
                    path: 'calendar',
                    icon: 'book' as const,
                  },
                  {
                    label: t.upcoming,
                    value: activeEvents.length,
                    path: 'calendar',
                    icon: 'calendar' as const,
                  },
                  {
                    label: t.unread,
                    value: data.unread,
                    path: 'notifications',
                    icon: 'bell' as const,
                  },
                ].map((s) => (
                  <a
                    className="deadline-stat"
                    key={s.label}
                    href={`/${locale}/${s.path}`}
                  >
                    <Icon name={s.icon} />
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </a>
                ))}
              </section>
              <div className="deadline-overview">
                <section className="deadline-panel">
                  <div className="deadline-panel-title">
                    <h2>{t.upcoming}</h2>
                    <a href={`/${locale}/calendar`}>
                      {t.viewAll}
                      <Icon name="arrow" />
                    </a>
                  </div>
                  {activeEvents.length
                    ? activeEvents.slice(0, 5).map(eventCard)
                    : empty()}
                </section>
                <aside className="deadline-panel deadline-side">
                  <Icon name="check" />
                  <h2>{t.profile}</h2>
                  <p>{data.hasProfile ? t.profileReady : t.profileEmpty}</p>
                  <a href={`/${locale}/onboarding`}>
                    {data.hasProfile ? t.profile : t.nextProfile}
                    <Icon name="arrow" />
                  </a>
                  <hr />
                  <h2>{t.browse}</h2>
                  <p>{t.nextBody}</p>
                  <a href={`/${locale}/search`}>
                    {t.browse}
                    <Icon name="search" />
                  </a>
                  <hr />
                  <a href={`/${locale}/notification-settings`}>
                    {t.control}
                    <Icon name="settings" />
                  </a>
                </aside>
              </div>
            </>
          ) : null}
          {section === 'calendar' ? (
            <section className="deadline-panel">
              <div className="deadline-filters">
                <label className="deadline-search">
                  <Icon name="search" />
                  <span className="sr-only">{t.search}</span>
                  <input
                    type="search"
                    value={filters.q}
                    maxLength={120}
                    placeholder={t.search}
                    onChange={(e) => changeFilters({ q: e.target.value })}
                  />
                </label>
                <label>
                  {t.sort}
                  <select
                    value={filters.sort}
                    onChange={(e) => changeFilters({ sort: e.target.value })}
                  >
                    <option value="deadline">{t.deadline}</option>
                    <option value="recent">{t.recent}</option>
                    <option value="title">{t.titleSort}</option>
                  </select>
                </label>
              </div>
              <div
                className="deadline-chips"
                role="group"
                aria-label={t.categories}
              >
                {['', ...categories].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="deadline-chip"
                    aria-pressed={filters.category === c}
                    onClick={() => changeFilters({ category: c })}
                  >
                    {c ? t[c as (typeof categories)[number]] : t.all}
                  </button>
                ))}
              </div>
              <details className="deadline-refine">
                <summary>
                  {t.status} / {t.verifiedOnly}
                </summary>
                <div className="deadline-filters">
                  <label>
                    {t.status}
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        changeFilters({ status: e.target.value })
                      }
                    >
                      <option value="">{t.all}</option>
                      {(
                        [
                          'active',
                          'completed',
                          'canceled',
                          'superseded',
                        ] as const
                      ).map((s) => (
                        <option key={s} value={s}>
                          {t[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="deadline-check">
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      onChange={(e) =>
                        changeFilters({ verified: e.target.checked })
                      }
                    />
                    {t.verifiedOnly}
                  </label>
                  <button
                    type="button"
                    className="ui-button"
                    onClick={() =>
                      changeFilters({
                        q: '',
                        category: '',
                        status: '',
                        sort: 'deadline',
                        verified: false,
                      })
                    }
                  >
                    {t.reset}
                  </button>
                </div>
              </details>
              <div className="deadline-calendar-tools">
                <div className="deadline-period">
                  <button
                    className="ui-button"
                    aria-label={t.previous}
                    onClick={() => {
                      const d = cursor
                        .subtract(
                          view === 'month'
                            ? { months: 1 }
                            : view === 'week'
                              ? { days: 7 }
                              : { days: 1 },
                        )
                        .toString();
                      setDate(d);
                      updateUrl(filters, view, d);
                    }}
                  >
                    ‹
                  </button>
                  <button
                    className="ui-button"
                    onClick={() => {
                      setDate(today);
                      updateUrl(filters, view, today);
                    }}
                  >
                    {t.today}
                  </button>
                  <button
                    className="ui-button"
                    aria-label={t.nextPeriod}
                    onClick={() => {
                      const d = cursor
                        .add(
                          view === 'month'
                            ? { months: 1 }
                            : view === 'week'
                              ? { days: 7 }
                              : { days: 1 },
                        )
                        .toString();
                      setDate(d);
                      updateUrl(filters, view, d);
                    }}
                  >
                    ›
                  </button>
                  <label>
                    <span className="sr-only">{t.jump}</span>
                    <input
                      type="date"
                      value={date}
                      min="2000-01-01"
                      max="2200-12-31"
                      onChange={(e) => {
                        if (e.target.value) {
                          setDate(e.target.value);
                          updateUrl(filters, view, e.target.value);
                        }
                      }}
                    />
                  </label>
                </div>
                <div
                  className="deadline-chips"
                  role="group"
                  aria-label={t.calendar}
                >
                  {(['day', 'week', 'month', 'agenda'] as const).map((v) => (
                    <button
                      className="deadline-chip"
                      key={v}
                      aria-pressed={view === v}
                      onClick={() => {
                        setView(v);
                        updateUrl(filters, v);
                      }}
                    >
                      {t[v]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="deadline-panel-title">
                <h2>{formatDate(date)}</h2>
                <p aria-live="polite">
                  {t.results}: {events.length}
                </p>
              </div>
              {!events.length ? (
                empty(
                  filters.q ||
                    filters.category ||
                    filters.status ||
                    filters.verified
                    ? t.noMatches
                    : t.empty,
                )
              ) : view === 'agenda' ? (
                <div className="deadline-agenda">{events.map(eventCard)}</div>
              ) : (
                <div className={`deadline-grid deadline-grid--${view}`}>
                  {days.map((d) => {
                    const key = d.toString();
                    const list = events.filter(
                      (e) => eventDate(e, zone) === key,
                    );
                    return (
                      <section
                        key={key}
                        className={`deadline-day ${key === today ? 'deadline-day--today' : ''} ${view === 'month' && d.month !== cursor.month ? 'deadline-day--outside' : ''}`}
                        aria-label={formatDate(key)}
                      >
                        <button
                          className="deadline-day-number"
                          aria-label={`${new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(key + 'T12:00Z'))} ${d.day}, ${formatDate(key)}`}
                          onClick={() => {
                            setDate(key);
                            setView('day');
                            updateUrl(filters, 'day', key);
                          }}
                        >
                          <span>
                            {new Intl.DateTimeFormat(locale, {
                              weekday: 'short',
                              timeZone: 'UTC',
                            }).format(new Date(key + 'T12:00Z'))}
                          </span>{' '}
                          <strong>{d.day}</strong>
                        </button>
                        {view === 'month' && list.length > 0 ? (
                          <button
                            className="deadline-day-count"
                            aria-label={`${list.length} · ${t.upcoming} · ${formatDate(key)}`}
                            onClick={() => {
                              setDate(key);
                              setView('day');
                              updateUrl(filters, 'day', key);
                            }}
                          >
                            {list.length}
                          </button>
                        ) : null}
                        {list.slice(0, view === 'month' ? 3 : 20).map((e) => (
                          <button
                            type="button"
                            className={`deadline-grid-event deadline-grid-event--${e.category}`}
                            key={e.event_key}
                            onClick={() => openEvent(e)}
                          >
                            {e.title}
                            <small>{eventLabel(e)}</small>
                          </button>
                        ))}
                        {list.length > (view === 'month' ? 3 : 20) ? (
                          <button
                            className="deadline-more"
                            onClick={() => {
                              setDate(key);
                              setView('day');
                              updateUrl(filters, 'day', key);
                            }}
                          >
                            +{list.length - (view === 'month' ? 3 : 20)} ·{' '}
                            {t.day}
                          </button>
                        ) : null}
                      </section>
                    );
                  })}
                </div>
              )}
              {view === 'month' ? (
                <div className="deadline-month-preview">
                  {events
                    .filter(
                      (e) =>
                        eventDate(e, zone)?.slice(0, 7) === date.slice(0, 7),
                    )
                    .map(eventCard)}
                </div>
              ) : null}
              <div className="deadline-export">
                <a
                  className="ui-button"
                  href={`/api/calendar/export?${exportParams}`}
                >
                  <Icon name="download" />
                  {t.export}
                </a>
                <p>{t.exportHint}</p>
                <span>
                  {t.zone}: {zone}
                </span>
              </div>
            </section>
          ) : null}
          {section === 'inbox' ? (
            <section className="deadline-panel">
              <div className="deadline-panel-title">
                <div
                  className="deadline-chips"
                  role="group"
                  aria-label={t.inbox}
                >
                  {[
                    ['all', t.allMessages],
                    ['unread', t.unreadOnly],
                    ['archive', t.archived],
                  ].map(([key, label]) => (
                    <button
                      className="deadline-chip"
                      key={key}
                      aria-pressed={inboxMode === key}
                      onClick={() => setInboxMode(key ?? 'all')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  className="ui-button"
                  disabled={busy || !data.unread}
                  onClick={() => mutate({ action: 'read_all' })}
                >
                  {t.readAll}
                </button>
              </div>
              <p>{t.history}</p>
              {data.inbox
                .filter((n) =>
                  inboxMode === 'archive'
                    ? n.archived_at
                    : !n.archived_at && (inboxMode !== 'unread' || !n.read_at),
                )
                .map((n) => (
                  <article
                    className={`deadline-message ${n.read_at ? '' : 'deadline-message--unread'}`}
                    key={n.id}
                  >
                    <div>
                      <span className="ui-badge">{t[n.kind]}</span>
                      {!n.read_at ? (
                        <span className="ui-badge">{t.new}</span>
                      ) : null}
                      <h2>{n.title}</h2>
                      <time dateTime={n.created_at}>
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: zone,
                        }).format(new Date(n.created_at))}
                      </time>
                      {n.kind === 'source_change' &&
                      (n.previous_due_date || n.previous_due_at) ? (
                        <p>
                          {t.previousDate}:{' '}
                          {n.previous_due_date
                            ? formatDate(n.previous_due_date)
                            : new Intl.DateTimeFormat(locale, {
                                dateStyle: 'long',
                                timeStyle: 'short',
                                timeZone: zone,
                              }).format(new Date(n.previous_due_at!))}
                        </p>
                      ) : null}
                      {n.due_date ? (
                        <p>
                          {n.kind === 'source_change' ? `${t.newDate}: ` : ''}
                          {formatDate(n.due_date)}
                        </p>
                      ) : n.due_at ? (
                        <p>
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: 'long',
                            timeStyle: 'short',
                            timeZone: zone,
                          }).format(new Date(n.due_at))}
                        </p>
                      ) : null}
                    </div>
                    <div className="deadline-message-actions">
                      <button
                        className="ui-button"
                        disabled={busy}
                        onClick={() =>
                          mutate({
                            action: 'receipt',
                            id: n.id,
                            read: !n.read_at,
                          })
                        }
                      >
                        {n.read_at ? t.markUnread : t.markRead}
                      </button>
                      <button
                        className="ui-button"
                        disabled={busy}
                        onClick={() =>
                          mutate({
                            action: 'receipt',
                            id: n.id,
                            archive: !n.archived_at,
                          })
                        }
                      >
                        {n.archived_at ? t.restore : t.archive}
                      </button>
                      {data.events.find((e) => e.event_key === n.event_key) ? (
                        <button
                          className="ui-button"
                          onClick={() =>
                            openEvent(
                              data.events.find(
                                (e) => e.event_key === n.event_key,
                              )!,
                            )
                          }
                        >
                          {t.openDate}
                          <Icon name="arrow" />
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              {data.inboxHasMore ? (
                <button
                  className="ui-button"
                  type="button"
                  disabled={busy}
                  onClick={olderMessages}
                >
                  {busy ? t.loading : t.older}
                </button>
              ) : null}
              {!data.inbox.some((n) =>
                inboxMode === 'archive'
                  ? n.archived_at
                  : !n.archived_at && (inboxMode !== 'unread' || !n.read_at),
              ) ? (
                <div className="deadline-empty">
                  <Icon name="check" />
                  <h2>{t.inboxEmpty}</h2>
                  <p>{t.inboxEmptyBody}</p>
                </div>
              ) : null}
            </section>
          ) : null}
          {section === 'settings' && draft ? (
            <form
              className="deadline-preferences"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!preferencesSchema.safeParse(draft).success) {
                  setError(t.saveError);
                  return;
                }
                await mutate({ action: 'preferences', value: draft });
              }}
            >
              <section className="deadline-panel">
                <h2>{t.control}</h2>
                <label className="deadline-switch">
                  <span>{t.inApp}</span>
                  <input
                    type="checkbox"
                    checked={draft.in_app}
                    onChange={(e) =>
                      setDraft({ ...draft, in_app: e.target.checked })
                    }
                  />
                </label>
                <label className="deadline-switch">
                  <span>{t.pause}</span>
                  <input
                    type="checkbox"
                    checked={draft.paused}
                    onChange={(e) =>
                      setDraft({ ...draft, paused: e.target.checked })
                    }
                  />
                </label>
                <label className="deadline-switch">
                  <span>{t.sourceChanges}</span>
                  <input
                    type="checkbox"
                    checked={draft.source_changes}
                    onChange={(e) =>
                      setDraft({ ...draft, source_changes: e.target.checked })
                    }
                  />
                </label>
                <fieldset>
                  <legend>{t.categories}</legend>
                  <div className="deadline-chips">
                    {categories.map((c) => (
                      <label className="deadline-choice" key={c}>
                        <input
                          type="checkbox"
                          checked={draft.categories.includes(c)}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              categories: e.target.checked
                                ? [...draft.categories, c]
                                : draft.categories.filter((x) => x !== c),
                            })
                          }
                        />
                        {t[c]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>{t.leads}</legend>
                  <div className="deadline-chips">
                    {[30, 14, 7, 1].map((n) => (
                      <label className="deadline-choice" key={n}>
                        <input
                          type="checkbox"
                          checked={draft.lead_days.includes(n)}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              lead_days: e.target.checked
                                ? [...draft.lead_days, n]
                                : draft.lead_days.filter((x) => x !== n),
                            })
                          }
                        />
                        {n}
                      </label>
                    ))}
                  </div>
                  <p className="field-help">{t.leadHint}</p>
                </fieldset>
                <div className="deadline-provider">
                  <Icon name="info" />
                  <div>
                    <p>{t.email}</p>
                    <p>{t.push}</p>
                  </div>
                </div>
              </section>
              <section className="deadline-panel">
                <h2>{t.zone}</h2>
                <label>
                  {t.zone}
                  <select
                    value={draft.timezone}
                    onChange={(e) =>
                      setDraft({ ...draft, timezone: e.target.value })
                    }
                  >
                    {[
                      ...new Set([
                        'UTC',
                        draft.timezone,
                        ...[
                          'Asia/Qyzylorda',
                          'Asia/Almaty',
                          'Asia/Tashkent',
                          'Asia/Bishkek',
                          'Asia/Dubai',
                          'Asia/Kolkata',
                          'Asia/Shanghai',
                          'Asia/Seoul',
                          'Asia/Tokyo',
                          'Europe/London',
                          'Europe/Berlin',
                          'Europe/Paris',
                          'America/New_York',
                          'America/Chicago',
                          'America/Denver',
                          'America/Los_Angeles',
                          'America/Toronto',
                          'America/Sao_Paulo',
                          'Australia/Sydney',
                          'Pacific/Auckland',
                          'Pacific/Kiritimati',
                        ],
                      ]),
                    ].map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="field-help">{t.timezoneHint}</p>
                <label>
                  {t.digest}
                  <select
                    value={draft.digest}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        digest: e.target.value as Preferences['digest'],
                      })
                    }
                  >
                    {(['immediate', 'daily', 'weekly', 'off'] as const).map(
                      (v) => (
                        <option key={v} value={v}>
                          {t[v]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  {t.digestTime}
                  <input
                    type="time"
                    required
                    value={draft.digest_time}
                    onChange={(e) =>
                      setDraft({ ...draft, digest_time: e.target.value })
                    }
                  />
                </label>
                <div className="deadline-time-pair">
                  <label>
                    {t.quietStart}
                    <input
                      type="time"
                      required
                      value={draft.quiet_start}
                      onChange={(e) =>
                        setDraft({ ...draft, quiet_start: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t.quietEnd}
                    <input
                      type="time"
                      required
                      value={draft.quiet_end}
                      onChange={(e) =>
                        setDraft({ ...draft, quiet_end: e.target.value })
                      }
                    />
                  </label>
                </div>
                <p className="field-help">{t.quietHint}</p>
                <button
                  type="submit"
                  className="ui-button ui-button--primary"
                  disabled={busy}
                >
                  {busy ? t.saving : t.save}
                  <Icon name="check" />
                </button>
              </section>
            </form>
          ) : null}
        </>
      )}
      <dialog
        ref={dialog}
        className="deadline-dialog"
        aria-labelledby="deadline-detail-title"
      >
        <div className="deadline-panel-title">
          <h2 id="deadline-detail-title">{t.details}</h2>
          <button
            className="ui-button"
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={t.close}
          >
            <Icon name="close" />
          </button>
        </div>
        {selected ? (
          <>
            <span className="ui-badge">{eventLabel(selected)}</span>
            <h3>{selected.title}</h3>
            <p>
              {eventDate(selected, zone)
                ? formatDate(eventDate(selected, zone)!)
                : t.unknown}
            </p>
            {selected.precision === 'date_only' ? (
              <p>{t.dateOnly}</p>
            ) : selected.due_at ? (
              <p>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: 'full',
                  timeStyle: 'long',
                  timeZone: zone,
                }).format(new Date(selected.due_at))}
              </p>
            ) : null}
            <p>
              {t.sourceZone}: {selected.timezone ?? t.zoneUnknown}
            </p>
            {selected.checked_at ? (
              <p>
                {t.checked}:{' '}
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: 'medium',
                  timeZone: zone,
                }).format(new Date(selected.checked_at))}
              </p>
            ) : null}
            {selected.source_url && /^https:\/\//.test(selected.source_url) ? (
              <a
                href={selected.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.source}
                <Icon name="arrow" />
              </a>
            ) : null}
            <p>
              {t.status}:{' '}
              {selected.status in t
                ? t[selected.status as 'active']
                : selected.status}
            </p>
            <div className="deadline-dialog-actions">
              {selected.origin === 'user_created' ? (
                <>
                  <button
                    className="ui-button ui-button--primary"
                    disabled={busy}
                    onClick={() => newEvent(selected)}
                  >
                    {t.edit}
                  </button>
                  <button
                    className="ui-button"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await mutate({
                          action: 'event',
                          value: {
                            id: selected.event_key.slice(7),
                            version: selected.version,
                            title: selected.title,
                            due_date: selected.due_date,
                            status:
                              selected.status === 'completed'
                                ? 'active'
                                : 'completed',
                          },
                        })
                      )
                        dialog.current?.close();
                    }}
                  >
                    {selected.status === 'completed' ? t.restore : t.complete}
                  </button>
                  <button
                    className="ui-button"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await mutate({
                          action: 'event',
                          value: {
                            id: selected.event_key.slice(7),
                            version: selected.version,
                            title: selected.title,
                            due_date: selected.due_date,
                            status:
                              selected.status === 'canceled'
                                ? 'active'
                                : 'canceled',
                          },
                        })
                      )
                        dialog.current?.close();
                    }}
                  >
                    {selected.status === 'canceled' ? t.restore : t.cancelEvent}
                  </button>
                </>
              ) : null}
              <button
                className="ui-button"
                disabled={busy}
                onClick={async () => {
                  if (
                    await mutate({
                      action: 'mute',
                      event_key: selected.event_key,
                      muted: !selected.muted,
                    })
                  )
                    dialog.current?.close();
                }}
              >
                {selected.muted ? t.unmute : t.mute}
              </button>
            </div>
          </>
        ) : null}
        {error ? (
          <p role="alert" className="feedback-box">
            {error}
          </p>
        ) : null}
      </dialog>
      <dialog
        ref={formDialog}
        className="deadline-dialog"
        aria-labelledby="deadline-form-title"
      >
        <div className="deadline-panel-title">
          <h2 id="deadline-form-title">{editing ? t.edit : t.newEvent}</h2>
          <button
            className="ui-button"
            type="button"
            aria-label={t.close}
            onClick={() => formDialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <p>{t.personalHint}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await mutate({
                action: 'event',
                value: {
                  ...(editing
                    ? {
                        id: editing.event_key.slice(7),
                        version: editing.version,
                      }
                    : {}),
                  title: formTitle,
                  due_date: formDate,
                  status: editing?.status ?? 'active',
                },
              })
            )
              formDialog.current?.close();
          }}
        >
          <label>
            {t.titleLabel}
            <input
              required
              maxLength={240}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </label>
          <label>
            {t.dateLabel}
            <input
              type="date"
              required
              min="2000-01-01"
              max="2200-12-31"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </label>
          {error ? (
            <p role="alert" className="feedback-box">
              {error}
            </p>
          ) : null}
          <button
            className="ui-button ui-button--primary"
            type="submit"
            disabled={busy}
          >
            {busy ? t.saving : t.save}
            <Icon name="check" />
          </button>
        </form>
      </dialog>
    </main>
  );
}
