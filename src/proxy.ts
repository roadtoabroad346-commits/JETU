import { NextResponse, type NextRequest } from 'next/server';
import {
  isLocale,
  locales,
  localeNames,
  messages,
  type Locale,
} from '@/lib/i18n/messages';
import { isMarketingSlug } from '@/lib/i18n/marketing';
import { getPublicEnv } from '@/lib/env/public';
import { createRouteSupabaseClient } from '@/lib/supabase/server';

const APP_ROUTES = new Set([
  'design-system',
  'login',
  'signup',
  'forgot-password',
  'reset-password',
  'dashboard',
  'onboarding',
  'schools',
]);

function notFoundResponse(locale: Locale) {
  const t = messages[locale];
  const links = locales
    .map(
      (item) =>
        `<a href="/${item}" lang="${item}">${localeNames[item]} · ${messages[item].home}</a>`,
    )
    .join('');
  const body = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${t.missing} | JETU Admissions</title><style>body{margin:0;background:#f3f9fd;color:#09213a;font:16px/1.6 Arial,sans-serif}main{width:min(100% - 40px,720px);margin:10vh auto}h1{font-size:clamp(2.5rem,6vw,4rem);line-height:1.1}nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}a{display:inline-flex;align-items:center;min-height:48px;padding:8px 16px;border-radius:12px;background:#0069ae;color:#fff;font-weight:700}a:focus-visible{outline:3px solid #00548b;outline-offset:5px}</style></head><body><main><p>JETU Admissions</p><h1>${t.missing}</h1><p>${t.missingBody}</p><nav aria-label="${t.language}">${links}</nav></main></body></html>`;
  return new NextResponse(body, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

/** Validate locale routes and refresh signed-in sessions for Server Components. */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const candidate = segments[0] ?? '';
  const isAsset =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/brand/') ||
    pathname === '/opengraph-image' ||
    /\/[^/]+\.[^/]+$/.test(pathname);
  const isAuthCallback =
    pathname === '/auth/callback' || pathname === '/auth/confirm';
  // Static SEO/brand assets skip locale validation and auth refresh entirely.
  if (isAsset) return NextResponse.next();
  if (pathname !== '/' && !isAuthCallback) {
    if (!isLocale(candidate)) return notFoundResponse('ru');
    const isCatalogDetail =
      segments.length === 3 &&
      ((segments[1] === 'universities' &&
        /^[a-z0-9]+(-[a-z0-9]+)*$/.test(segments[2] ?? '')) ||
        (segments[1] === 'programs' &&
          /^[1-9][0-9]*$/.test(segments[2] ?? '')) ||
        (segments[1] === 'opportunities' &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segments[2] ?? '')));
    if (
      !isCatalogDetail &&
      (segments.length > 2 ||
        (segments.length === 2 &&
          !APP_ROUTES.has(segments[1] ?? '') &&
          !isMarketingSlug(segments[1] ?? '')))
    ) {
      return notFoundResponse(candidate);
    }
  }
  const requestHeaders = new Headers(request.headers);
  // Overwrite client-supplied header; never trust it as identity or locale.
  requestHeaders.set('x-jetu-locale', isLocale(candidate) ? candidate : 'ru');
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const env = getPublicEnv();
  if (
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = createRouteSupabaseClient(request, response);
    await supabase.auth.getClaims();
  }
  return response;
}
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
