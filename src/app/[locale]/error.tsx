'use client';

import { useParams } from 'next/navigation';
import { isLocale, messages } from '@/lib/i18n/messages';

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : 'ru';
  const t = messages[locale];
  return (
    <main className="page-shell boundary">
      <h1>{t.error}</h1>
      <p role="alert">{t.errorBody}</p>
      <button className="action" type="button" onClick={reset}>
        {t.retry}
      </button>
      <a className="action" href={`/${locale}`}>
        {t.home}
      </a>
    </main>
  );
}
