import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { CookieMethodsServer } from '@supabase/ssr';

const factory = vi.hoisted(() => ({
  browser: vi.fn(),
  server: vi.fn(),
  admin: vi.fn(),
}));
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: factory.browser,
  createServerClient: factory.server,
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: factory.admin }));
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import {
  createRouteSupabaseClient,
  createServerSupabaseClient,
} from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_test_fixture_1234567890',
  );
});
describe('SDK adapters (mocked transport; not database integration)', () => {
  it('constructs the browser client with only the public key', () => {
    createBrowserSupabaseClient();
    expect(factory.browser).toHaveBeenCalledWith(
      'http://127.0.0.1:54321',
      'sb_publishable_test_fixture_1234567890',
    );
  });
  it('requires writable cookie handling instead of silently discarding refresh', () => {
    expect(() => createServerSupabaseClient({ getAll: () => [] })).toThrow(
      'writable SSR cookie adapter',
    );
  });
  it('propagates SSR refresh cookies to request and response and preserves all cache headers', async () => {
    const request = new NextRequest('http://localhost/ru');
    const response = NextResponse.next();
    createRouteSupabaseClient(request, response);
    const options = factory.server.mock.calls[0]?.[2] as {
      cookies: CookieMethodsServer;
    };
    expect(options.cookies.getAll()).toEqual([]);
    await options.cookies.setAll?.(
      [
        {
          name: 'test-session',
          value: 'test-token',
          options: { httpOnly: true, sameSite: 'lax' },
        },
      ],
      {
        'Cache-Control':
          'private, no-cache, no-store, must-revalidate, max-age=0',
        Expires: '0',
        Pragma: 'no-cache',
      },
    );
    expect(request.cookies.get('test-session')?.value).toBe('test-token');
    expect(response.cookies.get('test-session')?.httpOnly).toBe(true);
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.get('expires')).toBe('0');
  });
  it('requires a separate admin key and disables session persistence', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    expect(() => createAdminSupabaseClient()).toThrow('SUPABASE_SECRET_KEY');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_only_test_fixture_123456789');
    createAdminSupabaseClient();
    expect(factory.admin).toHaveBeenCalledWith(
      'http://127.0.0.1:54321',
      'sb_secret_only_test_fixture_123456789',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  });
});
