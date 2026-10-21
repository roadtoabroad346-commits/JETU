import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  parseFilters,
  searchCatalog,
  CatalogUnavailable,
} from '@/features/catalog/server';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_test_fixture_1234567890',
  );
});
describe('catalog URL and transport contract (mocked REST, SQL tested separately)', () => {
  it('rejects invalid pagination, cost and currency combinations', () => {
    expect(parseFilters({ page: '0' }).success).toBe(false);
    expect(parseFilters({ maxTuition: '10' }).success).toBe(false);
    expect(parseFilters({ maxTuition: '-2', currency: 'USD' }).success).toBe(
      false,
    );
    expect(parseFilters({ q: 'a'.repeat(81) }).success).toBe(false);
    expect(parseFilters({ level: 'phd' }).success).toBe(false);
  });
  it('sends bounded page state through a public-key RPC with no cache', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('[]', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const parsed = parseFilters({
      q: 'Engineering',
      country: 'KZ',
      level: 'bachelor',
      page: '2',
    });
    if (!parsed.success) throw new Error('fixture invalid');
    expect(await searchCatalog(parsed.data)).toEqual([]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(
      'http://127.0.0.1:54321/rest/v1/rpc/catalog_search',
    );
    expect(init?.cache).toBe('no-store');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body)).p_filters).toMatchObject({
      q: 'Engineering',
      country: 'KZ',
      offset: 12,
      limit: 12,
    });
    expect(JSON.stringify(init)).not.toContain('service_role');
    expect(
      (init?.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });
  it('fails closed on REST failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 403 }),
    );
    const parsed = parseFilters({});
    if (!parsed.success) throw new Error('fixture invalid');
    await expect(searchCatalog(parsed.data)).rejects.toBeInstanceOf(
      CatalogUnavailable,
    );
  });
});
