import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { matchingCopy } from '@/features/matching/copy';
import { MatchingWorkspace } from '@/features/matching/workspace';

export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: matchingCopy[locale].title,
    robots: { index: false, follow: false },
  };
}
export default async function MatchingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MatchingWorkspace locale={locale} />;
}
