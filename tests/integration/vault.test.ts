import { beforeEach, describe, expect, it, vi } from 'vitest';
const session = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  download: vi.fn(),
}));
vi.mock('@/lib/supabase/request', () => ({
  createRequestSupabaseClient: async () => ({
    auth: { getUser: session.getUser },
    from: session.from,
    storage: { from: () => ({ download: session.download }) },
  }),
}));
import { authorizedVersion, versionBytes } from '@/server/vault';
import { POST as upload } from '@/app/api/vault/upload/route';
import { GET as file } from '@/app/api/vault/file/route';
const uid = '19190000-0000-4000-8000-000000000001',
  docId = '19190000-0000-4000-8000-000000000002',
  versionId = '19190000-0000-4000-8000-000000000003';
const version = {
  id: versionId,
  document_id: docId,
  extension: 'txt',
  state: 'available',
  object_path: `private/student/${uid}/${docId}/${versionId}/asset.txt`,
  byte_size: 5,
  sha256: 'not the hash',
};
const document = {
  id: docId,
  deleted_at: null,
  archived_at: null,
  expires_at: '2099-01-01T00:00:00Z',
};
function row(data: unknown) {
  const q = {
    select: () => q,
    eq: () => q,
    maybeSingle: async () => ({ data, error: null }),
  };
  return q;
}
beforeEach(() => {
  session.getUser.mockResolvedValue({
    data: { user: { id: uid } },
    error: null,
  });
  session.from.mockReset();
  session.download.mockReset();
});
describe('private file service', () => {
  it('denies anonymous access before any storage request', async () => {
    session.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(authorizedVersion(versionId)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(session.download).not.toHaveBeenCalled();
  });
  it('does not download an inaccessible version', async () => {
    session.from.mockReturnValue(row(null));
    await expect(versionBytes(versionId)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(session.download).not.toHaveBeenCalled();
  });
  it.each(['quarantined', 'rejected', 'uploading', 'failed'])(
    'denies %s before provider access',
    async (state) => {
      session.from
        .mockReturnValueOnce(row({ ...version, state }))
        .mockReturnValueOnce(row(document));
      await expect(versionBytes(versionId)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      expect(session.download).not.toHaveBeenCalled();
    },
  );
  it.each([
    { deleted_at: '2026-01-01' },
    { archived_at: '2026-01-01' },
    { expires_at: '2000-01-01' },
  ])('denies expired/deleted/archived documents %#', async (patch) => {
    session.from
      .mockReturnValueOnce(row(version))
      .mockReturnValueOnce(row({ ...document, ...patch }));
    await expect(versionBytes(versionId)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(session.download).not.toHaveBeenCalled();
  });
  it('rejects a forged object path even if metadata is returned', async () => {
    session.from
      .mockReturnValueOnce(
        row({ ...version, object_path: 'other-owner/file.txt' }),
      )
      .mockReturnValueOnce(row(document));
    await expect(versionBytes(versionId)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(session.download).not.toHaveBeenCalled();
  });
  it('does not return bytes after an integrity mismatch', async () => {
    session.from
      .mockReturnValueOnce(row(version))
      .mockReturnValueOnce(row(document));
    session.download.mockResolvedValue({
      data: new Blob(['wrong']),
      error: null,
    });
    await expect(versionBytes(versionId)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
  it('rejects arbitrary path/bucket entitlement with private error responses', async () => {
    const response = await file(
      new Request(
        `https://example.invalid/api/vault/file?version=${versionId}&path=other`,
      ),
    );
    expect(response.status).toBe(422);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(session.from).not.toHaveBeenCalled();
  });
  it('rejects cross-origin upload before body/auth', async () => {
    const response = await upload(
      new Request('https://example.invalid/api/vault/upload', {
        method: 'POST',
        headers: { origin: 'https://evil.invalid', host: 'example.invalid' },
        body: 'x',
      }),
    );
    expect(response.status).toBe(403);
  });
});
