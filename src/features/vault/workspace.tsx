'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import type { Database } from '@/lib/supabase/database.types';
import { vaultCopy, type VaultCopy } from './copy';
import {
  categories,
  MAX_FILE_BYTES,
  validateFile,
  type Category,
} from './files';
import { jsonCommand, requestData, RequestFailure } from './client';
type Tables = Database['public']['Tables'];
type Document = Tables['vault_documents']['Row'];
type Version = Tables['vault_versions']['Row'];
type RequestRow = Pick<
  Tables['recommendation_requests']['Row'],
  | 'id'
  | 'application_id'
  | 'invited_email'
  | 'context'
  | 'due_date'
  | 'expires_at'
  | 'status'
  | 'created_at'
>;
export type VaultData = {
  documents: Document[];
  versions: Version[];
  links: Tables['vault_links']['Row'][];
  applications: { id: string; program_title_snapshot: string }[];
  tasks: { id: string; title: string; target_id: string | null }[];
  requests: RequestRow[];
  receivedRequests?: {
    id: string;
    context: string;
    due_date: string | null;
    expires_at: string;
    status: string;
  }[];
};
function stateOf(doc: Document, version: Version | undefined, now: number) {
  return Date.parse(doc.expires_at) <= now
    ? 'expired'
    : doc.archived_at
      ? 'archived'
      : (version?.state ?? 'available');
}
function statusLabel(state: string, t: VaultCopy) {
  return state === 'uploading'
    ? t.uploadingState
    : (t[state as keyof VaultCopy] ?? state);
}

