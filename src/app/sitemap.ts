import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env/public';
import { locales } from '@/lib/i18n/messages';
import { marketingSlugs } from '@/lib/i18n/marketing';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const paths = ['', ...marketingSlugs];
  return paths.flatMap((path) => {
    const suffix = path ? `/${path}` : '';
    const languages = Object.fromEntries(
      locales.map((locale) => [
        locale,
        new URL(`/${locale}${suffix}`, origin).toString(),
      ]),
    );
    return locales.map((locale) => ({
      url: new URL(`/${locale}${suffix}`, origin).toString(),
      changeFrequency: 'monthly' as const,
      priority: path ? 0.6 : 1,
      alternates: { languages },
    }));
  });
}
