import 'server-only';
import { createHash } from 'node:crypto';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse } from '@/server/http';
import { EnvironmentError } from '@/lib/env/public';
import type { Database } from '@/lib/supabase/database.types';
export type DocumentRow =
  Database['public']['Tables']['vault_documents']['Row'];
export type VersionRow = Database['public']['Tables']['vault_versions']['Row'];
export type DraftRow = Database['public']['Tables']['writing_drafts']['Row'];
export class VaultError extends Error {
  constructor(
    public code:
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'RATE_LIMITED'
      | 'VALIDATION_FAILED'
      | 'UNAUTHENTICATED',
  ) {
    super(code);
  }
}
export async function vaultSession() {
  const client = await createRequestSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new VaultError('UNAUTHENTICATED');
  return { client, user: data.user };
}
export function checked<T>(result: {
  data: T;
  error: { code?: string } | null;
}): T {
  if (result.error) {
    const c = result.error.code;
    throw new VaultError(
      c === '42501'
        ? 'FORBIDDEN'
        : c === '40001' || c === '23505'
          ? 'CONFLICT'
          : c === 'P0001'
            ? 'RATE_LIMITED'
            : c === '23514' || c === '23503' || c === '22001'
              ? 'VALIDATION_FAILED'
              : 'CONFLICT',
    );
  }
  return result.data;
}
export function vaultFailure(error: unknown) {
  if (error instanceof VaultError) return errorResponse(error.code);
  if (error instanceof EnvironmentError)
    return errorResponse('PROVIDER_NOT_CONFIGURED');
  return errorResponse('INTERNAL_ERROR');
}
export function sha256(bytes: Uint8Array | string) {
  return createHash('sha256').update(bytes).digest('hex');
}
export const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; sandbox",
};
export async function authorizedVersion(versionId: string) {
  const { client, user } = await vaultSession();
  const version = checked(
    await client
      .from('vault_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .maybeSingle(),
  );
  if (!version) throw new VaultError('NOT_FOUND');
  const doc = checked(
    await client
      .from('vault_documents')
      .select('*')
      .eq('id', version.document_id)
      .eq('user_id', user.id)
      .maybeSingle(),
  );
  if (
    !doc ||
    doc.deleted_at ||
    doc.archived_at ||
    Date.parse(doc.expires_at) <= Date.now() ||
    version.state !== 'available'
  )
    throw new VaultError('FORBIDDEN');
  const exact = `private/student/${user.id}/${doc.id}/${version.id}/asset.${version.extension}`;
  if (exact !== version.object_path) throw new VaultError('FORBIDDEN');
  return { client, user, version, doc };
}
export async function versionBytes(versionId: string) {
  const ctx = await authorizedVersion(versionId);
  const result = await ctx.client.storage
    .from('student-vault')
    .download(ctx.version.object_path);
  if (
    result.error ||
    !result.data ||
    result.data.size !== ctx.version.byte_size
  )
    throw new VaultError('FORBIDDEN');
  const bytes = new Uint8Array(await result.data.arrayBuffer());
  if (sha256(bytes) !== ctx.version.sha256) throw new VaultError('FORBIDDEN');
  // Recheck deletion/expiry after provider I/O. No reusable storage URL leaves the server.
  await authorizedVersion(versionId);
  return { ...ctx, bytes };
}

/** Supabase's generator omits SQL parameter nullability. Keep the adapter narrow;
 * Zod and SQL constraints remain authoritative; return values stay generated. */
export function command<N extends keyof Database['public']['Functions']>(
  client: Awaited<ReturnType<typeof vaultSession>>['client'],
  name: N,
  args: {
    [K in keyof Database['public']['Functions'][N]['Args']]:
      Database['public']['Functions'][N]['Args'][K] | null;
  },
) {
  return client.rpc(name, args as never);
}

/** Honor provider row caps while keeping every page owner-filtered and bounded. */
export async function readPages<T>(
  page: (
    first: number,
    last: number,
  ) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>,
  max = 2000,
) {
  const rows: T[] = [];
  for (let first = 0; first < max; first += 100) {
    const values =
      checked(await page(first, Math.min(first + 99, max - 1))) ?? [];
    rows.push(...values);
    if (values.length < 100) break;
  }
  return rows;
}
