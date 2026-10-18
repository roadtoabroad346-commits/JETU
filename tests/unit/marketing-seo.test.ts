import { afterEach, expect, it, vi } from 'vitest';
import { isIndexableSite } from '../../src/lib/marketing/seo';

afterEach(() => vi.unstubAllEnvs());

it('requires explicit indexing enablement on a nonlocal origin', () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview.jetu.example');
  vi.stubEnv('JETU_PUBLIC_INDEXING', 'false');
  expect(isIndexableSite()).toBe(false);

  vi.stubEnv('JETU_PUBLIC_INDEXING', 'true');
  expect(isIndexableSite()).toBe(true);

  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  expect(isIndexableSite()).toBe(false);
});
