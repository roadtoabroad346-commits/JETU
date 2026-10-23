import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import {
  localeFromDestination,
  safeAuthDestination,
} from '@/lib/auth/redirect';
import { createRouteSupabaseClient } from '@/lib/supabase/server';

const otpTypes = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const rawType = request.nextUrl.searchParams.get('type');
  const requested = request.nextUrl.searchParams.get('next');
  const locale = localeFromDestination(requested);
  const destination = safeAuthDestination(requested, `/${locale}/dashboard`);
  const response = NextResponse.redirect(new URL(destination, request.url));
  if (tokenHash && rawType && otpTypes.has(rawType as EmailOtpType)) {
    const supabase = createRouteSupabaseClient(request, response);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: rawType as EmailOtpType,
    });
    if (!error) return response;
  }
  return NextResponse.redirect(
    new URL(`/${locale}/login?error=callback`, request.url),
  );
}
