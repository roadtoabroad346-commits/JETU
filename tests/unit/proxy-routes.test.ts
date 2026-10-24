import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

afterEach(() => vi.unstubAllEnvs());

describe('nested route allowlist', () => {
  it('reaches opportunity detail and the owner workspace', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    for (const path of [
      '/en/opportunities/blue-planet-awareness-contest-2027',
      '/en/dashboard/opportunities',
    ]) {
      const response = await proxy(new NextRequest(`http://localhost${path}`));
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    }
  });

  it('rejects unknown nested routes before application rendering', async () => {
    const response = await proxy(
      new NextRequest('http://localhost/en/dashboard/unknown'),
    );
    expect(response.status).toBe(404);
  });
});
