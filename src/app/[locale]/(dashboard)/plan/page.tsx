import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { roadmapCopy } from '@/features/roadmap/copy';
import {
  RoadmapWorkspace,
  type RoadmapView,
} from '@/features/roadmap/workspace';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: roadmapCopy[locale].title,
    robots: { index: false, follow: false },
  };
}

export default async function RoadmapPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const requested = (await searchParams).view;
  const view: RoadmapView = [
    'overview',
    'kanban',
    'timeline',
    'calendar',
    'checklist',
  ].includes(requested ?? '')
    ? (requested as RoadmapView)
    : 'overview';
  return <RoadmapWorkspace locale={locale} initialView={view} />;
}
