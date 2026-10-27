'use client';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import { vaultCopy } from './copy';
import { requestData } from './client';
import type { VaultData } from './workspace';
/** Real owner-scoped attachments, pinned to their reviewed version. Never changes application status. */
export function ApplicationDocuments({
  applicationId,
  locale,
}: {
  applicationId: string;
  locale: Locale;
}) {
  const [at, setAt] = useState(0);
  const t = vaultCopy(locale),
    [data, setData] = useState<VaultData | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void requestData<VaultData>('/api/vault', { signal: controller.signal })
      .then((value) => {
        setAt(Date.now());
        setData(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [applicationId]);
  const links =
    data?.links.filter((l) => l.application_id === applicationId) ?? [];
  return (
    <section className="application-panel">
      <h2>{t.vault}</h2>
      <p>{t.exportHelp}</p>
      {error && <p role="alert">{t.error}</p>}
      {!data && !error ? (
        <p role="status">{t.loading}</p>
      ) : (
        <ul>
          {links.map((l) => {
            const doc = data?.documents.find((d) => d.id === l.document_id),
              v = data?.versions.find((v) => v.id === l.version_id);
            return (
              <li key={l.id}>
                {doc?.display_name ?? t.remove} · {t.version} {v?.sequence} ·{' '}
                {doc && Date.parse(doc.expires_at) <= at
                  ? t.expired
                  : doc?.deleted_at || doc?.archived_at
                    ? t.archived
                    : v?.state === 'available'
                      ? t.available
                      : t.quarantined}
              </li>
            );
          })}
        </ul>
      )}
      <div className="vault-actions">
        <a className="ui-button ui-button--secondary" href={`/${locale}/vault`}>
          {t.link}
        </a>
        <a
          className="ui-button ui-button--secondary"
          href={`/${locale}/writing`}
        >
          {t.writing}
        </a>
        {links.length > 0 && (
          <a
            className="ui-button ui-button--secondary"
            href={`/api/vault/export?application=${applicationId}`}
            download
          >
            {t.export}
          </a>
        )}
      </div>
    </section>
  );
}
