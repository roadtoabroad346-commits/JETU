import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/messages';
import { WritingWorkspace } from '@/features/writing/workspace';
import { writingCopy } from '@/features/writing/copy';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        title: writingCopy[locale].title,
        robots: { index: false, follow: false },
      }
    : {};
}
export default async function WritingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const { draft } = await searchParams;
  return (
    <main id="main" tabIndex={-1} className="dashboard-main page-shell">
      <WritingWorkspace locale={locale} initialDraftId={draft} />
    </main>
  );
}
