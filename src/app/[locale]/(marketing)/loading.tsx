'use client';
import { useParams } from 'next/navigation';
import { messages, isLocale } from '@/lib/i18n/messages';
import { Skeleton } from '@/components/ui/primitives';

export default function Loading() {
  const { locale } = useParams<{ locale: string }>();
  const t = messages[isLocale(locale) ? locale : 'ru'];
  return (
    <main className="page-shell boundary">
      <Skeleton label={t.loading} />
    </main>
  );
}
