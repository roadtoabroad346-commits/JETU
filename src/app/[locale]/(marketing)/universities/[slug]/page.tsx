import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { UniversityDetail } from '@/features/catalog/views';
import { getUniversity } from '@/features/catalog/server';
import { pageMetadata } from '@/lib/marketing/seo';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) notFound();
  return <UniversityDetail locale={locale} slug={slug} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  try {
    const university = await getUniversity(slug);
    if (!university) return { robots: { index: false } };
    return pageMetadata(
      locale,
      `/universities/${slug}`,
      university.name,
      `${university.name} · JETU Admissions`,
    );
  } catch {
    return { title: 'JETU Admissions', robots: { index: false } };
  }
}
