import { uuidSchema } from '@/features/vault/contracts';
import { privateHeaders, versionBytes, vaultFailure } from '@/server/vault';
import { errorResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const url = new URL(request.url),
    id = uuidSchema.safeParse(url.searchParams.get('version'));
  if (
    !id.success ||
    [...url.searchParams.keys()].some(
      (k) => !['version', 'preview'].includes(k),
    )
  )
    return errorResponse('VALIDATION_FAILED');
  try {
    const { bytes, version } = await versionBytes(id.data);
    // Preview is escaped text only. PDFs/images are originals downloaded as attachments.
    if (url.searchParams.get('preview') === '1' && version.extension !== 'txt')
      return errorResponse('FORBIDDEN');
    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        ...privateHeaders,
        'Content-Type': version.mime,
        'Content-Disposition': `${url.searchParams.get('preview') === '1' ? 'inline' : 'attachment'}; filename="document-${version.sequence}.${version.extension}"`,
      },
    });
  } catch (error) {
    return vaultFailure(error);
  }
}