export function VaultWorkspace({ locale }: { locale: Locale }) {
  const [now, setNow] = useState(0);
  const t = vaultCopy(locale),
    [data, setData] = useState<VaultData | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [status, setStatus] = useState('all'),
    [appFilter, setAppFilter] = useState('');
  const [selected, setSelected] = useState(''),
    [category, setCategory] = useState<Category>('transcript'),
    [file, setFile] = useState<File | null>(null),
    [purpose, setPurpose] = useState(''),
    [application, setApplication] = useState(''),
    [task, setTask] = useState(''),
    [uploadDoc, setUploadDoc] = useState(''),
    [recommendationId, setRecommendationId] = useState('');
  const [token, setToken] = useState(''),
    [invite, setInvite] = useState(''),
    [preview, setPreview] = useState<string | null>(null);
  const uploadId = useRef<string | null>(null),
    controller = useRef<AbortController | null>(null),
    errorRef = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try {
      const value = await requestData<VaultData>('/api/vault');
      setNow(Date.now());
      setData(value);
      setError('');
    } catch {
      setError(t.error);
    }
  }, [t.error]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(Date.now());
      void load();
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const code = fragment.get('invite');
      if (code) {
        setToken(code);
        history.replaceState(null, '', window.location.pathname);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(
        e instanceof RequestFailure && e.code === 'VALIDATION_FAILED'
          ? t.validation
          : t.error,
      );
    } finally {
      setBusy(false);
    }
  }
  function chooseFile(value: File | null) {
    setFile(value);
    uploadId.current = null;
    setError('');
    if (value && value.size > MAX_FILE_BYTES) setError(t.validation);
  }
  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || busy) return;
    setUploading(true);
    await act(async () => {
      if (file.size > MAX_FILE_BYTES)
        throw new RequestFailure('VALIDATION_FAILED');
      try {
        validateFile(
          new Uint8Array(await file.arrayBuffer()),
          file.name,
          file.type,
          category,
        );
      } catch {
        throw new RequestFailure('VALIDATION_FAILED');
      }
      uploadId.current ??= crypto.randomUUID();
      controller.current = new AbortController();
      const result = await requestData<{ id: string; state: string }>(
        '/api/vault/upload',
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'X-Vault-Metadata': encodeURIComponent(
              JSON.stringify({
                name: file.name,
                category,
                purpose,
                documentId: uploadDoc || null,
                applicationId: application || null,
                recommendationId: recommendationId || null,
                requestId: uploadId.current,
              }),
            ),
          },
          body: file,
          signal: controller.current.signal,
        },
      );
      if (!['quarantined', 'available'].includes(result.state)) {
        setUploadDoc(result.id);
        uploadId.current = null;
        await load();
        throw new RequestFailure('CONFLICT');
      }
      setNotice(result.state === 'available' ? t.saved : t.quarantinedNotice);
      setFile(null);
      uploadId.current = null;
    });
    controller.current = null;
    setUploading(false);
  }
  const doc = data?.documents.find((v) => v.id === selected),
    versions = data?.versions.filter((v) => v.document_id === selected) ?? [];
  const current = doc
    ? data?.versions.find((v) => v.id === doc.current_version_id)
    : undefined;
  const filtered =
    data?.documents.filter((d) => {
      const v = data.versions.find((v) => v.id === d.current_version_id);
      return (
        d.display_name
          .toLocaleLowerCase(locale)
          .includes(query.toLocaleLowerCase(locale)) &&
        (filter === 'all' || d.category === filter) &&
        (status === 'all' || stateOf(d, v, now) === status) &&
        (!appFilter ||
          data.links.some(
            (l) => l.document_id === d.id && l.application_id === appFilter,
          ))
      );
    }) ?? [];
  return (
    <main id="main" className="page-shell dashboard-main vault-workspace">
      <header className="vault-hero">
        <div>
          <p className="eyebrow">JETU · {t.personal}</p>
          <h1>{t.vault}</h1>
          <p className="lead">{t.lead}</p>
        </div>
        <a
          className="ui-button ui-button--secondary"
          href={`/${locale}/writing`}
        >
          {t.writing} →
        </a>
      </header>
      <p className="vault-privacy">{t.privacy}</p>
      {error && (
        <div className="form-error" role="alert" tabIndex={-1} ref={errorRef}>
          {error}{' '}
          <button type="button" onClick={() => void load()}>
            {t.retry}
          </button>
        </div>
      )}
      <p role="status" aria-live="polite" className="vault-notice">
        {busy ? t.loading : notice}
      </p>
      {!data ? (
        <p aria-busy={!error}>{error ? '' : t.loading}</p>
      ) : (
        <>
          <div className="vault-columns">
            <section className="vault-panel" aria-labelledby="upload-heading">
              <h2 id="upload-heading">{t.upload}</h2>
              <form onSubmit={upload} className="vault-form" aria-busy={busy}>
                <label>
                  {t.version}
                  <select
                    value={uploadDoc}
                    disabled={busy}
                    onChange={(e) => {
                      setUploadDoc(e.target.value);
                      const d = data.documents.find(
                        (d) => d.id === e.target.value,
                      );
                      if (d) setCategory(d.category as Category);
                      uploadId.current = null;
                    }}
                  >
                    <option value="">{t.newDocument}</option>
                    {data.documents
                      .filter((d) => !d.archived_at && !d.portfolio_url)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.display_name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  {t.category}
                  <select
                    value={category}
                    disabled={busy || Boolean(uploadDoc)}
                    onChange={(e) => {
                      setCategory(e.target.value as Category);
                      uploadId.current = null;
                    }}
                  >
                    {categories
                      .filter((c) => c !== 'portfolio')
                      .map((c) => (
                        <option key={c} value={c}>
                          {t[c]}
                        </option>
                      ))}
                  </select>
                </label>
                <fieldset
                  className="vault-drop"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!busy) {
                      if (e.dataTransfer.files.length === 1)
                        chooseFile(e.dataTransfer.files[0] ?? null);
                      else setError(t.validation);
                    }
                  }}
                >
                  <legend>{t.drop}</legend>
                  <label>
                    {t.file}
                    <input
                      key={file?.name ?? 'empty'}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      disabled={busy}
                      aria-describedby="file-help"
                      onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {file && (
                    <p>
                      {file.name} · {(file.size / 1024).toFixed(0)} KB
                    </p>
                  )}
                </fieldset>
                <p id="file-help" className="muted">
                  {t.fileHelp}
                </p>
                {['financial', 'identity'].includes(category) && (
                  <>
                    <label>
                      {t.purpose}
                      <textarea
                        required
                        minLength={10}
                        maxLength={500}
                        value={purpose}
                        onChange={(e) => {
                          setPurpose(e.target.value);
                          uploadId.current = null;
                        }}
                      />
                    </label>
                    <p className="muted">{t.purposeHelp}</p>
                  </>
                )}
                <label>
                  {t.application}
                  <select
                    required={['financial', 'identity'].includes(category)}
                    value={application}
                    disabled={busy}
                    onChange={(e) => {
                      setApplication(e.target.value);
                      uploadId.current = null;
                    }}
                  >
                    <option value="">{t.none}</option>
                    {data.applications.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.program_title_snapshot}
                      </option>
                    ))}
                  </select>
                </label>
                {category === 'recommendation' && (
                  <label>
                    {t.requestId}
                    <input
                      required
                      value={recommendationId}
                      onChange={(e) => {
                        setRecommendationId(e.target.value);
                        uploadId.current = null;
                      }}
                    />
                  </label>
                )}
                <div className="vault-actions">
                  <button
                    className="ui-button ui-button--primary"
                    disabled={busy || !file || file.size > MAX_FILE_BYTES}
                  >
                    {uploading ? t.uploading : t.upload}
                  </button>
                  {uploading && (
                    <button
                      className="ui-button ui-button--secondary"
                      type="button"
                      onClick={() => controller.current?.abort()}
                    >
                      {t.cancel}
                    </button>
                  )}
                </div>
              </form>
            </section>
            <section className="vault-panel" aria-labelledby="library-heading">
              <div className="vault-section-heading">
                <h2 id="library-heading">{t.vault}</h2>
                <button
                  type="button"
                  className="ui-button ui-button--secondary"
                  disabled={busy}
                  onClick={() => void load()}
                >
                  {t.refresh}
                </button>
              </div>
              <div className="vault-filters">
                <label>
                  {t.search}
                  <input
                    type="search"
                    maxLength={160}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label>
                  {t.category}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">{t.all}</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {t[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.status}
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">{t.all}</option>
                    {[
                      'uploading',
                      'quarantined',
                      'available',
                      'rejected',
                      'failed',
                      'archived',
                      'expired',
                    ].map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s, t)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.application}
                  <select
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value)}
                  >
                    <option value="">{t.all}</option>
                    {data.applications.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.program_title_snapshot}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {!filtered.length ? (
                <p className="vault-empty">
                  {data.documents.length ? t.noResults : t.empty}
                </p>
              ) : (
                <ul className="vault-list">
                  {filtered.map((d) => {
                    const v = data.versions.find(
                      (v) => v.id === d.current_version_id,
                    );
                    const state = stateOf(d, v, now);
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          className="vault-document"
                          aria-expanded={selected === d.id}
                          aria-controls="document-detail"
                          onClick={() => {
                            setSelected(selected === d.id ? '' : d.id);
                            setPreview(null);
                          }}
                        >
                          <span>
                            <strong>{d.display_name}</strong>
                            <small>
                              {t[d.category as keyof VaultCopy]} ·{' '}
                              {t[d.sensitivity as keyof VaultCopy]}
                            </small>
                          </span>
                          <span
                            className={`vault-status vault-status--${state}`}
                          >
                            {statusLabel(state, t)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
          {doc && (
            <section
              className="vault-panel"
              id="document-detail"
              aria-labelledby="detail-heading"
            >
              <h2 id="detail-heading">{doc.display_name}</h2>
              <p>
                {t.expiry}:{' '}
                {new Date(doc.expires_at).toLocaleDateString(locale)}
              </p>
              <p>{doc.purpose}</p>
              <p className="muted">{t.safePreview}</p>
              <div className="vault-actions">
                {current && stateOf(doc, current, now) === 'available' && (
                  <>
                    <a
                      className="ui-button ui-button--primary"
                      href={`/api/vault/file?version=${current.id}`}
                      download
                    >
                      {t.download}
                    </a>
                    {current.extension === 'txt' && (
                      <button
                        className="ui-button ui-button--secondary"
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            const r = await fetch(
                              `/api/vault/file?version=${current.id}&preview=1`,
                              { cache: 'no-store' },
                            );
                            if (!r.ok) throw new Error();
                            setPreview(await r.text());
                          })
                        }
                      >
                        {t.preview}
                      </button>
                    )}
                  </>
                )}
                {doc.portfolio_url && (
                  <a
                    href={doc.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.portfolio} ↗
                  </a>
                )}
                <button
                  className="ui-button ui-button--secondary"
                  disabled={busy}
                  onClick={() =>
                    void act(() =>
                      jsonCommand('/api/vault', {
                        action: doc.archived_at ? 'restore' : 'archive',
                        documentId: doc.id,
                        confirmed: true,
                      }),
                    )
                  }
                >
                  {doc.archived_at ? t.restore : t.archive}
                </button>
                <button
                  className="ui-button ui-button--danger"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t.confirm))
                      void act(async () => {
                        await jsonCommand('/api/vault', {
                          action: 'delete',
                          documentId: doc.id,
                          confirmed: true,
                        });
                        setSelected('');
                      });
                  }}
                >
                  {t.remove}
                </button>
              </div>
              {preview !== null && (
                <pre className="vault-preview">{preview}</pre>
              )}
              <h3>{t.history}</h3>
              <div className="vault-history">
                {versions.map((v) => (
                  <article key={v.id}>
                    <strong>
                      {t.version} {v.sequence} · {statusLabel(v.state, t)}
                    </strong>
                    <p>
                      {new Date(v.created_at).toLocaleString(locale)} · {v.mime}{' '}
                      · {v.byte_size} B
                    </p>
                    <code className="vault-checksum">SHA-256 {v.sha256}</code>
                    {stateOf(doc, v, now) === 'available' && (
                      <a href={`/api/vault/file?version=${v.id}`} download>
                        {t.download}
                      </a>
                    )}
                  </article>
                ))}
              </div>
              {current && doc.sensitivity !== 'confidential' && (
                <form
                  className="vault-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(() =>
                      jsonCommand('/api/vault', {
                        action: 'link',
                        documentId: doc.id,
                        versionId: current.id,
                        applicationId: application,
                        taskId: task || null,
                      }),
                    );
                  }}
                >
                  <h3>{t.application}</h3>
                  <label>
                    {t.application}
                    <select
                      required
                      value={application}
                      onChange={(e) => setApplication(e.target.value)}
                    >
                      <option value="">{t.none}</option>
                      {data.applications.map((a) => (
                        <option value={a.id} key={a.id}>
                          {a.program_title_snapshot}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t.task}
                    <select
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                    >
                      <option value="">{t.none}</option>
                      {data.tasks
                        .filter((v) => v.target_id)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    className="ui-button ui-button--secondary"
                    disabled={
                      busy || stateOf(doc, current, now) !== 'available'
                    }
                  >
                    {t.link}
                  </button>
                </form>
              )}
              <ul>
                {data.links
                  .filter((l) => l.document_id === doc.id)
                  .map((l) => (
                    <li key={l.id}>
                      <a href={`/${locale}/applications/${l.application_id}`}>
                        {data.applications.find(
                          (a) => a.id === l.application_id,
                        )?.program_title_snapshot ?? t.application}
                      </a>{' '}
                      · {t.version}{' '}
                      {
                        data.versions.find((v) => v.id === l.version_id)
                          ?.sequence
                      }
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            jsonCommand('/api/vault', {
                              action: 'unlink',
                              documentId: doc.id,
                              versionId: l.version_id,
                              applicationId: l.application_id,
                              taskId: null,
                            }),
                          )
                        }
                      >
                        {t.unlink}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          )}
          <div className="vault-columns">
            <section className="vault-panel">
              <h2>{t.portfolio}</h2>
              <form
                className="vault-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void act(() =>
                    jsonCommand('/api/vault', {
                      action: 'portfolio',
                      name: f.get('name'),
                      url: f.get('url'),
                    }),
                  );
                }}
              >
                <label>
                  {t.name}
                  <input name="name" required maxLength={160} />
                </label>
                <label>
                  URL
                  <input
                    name="url"
                    type="url"
                    pattern="https://.*"
                    required
                    maxLength={2048}
                  />
                </label>
                <button
                  className="ui-button ui-button--secondary"
                  disabled={busy}
                >
                  {t.add}
                </button>
              </form>
            </section>
            <section className="vault-panel">
              <h2>{t.export}</h2>
              <p>{t.exportHelp}</p>
              <label>
                {t.application}
                <select
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                >
                  <option value="">{t.none}</option>
                  {data.applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.program_title_snapshot}
                    </option>
                  ))}
                </select>
              </label>
              {application && (
                <a
                  className="ui-button ui-button--secondary"
                  href={`/api/vault/export?application=${application}`}
                  download
                >
                  {t.export}
                </a>
              )}
            </section>
          </div>
          <section className="vault-panel">
            <h2>{t.recommendations}</h2>
            <p>{t.sealed}</p>
            <form
              className="vault-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void act(async () => {
                  const r = await jsonCommand<{ token: string }>(
                    '/api/recommendations',
                    {
                      action: 'create',
                      applicationId: f.get('application'),
                      email: f.get('email'),
                      context: f.get('context'),
                      dueDate: f.get('due') || null,
                      consent: f.get('consent') === 'on',
                    },
                  );
                  setInvite(
                    `${window.location.origin}/${locale}/vault#invite=${r.token}`,
                  );
                });
              }}
            >
              <label>
                {t.application}
                <select name="application" required>
                  <option value="">{t.none}</option>
                  {data.applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.program_title_snapshot}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.email}
                <input name="email" type="email" required maxLength={254} />
              </label>
              <label>
                {t.context}
                <textarea
                  name="context"
                  required
                  minLength={10}
                  maxLength={2000}
                />
              </label>
              <label>
                {t.due}
                <input name="due" type="date" />
              </label>
              <label className="vault-check">
                <input name="consent" type="checkbox" required />
                {t.consent}
              </label>
              <button
                className="ui-button ui-button--secondary"
                disabled={busy || !data.applications.length}
              >
                {t.createRequest}
              </button>
            </form>
            {invite && (
              <div className="vault-privacy">
                <p>{t.unsent}</p>
                <label>
                  {t.invitation}
                  <input
                    value={invite}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />
                </label>
              </div>
            )}
            <ul className="vault-list">
              {data.requests.map((r) => (
                <li key={r.id}>
                  <p>
                    <strong>{r.invited_email}</strong> ·{' '}
                    {statusLabel(
                      Date.parse(r.expires_at) < now &&
                        ['requested', 'accepted'].includes(r.status)
                        ? 'expired'
                        : r.status,
                      t,
                    )}
                  </p>
                  <p>{r.context}</p>
                  {['requested', 'accepted'].includes(r.status) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void act(() =>
                          jsonCommand('/api/recommendations', {
                            action: 'cancel',
                            id: r.id,
                          }),
                        )
                      }
                    >
                      {t.cancel}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {(data.receivedRequests ?? []).map((r) => (
              <article key={r.id}>
                <h3>{t.invitation}</h3>
                <p>
                  {r.context} · {statusLabel(r.status, t)}
                </p>
                {r.status === 'accepted' && Date.parse(r.expires_at) > now && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setRecommendationId(r.id);
                      setCategory('recommendation');
                    }}
                  >
                    {t.upload}
                  </button>
                )}
              </article>
            ))}
            <details open={Boolean(token)}>
              <summary>{t.invitation}</summary>
              <form
                className="vault-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(async () => {
                    const r = await jsonCommand<{ id: string }>(
                      '/api/recommendations',
                      { action: 'respond', token, accept: true },
                    );
                    setRecommendationId(r.id);
                    setCategory('recommendation');
                    setToken('');
                  });
                }}
              >
                <label>
                  {t.token}
                  <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    pattern="[a-f0-9]{64}"
                  />
                </label>
                <div className="vault-actions">
                  <button
                    className="ui-button ui-button--secondary"
                    disabled={busy}
                  >
                    {t.accept}
                  </button>
                  <button
                    className="ui-button ui-button--secondary"
                    type="button"
                    disabled={busy || !token}
                    onClick={() =>
                      void act(async () => {
                        await jsonCommand('/api/recommendations', {
                          action: 'respond',
                          token,
                          accept: false,
                        });
                        setToken('');
                      })
                    }
                  >
                    {t.decline}
                  </button>
                </div>
              </form>
              {recommendationId && (
                <p>
                  {t.requestId}: <code>{recommendationId}</code>
                </p>
              )}
            </details>
          </section>
          <aside className="vault-panel">
            <h2>{t.personal}</h2>
            <p>{t.retention}</p>
            <p>{t.mentor}</p>
          </aside>
        </>
      )}
    </main>
  );
}
