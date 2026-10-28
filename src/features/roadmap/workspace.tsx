'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import type { RoadmapState } from './service';
import {
  calculateProgress,
  nextBestAction,
  unmetMandatoryDependencies,
  type TaskPriority,
  type TaskStatus,
} from './engine';
import { roadmapCopy } from './copy';
import { WeeklyWorkload } from './weekly-workload';

export type RoadmapView =
  'overview' | 'kanban' | 'timeline' | 'calendar' | 'checklist';
type Task = RoadmapState['tasks'][number];
type ApiResult<T> = { data?: T; error?: { code: string; message: string } };

const views: RoadmapView[] = [
  'overview',
  'kanban',
  'timeline',
  'calendar',
  'checklist',
];
const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'completed'];
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

function dateOnly(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function taskDueDate(task: Task) {
  return (
    task.targetDate ??
    task.recommendedDueDate ??
    task.officialDeadlineDate ??
    dateOnly(task.officialDeadlineAt)
  );
}

function formatDate(locale: Locale, value: string | null) {
  if (!value) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    parsed,
  );
}

function deadlineLabel(locale: Locale, task: Task) {
  const t = roadmapCopy[locale];
  if (task.deadlinePrecision === 'date_only')
    return `${formatDate(locale, task.officialDeadlineDate)} · ${t.dateOnly}`;
  if (task.deadlinePrecision === 'rolling') return t.rolling;
  if (task.deadlinePrecision === 'unknown') return t.unknownDate;
  if (!task.officialDeadlineAt) return t.unknownDate;
  const parsed = new Date(task.officialDeadlineAt);
  if (!Number.isFinite(parsed.getTime())) return t.unknownDate;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(task.deadlineTimezone ? { timeZone: task.deadlineTimezone } : {}),
  }).format(parsed);
}

async function jsonRequest<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || result.error)
    throw Object.assign(new Error(result.error?.message ?? 'Request failed'), {
      code: result.error?.code,
    });
  return result.data as T;
}

function TaskCard({
  task,
  locale,
  state,
  onOpen,
  onStatus,
  pending,
}: {
  task: Task;
  locale: Locale;
  state: RoadmapState;
  onOpen: (task: Task) => void;
  onStatus: (task: Task, status: TaskStatus) => void;
  pending: boolean;
}) {
  const t = roadmapCopy[locale];
  const unmet = unmetMandatoryDependencies(
    task.id,
    state.tasks.map((item) => ({ id: item.id, status: item.status })),
    state.dependencies.map((item) => ({
      taskId: item.taskId,
      dependsOnTaskId: item.dependsOnTaskId,
      dependencyType: item.dependencyType,
    })),
  );
  const due = taskDueDate(task);
  return (
    <article
      className={`roadmap-task roadmap-task--${task.priority}`}
      data-status={task.status}
    >
      <div className="roadmap-task-topline">
        <span
          className={`ui-badge roadmap-priority roadmap-priority--${task.priority}`}
        >
          {t.priorityLabels[task.priority]}
        </span>
        <span className="roadmap-task-origin">
          {task.origin === 'manual' ? t.manual : t.generated}
        </span>
      </div>
      <h3>
        <button
          className="roadmap-task-title"
          type="button"
          onClick={() => onOpen(task)}
        >
          {task.title}
        </button>
      </h3>
      {task.description && <p>{task.description}</p>}
      <div className="roadmap-task-meta">
        <span>{task.mandatory ? t.mandatory : t.optional}</span>
        <span>{due ? formatDate(locale, due) : t.unknownDate}</span>
      </div>
      {unmet.length > 0 && (
        <p className="roadmap-blocked-note">
          {t.blockedBy}: {unmet.length}
        </p>
      )}
      <div className="roadmap-task-actions">
        {task.status === 'todo' && (
          <button
            type="button"
            disabled={pending || unmet.length > 0}
            onClick={() => onStatus(task, 'in_progress')}
          >
            {t.start}
          </button>
        )}
        {task.status !== 'completed' && task.status !== 'blocked' && (
          <button
            type="button"
            disabled={pending || unmet.length > 0}
            onClick={() => onStatus(task, 'completed')}
          >
            {t.complete}
          </button>
        )}
        {task.status === 'completed' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus(task, 'todo')}
          >
            {t.reopen}
          </button>
        )}
        <button type="button" onClick={() => onOpen(task)}>
          {t.details}
        </button>
      </div>
    </article>
  );
}

