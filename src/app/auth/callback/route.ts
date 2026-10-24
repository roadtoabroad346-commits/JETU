import { NextResponse, type NextRequest } from 'next/server';
import {
  localeFromDestination,
  safeAuthDestination,
} from '@/lib/auth/redirect';
import { createRouteSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const requested = request.nextUrl.searchParams.get('next');
  const locale = localeFromDestination(requested);
  const destination = safeAuthDestination(requested, `/${locale}/dashboard`);
  const response = NextResponse.redirect(new URL(destination, request.url));
  if (code) {
    const supabase = createRouteSupabaseClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }
  return NextResponse.redirect(
    new URL(`/${locale}/login?error=callback`, request.url),
  );
}
