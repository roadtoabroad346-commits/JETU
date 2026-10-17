import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getPublicEnv } from '@/lib/env/public';
import { isLocale } from '@/lib/i18n/messages';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getPublicEnv().NEXT_PUBLIC_APP_URL),
  title: { default: 'JETU Admissions', template: '%s | JETU Admissions' },
  robots: { index: false, follow: false },
};

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
