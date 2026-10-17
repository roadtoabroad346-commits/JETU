'use client';
import { useParams } from 'next/navigation';
import { messages, isLocale } from '@/lib/i18n/messages';

export default function Loading() {
  const { locale } = useParams<{ locale: string }>();
  const t = messages[isLocale(locale) ? locale : 'ru'];
  return (
    <main className="page-shell boundary" role="status" aria-live="polite">
      <p>{t.loading}</p>
    </main>
  );
}
