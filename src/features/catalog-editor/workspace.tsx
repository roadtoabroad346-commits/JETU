'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import { editorCopy } from './copy';
import {
  editorQueueSchema,
  type EditorCommand,
  type EditorQueue,
} from './contracts';

type Entity = EditorQueue['entities'][number];
type Claim = Entity['claims'][number];
type Result<T> = { data?: T; error?: { code: string } };
async function queue(cursor: number | null, signal?: AbortSignal) {
  const response = await fetch(
    `/api/admin/catalog${cursor ? `?before=${cursor}` : ''}`,
    { signal },
  );
  const result = (await response.json()) as Result<unknown>;
  if (!response.ok || result.error)
    throw Object.assign(new Error('Queue unavailable'), {
      code: result.error?.code,
    });
  return editorQueueSchema.parse(result.data);
}

function ReviewFields({
  locale,
  claim,
  disabled,
}: {
  locale: Locale;
  claim?: Claim;
  disabled: boolean;
}) {
  const t = editorCopy[locale];
  return (
    <>
      <label>
        {t.note}
        <textarea
          name="note"
          minLength={10}
          maxLength={1000}
          required
          disabled={disabled}
          rows={3}
        />
      </label>
      <label className="catalog-editor-attestation">
        <input type="checkbox" name="attested" required disabled={disabled} />
        {claim ? t.attest : t.publicationAttest}
      </label>
    </>
  );
}

function EntityReview({
  entity,
  locale,
  writable,
  pending,
  onCommand,
}: {
  entity: Entity;
  locale: Locale;
  writable: boolean;
  pending: boolean;
  onCommand: (command: EditorCommand) => Promise<void>;
}) {
  const t = editorCopy[locale];
  const canPublish =
    entity.record !== null &&
    entity.claims.some((claim) => claim.state === 'verified') &&
    entity.claims.every((claim) =>
      ['verified', 'rejected'].includes(claim.state),
    ) &&
    entity.parents.every(
      (parent) =>
        parent.status === 'published' && parent.verification === 'verified',
    );
  const title = String(
    entity.record?.title ??
      entity.record?.legal_name ??
      entity.record?.name ??
      `#${entity.id}`,
  );
  return (
    <article className="catalog-editor-record">
      <h2>{title}</h2>
      <p>
        {entity.type} · #{entity.id} · {entity.status} · {entity.verification} ·
        v{entity.revision}
      </p>
      <details>
        <summary>{t.record}</summary>
        {entity.record ? (
          <pre>{JSON.stringify(entity.record, null, 2)}</pre>
        ) : (
          <p>{t.missingRecord}</p>
        )}
      </details>
      {entity.parents.length > 0 && (
        <div>
          <h3>{t.parents}</h3>
          <ul>
            {entity.parents.map((parent) => (
              <li key={parent.id}>
                #{parent.id} · {parent.type} · {parent.status} ·{' '}
                {parent.verification}
              </li>
            ))}
          </ul>
        </div>
      )}
      <h3>{t.claims}</h3>
      {!entity.claims.length && <p>{t.noClaims}</p>}
      {entity.claims.map((claim) => (
        <section
          className="catalog-editor-claim"
          key={claim.id}
          aria-label={claim.key}
        >
          <h4>{claim.key}</h4>
          <p>{claim.text}</p>
          <p>
            {claim.state} · {claim.publisher} ·{' '}
            {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
              new Date(claim.checkedAt),
            )}
          </p>
          <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer">
            {t.source}
          </a>
          {writable && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const action = (
                  event.nativeEvent as SubmitEvent
                ).submitter?.getAttribute('value');
                if (action !== 'review_claim' && action !== 'reject_claim')
                  return;
                void onCommand({
                  entityId: entity.id,
                  expectedRevision: entity.revision,
                  claimId: claim.id,
                  expectedHash: claim.hash,
                  expectedState: claim.state,
                  action,
                  note: String(data.get('note')),
                  attested: true,
                });
              }}
            >
              <ReviewFields locale={locale} claim={claim} disabled={pending} />
              <div className="catalog-editor-actions">
                <button
                  className="ui-button ui-button--primary"
                  name="action"
                  value="review_claim"
                  disabled={pending || !claim.sourceActive}
                >
                  {t.approve}
                </button>
                <button
                  className="ui-button ui-button--secondary"
                  name="action"
                  value="reject_claim"
                  disabled={pending}
                >
                  {t.reject}
                </button>
              </div>
            </form>
          )}
        </section>
      ))}
      {!canPublish && <p className="feedback-box">{t.gates}</p>}
      {writable && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const action =
              entity.status === 'published' ? 'unpublish' : 'publish';
            const common = {
              entityId: entity.id,
              expectedRevision: entity.revision,
              note: String(data.get('note')),
              attested: true as const,
            };
            void onCommand(
              action === 'publish'
                ? { ...common, action, expectedRecordHash: entity.recordHash }
                : { ...common, action },
            );
          }}
        >
          <ReviewFields locale={locale} disabled={pending} />
          <button
            className="ui-button ui-button--accent"
            disabled={pending || (entity.status !== 'published' && !canPublish)}
          >
            {entity.status === 'published' ? t.unpublish : t.publish}
          </button>
        </form>
      )}
    </article>
  );
}

