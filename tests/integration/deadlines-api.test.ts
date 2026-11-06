import { beforeEach, describe, expect, it, vi } from 'vitest';
const client = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));
vi.mock('@/lib/supabase/request', () => ({
  createRequestSupabaseClient: async () => client,
}));
import { GET, POST } from '@/app/api/deadlines/route';
import { GET as exportCalendar } from '@/app/api/calendar/export/route';
import { defaultPreferences } from '@/features/deadlines/model';
const req = (body: unknown, origin = 'https://jetu.test') =>
  new Request('https://jetu.test/api/deadlines', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  client.auth.getUser.mockResolvedValue({ data: { user: null } });
  client.from.mockReset();
});
describe('private deadlines API boundaries', () => {
  it('rejects missing and foreign origins before writes', async () => {
    expect(
      (await POST(req({ action: 'read_all' }, 'https://foreign.test'))).status,
    ).toBe(403);
    expect((await POST(req({ action: 'read_all' }, 'null'))).status).toBe(403);
    expect(client.from).not.toHaveBeenCalled();
  });
  it('requires authentication for reads, writes, and exports', async () => {
    expect((await GET()).status).toBe(401);
    expect((await POST(req({ action: 'read_all' }))).status).toBe(401);
    expect(
      (
        await exportCalendar(
          new Request('https://jetu.test/api/calendar/export'),
        )
      ).status,
    ).toBe(401);
  });
  it('rejects forged owner and external-channel settings', async () => {
    expect(
      (
        await POST(
          req({
            action: 'preferences',
            value: { ...defaultPreferences, user_id: 'another-user' },
          }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await POST(
          req({
            action: 'preferences',
            value: { ...defaultPreferences, email: true },
          }),
        )
      ).status,
    ).toBe(422);
  });
  it('validates impossible dates and excessive payloads', async () => {
    expect(
      (
        await POST(
          req({
            action: 'event',
            value: { title: 'Test', due_date: '2026-02-30' },
          }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await POST(
          req({
            action: 'event',
            value: { title: 'x'.repeat(10000), due_date: '2026-11-10' },
          }),
        )
      ).status,
    ).toBe(422);
  });
  it('rejects modifying official events through the custom-event endpoint', async () => {
    expect(
      (
        await POST(
          req({
            action: 'event',
            value: {
              id: 'official:123',
              version: 1,
              title: 'Forged',
              due_date: '2026-11-10',
            },
          }),
        )
      ).status,
    ).toBe(422);
  });
  it('sanitizes backend failures and disables caching', async () => {
    client.auth.getUser.mockRejectedValue(
      new Error('private connection details'),
    );
    const r = await GET();
    expect(r.status).toBe(503);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await r.text()).not.toContain('private connection details');
  });
});
