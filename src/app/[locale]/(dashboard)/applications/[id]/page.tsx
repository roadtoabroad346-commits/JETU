import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { applicationsCopy } from '@/features/applications/copy';
import { ApplicationWorkspace } from '@/features/applications/workspace';
import { isUuid } from '@/features/applications/http';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/applications/[id]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: applicationsCopy[locale].workspace,
    robots: { index: false, follow: false },
  };
}

export default async function ApplicationPage({
  params,
}: PageProps<'/[locale]/applications/[id]'>) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !isUuid(id)) notFound();
  return <ApplicationWorkspace locale={locale} applicationId={id} />;
}