export function CatalogEditor({ locale }: { locale: Locale }) {
  const t = editorCopy[locale];
  const [state, setState] = useState<EditorQueue | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState(false);
  const [cursors, setCursors] = useState<Array<number | null>>([null]);
  const cursor = cursors[cursors.length - 1] ?? null;
  useEffect(() => {
    const abort = new AbortController();
    void queue(null, abort.signal)
      .then(setState)
      .catch((failure: { name?: string; code?: string }) => {
        if (failure.name !== 'AbortError')
          setError(
            failure.code === 'FORBIDDEN' || failure.code === 'UNAUTHENTICATED'
              ? t.denied
              : t.unavailable,
          );
      });
    return () => abort.abort();
  }, [t]);
  async function load(next: Array<number | null>) {
    setPending(true);
    try {
      setState(await queue(next[next.length - 1] ?? null));
      setCursors(next);
      setError('');
    } catch {
      setError(t.unavailable);
    } finally {
      setPending(false);
    }
  }
  async function command(value: EditorCommand) {
    setPending(true);
    setFeedback('');
    let saved = false;
    try {
      const response = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
      const result = (await response.json()) as Result<unknown>;
      if (!response.ok || result.error)
        throw Object.assign(new Error('Review failed'), {
          code: result.error?.code,
        });
      saved = true;
      setState(await queue(cursor));
      setFeedback(t.saved);
    } catch (failure) {
      const code = (failure as { code?: string }).code;
      setFeedback(
        saved
          ? t.savedReload
          : code === 'CONFLICT'
            ? t.conflict
            : code === 'FORBIDDEN'
              ? t.denied
              : t.gates,
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <main
      id="main"
      tabIndex={-1}
      className="dashboard-main page-shell catalog-editor"
    >
      <header className="dashboard-heading">
        <div>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <button
          className="ui-button ui-button--secondary"
          disabled={pending}
          onClick={() => void load(cursors)}
        >
          {pending ? t.pending : t.retry}
        </button>
      </header>
      {error && (
        <p className="feedback-box feedback-box--error" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="feedback-box" role="status">
          {feedback}
        </p>
      )}
      {!state && !error && <p role="status">{t.loading}</p>}
      {state && (
        <>
          <p>
            {t.role}: {state.role}
          </p>
          {state.role === 'editor' && <p>{t.readOnly}</p>}
          {!state.entities.length && <p>{t.empty}</p>}
          {state.entities.map((entity) => (
            <EntityReview
              key={`${entity.id}:${entity.revision}`}
              entity={entity}
              locale={locale}
              writable={state.role !== 'editor'}
              pending={pending}
              onCommand={command}
            />
          ))}
          <nav className="catalog-editor-actions" aria-label={t.title}>
            <button
              className="ui-button ui-button--secondary"
              disabled={pending || cursors.length === 1}
              onClick={() => void load(cursors.slice(0, -1))}
            >
              {t.newer}
            </button>
            <button
              className="ui-button ui-button--secondary"
              disabled={pending || state.nextCursor === null}
              onClick={() => void load([...cursors, state.nextCursor])}
            >
              {t.older}
            </button>
            <button
              className="ui-button ui-button--secondary"
              disabled={pending || cursors.length === 1}
              onClick={() => void load([null])}
            >
              {t.newest}
            </button>
          </nav>
          <details className="catalog-editor-record">
            <summary>{t.history}</summary>
            {state.events.map((event) => (
              <article key={event.id}>
                <h2>
                  #{event.entity_id} · {event.action}
                </h2>
                <p>{event.note}</p>
                <time dateTime={event.created_at}>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(event.created_at))}
                </time>
                <details>
                  <summary>
                    {t.before} / {t.after}
                  </summary>
                  <h3>{t.before}</h3>
                  <pre>{JSON.stringify(event.before_snapshot, null, 2)}</pre>
                  <h3>{t.after}</h3>
                  <pre>{JSON.stringify(event.after_snapshot, null, 2)}</pre>
                </details>
              </article>
            ))}
          </details>
        </>
      )}
    </main>
  );
}
