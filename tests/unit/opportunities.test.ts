import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OpportunityUnavailable,
  parseOpportunityFilters,
  searchOpportunities,
} from '@/features/opportunities/server';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_test_fixture_1234567890',
  );
});
describe('opportunity search transport and URL contract', () => {
  it('rejects inappropriate or unbounded age, grade and page values', () => {
    for (const input of [
      { age: '4' },
      { age: '36' },
      { grade: '0' },
      { grade: '14' },
      { page: '0' },
      { page: '201' },
      { kind: 'degree_program' },
      { q: 'a'.repeat(81) },
    ])
      expect(parseOpportunityFilters(input).success).toBe(false);
  });
  it('sends bounded filters to the invoker RPC with no privileged token', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('[]', { status: 200 }));
    const parsed = parseOpportunityFilters({
      age: '16',
      grade: '10',
      kind: 'hackathon',
      page: '2',
    });
    if (!parsed.success) throw new Error('Invalid fixture');
    expect(await searchOpportunities(parsed.data)).toEqual([]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(
      'http://127.0.0.1:54321/rest/v1/rpc/opportunity_search',
    );
    expect(init?.cache).toBe('no-store');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body)).p_filters).toMatchObject({
      age: 16,
      grade: 10,
      type: 'hackathon',
      offset: 12,
      limit: 12,
    });
    expect(
      (init?.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });
  it('fails closed on denied network requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 403 }),
    );
    const parsed = parseOpportunityFilters({});
    if (!parsed.success) throw new Error('Invalid fixture');
    await expect(searchOpportunities(parsed.data)).rejects.toBeInstanceOf(
      OpportunityUnavailable,
    );
  });
  it('accepts a successful minimal mutation response without a JSON body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 201 }),
    );
    const { opportunityRest } = await import('@/features/opportunities/server');
    await expect(
      opportunityRest(
        'student_opportunity_saves',
        { method: 'POST' },
        'test-token',
      ),
    ).resolves.toBeUndefined();
  });
});
