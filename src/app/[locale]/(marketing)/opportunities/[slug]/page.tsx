import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/messages';
import { opportunityCopy } from '@/features/opportunities/copy';
import { OpportunityDetail } from '@/features/opportunities/views';
import { pageMetadata } from '@/lib/marketing/seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  return pageMetadata(
    locale,
    `opportunities/${slug}`,
    opportunityCopy[locale].title,
    opportunityCopy[locale].intro,
  );
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const query = await searchParams;
  return (
    <OpportunityDetail
      locale={locale}
      slug={slug}
      feedback={query.error ? 'error' : query.success ? 'saved' : undefined}
    />
  );
}
