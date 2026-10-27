import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { WritingWorkspace } from '@/features/writing/workspace';
import { vaultCopy } from '@/features/vault/copy';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/writing'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: vaultCopy(locale).writing,
    robots: { index: false, follow: false },
    referrer: 'no-referrer' as const,
  };
}
export default async function WritingPage({
  params,
}: PageProps<'/[locale]/writing'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <WritingWorkspace locale={locale} />;
}
