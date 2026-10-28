import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { CatalogEditor } from '@/features/catalog-editor/workspace';
import { editorCopy } from '@/features/catalog-editor/copy';

export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: editorCopy[locale].title,
    robots: { index: false, follow: false },
  };
}
export default async function CatalogEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CatalogEditor locale={locale} />;
}
