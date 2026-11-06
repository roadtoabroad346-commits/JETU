import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/marketing/seo';
import { isLocale } from '@/lib/i18n/messages';
import { MentorDirectory } from '@/features/mentors/directory';
import { mentorCopy } from '@/features/mentors/copy';
import { MarketingFooter } from '@/components/marketing/footer';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale)
    ? pageMetadata(
        locale,
        'mentors',
        mentorCopy[locale].title,
        mentorCopy[locale].intro,
      )
    : {};
}
export default async function MentorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const values = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (typeof value === 'string') query.set(key, value);
  return (
    <>
      <main id="main" tabIndex={-1} className="page-shell mentor-main">
        <MentorDirectory locale={locale} query={query.toString()} />
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
