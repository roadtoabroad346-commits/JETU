import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getPublicEnv } from '@/lib/env/public';
import { isLocale, messages } from '@/lib/i18n/messages';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const candidate = (await headers()).get('x-jetu-locale') ?? 'ru';
  const locale = isLocale(candidate) ? candidate : 'ru';
  return {
    metadataBase: new URL(getPublicEnv().NEXT_PUBLIC_APP_URL),
    title: {
      default: messages[locale].title,
      template: '%s | JETU Admissions',
    },
    description: messages[locale].description,
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const candidate = (await headers()).get('x-jetu-locale') ?? 'ru';
  const locale = isLocale(candidate) ? candidate : 'ru';
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
