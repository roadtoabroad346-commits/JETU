import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase/request', () => ({
  createRequestSupabaseClient: mocks.create,
}));
import { GET, POST } from '@/app/api/admin/catalog/route';
import { editorCommandSchema } from '@/features/catalog-editor/contracts';

const command = {
  action: 'publish',
  entityId: 7,
  expectedRevision: 1,
  expectedRecordHash: 'a'.repeat(32),
  note: 'Human source review note',
  attested: true,
};
function request(body: unknown = command, origin = 'https://jetu.example') {
  return new Request('https://jetu.example/api/admin/catalog', {
    method: 'POST',
    headers: {
      origin,
      host: 'jetu.example',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  });
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'reviewer' } },
    error: null,
  });
  mocks.rpc.mockResolvedValue({
    data: { entityId: 7, revision: 2 },
    error: null,
  });
});
describe('catalog editorial API authorization boundaries', () => {
  it('rejects unsafe origin before accessing the backend', async () => {
    expect(
      (await POST(request(command, 'https://untrusted.example'))).status,
    ).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([
    { ...command, attested: false },
    { ...command, note: 'short' },
    { ...command, actorId: 'spoofed-reviewer' },
    { ...command, entityId: -1 },
  ])('rejects unreviewed or spoofed commands', async (body) => {
    expect((await POST(request(body))).status).toBe(422);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('requires verified provider identity before running an RPC', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('uses the user RPC and preserves the database authorization decision', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'private diagnostic' },
    });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.rpc).toHaveBeenCalledWith('catalog_editor_command', {
      p_command: command,
    });
    expect(await response.text()).not.toContain('private diagnostic');
  });
  it.each([
    ['40001', 409],
    ['23514', 422],
    ['P0002', 404],
  ])('maps database conflict %s to HTTP %s', async (code, status) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code } });
    expect((await POST(request())).status).toBe(status);
  });
  it('does not report unsuccessful persistence as a saved review', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'XX000' } });
    expect((await POST(request())).status).toBe(500);
  });
  it('validates pagination before authentication and forbids ordinary student reads', async () => {
    expect(
      (
        await GET(
          new Request('https://jetu.example/api/admin/catalog?before=-1'),
        )
      ).status,
    ).toBe(422);
    expect(mocks.create).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    expect(
      (await GET(new Request('https://jetu.example/api/admin/catalog'))).status,
    ).toBe(403);
  });
  it('requires the reviewed record snapshot for publication', () => {
    expect(
      editorCommandSchema.safeParse({
        ...command,
        expectedRecordHash: undefined,
      }).success,
    ).toBe(false);
  });
});
