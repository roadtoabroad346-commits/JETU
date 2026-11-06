import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/env/public', () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: 'http://localhost:3000' }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createRouteSupabaseClient: vi.fn(),
}));
import { proxy } from '@/proxy';
describe('Phase 23 locale route admission', () => {
  for (const locale of ['ru', 'kk', 'en'])
    for (const path of ['calendar', 'notifications', 'notification-settings']) {
      it(`allows /${locale}/${path} through locale validation`, async () => {
        const response = await proxy(
          new NextRequest(`http://localhost:3000/${locale}/${path}`),
        );
        expect(response.status).toBe(200);
        expect(response.headers.get('x-middleware-next')).toBe('1');
      });
    }
  it('still rejects unsupported routes', async () => {
    expect(
      (await proxy(new NextRequest('http://localhost:3000/en/nonexistent')))
        .status,
    ).toBe(404);
  });
});
