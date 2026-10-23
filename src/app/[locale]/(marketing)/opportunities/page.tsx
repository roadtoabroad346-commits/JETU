import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/messages';
import { opportunityCopy } from '@/features/opportunities/copy';
import {
  defaultOpportunityFilters,
  parseOpportunityFilters,
} from '@/features/opportunities/server';
import { OpportunityExplorer } from '@/features/opportunities/views';
import { pageMetadata } from '@/lib/marketing/seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMetadata(
    locale,
    'opportunities',
    opportunityCopy[locale].title,
    opportunityCopy[locale].intro,
  );
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const parsed = parseOpportunityFilters(await searchParams);
  return (
    <OpportunityExplorer
      locale={locale}
      filters={parsed.success ? parsed.data : defaultOpportunityFilters}
      valid={parsed.success}
    />
  );
}