function Overview({
  state,
  locale,
  onOpen,
  onStatus,
  pending,
}: {
  state: RoadmapState;
  locale: Locale;
  onOpen: (task: Task) => void;
  onStatus: (task: Task, status: TaskStatus) => void;
  pending: boolean;
}) {
  const t = roadmapCopy[locale];
  const active = state.tasks.filter((task) => !task.obsoleteAt);
  const graphTasks = active.map((task) => ({
    id: task.id,
    status: task.status,
    weight: task.mandatory ? 2 : 1,
  }));
  const graphEdges = state.dependencies.map((edge) => ({
    taskId: edge.taskId,
    dependsOnTaskId: edge.dependsOnTaskId,
    dependencyType: edge.dependencyType,
  }));
  const progress = calculateProgress(graphTasks);
  const today = new Date().toISOString().slice(0, 10);
  const next = nextBestAction(
    active.map((task) => ({
      id: task.id,
      status: task.status,
      title: task.title,
      mandatory: task.mandatory,
      priority: task.priority,
      dueDate: taskDueDate(task),
    })),
    graphEdges,
    today,
  );
  const upcoming = active
    .filter(
      (task) =>
        task.status !== 'completed' &&
        taskDueDate(task) &&
        taskDueDate(task)! >= today,
    )
    .sort((a, b) => (taskDueDate(a) ?? '').localeCompare(taskDueDate(b) ?? ''))
    .slice(0, 4);
  const overdue = active.filter(
    (task) =>
      task.status !== 'completed' &&
      taskDueDate(task) &&
      taskDueDate(task)! < today,
  );
  const nextTask = next ? active.find((task) => task.id === next.id) : null;
  return (
    <div className="roadmap-overview">
      <section
        className="roadmap-progress-panel"
        aria-labelledby="roadmap-progress-title"
      >
        <div>
          <p className="section-kicker">{t.progress}</p>
          <h2 id="roadmap-progress-title">{progress.percent}%</h2>
          <p>
            {progress.completed} / {progress.total} {t.completed}
          </p>
        </div>
        <div
          className="roadmap-progress-ring"
          style={
            {
              '--roadmap-progress': `${progress.percent}%`,
            } as React.CSSProperties
          }
          role="img"
          aria-label={`${t.progress}: ${progress.percent}%`}
        >
          <span>{progress.percent}%</span>
        </div>
      </section>
      <section
        className="roadmap-next-panel"
        aria-labelledby="next-action-title"
      >
        <p className="section-kicker">JETU / NEXT</p>
        <h2 id="next-action-title">{t.nextAction}</h2>
        <p>{t.nextReason}</p>
        {nextTask ? (
          <TaskCard
            task={nextTask}
            locale={locale}
            state={state}
            onOpen={onOpen}
            onStatus={onStatus}
            pending={pending}
          />
        ) : (
          <p className="roadmap-empty-inline">{t.noTasks}</p>
        )}
      </section>
      <section className="roadmap-summary-grid" aria-label={t.progress}>
        <article>
          <strong>
            {active.filter((task) => task.status === 'completed').length}
          </strong>
          <span>{t.completed}</span>
        </article>
        <article>
          <strong>{upcoming.length}</strong>
          <span>{t.upcoming}</span>
        </article>
        <article>
          <strong>{overdue.length}</strong>
          <span>{t.overdue}</span>
        </article>
        <article>
          <strong>
            {state.targets.filter((target) => target.active).length}
          </strong>
          <span>{t.savedTargets}</span>
        </article>
      </section>
      <section className="roadmap-upcoming" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">{t.upcoming}</h2>
        <div className="roadmap-task-grid">
          {upcoming.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              locale={locale}
              state={state}
              onOpen={onOpen}
              onStatus={onStatus}
              pending={pending}
            />
          ))}
          {!upcoming.length && <p>{t.noTasks}</p>}
        </div>
      </section>
      <WeeklyWorkload state={state} locale={locale} onOpen={onOpen} />
    </div>
  );
}

