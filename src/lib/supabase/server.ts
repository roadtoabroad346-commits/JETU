import 'server-only';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseConfig } from '@/lib/env/public';
import type { Database } from './database.types';

/** New instance per request. The adapter MUST persist cookie writes AND cache headers. */
export function createServerSupabaseClient(cookies: CookieMethodsServer) {
  const { url, key } = requireSupabaseConfig();
  if (!cookies.setAll)
    throw new Error('A writable SSR cookie adapter is required.');
  return createServerClient<Database>(url, key, { cookies });
}

/** For future route/proxy session handling; return this same response after any refresh. */
export function createRouteSupabaseClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerSupabaseClient({
    getAll: () => request.cookies.getAll(),
    setAll(cookiesToSet, cacheHeaders) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set(name, value);
        response.cookies.set(name, value, options);
      });
      Object.entries(cacheHeaders).forEach(([name, value]) =>
        response.headers.set(name, value),
      );
    },
  });
}
