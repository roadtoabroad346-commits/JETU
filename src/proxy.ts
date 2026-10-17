import { NextResponse, type NextRequest } from 'next/server';
import { isLocale } from '@/lib/i18n/messages';

/** Locale transport only; this does not implement authentication. */
export function proxy(request: NextRequest) {
  const candidate = request.nextUrl.pathname.split('/')[1] ?? '';
  const requestHeaders = new Headers(request.headers);
  // Overwrite client-supplied header; never trust it as identity or locale.
  requestHeaders.set('x-jetu-locale', isLocale(candidate) ? candidate : 'ru');
  return NextResponse.next({ request: { headers: requestHeaders } });
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
