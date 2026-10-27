'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import type { Database } from '@/lib/supabase/database.types';
import { vaultCopy, vaultExportCopy } from '@/features/vault/copy';
import {
  requestData,
  jsonCommand,
  RequestFailure,
} from '@/features/vault/client';
import { compareText, rubricKeys, wordCount } from './domain';
import type { z } from 'zod';
import { writingSaveSchema } from './contracts';
type Draft = Database['public']['Tables']['writing_drafts']['Row'];
type Revision = Database['public']['Tables']['writing_versions']['Row'];
type Input = z.infer<typeof writingSaveSchema>;
function blank(): Input {
  return {
    id: crypto.randomUUID(),
    version: 0,
    requestId: crypto.randomUUID(),
    title: '',
    kind: 'essay',
    content: '',
    prompt: '',
    wordLimit: null,
    rubric: {},
    applicationId: null,
  };
}
function inputFrom(row: Draft): Input {
  return {
    id: row.id,
    version: row.version,
    requestId: crypto.randomUUID(),
    title: row.title,
    kind: row.kind as Input['kind'],
    content: row.content,
    prompt: row.prompt,
    wordLimit: row.word_limit,
    rubric: row.rubric as Input['rubric'],
    applicationId: row.application_id,
  };
}
export function WritingWorkspace({ locale }: { locale: Locale }) {
  const t = vaultCopy(locale),
    [drafts, setDrafts] = useState<Draft[]>([]),
    [apps, setApps] = useState<
      { id: string; program_title_snapshot: string }[]
    >([]),
    [input, setInput] = useState<Input | null>(null),
    [versions, setVersions] = useState<Revision[]>([]),
    [compared, setCompared] = useState(''),
    [loaded, setLoaded] = useState(false),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const errorRef = useRef<HTMLDivElement>(null),
    fileRequestId = useRef<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await requestData<{
        drafts: Draft[];
        applications: typeof apps;
      }>('/api/writing');
      setDrafts(r.drafts);
      setApps(r.applications);
      setLoaded(true);
      setError('');
    } catch {
      setError(t.error);
    }
  }, [t.error]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const count = useMemo(
    () => wordCount(input?.content ?? ''),
    [input?.content],
  );
  function change(patch: Partial<Input>) {
    setInput((v) =>
      v ? { ...v, ...patch, requestId: crypto.randomUUID() } : v,
    );
    setDirty(true);
    setNotice('');
    fileRequestId.current = null;
  }
  async function revisions(id: string) {
    const r = await requestData<{ versions: Revision[] }>(
      `/api/writing?draft=${id}`,
    );
    setVersions(r.versions);
  }
  async function open(row: Draft) {
    if (dirty && !window.confirm(t.unsaved)) return;
    setInput(inputFrom(row));
    setDirty(false);
    setCompared('');
    setNotice('');
    try {
      await revisions(row.id);
    } catch {
      setError(t.error);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!input || busy) return;
    const parsed = writingSaveSchema.safeParse(input);
    if (!parsed.success) {
      setError(t.validation);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await jsonCommand<{ draft: Draft }>('/api/writing', input);
      setInput(inputFrom(r.draft));
      setDirty(false);
      setNotice(t.saved);
      await load();
      await revisions(r.draft.id);
    } catch (e) {
      setError(
        e instanceof RequestFailure && e.code === 'CONFLICT'
          ? t.conflict
          : t.error,
      );
    } finally {
      setBusy(false);
    }
  }
  function exportText() {
    if (!input) return;
    const url = URL.createObjectURL(
      new Blob([input.content], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'draft.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const snapshot = versions.find(
    (v) => String(v.version) === compared,
  )?.snapshot;
  const earlier =
    snapshot &&
    typeof snapshot === 'object' &&
    !Array.isArray(snapshot) &&
    typeof snapshot.content === 'string'
      ? snapshot.content
      : null;
  const diff =
    earlier !== null ? compareText(earlier, input?.content ?? '') : null;
  return (
    <main id="main" className="page-shell dashboard-main vault-workspace">
      <header className="vault-hero">
        <div>
          <p className="eyebrow">JETU · {t.personal}</p>
          <h1>{t.writing}</h1>
          <p className="lead">{t.writingHelp}</p>
        </div>
        <a
          className="ui-button ui-button--secondary"
          href={`/${locale}/vault`}
          onClick={(e) => {
            if (dirty && !window.confirm(t.unsaved)) e.preventDefault();
          }}
        >
          {t.vault} →
        </a>
      </header>
      {error && (
        <div ref={errorRef} className="form-error" role="alert" tabIndex={-1}>
          {error}
          <button type="button" onClick={() => void load()}>
            {t.retry}
          </button>
        </div>
      )}
      <p role="status" className="vault-notice">
        {busy ? t.loading : notice}
      </p>
      {!loaded ? (
        <p aria-busy={!error}>{error ? '' : t.loading}</p>
      ) : (
        <div className="writing-layout">
          <aside className="vault-panel">
            <h2>{t.revisions}</h2>
            <button
              className="ui-button ui-button--primary"
              type="button"
              disabled={busy}
              onClick={() => {
                if (dirty && !window.confirm(t.unsaved)) return;
                setInput(blank());
                setDirty(true);
                setVersions([]);
                setCompared('');
                setError('');
              }}
            >
              {t.createDraft}
            </button>
            <ul className="vault-list">
              {drafts.map((d) => (
                <li key={d.id}>
                  <button
                    className="vault-draft-choice"
                    type="button"
                    disabled={busy}
                    aria-pressed={input?.id === d.id}
                    onClick={() => void open(d)}
                  >
                    <strong>{d.title}</strong>
                    <small>
                      {t.version} {d.version} ·{' '}
                      {new Date(d.updated_at).toLocaleDateString(locale)}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <section className="vault-panel writing-editor">
            {!input ? (
              <p>{t.createDraft}</p>
            ) : (
              <>
                <form className="vault-form" onSubmit={save} aria-busy={busy}>
                  <fieldset disabled={busy}>
                    <legend className="sr-only">{t.editor}</legend>
                    <div className="vault-filters">
                      <label>
                        {t.title}
                        <input
                          required
                          maxLength={160}
                          value={input.title}
                          onChange={(e) => change({ title: e.target.value })}
                        />
                      </label>
                      <label>
                        {t.kind}
                        <select
                          value={input.kind}
                          onChange={(e) =>
                            change({ kind: e.target.value as Input['kind'] })
                          }
                        >
                          {(
                            [
                              'essay',
                              'sop',
                              'personal_statement',
                              'cv',
                            ] as const
                          ).map((k) => (
                            <option key={k} value={k}>
                              {t[k]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      {t.application}
                      <select
                        value={input.applicationId ?? ''}
                        onChange={(e) =>
                          change({ applicationId: e.target.value || null })
                        }
                      >
                        <option value="">{t.none}</option>
                        {apps.map((a) => (
                          <option value={a.id} key={a.id}>
                            {a.program_title_snapshot}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t.prompt}
                      <textarea
                        rows={3}
                        maxLength={4000}
                        value={input.prompt}
                        onChange={(e) => change({ prompt: e.target.value })}
                      />
                    </label>
                    <label>
                      {t.wordLimit}
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
                      {t.editor}
                      <textarea
                        className="writing-text"
                        rows={18}
                        maxLength={100000}
                        value={input.content}
                        spellCheck
                        onChange={(e) => change({ content: e.target.value })}
                        aria-describedby="word-status"
                      />
                    </label>
                    <div className="writing-count" id="word-status">
                      <span>
                        {t.words}: <strong>{count}</strong>
                        {input.wordLimit ? ` / ${input.wordLimit}` : ''}
                      </span>
                      <span>
                        {t.characters}: {Array.from(input.content).length}
                      </span>
                      {input.wordLimit && count > input.wordLimit && (
                        <strong className="writing-over">{t.overLimit}</strong>
                      )}
                    </div>
                    {input.wordLimit && (
                      <progress
                        value={Math.min(count, input.wordLimit)}
                        max={input.wordLimit}
                        aria-label={t.wordLimit}
                      />
                    )}
                    <fieldset className="writing-rubric">
                      <legend>{t.rubric}</legend>
                      {rubricKeys.map((key) => (
                        <label className="vault-check" key={key}>
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
                          {t[key]}
                        </label>
                      ))}
                    </fieldset>
                  </fieldset>
                  <div className="vault-actions">
                    <button
                      className="ui-button ui-button--primary"
                      disabled={busy || !input.title.trim()}
                    >
                      {t.save}
                    </button>
                    <button
                      type="button"
                      className="ui-button ui-button--secondary"
                      onClick={exportText}
                    >
                      {t.exportText}
                    </button>
                    <span>
                      {dirty
                        ? t.unsaved
                        : `${t.saved} · ${t.version} ${input.version}`}
                    </span>
                  </div>
                </form>
                <div className="vault-actions">
                  <button
                    className="ui-button ui-button--secondary"
                    disabled={
                      busy || dirty || input.version === 0 || !input.content
                    }
                    onClick={async () => {
                      setBusy(true);
                      setError('');
                      try {
                        fileRequestId.current ??= crypto.randomUUID();
                        await requestData('/api/vault/upload', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'text/plain',
                            'X-Vault-Metadata': encodeURIComponent(
                              JSON.stringify({
                                name: `${input.kind}.txt`,
                                category: input.kind === 'cv' ? 'cv' : 'essay',
                                purpose: '',
                                documentId: null,
                                applicationId: input.applicationId,
                                recommendationId: null,
                                draftId: input.id,
                                requestId: fileRequestId.current,
                              }),
                            ),
                          },
                          body: input.content,
                        });
                        setNotice(t.quarantinedNotice);
                      } catch {
                        setError(t.error);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {vaultExportCopy[locale]}
                  </button>
                  {input.version > 0 && (
                    <button
                      type="button"
                      className="ui-button ui-button--danger"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(t.confirmDraft)) return;
                        setBusy(true);
                        try {
                          await requestData('/api/writing', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: input.id,
                              version: input.version,
                            }),
                          });
                          setInput(null);
                          setDirty(false);
                          setVersions([]);
                          await load();
                        } catch {
                          setError(t.error);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {t.remove}
                    </button>
                  )}
                </div>
                <details>
                  <summary>
                    {t.revisions} ({versions.length})
                  </summary>
                  <ul className="vault-list">
                    {versions.map((v) => (
                      <li key={v.id}>
                        <strong>
                          {t.version} {v.version}
                        </strong>{' '}
                        · {new Date(v.created_at).toLocaleString(locale)}
                        <div className="vault-actions">
                          <button
                            type="button"
                            onClick={() => setCompared(String(v.version))}
                          >
                            {t.compare}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (dirty && !window.confirm(t.unsaved)) return;
                              const s = v.snapshot;
                              if (
                                !s ||
                                typeof s !== 'object' ||
                                Array.isArray(s)
                              )
                                return;
                              const parsed = writingSaveSchema.safeParse({
                                ...input,
                                title: s.title,
                                kind: s.kind,
                                content: s.content,
                                prompt: s.prompt,
                                wordLimit: s.word_limit,
                                rubric: s.rubric,
                                applicationId: s.application_id,
                                requestId: crypto.randomUUID(),
                              });
                              if (parsed.success) {
                                setInput(parsed.data);
                                setDirty(true);
                              } else setError(t.validation);
                            }}
                          >
                            {t.revert}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
                {diff && (
                  <section className="writing-diff" aria-label={t.compare}>
                    <div>
                      <h3>{t.before}</h3>
                      <pre>
                        {diff.unchanged}
                        <del>{diff.removed}</del>
                        {diff.suffix}
                      </pre>
                    </div>
                    <div>
                      <h3>{t.after}</h3>
                      <pre>
                        {diff.unchanged}
                        <ins>{diff.added}</ins>
                        {diff.suffix}
                      </pre>
                    </div>
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
