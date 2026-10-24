import type { Metadata } from 'next';
import { getPublicEnv } from '@/lib/env/public';
import { locales, type Locale } from '@/lib/i18n/messages';

export function isIndexableSite(): boolean {
  const host = new URL(getPublicEnv().NEXT_PUBLIC_APP_URL).hostname;
  return (
    process.env.JETU_PUBLIC_INDEXING === 'true' &&
    host !== 'localhost' &&
    host !== '127.0.0.1'
  );
}

export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const pathname = path ? `/${path}` : '';
  const absolute = new URL(`/${locale}${pathname}`, origin).toString();
  const languages = Object.fromEntries(
    locales.map((candidate) => [
      candidate,
      new URL(`/${candidate}${pathname}`, origin).toString(),
    ]),
  );
  return {
    title,
    description,
    robots: { index: isIndexableSite(), follow: isIndexableSite() },
    alternates: {
      canonical: absolute,
      languages: {
        ...languages,
        'x-default': new URL('/ru' + pathname, origin).toString(),
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'JETU Admissions',
      title,
      description,
      url: absolute,
      locale,
      images: [
        {
          url: new URL('/opengraph-image', origin).toString(),
          width: 1200,
          height: 630,
          alt: 'JETU Admissions',
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
