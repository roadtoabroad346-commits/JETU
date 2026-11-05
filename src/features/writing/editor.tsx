'use client';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Locale } from '@/lib/i18n/messages';
import {
  fromDraft,
  criteria,
  writingSaveSchema,
  type Draft,
  type Revision,
  type WritingInput,
  type WorkspaceData,
} from './contracts';
import {
  criterionCopy,
  guidanceCopy,
  kindCopy,
  reviewCopy,
  sectionCopy,
  writingCopy,
} from './copy';
import {
  anchorValid,
  compareText,
  contentHash,
  counts,
  cvText,
  deterministicReview,
  exportText,
  readyToMark,
} from './domain';
import { SaveQueue } from './save-queue';
import { requestData } from './client';
import { CVBuilder } from './cv-builder';
import { InterviewControls } from './interview';
export function StudioEditor({
  locale,
  initial,
  data,
  onSaved,
  onBack,
  onFork,
}: {
  locale: Locale;
  initial: WritingInput;
  data: WorkspaceData;
  onSaved: (row: Draft) => void;
  onBack: () => void;
  onFork: (input: WritingInput) => void;
}) {
  const t = writingCopy[locale];
  const [queue] = useState(
    () =>
      new SaveQueue(
        initial,
        async (value) => {
          const parsed = writingSaveSchema.safeParse(value);
          if (!parsed.success) throw new Error('VALIDATION_FAILED');
          return (
            await requestData<{ draft: Draft }>('/api/writing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed.data),
            })
          ).draft;
        },
        onSaved,
      ),
  );
  const { input, status } = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot,
  );
  const [pane, setPane] = useState<'context' | 'feedback' | 'history'>(
    'context',
  );
  const [focus, setFocus] = useState(false),
    [versions, setVersions] = useState<Revision[]>([]),
    [compare, setCompare] = useState<string | null>(null),
    [historyError, setHistoryError] = useState(false),
    [undo, setUndo] = useState<WritingInput | null>(null),
    [identity, setIdentity] = useState({ text: '', hash: '' });
  const [practicePhase, setPracticePhase] = useState<
    'idle' | 'active' | 'paused' | 'ended'
  >('idle');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const reduced = useReducedMotion();
  const ephemeral = input.kind === 'interview' && !input.studio.interview;
  const count = useMemo(() => counts(input.content), [input.content]),
    official = data.prompts.find((p) => p.id === input.promptId);
  const officialCount =
    official?.count_spaces === false ? count.withoutSpaces : count.characters;
  const overLimit = Boolean(
    (input.wordLimit && count.words > input.wordLimit) ||
    (official?.word_limit && count.words > official.word_limit) ||
    (official?.character_limit &&
      official.count_spaces !== null &&
      officialCount > official.character_limit),
  );
  const dirty = queue.dirty;
  function edit(next: WritingInput) {
    queue.edit({ ...next, studio: { ...next.studio, ready: false } });
  }
  function change(patch: Partial<WritingInput>) {
    let next = { ...input, ...patch };
    if (
      input.kind === 'interview' &&
      patch.content !== undefined &&
      input.studio.interview
    ) {
      const answers = [...input.studio.interview.answers];
      answers[input.studio.interview.question] = patch.content;
      next = {
        ...next,
        studio: {
          ...next.studio,
          interview: { ...input.studio.interview, answers },
        },
      };
    }
    if (input.kind === 'cv' || input.kind === 'activities')
      next = {
        ...next,
        content: cvText(next.title, next.studio.sections, sectionCopy[locale]),
      };
    edit(next);
  }
  useEffect(() => {
    if (status !== 'unsaved' || ephemeral || !input.title.trim()) return;
    const delay = Math.max(1500, 15000 - (Date.now() - queue.lastSavedAt));
    const timer = setTimeout(() => void queue.flush(), delay);
    return () => clearTimeout(timer);
  }, [status, input, ephemeral, queue]);
  useEffect(() => {
    if (!dirty) return;
    const leave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);
  useEffect(() => {
    const online = () => {
      if (!ephemeral && queue.dirty) void queue.flush();
    };
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [queue, ephemeral]);
  useEffect(() => {
    let cancelled = false;
    void contentHash(input.content).then((hash) => {
      if (!cancelled) setIdentity({ text: input.content, hash });
    });
    return () => {
      cancelled = true;
    };
  }, [input.content]);
  async function loadVersions() {
    setHistoryError(false);
    try {
      setVersions(
        (
          await requestData<{ versions: Revision[] }>(
            `/api/writing?draft=${input.id}`,
          )
        ).versions,
      );
    } catch {
      setHistoryError(true);
    }
  }
  const canAct = (c: WritingInput['studio']['comments'][number]) =>
    identity.text === input.content &&
    anchorValid(input.content, c, input.studio.reviewHash, identity.hash);
  async function review() {
    const text = input.content;
    const hash = await contentHash(text);
    if (queue.getSnapshot().input.content !== text) return;
    const comments = deterministicReview(text).map((c, index) => ({
      id: `local-${index}`,
      criterion: c.criterion,
      start: c.start,
      end: c.end,
      quote: c.quote,
      message: reviewCopy[locale][c.code]!,
      ...(c.replacement === undefined ? {} : { replacement: c.replacement }),
      state: 'open' as const,
      provenance: 'deterministic-v1' as const,
    }));
    edit({
      ...queue.getSnapshot().input,
      studio: {
        ...queue.getSnapshot().input.studio,
        comments,
        reviewHash: hash,
        ready: false,
      },
    });
    setPane('feedback');
  }
  async function restore(revision: Revision) {
    try {
      const full = (
        await requestData<{ version: Revision }>(
          `/api/writing?draft=${input.id}&version=${revision.version}`,
        )
      ).version;
      const row = full.snapshot as Draft;
      const candidate = {
        ...fromDraft(row),
        id: input.id,
        version: input.version,
        requestId: crypto.randomUUID(),
        checkpoint: true,
      };
      if (!writingSaveSchema.safeParse(candidate).success) return;
      queue.edit(candidate);
      await queue.flush(true);
      await loadVersions();
    } catch {
      setHistoryError(true);
    }
  }

  const diff = compare === null ? null : compareText(compare, input.content);
  return (
    <div className={`studio-editor ${focus ? 'studio-editor--focus' : ''}`}>
      <h1 className="sr-only">{t.title}</h1>
      <div className="studio-editor-heading">
        <button
          type="button"
          className="ui-button ui-button--secondary"
          onClick={() => {
            if (!queue.dirty || window.confirm(t.leave)) onBack();
          }}
        >
          {t.back}
        </button>
        <span className="ui-badge">{kindCopy[locale][input.kind]}</span>
        <button
          type="button"
          className="ui-button ui-button--secondary"
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
        >
          {focus ? t.exitFocus : t.distraction}
        </button>
      </div>
      <label className="studio-title-label">
        {t.projectTitle}
        <input
          className="studio-title-input"
          value={input.title}
          maxLength={160}
          onChange={(e) => change({ title: e.target.value })}
        />
      </label>
      <div className="studio-savebar">
        <span
          role="status"
          aria-live="polite"
          className={`studio-save-state studio-save-state--${status}`}
        >
          {ephemeral ? t.practicePrivacy : t[status]}
        </span>
        <div className="studio-actions">
          <button
            type="button"
            className="ui-button ui-button--primary"
            disabled={
              status === 'saving' ||
              status === 'conflict' ||
              ephemeral ||
              !input.title.trim()
            }
            onClick={() => void queue.flush(true)}
          >
            {t.save}
          </button>
          <button
            type="button"
            className="ui-button ui-button--secondary"
            onClick={() => exportText(input.title, input.content)}
          >
            {t.export}
          </button>
          <button
            type="button"
            className="ui-button ui-button--secondary"
            onClick={() => window.print()}
          >
            {t.print}
          </button>
        </div>
      </div>
      {(status === 'error' ||
        status === 'offline' ||
        status === 'conflict') && (
        <div className="feedback-box feedback-box--error" role="alert">
          <p>{t[status]}</p>
          <div className="studio-actions">
            {status !== 'conflict' && (
              <button
                type="button"
                className="ui-button ui-button--secondary"
                onClick={() => void queue.flush()}
              >
                {t.retry}
              </button>
            )}
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => onFork(queue.fork())}
            >
              {t.recover}
            </button>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={async () => {
                if (window.confirm(t.leave)) {
                  const current = await requestData<WorkspaceData>(
                    '/api/writing',
                  ).catch(() => null);
                  const row = current?.drafts.find((d) => d.id === input.id);
                  if (row) onFork(fromDraft(row));
                }
              }}
            >
              {t.reload}
            </button>
          </div>
        </div>
      )}
      <div className="studio-workspace-grid">
        <section className="studio-paper" aria-label={t.editor}>
          {input.kind === 'interview' && (
            <InterviewControls
              locale={locale}
              input={input}
              onChange={edit}
              onPhaseChange={setPracticePhase}
            />
          )}
          {input.kind === 'cv' || input.kind === 'activities' ? (
            <CVBuilder
              locale={locale}
              sections={input.studio.sections}
              onChange={(sections) =>
                change({ studio: { ...input.studio, sections } })
              }
            />
          ) : (
            <label className="studio-writing-label">
              {input.kind === 'interview' ? t.answer : t.editor}
              <textarea
                ref={textarea}
                className="studio-textarea"
                value={input.content}
                maxLength={100000}
                spellCheck
                readOnly={
                  input.kind === 'interview' && practicePhase !== 'active'
                }
                dir="auto"
                onChange={(e) => change({ content: e.target.value })}
                onBlur={() => {
                  if (
                    !ephemeral &&
                    queue.dirty &&
                    status !== 'conflict' &&
                    status !== 'error' &&
                    status !== 'offline'
                  )
                    void queue.flush();
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (!ephemeral) void queue.flush(true);
                  }
                }}
              />
            </label>
          )}
          <dl className="studio-counts">
            <div>
              <dt>{t.words}</dt>
              <dd>
                {count.words}
                {input.wordLimit ? ` / ${input.wordLimit}` : ''}
              </dd>
            </div>
            <div>
              <dt>{t.characters}</dt>
              <dd>{count.characters}</dd>
            </div>
            <div>
              <dt>{t.withoutSpaces}</dt>
              <dd>{count.withoutSpaces}</dd>
            </div>
          </dl>
          <details>
            <summary>{t.countHelp}</summary>
            <p>{t.exportHelp}</p>
          </details>
          {overLimit && (
            <p className="feedback-box feedback-box--error" role="status">
              {t.overLimit}
            </p>
          )}
        </section>
        {!focus && (
          <aside className="studio-sidebar">
            <div className="studio-pane-nav" role="group" aria-label={t.title}>
              {(['context', 'feedback', 'history'] as const).map((item) => (
                <button
                  type="button"
                  aria-pressed={pane === item}
                  className="studio-pane-button"
                  key={item}
                  onClick={() => {
                    setPane(item);
                    if (item === 'history' && input.version)
                      void loadVersions();
                  }}
                >
                  {t[item]}
                </button>
              ))}
            </div>
            <motion.section
              key={pane}
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.16 }}
              className="studio-panel"
              aria-label={t[pane]}
            >
              {pane === 'context' && (
                <>
                  <h2>{t.context}</h2>
                  <p>{guidanceCopy[locale][input.kind]}</p>
                  <p>{t.unknown}</p>
                  <label>
                    {t.source}
                    <select
                      value={input.promptId ?? ''}
                      onChange={(e) => {
                        const source = data.prompts.find(
                          (p) => p.id === e.target.value,
                        );
                        change({
                          promptId: source?.id ?? null,
                          ...(source ? { prompt: source.prompt } : {}),
                        });
                      }}
                    >
                      <option value="">{t.noSource}</option>
                      {data.prompts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} · {p.cycle}
                        </option>
                      ))}
                    </select>
                  </label>
                  {official && (
                    <div className="studio-source">
                      <a
                        href={official.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {official.title}
                      </a>
                      <p>
                        {t.cycle}: {official.cycle}
                      </p>
                      <p>
                        {t.verifiedAt}:{' '}
                        {official.verified_at
                          ? new Date(official.verified_at).toLocaleDateString(
                              locale,
                            )
                          : '—'}
                      </p>
                      <p>
                        {t.policy}:{' '}
                        {
                          {
                            en: {
                              unknown: 'Unknown',
                              allowed: 'Allowed',
                              coaching_only: 'Coaching only',
                              prohibited: 'Prohibited',
                            },
                            ru: {
                              unknown: 'Неизвестны',
                              allowed: 'Разрешено',
                              coaching_only: 'Только обратная связь',
                              prohibited: 'Запрещено',
                            },
                            kk: {
                              unknown: 'Белгісіз',
                              allowed: 'Рұқсат етілген',
                              coaching_only: 'Тек кері байланыс',
                              prohibited: 'Тыйым салынған',
                            },
                          }[locale][
                            official.ai_policy as
                              | 'unknown'
                              | 'allowed'
                              | 'coaching_only'
                              | 'prohibited'
                          ]
                        }
                      </p>
                      {official.word_limit && (
                        <p>
                          {t.words}: {official.word_limit}
                        </p>
                      )}
                      {official.character_limit && (
                        <p>
                          {t.characters}: {official.character_limit}
                        </p>
                      )}
                    </div>
                  )}
                  <label>
                    {t.prompt}
                    <textarea
                      rows={6}
                      maxLength={4000}
                      value={input.prompt}
                      readOnly={Boolean(official)}
                      onChange={(e) => change({ prompt: e.target.value })}
                    />
                  </label>
                  <label>
                    {t.personalLimit}
                    <input
                      type="number"
                      min={1}
                      max={20000}
                      value={input.wordLimit ?? ''}
                      onChange={(e) =>
                        change({
                          wordLimit: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t.application}
                    <select
                      value={input.applicationId ?? ''}
                      onChange={(e) =>
                        change({ applicationId: e.target.value || null })
                      }
                    >
                      <option value="">{t.general}</option>
                      {data.applications.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.program_title_snapshot}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!data.applications.length && <p>{t.noApplications}</p>}
                  {input.kind === 'email' && (
                    <button
                      type="button"
                      className="ui-button ui-button--secondary"
                      onClick={() => {
                        if (!input.content || window.confirm(t.leave))
                          change({ content: t.emailScaffold });
                      }}
                    >
                      {t.emailTemplate}
                    </button>
                  )}
                  <p>{t.translation}</p>
                </>
              )}
              {pane === 'feedback' && (
                <>
                  <h2>{t.feedback}</h2>
                  <p>{t.deterministic}</p>
                  <button
                    type="button"
                    className="ui-button ui-button--primary"
                    disabled={!input.content.trim()}
                    onClick={() => void review()}
                  >
                    {t.review}
                  </button>
                  <p className="studio-ai-notice">{t.aiUnavailable}</p>
                  {!input.studio.comments.length && <p>{t.noReview}</p>}
                  {input.studio.comments.map((c) => (
                    <article className="studio-comment" key={c.id}>
                      <span className="ui-badge">
                        {criterionCopy[locale][c.criterion]}
                      </span>
                      <blockquote dir="auto">{c.quote}</blockquote>
                      <p>{c.message}</p>
                      {!canAct(c) && <p>{t.stale}</p>}
                      {c.state === 'open' ? (
                        <div className="studio-actions">
                          <button
                            type="button"
                            className="ui-button ui-button--secondary"
                            disabled={
                              !canAct(c) ||
                              input.kind === 'cv' ||
                              input.kind === 'activities'
                            }
                            onClick={() => {
                              textarea.current?.focus();
                              textarea.current?.setSelectionRange(
                                c.start,
                                c.end,
                              );
                            }}
                          >
                            {t.locate}
                          </button>
                          {c.replacement !== undefined && (
                            <button
                              type="button"
                              className="ui-button ui-button--secondary"
                              disabled={!canAct(c)}
                              onClick={() => {
                                setUndo(input);
                                edit({
                                  ...input,
                                  content:
                                    input.content.slice(0, c.start) +
                                    c.replacement +
                                    input.content.slice(c.end),
                                  studio: {
                                    ...input.studio,
                                    comments: input.studio.comments.map(
                                      (item) =>
                                        item.id === c.id
                                          ? { ...item, state: 'accepted' }
                                          : item,
                                    ),
                                  },
                                });
                              }}
                            >
                              {t.accept}
                            </button>
                          )}
                          <button
                            type="button"
                            className="ui-button ui-button--secondary"
                            onClick={() =>
                              edit({
                                ...input,
                                studio: {
                                  ...input.studio,
                                  comments: input.studio.comments.map((item) =>
                                    item.id === c.id
                                      ? { ...item, state: 'dismissed' }
                                      : item,
                                  ),
                                },
                              })
                            }
                          >
                            {t.dismiss}
                          </button>
                        </div>
                      ) : (
                        <p>{t.resolved}</p>
                      )}
                    </article>
                  ))}
                  {undo && (
                    <button
                      type="button"
                      className="ui-button ui-button--secondary"
                      onClick={() => {
                        edit({
                          ...input,
                          content: undo.content,
                          studio: {
                            ...input.studio,
                            comments: undo.studio.comments,
                            reviewHash: undo.studio.reviewHash,
                          },
                        });
                        setUndo(null);
                      }}
                    >
                      {t.undo}
                    </button>
                  )}
                  <fieldset>
                    <legend>{t.checklist}</legend>
                    {criteria.map((key) => (
                      <label className="studio-check" key={key}>
                        <input
                          type="checkbox"
                          checked={Boolean(input.rubric[key])}
                          onChange={(e) =>
                            change({
                              rubric: {
                                ...input.rubric,
                                [key]: e.target.checked,
                              },
                            })
                          }
                        />
                        {criterionCopy[locale][key]}
                      </label>
                    ))}
                  </fieldset>
                  <p>
                    {Object.values(input.rubric).filter(Boolean).length} / 5 ·{' '}
                    {t.progress}
                  </p>
                  <button
                    type="button"
                    className="ui-button ui-button--accent"
                    disabled={!readyToMark(input) || overLimit}
                    onClick={() =>
                      queue.edit({
                        ...input,
                        studio: { ...input.studio, ready: true },
                      })
                    }
                  >
                    {t.ready}
                  </button>
                  <p>{input.studio.ready ? t.readyNotice : t.notReady}</p>
                  <p>{t.integrity}</p>
                </>
              )}
              {pane === 'history' && (
                <>
                  <h2>{t.history}</h2>
                  {historyError && <p role="alert">{t.loadError}</p>}
                  {!versions.length && <p>{t.noVersions}</p>}
                  <button
                    type="button"
                    className="ui-button ui-button--secondary"
                    disabled={!input.version}
                    onClick={() => void loadVersions()}
                  >
                    {t.retryLoad}
                  </button>
                  <ol className="studio-version-list">
                    {versions.map((v) => (
                      <li key={v.id}>
                        <strong>#{v.version}</strong> ·{' '}
                        {new Date(v.created_at).toLocaleString(locale)}
                        <div className="studio-actions">
                          <button
                            type="button"
                            className="ui-button ui-button--secondary"
                            onClick={async () => {
                              try {
                                const full = (
                                  await requestData<{ version: Revision }>(
                                    `/api/writing?draft=${input.id}&version=${v.version}`,
                                  )
                                ).version;
                                const row = full.snapshot as {
                                  content?: unknown;
                                };
                                if (typeof row.content === 'string')
                                  setCompare(row.content);
                              } catch {
                                setHistoryError(true);
                              }
                            }}
                          >
                            {t.compare}
                          </button>
                          <button
                            type="button"
                            className="ui-button ui-button--secondary"
                            disabled={
                              status === 'saving' || status === 'conflict'
                            }
                            onClick={() => {
                              if (!queue.dirty || window.confirm(t.leave))
                                void restore(v);
                            }}
                          >
                            {t.restore}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {diff && (
                    <div className="studio-diff">
                      <h3>{t.before}</h3>
                      <p>
                        {diff.unchanged}
                        <del>{diff.removed}</del>
                        {diff.suffix}
                      </p>
                      <h3>{t.after}</h3>
                      <p>
                        {diff.unchanged}
                        <ins>{diff.added}</ins>
                        {diff.suffix}
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.section>
          </aside>
        )}
      </div>
      <section className="studio-export-preview" aria-label={t.preview}>
        <h2>{input.title}</h2>
        <pre dir="auto">
          {input.kind === 'cv' || input.kind === 'activities'
            ? cvText('', input.studio.sections, sectionCopy[locale])
            : input.content}
        </pre>
      </section>
    </div>
  );
}
