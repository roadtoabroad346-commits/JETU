'use client';

import { useParams } from 'next/navigation';
import { isLocale, messages } from '@/lib/i18n/messages';
import { Button } from '@/components/ui/primitives';

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
      <Button onClick={reset}>{t.retry}</Button>
      <a className="ui-button ui-button--secondary" href={`/${locale}`}>
        {t.home}
      </a>
    </main>
  );
}
