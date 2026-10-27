import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

const mocks = vi.hoisted(() => ({ admin: vi.fn(), state: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: mocks.admin,
}));
vi.mock('@/features/matching/service', () => ({
  loadMatchingState: mocks.state,
  loadCandidatesWithin: vi.fn(),
  MatchingUnavailable: class extends Error {},
}));
import { generateAndPersistRoadmap } from '@/features/roadmap/service';

const input = {
  locale: 'en' as const,
  cycleYear: 2027,
  timezone: 'Asia/Almaty',
  availabilityMinutesPerWeek: 300,
  targetIds: [],
};
const userId = '17170000-0000-4000-8000-000000000001';
function client(identity: string | null, error: unknown = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: identity ? { id: identity } : null },
        error,
      }),
    },
    rpc: vi.fn(),
  } as unknown as SupabaseClient<Database>;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.mockResolvedValue({ profileVersion: null, profile: {} });
});
describe('roadmap trusted generation boundary (mocked provider)', () => {
  it.each([null, 'another-owner'])(
    'rejects missing or mismatched identity %s before privileged work',
    async (identity) => {
      await expect(
        generateAndPersistRoadmap(client(identity), userId, input),
      ).rejects.toThrow('Authenticated owner required');
      expect(mocks.state).not.toHaveBeenCalled();
      expect(mocks.admin).not.toHaveBeenCalled();
    },
  );
  it('rejects provider identity errors even when a user object exists', async () => {
    await expect(
      generateAndPersistRoadmap(
        client(userId, new Error('expired')),
        userId,
        input,
      ),
    ).rejects.toThrow();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('uses only the trusted client for generated text and derives the owner from validated Auth', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: { unchanged: false }, error: null });
    mocks.admin.mockReturnValue({ rpc });
    const requestClient = client(userId);
    await expect(
      generateAndPersistRoadmap(requestClient, userId, input),
    ).resolves.toEqual({ unchanged: false });
    expect(requestClient.rpc).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      'roadmap_apply_generation',
      expect.objectContaining({
        p_user_id: userId,
        p_targets: [],
        p_tasks: expect.any(Array),
      }),
    );
  });
  it('reports failed privileged persistence rather than false success', async () => {
    mocks.admin.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'migration unavailable' },
      }),
    });
    await expect(
      generateAndPersistRoadmap(client(userId), userId, input),
    ).rejects.toThrow('migration unavailable');
  });
});
