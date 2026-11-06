'use client';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import { requestData } from '@/features/writing/client';
import { mentorCopy, label } from './copy';
import {
  rubricKeys,
  type Command,
  type Workspace,
  type RequestRow,
} from './contracts';
export function MentorReview({
  locale,
  data,
  request: r,
  run,
  busy,
}: {
  locale: Locale;
  data: Workspace;
  request: RequestRow;
  run: (value: Command) => Promise<void>;
  busy: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  const t = mentorCopy[locale],
    student = r.student_id === data.actor.id,
    grants = data.grants.filter((g) => g.request_id === r.id),
    active =
      !r.revoked_at &&
      new Date(r.expires_at).getTime() > now &&
      !['completed', 'cancelled', 'disputed', 'expired'].includes(r.status);
  const [grantId, setGrantId] = useState(grants[0]?.id ?? ''),
    [resource, setResource] = useState<{
      type: string;
      content?: string;
      title?: string;
      version?: number;
      draft?: string;
      prompt?: string;
      wordLimit?: number;
      snapshot?: Record<string, unknown>;
      preview?: string;
    } | null>(null),
    [resourceError, setResourceError] = useState(false),
    [parent, setParent] = useState<string | null>(null),
    [body, setBody] = useState(''),
    [selection, setSelection] = useState<{
      start: number;
      end: number;
      quote: string;
    } | null>(null),
    [commentKey, setCommentKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      setResource(null);
      setSelection(null);
      setResourceError(false);
      if (active && grantId)
        void requestData<{ resource: NonNullable<typeof resource> }>(
          `/api/mentors?grant=${grantId}`,
        )
          .then((v) => {
            if (current) setResource(v.resource);
          })
          .catch(() => {
            if (current) setResourceError(true);
          });
    }, 0);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [grantId, active, r.revision]);
  async function safeRun(value: Command) {
    try {
      await run(value);
    } catch {
      /* Parent retains visible error. */
    }
  }
  const comments = data.comments.filter((c) => c.request_id === r.id),
    reviews = data.reviews.filter((v) => v.request_id === r.id);
  return (
    <section className="mentor-stack">
      <header>
        <h2>
          {label(t, r.terms_snapshot.kind)} · {label(t, r.status)}
        </h2>
        <p>{r.goal}</p>
        <p>
          {t.due}: <time>{new Date(r.due_at).toLocaleString(locale)}</time>
        </p>
        <p>
          {t.expires}:{' '}
          <time>{new Date(r.expires_at).toLocaleString(locale)}</time>
        </p>
        <p>{t.versionNotice}</p>
      </header>
      <div className="mentor-actions">
        {student ? (
          <>
            {active && (
              <>
                <button
                  disabled={busy}
                  className="ui-button ui-button--secondary"
                  onClick={() => void safeRun({ op: 'revoke', request: r.id })}
                >
                  {t.revoke}
                </button>
                <button
                  disabled={busy}
                  className="ui-button ui-button--secondary"
                  onClick={() => void safeRun({ op: 'cancel', request: r.id })}
                >
                  {t.cancel}
                </button>
              </>
            )}
            <button
              disabled={busy}
              className="ui-button ui-button--secondary"
              onClick={() => void safeRun({ op: 'block', request: r.id })}
            >
              {t.block}
            </button>
            {active && r.status === 'review_delivered' && (
              <>
                <button
                  disabled={busy}
                  className="ui-button ui-button--primary"
                  onClick={() =>
                    void safeRun({
                      op: 'transition',
                      request: r.id,
                      revision: r.revision,
                      state: 'completed',
                    })
                  }
                >
                  {t.complete}
                </button>
                <button
                  disabled={busy}
                  className="ui-button ui-button--secondary"
                  onClick={() =>
                    void safeRun({
                      op: 'transition',
                      request: r.id,
                      revision: r.revision,
                      state: 'needs_student_action',
                    })
                  }
                >
                  {t.returnReview}
                </button>
                <button
                  disabled={busy}
                  className="ui-button ui-button--secondary"
                  onClick={() =>
                    void safeRun({
                      op: 'transition',
                      request: r.id,
                      revision: r.revision,
                      state: 'disputed',
                    })
                  }
                >
                  {t.dispute}
                </button>
              </>
            )}
            {active && r.status === 'needs_student_action' && (
              <button
                disabled={busy}
                className="ui-button ui-button--primary"
                onClick={() =>
                  void safeRun({
                    op: 'transition',
                    request: r.id,
                    revision: r.revision,
                    state: 'in_review',
                  })
                }
              >
                {t.returnReview}
              </button>
            )}
          </>
        ) : (
          active && (
            <>
              {r.status === 'submitted' && (
                <button
                  disabled={busy}
                  className="ui-button ui-button--primary"
                  onClick={() =>
                    void safeRun({
                      op: 'transition',
                      request: r.id,
                      revision: r.revision,
                      state: 'accepted',
                    })
                  }
                >
                  {t.accept}
                </button>
              )}
              {r.status === 'accepted' && (
                <button
                  disabled={busy}
                  className="ui-button ui-button--primary"
                  onClick={() =>
                    void safeRun({
                      op: 'transition',
                      request: r.id,
                      revision: r.revision,
                      state: 'in_review',
                    })
                  }
                >
                  {t.start}
                </button>
              )}
              {r.status === 'in_review' && (
                <button
                  disabled={busy}
                  className="ui-button ui-button--secondary"
                  onClick={() =>
                    void safeRun({
                      op: 'transition',
                      request: r.id,
                      revision: r.revision,
                      state: 'needs_student_action',
                    })
                  }
                >
                  {t.needs}
                </button>
              )}
            </>
          )
        )}
      </div>
      {!active && (
        <p role="status" className="mentor-notice">
          {t.revoked}
        </p>
      )}
      {active && grants.length > 0 && (
        <section className="mentor-panel">
          <h3>{t.original}</h3>
          <label>
            {t.selected}
            <select
              value={grantId}
              onChange={(e) => {
                setGrantId(e.target.value);
                setParent(null);
              }}
            >
              {grants.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.snapshot?.title ?? g.resource_type} ·{' '}
                  {g.version_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          {resourceError ? (
            <p role="alert">{t.errorPermission}</p>
          ) : !resource ? (
            <p role="status">{t.loading}</p>
          ) : (
            <>
              {resource.type === 'writing' && (
                <>
                  <p>
                    {resource.title} · v{resource.version} ·{' '}
                    {resource.wordLimit ?? t.unknown}
                  </p>
                  <p>{resource.prompt}</p>
                  <label>
                    {t.quote}
                    <textarea
                      className="mentor-original"
                      readOnly
                      value={resource.content ?? ''}
                      onSelect={(e) => {
                        const node = e.currentTarget,
                          start = Array.from(
                            node.value.slice(0, node.selectionStart),
                          ).length,
                          end = Array.from(
                            node.value.slice(0, node.selectionEnd),
                          ).length;
                        setSelection(
                          end > start
                            ? {
                                start,
                                end,
                                quote: Array.from(node.value)
                                  .slice(start, end)
                                  .join(''),
                              }
                            : null,
                        );
                      }}
                    />
                  </label>
                  {selection && <blockquote>{selection.quote}</blockquote>}
                  {student && (
                    <a
                      className="ui-button ui-button--secondary"
                      href={`/${locale}/writing?draft=${resource.draft}`}
                    >
                      {t.writing}
                    </a>
                  )}
                </>
              )}
              {resource.type === 'application' && (
                <>
                  <h4>{t.readiness}</h4>
                  <dl>
                    {Object.entries(resource.snapshot ?? {})
                      .filter(([k]) => k !== 'checklist')
                      .map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{String(v ?? t.unknown)}</dd>
                        </div>
                      ))}
                  </dl>
                  {Array.isArray(resource.snapshot?.checklist) && (
                    <ul>
                      {(
                        resource.snapshot.checklist as {
                          title: string;
                          status: string;
                          verification: string;
                        }[]
                      ).map((c, i) => (
                        <li key={i}>
                          {c.title} · {c.status} · {c.verification}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p>{t.notOfficial}</p>
                </>
              )}
              {resource.type === 'vault' && (
                <>
                  <a
                    className="ui-button ui-button--secondary"
                    href={resource.preview}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.preview}
                  </a>
                  {grants
                    .find((g) => g.id === grantId)
                    ?.operations.includes('download') && (
                    <a href={`/api/mentors/file?grant=${grantId}&download=1`}>
                      {t.download}
                    </a>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}
      <section className="mentor-panel mentor-stack">
        <h3>{t.comments}</h3>
        <p>{t.conduct}</p>
        {comments.map((c) => (
          <article className="mentor-comment" key={c.id}>
            <p>
              <strong>
                {c.author_id === r.mentor_id ? t.review : t.student}
              </strong>{' '}
              · <time>{new Date(c.created_at).toLocaleString(locale)}</time>
              {c.parent_id && (
                <>
                  {' '}
                  · {t.reply}: {c.parent_id.slice(0, 8)}
                </>
              )}
            </p>
            {c.anchor && <blockquote>{c.anchor.quote}</blockquote>}
            <p>{c.body}</p>
            <p>{label(t, c.disposition)}</p>
            <div className="mentor-actions">
              {active && (
                <button
                  className="ui-button ui-button--secondary"
                  onClick={() => {
                    setParent(c.id);
                    setGrantId(c.grant_id ?? '');
                    setSelection(null);
                  }}
                >
                  {t.reply}
                </button>
              )}
              {student && c.author_id === r.mentor_id && (
                <>
                  <button
                    disabled={busy}
                    className="ui-button ui-button--secondary"
                    onClick={() =>
                      void safeRun({
                        op: 'resolve',
                        request: r.id,
                        id: c.id,
                        revision: c.revision,
                        state: 'resolved',
                      })
                    }
                  >
                    {t.resolved}
                  </button>
                  <button
                    disabled={busy}
                    className="ui-button ui-button--secondary"
                    onClick={() =>
                      void safeRun({
                        op: 'resolve',
                        request: r.id,
                        id: c.id,
                        revision: c.revision,
                        state: 'rejected',
                      })
                    }
                  >
                    {t.rejected}
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {active && r.status !== 'submitted' && (
          <form
            className="mentor-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await run({
                  op: 'comment',
                  request: r.id,
                  grant: grantId || null,
                  parent,
                  body,
                  anchor: parent ? null : selection,
                  key: commentKey,
                });
                setBody('');
                setParent(null);
                setSelection(null);
                setCommentKey(crypto.randomUUID());
              } catch {
                /* Parent displays the failure and retains input. */
              }
            }}
          >
            <label>
              {t.body}
              {parent && ` · ${t.reply} ${parent.slice(0, 8)}`}
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setCommentKey(crypto.randomUUID());
                }}
                minLength={1}
                maxLength={2000}
                required
              />
            </label>
            <button disabled={busy} className="ui-button ui-button--primary">
              {t.addComment}
            </button>
          </form>
        )}
      </section>
      {reviews.map((v) => (
        <article key={v.id} className="mentor-panel">
          <h3>
            {t.review} · {label(t, v.outcome)}
          </h3>
          <p>{v.summary}</p>
          <p>
            {t.review}: {v.author_id.slice(0, 8)} ·{' '}
            <time>{new Date(v.created_at).toLocaleString(locale)}</time>
          </p>
          <dl className="mentor-rubric">
            {Object.entries(v.rubric).map(([k, value]) => (
              <div key={k}>
                <dt>{label(t, k)}</dt>
                <dd>{value}/5</dd>
              </div>
            ))}
          </dl>
          <ul>
            {v.actions.map((a, i) => (
              <li key={i}>
                {a.text}
                {a.source && (
                  <>
                    {' '}
                    ·{' '}
                    <a href={a.source} target="_blank" rel="noreferrer">
                      {t.source}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p>{t.notOfficial}</p>
        </article>
      ))}
      {!student &&
        active &&
        ['in_review', 'needs_student_action', 'review_delivered'].includes(
          r.status,
        ) && (
          <ReviewForm locale={locale} requestId={r.id} run={run} busy={busy} />
        )}
      {student && (
        <form
          className="mentor-panel mentor-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void safeRun({
              op: 'report',
              request: r.id,
              reason: String(f.get('reason')) as
                'contact' | 'harassment' | 'privacy' | 'integrity' | 'other',
              explanation: String(f.get('explanation')),
            }).catch(() => {});
          }}
        >
          <h3>{t.report}</h3>
          <label>
            {t.reason}
            <select name="reason">
              {['contact', 'harassment', 'privacy', 'integrity', 'other'].map(
                (k) => (
                  <option key={k} value={k}>
                    {label(t, k)}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            {t.explanation}
            <textarea name="explanation" maxLength={2000} />
          </label>
          <button disabled={busy} className="ui-button ui-button--secondary">
            {t.send}
          </button>
        </form>
      )}
      {data.reports
        .filter((v) => v.request_id === r.id)
        .map((v) => (
          <article className="mentor-panel" key={v.id}>
            <h3>
              {t.reportStatus} · {label(t, v.status)}
            </h3>
            <p>{v.resolution}</p>
            {['closed', 'actioned'].includes(v.status) && (
              <button
                disabled={busy}
                className="ui-button ui-button--secondary"
                onClick={() =>
                  void safeRun({ op: 'appeal', request: r.id, id: v.id }).catch(
                    () => {},
                  )
                }
              >
                {t.appeal}
              </button>
            )}
          </article>
        ))}
      <section className="mentor-panel">
        <h3>{t.history}</h3>
        <ol>
          {data.events
            .filter((v) => v.request_id === r.id)
            .map((v) => (
              <li key={v.id}>
                <time>{new Date(v.created_at).toLocaleString(locale)}</time> ·{' '}
                {label(t, v.kind)} · {v.actor_id.slice(0, 8)}
              </li>
            ))}
        </ol>
      </section>
    </section>
  );
}
function ReviewForm({
  locale,
  requestId,
  run,
  busy,
}: {
  locale: Locale;
  requestId: string;
  run: (v: Command) => Promise<void>;
  busy: boolean;
}) {
  const t = mentorCopy[locale],
    [key, setKey] = useState(() => crypto.randomUUID());
  return (
    <form
      className="mentor-panel mentor-form"
      onChange={() => setKey(crypto.randomUUID())}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void run({
          op: 'review',
          request: requestId,
          outcome: String(f.get('outcome')) as
            | 'more_work_needed'
            | 'ready_for_student_review'
            | 'incomplete_information',
          summary: String(f.get('summary')),
          rubric: Object.fromEntries(
            rubricKeys.map((k) => [k, Number(f.get(k))]),
          ) as Record<(typeof rubricKeys)[number], number>,
          actions: String(f.get('actions'))
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((text) => ({ text, source: null })),
          key,
        })
          .then(() => setKey(crypto.randomUUID()))
          .catch(() => {});
      }}
    >
      <h3>{t.review}</h3>
      <fieldset className="mentor-rubric">
        <legend>{t.rubric}</legend>
        {rubricKeys.map((k) => (
          <label key={k}>
            {label(t, k)}
            <input
              name={k}
              type="number"
              min={1}
              max={5}
              defaultValue={3}
              required
            />
          </label>
        ))}
      </fieldset>
      <label>
        {t.outcome}
        <select name="outcome">
          {[
            'more_work_needed',
            'ready_for_student_review',
            'incomplete_information',
          ].map((k) => (
            <option key={k} value={k}>
              {label(t, k)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.summary}
        <textarea name="summary" minLength={10} maxLength={4000} required />
      </label>
      <label>
        {t.actions}
        <textarea name="actions" maxLength={5000} />
      </label>
      <p>{t.notOfficial}</p>
      <button disabled={busy} className="ui-button ui-button--primary">
        {t.deliver}
      </button>
    </form>
  );
}
