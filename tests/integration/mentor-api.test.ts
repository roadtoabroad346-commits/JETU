import { describe, it, expect, vi, beforeEach } from 'vitest';
const rpc = vi.fn();
const from = vi.fn();
vi.mock('@/lib/supabase/request', () => ({
  createRequestSupabaseClient: async () => ({ rpc }),
}));
vi.mock('@/server/writing', async () => {
  const actual =
    await vi.importActual<typeof import('@/server/writing')>(
      '@/server/writing',
    );
  return {
    ...actual,
    writingSession: vi.fn(async () => ({
      client: { rpc, from },
      user: { id: 'fixture' },
    })),
  };
});
import { GET, POST } from '@/app/api/mentors/route';
import { GET as fileGET } from '@/app/api/mentors/file/route';
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => {
    throw new Error('Privileged client must not run before permission checks');
  }),
}));
describe('mentor API guards', () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });
  it('keeps Studio comments scoped to the selected draft in a multi-item request', async () => {
    const grants = [
      { id: 'selected-grant', request_id: 'request', version_id: 'v1' },
    ];
    const comments = [
      { id: 'own', grant_id: 'selected-grant', body: 'Selected draft comment' },
      {
        id: 'other',
        grant_id: 'other-grant',
        body: 'Different private draft comment',
      },
      { id: 'general', grant_id: null, body: 'Request-wide clarification' },
    ];
    from.mockImplementation((table: string) => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data:
            table === 'mentor_resource_grants'
              ? grants
              : table === 'mentor_comments'
                ? comments
                : [],
          error: null,
        }),
      };
      return builder;
    });
    const response = await GET(
      new Request(
        'https://jetu.test/api/mentors?writing=22000000-0000-4000-8000-000000000001',
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(
      body.data.comments.map((comment: { id: string }) => comment.id),
    ).toEqual(['own', 'general']);
    expect(body.data.grants).toEqual(grants);
  });
  it('rejects cross-origin mutations before opening a session', async () => {
    expect(
      (
        await POST(
          new Request('https://jetu.test/api/mentors', {
            method: 'POST',
            headers: {
              origin: 'https://evil.test',
              host: 'jetu.test',
              'content-type': 'application/json',
            },
            body: '{}',
          }),
        )
      ).status,
    ).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects actor injection and unknown operations', async () => {
    expect(
      (
        await POST(
          new Request('https://jetu.test/api/mentors', {
            method: 'POST',
            headers: {
              origin: 'https://jetu.test',
              host: 'jetu.test',
              'content-type': 'application/json',
            },
            body: JSON.stringify({ op: 'grant_admin', user: 'fixture' }),
          }),
        )
      ).status,
    ).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('does not return a Storage path from the resource API', async () => {
    rpc.mockResolvedValue({
      data: { type: 'vault', path: 'private/opaque/path', mime: 'text/plain' },
      error: null,
    });
    const response = await GET(
      new Request(
        'https://jetu.test/api/mentors?grant=22000000-0000-4000-8000-000000000001',
      ),
    );
    const body = await response.text();
    expect(body).not.toContain('private/opaque/path');
    expect(body).toContain('/api/mentors/file?grant=');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('denies a revoked resource before any privileged Storage read', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    const response = await fileGET(
      new Request(
        'https://jetu.test/api/mentors/file?grant=22000000-0000-4000-8000-000000000001',
      ),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('invalid IDs do not query the database', async () => {
    expect(
      (
        await fileGET(
          new Request('https://jetu.test/api/mentors/file?grant=guessed-path'),
        )
      ).status,
    ).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });
});
