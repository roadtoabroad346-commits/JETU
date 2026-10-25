import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getProgramComparison,
  parseCompareIds,
  parseSearchFilters,
  searchUnified,
  type UnifiedSearchRow,
} from '@/features/search/server';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_test_fixture_1234567890',
  );
});

const row = {
  entity_type: 'program',
  entity_id: 17,
  slug: 'computer-science',
  title: 'Computer Science',
  subtitle: 'Verified University',
  country_code: 'KZ',
  degree_level: 'bachelor',
  category: 'Computer Science',
  delivery_format: 'on_campus',
  cost_state: 'published',
  cost_amount_min: 12000,
  cost_amount_max: null,
  cost_currency: 'USD',
  cost_period: 'academic_year',
  deadline_at: null,
  funding_label: null,
  has_funding: false,
  source_url: 'https://university.example/program',
  source_checked_at: '2026-10-01T00:00:00Z',
  source_freshness: 'current',
  eligibility_state: 'not_evaluated',
  detail_path: '/programs/17',
  relevance: 10,
  total_count: 1,
  type_counts: { program: 1, scholarship: 0, opportunity: 0 },
} satisfies UnifiedSearchRow;

describe('unified search URL and transport contract', () => {
  it('accepts international text and rejects invalid bounded parameters', () => {
    expect(parseSearchFilters({ q: 'Әл-Фараби École Москва' }).success).toBe(
      true,
    );
    expect(parseSearchFilters({ country: 'Kazakhstan' }).success).toBe(false);
    expect(parseSearchFilters({ page: '242' }).success).toBe(false);
    expect(parseSearchFilters({ type: 'private' }).success).toBe(false);
    expect(parseSearchFilters({ deadline: '2026-02-31' }).success).toBe(false);
  });

  it('requires two to four unique positive comparison IDs', () => {
    expect(parseCompareIds('2,7,11')).toEqual([2, 7, 11]);
    expect(parseCompareIds('2,2')).toBeNull();
    expect(parseCompareIds('1,2,3,4,5')).toBeNull();
    expect(parseCompareIds('1,drop table')).toBeNull();
    expect(parseCompareIds(undefined)).toEqual([]);
  });

  it('sends an allowlisted, bounded page to the RLS-preserving RPC', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json([row]));
    const parsed = parseSearchFilters({
      q: 'Компьютер',
      type: 'program',
      country: 'kz',
      sort: 'deadline',
      page: '3',
      compare: '17,18',
    });
    if (!parsed.success) throw new Error('fixture invalid');
    expect(await searchUnified(parsed.data)).toEqual([row]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(
      'http://127.0.0.1:54321/rest/v1/rpc/unified_catalog_search',
    );
    const body = JSON.parse(String(init?.body));
    expect(body.p_filters).toMatchObject({
      q: 'Компьютер',
      type: 'program',
      country: 'KZ',
      sort: 'deadline',
      limit: 20,
      offset: 40,
    });
    expect(body.p_filters).not.toHaveProperty('compare');
    expect(init?.cache).toBe('no-store');
    expect(JSON.stringify(init)).not.toContain('service_role');
  });

  it('builds sparse comparison data with fixed batched reads', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/rpc/unified_catalog_search'))
          return Response.json([row]);
        if (url.includes('/degree_program_languages'))
          return Response.json([{ program_id: 17, language_code: 'en' }]);
        if (url.includes('/degree_program_delivery_modes'))
          return Response.json([
            { program_id: 17, delivery_mode_code: 'on_campus' },
          ]);
        if (url.includes('/program_eligibility_requirements'))
          return Response.json([
            { program_id: 17, eligibility_requirement_id: 91 },
          ]);
        if (url.includes('/eligibility_requirements'))
          return Response.json([
            {
              id: 91,
              title: 'Prior study',
              description: 'Published requirement',
              is_mandatory: true,
            },
          ]);
        return new Response('{}', { status: 404 });
      });
    const result = await getProgramComparison([17, 18]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      languages: ['en'],
      formats: ['on_campus'],
      eligibility_state: 'not_evaluated',
      requirements: [{ title: 'Prior study', isMandatory: true }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