function Kanban({
  state,
  locale,
  onOpen,
  onStatus,
  pending,
}: {
  state: RoadmapState;
  locale: Locale;
  onOpen: (task: Task) => void;
  onStatus: (task: Task, status: TaskStatus) => void;
  pending: boolean;
}) {
  const t = roadmapCopy[locale];
  return (
    <div className="roadmap-kanban" aria-label={t.views.kanban}>
      {statuses.map((status) => (
        <section
          className="roadmap-kanban-column"
          key={status}
          aria-labelledby={`column-${status}`}
        >
          <header>
            <h2 id={`column-${status}`}>{t.columns[status]}</h2>
            <span>
              {
                state.tasks.filter(
                  (task) => !task.obsoleteAt && task.status === status,
                ).length
              }
            </span>
          </header>
          <div>
            {state.tasks
              .filter((task) => !task.obsoleteAt && task.status === status)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  locale={locale}
                  state={state}
                  onOpen={onOpen}
                  onStatus={onStatus}
                  pending={pending}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Timeline({
  state,
  locale,
  onOpen,
}: {
  state: RoadmapState;
  locale: Locale;
  onOpen: (task: Task) => void;
}) {
  const t = roadmapCopy[locale];
  const milestones = state.milestones
    .filter((milestone) => milestone.active)
    .sort((a, b) => a.sequence - b.sequence);
  return (
    <ol className="roadmap-timeline" aria-label={t.views.timeline}>
      {milestones.map((milestone, index) => (
        <li key={milestone.id}>
          <div className="roadmap-timeline-marker" aria-hidden="true">
            {index + 1}
          </div>
          <section>
            <p className="section-kicker">
              {milestone.recommendedDate
                ? formatDate(locale, milestone.recommendedDate)
                : t.unknownDate}
            </p>
            <h2>{milestone.title}</h2>
            <p>{milestone.description}</p>
            <ul>
              {state.tasks
                .filter(
                  (task) =>
                    task.milestoneId === milestone.id && !task.obsoleteAt,
                )
                .map((task) => (
                  <li key={task.id}>
                    <button type="button" onClick={() => onOpen(task)}>
                      <span
                        className={`roadmap-status-dot roadmap-status-dot--${task.status}`}
                      />
                      {task.title}
                      <small>
                        {taskDueDate(task)
                          ? formatDate(locale, taskDueDate(task))
                          : t.unknownDate}
                      </small>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        </li>
      ))}
    </ol>
  );
}

function Calendar({
  state,
  locale,
  onOpen,
}: {
  state: RoadmapState;
  locale: Locale;
  onOpen: (task: Task) => void;
}) {
  const t = roadmapCopy[locale];
  const [cursor, setCursor] = useState(() => {
    const date = new Date();
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  });
  const year = cursor.getUTCFullYear();
  const month = cursor.getUTCMonth();
  const leading = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array.from(
    { length: Math.ceil((leading + days) / 7) * 7 },
    (_, index) => index - leading + 1,
  );
  const heading = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(cursor);
  return (
    <section className="roadmap-calendar" aria-labelledby="calendar-title">
      <header>
        <button
          type="button"
          aria-label={t.previousMonth}
          onClick={() => setCursor(new Date(Date.UTC(year, month - 1, 1)))}
        >
          ←
        </button>
        <h2 id="calendar-title">{heading}</h2>
        <button
          type="button"
          aria-label={t.nextMonth}
          onClick={() => setCursor(new Date(Date.UTC(year, month + 1, 1)))}
        >
          →
        </button>
      </header>
      <div className="roadmap-calendar-grid">
        {cells.map((day, index) => {
          const date =
            day > 0 && day <= days
              ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              : null;
          const tasks = date
            ? state.tasks.filter(
                (task) => !task.obsoleteAt && taskDueDate(task) === date,
              )
            : [];
          return (
            <div
              className={
                date
                  ? 'roadmap-calendar-day'
                  : 'roadmap-calendar-day roadmap-calendar-day--outside'
              }
              key={index}
            >
              {date && (
                <>
                  <span>{day}</span>
                  {tasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpen(task)}
                      className={`roadmap-calendar-task roadmap-calendar-task--${task.priority}`}
                    >
                      {task.title}
                    </button>
                  ))}
                  {tasks.length > 3 && <small>+{tasks.length - 3}</small>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Checklist({
  state,
  locale,
  onOpen,
  onStatus,
  pending,
}: {
  state: RoadmapState;
  locale: Locale;
  onOpen: (task: Task) => void;
  onStatus: (task: Task, status: TaskStatus) => void;
  pending: boolean;
}) {
  const t = roadmapCopy[locale];
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const filtered = state.tasks
    .filter(
      (task) =>
        !task.obsoleteAt &&
        (status === 'all' || task.status === status) &&
        `${task.title} ${task.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      (taskDueDate(a) ?? '9999').localeCompare(taskDueDate(b) ?? '9999'),
    );
  return (
    <section className="roadmap-checklist" aria-labelledby="checklist-title">
      <h2 id="checklist-title">{t.views.checklist}</h2>
      <div className="roadmap-filters">
        <label>
          {t.search}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          {t.status}
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as TaskStatus | 'all')
            }
          >
            <option value="all">{t.all}</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {t.columns[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="roadmap-checklist-list">
        {filtered.map((task) => (
          <div className="roadmap-check-row" key={task.id}>
            <input
              type="checkbox"
              aria-label={task.title}
              checked={task.status === 'completed'}
              disabled={pending || task.status === 'blocked'}
              onChange={() =>
                onStatus(
                  task,
                  task.status === 'completed' ? 'todo' : 'completed',
                )
              }
            />
            <span>
              <button type="button" onClick={() => onOpen(task)}>
                {task.title}
              </button>
              <small>
                {taskDueDate(task)
                  ? formatDate(locale, taskDueDate(task))
                  : t.unknownDate}{' '}
                · {t.priorityLabels[task.priority]}
              </small>
            </span>
          </div>
        ))}
        {!filtered.length && <p>{t.noTasks}</p>}
      </div>
    </section>
  );
}

function TaskDialog({
  task,
  state,
  locale,
  pending,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  state: RoadmapState;
  locale: Locale;
  pending: boolean;
  onClose: () => void;
  onSave: (task: Task, patch: Record<string, unknown>) => void;
  onDelete: (task: Task) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const t = roadmapCopy[locale];
  useEffect(() => {
    if (task && !dialog.current?.open) dialog.current?.showModal();
    else if (!task && dialog.current?.open) dialog.current?.close();
  }, [task]);
  if (!task) return null;
  const blockers = state.dependencies
    .filter((edge) => edge.taskId === task.id)
    .map((edge) => ({
      edge,
      task: state.tasks.find((item) => item.id === edge.dependsOnTaskId),
    }))
    .filter((item) => item.task);
  return (
    <dialog ref={dialog} className="roadmap-dialog" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSave(task, {
            title:
              task.origin === 'manual'
                ? String(data.get('title') ?? '')
                : undefined,
            description:
              task.origin === 'manual'
                ? String(data.get('description') ?? '')
                : undefined,
            note: String(data.get('note') ?? ''),
            priority: String(data.get('priority') ?? 'medium'),
            targetDate: String(data.get('targetDate') ?? '') || null,
          });
        }}
      >
        <div className="roadmap-dialog-header">
          <div>
            <p className="section-kicker">{t.details}</p>
            <h2>{task.title}</h2>
          </div>
          <button
            type="button"
            className="roadmap-dialog-close"
            aria-label={t.cancel}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        {task.origin === 'manual' ? (
          <>
            <label>
              {t.taskTitle}
              <input
                name="title"
                required
                maxLength={240}
                defaultValue={task.title}
              />
            </label>
            <label>
              {t.taskDescription}
              <textarea
                name="description"
                maxLength={4000}
                defaultValue={task.description}
              />
            </label>
          </>
        ) : (
          <p>{task.description}</p>
        )}
        <dl className="roadmap-detail-list">
          <div>
            <dt>{t.why}</dt>
            <dd>{task.whyItMatters || t.nextReason}</dd>
          </div>
          <div>
            <dt>{t.officialDeadline}</dt>
            <dd>{deadlineLabel(locale, task)}</dd>
          </div>
          <div>
            <dt>{t.internalDate}</dt>
            <dd>
              {task.recommendedDueDate
                ? formatDate(locale, task.recommendedDueDate)
                : t.unknownDate}
            </dd>
          </div>
          <div>
            <dt>{t.estimatedTime}</dt>
            <dd>{task.estimatedMinutes} min</dd>
          </div>
        </dl>
        {task.sourceUrl && (
          <p>
            <a href={task.sourceUrl} target="_blank" rel="noreferrer">
              {t.source} ↗
            </a>
          </p>
        )}
        <label>
          {t.targetDate}
          <input
            name="targetDate"
            type="date"
            defaultValue={task.targetDate ?? ''}
          />
        </label>
        <label>
          {t.priority}
          <select name="priority" defaultValue={task.priority}>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {t.priorityLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.notes}
          <textarea
            name="note"
            maxLength={4000}
            defaultValue={task.note ?? ''}
          />
        </label>
        {blockers.length > 0 && (
          <section className="roadmap-dependencies">
            <h3>{t.dependencies}</h3>
            <ul>
              {blockers.map(({ edge, task: blocker }) => (
                <li key={edge.id}>
                  <span
                    className={`roadmap-status-dot roadmap-status-dot--${blocker!.status}`}
                  />
                  {blocker!.title} ·{' '}
                  {edge.dependencyType === 'mandatory'
                    ? t.mandatory
                    : t.optional}
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="roadmap-dialog-actions">
          <button className="ui-button" type="submit" disabled={pending}>
            {t.save}
          </button>
          {task.origin === 'manual' && (
            <button
              className="ui-button ui-button--danger"
              type="button"
              disabled={pending}
              onClick={() => onDelete(task)}
            >
              {t.delete}
            </button>
          )}
          <button
            className="ui-button ui-button--secondary"
            type="button"
            onClick={() => dialog.current?.close()}
          >
            {t.cancel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function RoadmapWorkspace({
  locale,
  initialView,
}: {
  locale: Locale;
  initialView: RoadmapView;
}) {
  const t = roadmapCopy[locale];
  const [state, setState] = useState<RoadmapState | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selected, setSelected] = useState<Task | null>(null);
  const load = useCallback(async () => {
    setPhase('loading');
    try {
      setState(await jsonRequest<RoadmapState>('/api/roadmaps'));
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }, []);
  useEffect(() => {
    let active = true;
    void jsonRequest<RoadmapState>('/api/roadmaps')
      .then((result) => {
        if (!active) return;
        setState(result);
        setPhase('ready');
      })
      .catch(() => {
        if (active) setPhase('error');
      });
    return () => {
      active = false;
    };
  }, []);
  const updateTask = useCallback(
    async (task: Task, patch: Record<string, unknown>) => {
      setPending(true);
      setFeedback('');
      try {
        await jsonRequest(`/api/roadmaps/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ version: task.version, ...patch }),
        });
        await load();
        setSelected(null);
        setFeedback(t.saved);
      } catch (error) {
        setFeedback(
          (error as { code?: string }).code === 'CONFLICT'
            ? t.updateConflict
            : t.actionError,
        );
      } finally {
        setPending(false);
      }
    },
    [load, t],
  );
  const activeTasks = useMemo(
    () => state?.tasks.filter((task) => !task.obsoleteAt) ?? [],
    [state],
  );
  if (phase === 'loading')
    return (
      <main
        id="main"
        tabIndex={-1}
        className="dashboard-main page-shell roadmap-main"
        aria-busy="true"
      >
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">JETU / {t.nav}</p>
            <h1>{t.title}</h1>
          </div>
        </div>
        <div className="roadmap-skeleton">
          <span />
          <span />
          <span />
        </div>
      </main>
    );
  if (phase === 'error' || !state)
    return (
      <main
        id="main"
        tabIndex={-1}
        className="dashboard-main page-shell roadmap-main"
      >
        <div className="search-state" role="alert">
          <h1>{t.title}</h1>
          <p>{t.unavailable}</p>
          <button
            className="ui-button"
            type="button"
            onClick={() => void load()}
          >
            {t.retry}
          </button>
        </div>
      </main>
    );
  const currentYear = new Date().getUTCFullYear();
  return (
    <main
      id="main"
      tabIndex={-1}
      className="dashboard-main page-shell roadmap-main"
    >
      <header className="dashboard-heading roadmap-heading">
        <div>
          <p className="eyebrow">JETU / {t.nav}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <button
          className="ui-button ui-button--accent"
          type="button"
          onClick={() =>
            document
              .getElementById('roadmap-generator')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          {state.roadmap ? t.regenerate : t.generate}
        </button>
      </header>
      {feedback && (
        <p
          className={`feedback-box ${feedback === t.saved || feedback === t.regenerated || feedback === t.removed ? 'feedback-box--success' : 'feedback-box--error'}`}
          role="status"
        >
          {feedback}
        </p>
      )}
      <section
        id="roadmap-generator"
        className="roadmap-generator"
        aria-labelledby="generator-title"
      >
        <div>
          <p className="section-kicker">JETU / PLAN SETTINGS</p>
          <h2 id="generator-title">
            {state.roadmap ? t.regenerate : t.generate}
          </h2>
          <p>{state.availableTargets.length ? t.savedTargets : t.noTargets}</p>
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setPending(true);
            setFeedback('');
            try {
              await jsonRequest('/api/roadmaps', {
                method: 'POST',
                body: JSON.stringify({
                  locale,
                  cycleYear: Number(data.get('cycleYear')),
                  timezone: String(data.get('timezone')),
                  availabilityMinutesPerWeek: Number(data.get('availability')),
                  targetIds: data.getAll('targetId').map(Number),
                }),
              });
              await load();
              setFeedback(t.regenerated);
            } catch {
              setFeedback(t.actionError);
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="roadmap-settings-grid">
            <label>
              {t.cycleYear}
              <input
                name="cycleYear"
                type="number"
                min={currentYear}
                max={2200}
                defaultValue={state.roadmap?.cycleYear ?? currentYear + 1}
                required
              />
            </label>
            <label>
              {t.timezone}
              <input
                name="timezone"
                defaultValue={
                  state.roadmap?.timezone ??
                  Intl.DateTimeFormat().resolvedOptions().timeZone ??
                  'UTC'
                }
                maxLength={80}
                required
              />
            </label>
            <label>
              {t.availability}
              <span className="roadmap-input-suffix">
                <input
                  name="availability"
                  type="number"
                  min={30}
                  max={10080}
                  defaultValue={
                    state.roadmap?.availabilityMinutesPerWeek ?? 300
                  }
                  required
                />
                <small>{t.minutesPerWeek}</small>
              </span>
            </label>
          </div>
          {state.availableTargets.length > 0 && (
            <fieldset className="roadmap-targets">
              <legend>{t.savedTargets}</legend>
              {state.availableTargets.map((target) => {
                const inputId = `roadmap-target-${target.targetType}-${target.catalogEntityId}`;
                return (
                  <div key={`${target.targetType}:${target.catalogEntityId}`}>
                    <input
                      id={inputId}
                      aria-label={target.title}
                      type="checkbox"
                      name="targetId"
                      value={target.catalogEntityId}
                      defaultChecked={state.targets.some(
                        (item) =>
                          item.active &&
                          item.catalogEntityId === target.catalogEntityId,
                      )}
                    />
                    <span>
                      <strong>{target.title}</strong>
                      <small>{target.targetType}</small>
                    </span>
                  </div>
                );
              })}
            </fieldset>
          )}
          <button className="ui-button" type="submit" disabled={pending}>
            {pending ? t.generating : state.roadmap ? t.regenerate : t.generate}
          </button>
        </form>
      </section>
      {state.roadmap && (
        <>
          <nav className="roadmap-view-nav" aria-label={t.title}>
            {views.map((view) => (
              <a
                key={view}
                href={`/${locale}/plan?view=${view}`}
                aria-current={initialView === view ? 'page' : undefined}
              >
                {t.views[view]}
              </a>
            ))}
          </nav>
          <section
            className="roadmap-manual"
            aria-labelledby="manual-task-title"
          >
            <details>
              <summary id="manual-task-title">{t.addTask}</summary>
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  setPending(true);
                  try {
                    await jsonRequest('/api/roadmaps/tasks', {
                      method: 'POST',
                      body: JSON.stringify({
                        title: String(data.get('title')),
                        description: String(data.get('description')),
                        priority: String(data.get('priority')),
                        targetDate: String(data.get('targetDate')) || null,
                        note: '',
                        estimatedMinutes: Number(data.get('estimatedMinutes')),
                      }),
                    });
                    form.reset();
                    await load();
                    setFeedback(t.saved);
                  } catch {
                    setFeedback(t.actionError);
                  } finally {
                    setPending(false);
                  }
                }}
              >
                <label>
                  {t.taskTitle}
                  <input name="title" required maxLength={240} />
                </label>
                <label>
                  {t.taskDescription}
                  <textarea name="description" maxLength={4000} />
                </label>
                <label>
                  {t.priority}
                  <select name="priority" defaultValue="medium">
                    {priorities.map((value) => (
                      <option key={value} value={value}>
                        {t.priorityLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.targetDate}
                  <input name="targetDate" type="date" />
                </label>
                <label>
                  {t.estimatedTime}
                  <input
                    name="estimatedMinutes"
                    type="number"
                    min={5}
                    max={10080}
                    defaultValue={30}
                  />
                </label>
                <button className="ui-button" type="submit" disabled={pending}>
                  {t.save}
                </button>
              </form>
            </details>
          </section>
          {initialView === 'overview' && (
            <Overview
              state={state}
              locale={locale}
              onOpen={setSelected}
              onStatus={(task, status) => void updateTask(task, { status })}
              pending={pending}
            />
          )}
          {initialView === 'kanban' && (
            <Kanban
              state={state}
              locale={locale}
              onOpen={setSelected}
              onStatus={(task, status) => void updateTask(task, { status })}
              pending={pending}
            />
          )}
          {initialView === 'timeline' && (
            <Timeline state={state} locale={locale} onOpen={setSelected} />
          )}
          {initialView === 'calendar' && (
            <Calendar state={state} locale={locale} onOpen={setSelected} />
          )}
          {initialView === 'checklist' && (
            <Checklist
              state={state}
              locale={locale}
              onOpen={setSelected}
              onStatus={(task, status) => void updateTask(task, { status })}
              pending={pending}
            />
          )}
        </>
      )}{' '}
      {!state.roadmap && (
        <section className="roadmap-empty">
          <h2>{t.noRoadmap}</h2>
          <p>{t.noTargets}</p>
        </section>
      )}
      <TaskDialog
        task={selected}
        state={state}
        locale={locale}
        pending={pending}
        onClose={() => setSelected(null)}
        onSave={(task, patch) => void updateTask(task, patch)}
        onDelete={async (task) => {
          setPending(true);
          try {
            await jsonRequest(`/api/roadmaps/tasks/${task.id}`, {
              method: 'DELETE',
              body: JSON.stringify({ version: task.version }),
            });
            setSelected(null);
            await load();
            setFeedback(t.removed);
          } catch {
            setFeedback(t.actionError);
          } finally {
            setPending(false);
          }
        }}
      />
      <span className="sr-only" aria-live="polite">
        {activeTasks.length}
      </span>
    </main>
  );
}
