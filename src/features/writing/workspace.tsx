'use client';
import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import type { Locale } from '@/lib/i18n/messages';
import {
  blank,
  fromDraft,
  kinds,
  type Draft,
  type WritingInput,
  type WorkspaceData,
} from './contracts';
import { kindCopy, writingCopy } from './copy';
import { requestData } from './client';
import { StudioEditor } from './editor';
export function WritingWorkspace({
  locale,
  initialDraftId,
}: {
  locale: Locale;
  initialDraftId?: string;
}) {
  const t = writingCopy[locale];
  const [data, setData] = useState<WorkspaceData | null>(null),
    [failed, setFailed] = useState(false),
    [input, setInput] = useState<WritingInput | null>(null),
    [generation, setGeneration] = useState(0),
    [title, setTitle] = useState(''),
    [kind, setKind] = useState<WritingInput['kind']>('personal_statement'),
    [showArchive, setShowArchive] = useState(false),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try {
      const result = await requestData<WorkspaceData>('/api/writing');
      setData(result);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const loaded = Boolean(data);
  useEffect(() => {
    if (!initialDraftId || !loaded) return;
    let active = true;
    void requestData<{ draft: Draft }>(
      `/api/writing?project=${encodeURIComponent(initialDraftId)}`,
    )
      .then((r) => {
        if (active) {
          setInput(fromDraft(r.draft));
          setGeneration((g) => g + 1);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [initialDraftId, loaded]); // Data refresh must not remount an edited draft.
  function saved(row: Draft) {
    setData((current) =>
      current
        ? {
            ...current,
            drafts: [
              row,
              ...current.drafts.filter((d) => d.id !== row.id),
            ].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
          }
        : current,
    );
  }
  function open(value: WritingInput) {
    setInput(value);
    setGeneration((g) => g + 1);
  }
  async function openProject(row: Draft) {
    setBusy(true);
    try {
      const result = await requestData<{ draft: Draft }>(
        `/api/writing?project=${row.id}`,
      );
      open(fromDraft(result.draft));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  async function archive(row: Draft) {
    setBusy(true);
    try {
      const loaded = (
        await requestData<{ draft: Draft }>(`/api/writing?project=${row.id}`)
      ).draft;
      const value = fromDraft(loaded);
      const result = await requestData<{ draft: Draft }>('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...value,
          studio: { ...value.studio, archived: !value.studio.archived },
        }),
      });
      saved(result.draft);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  if (input && data)
    return (
      <StudioEditor
        key={`${input.id}:${generation}`}
        locale={locale}
        initial={input}
        data={data}
        onSaved={saved}
        onBack={() => setInput(null)}
        onFork={open}
      />
    );
  return (
    <div className="studio-home">
      <div className="studio-hero">
        <div>
          <p className="eyebrow">JETU / WRITING</p>
          <h1>{t.title}</h1>
          <p className="studio-lead">{t.subtitle}</p>
          <p className="studio-privacy">
            <Icon name="check" />
            {t.private}
          </p>
        </div>
        <div className="studio-hero-art" aria-hidden="true">
          <span className="studio-art-line" />
          <span className="studio-art-line" />
          <span className="studio-art-line" />
          <span className="studio-art-mark">J</span>
        </div>
      </div>
      {failed && (
        <div role="alert" className="feedback-box feedback-box--error">
          <p>{t.loadError}</p>
          <button
            type="button"
            className="ui-button ui-button--secondary"
            onClick={() => void load()}
          >
            {t.retryLoad}
          </button>
        </div>
      )}
      {!data && !failed && <p role="status">{t.loading}</p>}
      {data && (
        <>
          <section
            className="ui-card studio-create"
            aria-labelledby="new-writing"
          >
            <div>
              <span className="ui-badge">01</span>
              <h2 id="new-writing">{t.newProject}</h2>
              <p>{t.emptyBody}</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                open({ ...blank(locale, kind), title });
              }}
            >
              <label>
                {t.projectTitle}
                <input
                  required
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                {t.kind}
                <select
                  value={kind}
                  onChange={(e) =>
                    setKind(e.target.value as WritingInput['kind'])
                  }
                >
                  {kinds.map((k) => (
                    <option key={k} value={k}>
                      {kindCopy[locale][k]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="ui-button ui-button--accent"
                disabled={!title.trim()}
              >
                {t.create}
                <Icon name="arrow" />
              </button>
            </form>
          </section>
          <section aria-labelledby="writing-projects">
            <div className="studio-projects-heading">
              <h2 id="writing-projects">{t.projects}</h2>
              <label className="studio-check">
                <input
                  type="checkbox"
                  checked={showArchive}
                  onChange={(e) => setShowArchive(e.target.checked)}
                />
                {t.showArchive}
              </label>
            </div>
            <div className="studio-project-grid">
              {data.drafts
                .filter(
                  (row) =>
                    Boolean(
                      (row.studio as { archived?: boolean } | null)?.archived,
                    ) === showArchive,
                )
                .map((row) => (
                  <article className="ui-card studio-project-card" key={row.id}>
                    <span className="studio-project-icon">
                      <Icon name="book" />
                    </span>
                    <span className="ui-badge">
                      {kindCopy[locale][row.kind]}
                    </span>
                    <h3>{row.title}</h3>
                    <p>{new Date(row.updated_at).toLocaleString(locale)}</p>
                    <p>
                      {(row.studio as { ready?: boolean } | null)?.ready
                        ? t.statusReady
                        : t.statusDraft}
                    </p>
                    <div className="studio-actions">
                      <button
                        type="button"
                        disabled={busy}
                        className="ui-button ui-button--primary"
                        onClick={() => void openProject(row)}
                      >
                        {t.continue}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="ui-button ui-button--secondary"
                        onClick={() => void archive(row)}
                      >
                        {showArchive ? t.reopen : t.archive}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="ui-button ui-button--secondary"
                        onClick={async () => {
                          setBusy(true);
                          try {
                            const full = (
                              await requestData<{ draft: Draft }>(
                                `/api/writing?project=${row.id}`,
                              )
                            ).draft;
                            open({
                              ...fromDraft(full),
                              id: crypto.randomUUID(),
                              version: 0,
                              title: `${row.title.slice(0, 130)} · ${t.duplicate}`,
                              studio: {
                                ...fromDraft(full).studio,
                                archived: false,
                                ready: false,
                              },
                            });
                          } catch {
                            setFailed(true);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {t.duplicate}
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            {!data.drafts.length && (
              <div className="studio-empty">
                <Icon name="book" />
                <h3>{t.empty}</h3>
                <p>{t.private}</p>
              </div>
            )}
          </section>
        </>
      )}
      <p className="studio-integrity">{t.integrity}</p>
    </div>
  );
}
