import { uuidSchema } from '@/features/vault/contracts';
import {
  checked,
  privateHeaders,
  versionBytes,
  vaultFailure,
  vaultSession,
  VaultError,
} from '@/server/vault';
import { zipExport } from '@/features/vault/zip';
import { errorResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const id = uuidSchema.safeParse(
    new URL(request.url).searchParams.get('application'),
  );
  if (!id.success) return errorResponse('VALIDATION_FAILED');
  try {
    const { client, user } = await vaultSession();
    if (
      !checked(
        await client
          .from('applications')
          .select('id')
          .eq('id', id.data)
          .eq('user_id', user.id)
          .is('archived_at', null)
          .maybeSingle(),
      )
    )
      throw new VaultError('NOT_FOUND');
    const links =
      checked(
        await client
          .from('vault_links')
          .select('version_id')
          .eq('application_id', id.data)
          .eq('user_id', user.id)
          .limit(21),
      ) ?? [];
    if (!links.length || links.length > 20)
      throw new VaultError('VALIDATION_FAILED');
    const entries = [];
    let total = 0;
    for (const link of links) {
      const { doc, version, bytes } = await versionBytes(link.version_id);
      if (doc.sensitivity === 'confidential') throw new VaultError('FORBIDDEN');
      total += bytes.length;
      if (total > 20 * 1024 * 1024) throw new VaultError('VALIDATION_FAILED');
      entries.push({
        name: `${doc.id}-v${version.sequence}.${version.extension}`,
        bytes,
      });
    }
    // Association/revocation is rechecked after all downloads.
    const current =
      checked(
        await client
          .from('vault_links')
          .select('version_id')
          .eq('application_id', id.data)
          .eq('user_id', user.id)
          .limit(21),
      ) ?? [];
    if (
      JSON.stringify(current.map((v) => v.version_id).sort()) !==
      JSON.stringify(links.map((v) => v.version_id).sort())
    )
      throw new VaultError('CONFLICT');
    for (const link of links) {
      const { authorizedVersion } = await import('@/server/vault');
      await authorizedVersion(link.version_id);
    }
    const bytes = zipExport(entries);
    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        ...privateHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition':
          'attachment; filename="application-documents.zip"',
      },
    });
  } catch (error) {
    return vaultFailure(error);
  }
}
