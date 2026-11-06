import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n/messages';
import { MentorWorkspace } from '@/features/mentors/workspace';
import { mentorCopy } from '@/features/mentors/copy';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        title: mentorCopy[locale].workspace,
        robots: { index: false, follow: false },
      }
    : {};
}
export default async function MentoringPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const values = await searchParams;
  return (
    <main id="main" tabIndex={-1} className="dashboard-main page-shell">
      <MentorWorkspace
        locale={locale}
        query={new URLSearchParams(
          Object.entries(values).filter(
            (v): v is [string, string] => typeof v[1] === 'string',
          ),
        ).toString()}
      />
    </main>
  );
}
