import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env/public';
import { isIndexableSite } from '@/lib/marketing/seo';

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const publicSite = isIndexableSite();
  return {
    rules: {
      userAgent: '*',
      ...(publicSite
        ? { allow: '/', disallow: ['/*/design-system'] }
        : { disallow: '/' }),
    },
    sitemap: new URL('/sitemap.xml', origin).toString(),
  };
}
