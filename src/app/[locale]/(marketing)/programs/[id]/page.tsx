import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { ProgramDetail } from '@/features/catalog/views';
import { getProgram } from '@/features/catalog/server';
import { pageMetadata } from '@/lib/marketing/seo';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^[1-9][0-9]*$/.test(id)) notFound();
  return <ProgramDetail locale={locale} id={id} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  try {
    const program = await getProgram(id);
    if (!program) return { robots: { index: false } };
    return pageMetadata(
      locale,
      `/programs/${id}`,
      program.name,
      `${program.name} · JETU Admissions`,
    );
  } catch {
    return { title: 'JETU Admissions', robots: { index: false } };
  }
}
