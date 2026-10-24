import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listSchools, schoolPage } from '@/features/schools/server';
import { opportunityRest } from '@/features/opportunities/server';

vi.mock('@/features/opportunities/server', () => ({
  opportunityRest: vi.fn(),
}));
const request = vi.mocked(opportunityRest);

beforeEach(() => request.mockReset());

describe('public school directory', () => {
  it('rejects unbounded page numbers', () => {
    expect(schoolPage.safeParse('201').success).toBe(false);
    expect(schoolPage.safeParse('2').data).toBe(2);
  });

  it('paginates and excludes university and stale source records', async () => {
    const profiles = Array.from({ length: 13 }, (_, index) => ({
      institution_id: index + 1,
      school_kind: 'high_school',
      partnership_state: index === 0 ? 'verified_partner' : 'none',
      source_claim_id: index + 1,
    }));
    request.mockImplementation(async (path) => {
      if (!path) return [] as never;
      if (path.startsWith('institution_school_profiles?'))
        return profiles as never;
      if (path.startsWith('institutions?'))
        return profiles.slice(0, 12).map((item) => ({
          id: item.institution_id,
          legal_name: `School ${item.institution_id}`,
          institution_type: item.institution_id === 2 ? 'university' : 'school',
          website_url: null,
        })) as never;
      if (path.startsWith('source_claims?'))
        return profiles.slice(0, 12).map((item) => ({
          id: item.source_claim_id,
          source_id: item.source_claim_id,
          observed_at: new Date().toISOString(),
        })) as never;
      return profiles.slice(0, 12).map((item) => ({
        id: item.source_claim_id,
        canonical_url: 'https://school.example',
        last_checked_at:
          item.source_claim_id === 3
            ? '2020-01-01T00:00:00Z'
            : new Date().toISOString(),
      })) as never;
    });
    const result = await listSchools(2);
    expect(result.hasNext).toBe(true);
    expect(result.schools).toHaveLength(10);
    expect(result.schools[0]?.verifiedPartner).toBe(true);
    expect(request.mock.calls[0]?.[0]).toContain('limit=13&offset=12');
  });
});
