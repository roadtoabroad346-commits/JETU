import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { applicationsCopy } from '@/features/applications/copy';
import { ApplicationsPortfolio } from '@/features/applications/workspace';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/applications'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: applicationsCopy[locale].title,
    robots: { index: false, follow: false },
  };
}

export default async function ApplicationsPage({
  params,
}: PageProps<'/[locale]/applications'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ApplicationsPortfolio locale={locale} />;
}
