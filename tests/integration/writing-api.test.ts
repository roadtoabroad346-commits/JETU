import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blank } from '@/features/writing/contracts';
const db = vi.hoisted(() => ({
  create: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock('@/lib/supabase/request', () => ({
  createRequestSupabaseClient: db.create,
}));
import { GET, POST } from '@/app/api/writing/route';
import { boundedJson, sameOrigin } from '@/server/writing';
const payload = () => ({ ...blank('en'), title: 'Private essay' });
function req(value: unknown, origin = 'https://jetu.test') {
  return new Request('https://jetu.test/api/writing', {
    method: 'POST',
    headers: { origin, host: 'jetu.test', 'content-type': 'application/json' },
    body: JSON.stringify(value),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  db.create.mockResolvedValue({
    auth: { getUser: db.getUser },
    from: db.from,
    rpc: db.rpc,
  });
  db.getUser.mockResolvedValue({
    data: { user: { id: 'owner' } },
    error: null,
  });
  const query = { select: db.select, eq: db.eq, maybeSingle: db.maybeSingle };
  db.from.mockReturnValue(query);
  db.select.mockReturnValue(query);
  db.eq.mockReturnValue(query);
  db.maybeSingle.mockResolvedValue({ data: null, error: null });
  db.rpc.mockResolvedValue({ data: { id: 'saved' }, error: null });
});
describe('writing API adapter (not real authorization proof)', () => {
  it('rejects absent, malformed and cross-scheme origins before touching identity', async () => {
    for (const origin of [
      '',
      'nonsense',
      'http://jetu.test',
      'https://evil.test',
    ])
      expect((await POST(req(payload(), origin))).status).toBe(403);
    expect(db.create).not.toHaveBeenCalled();
  });
  it('rejects owner injection and unbounded UTF-8 bodies', async () => {
    expect((await POST(req({ ...payload(), user_id: 'other' }))).status).toBe(
      422,
    );
    expect(
      (await POST(req({ ...payload(), content: 'ә'.repeat(100001) }))).status,
    ).toBe(422);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('requires a real authenticated user on mutation', async () => {
    db.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await POST(req(payload()))).status).toBe(401);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('uses the bounded atomic command and no caller owner ID', async () => {
    const value = payload();
    const response = await POST(req(value));
    expect(response.status).toBe(200);
    expect(db.rpc).toHaveBeenCalledWith('writing_studio_save', {
      p_input: value,
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each([
    ['40001', 409],
    ['42501', 403],
    ['P0001', 429],
    ['23514', 422],
    ['XX000', 500],
  ])('sanitizes SQL error %s', async (code, status) => {
    db.rpc.mockResolvedValue({
      data: null,
      error: { code, message: 'SECRET private draft' },
    });
    const response = await POST(req(payload()));
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain('SECRET');
  });
  it('owner-filters guessed projects and returns 404 without raw content', async () => {
    const id = crypto.randomUUID();
    const response = await GET(
      new Request(`https://jetu.test/api/writing?project=${id}`),
    );
    expect(response.status).toBe(404);
    expect(db.eq).toHaveBeenCalledWith('user_id', 'owner');
  });
  it('validates IDs before database access', async () => {
    expect(
      (await GET(new Request('https://jetu.test/api/writing?project=bad')))
        .status,
    ).toBe(422);
    expect(db.create).not.toHaveBeenCalled();
  });
  it('bounds streams even when Content-Length is absent', async () => {
    await expect(
      boundedJson(
        new Request('https://jetu.test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '"' + 'x'.repeat(200) + '"',
        }),
        100,
      ),
    ).rejects.toThrow('VALIDATION_FAILED');
  });
  it('compares full origins, including ports', () => {
    expect(sameOrigin(req({}, 'https://jetu.test:9000'))).toBe(false);
  });
});

it('accepts Next internal-host normalization without accepting another scheme', () => {
  expect(
    sameOrigin(
      new Request('http://localhost:3100/api/writing', {
        headers: { host: '127.0.0.1:3100', origin: 'http://127.0.0.1:3100' },
      }),
    ),
  ).toBe(true);
  expect(
    sameOrigin(
      new Request('http://localhost:3100/api/writing', {
        headers: { host: '127.0.0.1:3100', origin: 'https://127.0.0.1:3100' },
      }),
    ),
  ).toBe(false);
});
