import { boundedBytes, BodyLimitError } from '@/lib/http/body';
import { hasSameOrigin } from '@/features/roadmap/http';
import { uploadSchema } from '@/features/vault/contracts';
import {
  command,
  checked,
  sha256,
  vaultFailure,
  vaultSession,
  VaultError,
} from '@/server/vault';
import {
  FileValidationError,
  MAX_FILE_BYTES,
  validateFile,
} from '@/features/vault/files';
import { errorResponse, successResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  let metadata: unknown;
  try {
    metadata = JSON.parse(
      decodeURIComponent(request.headers.get('x-vault-metadata') ?? ''),
    );
  } catch {
    return errorResponse('VALIDATION_FAILED');
  }
  const parsed = uploadSchema.safeParse(metadata);
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const { client } = await vaultSession();
    const bytes = await boundedBytes(request, MAX_FILE_BYTES);
    const input = parsed.data,
      file = validateFile(
        bytes,
        input.name,
        request.headers.get('content-type') ?? '',
        input.category,
      );
    const version = checked(
      await command(client, 'vault_reserve', {
        p_document_id: input.documentId,
        p_category: input.category,
        p_name: file.displayName,
        p_purpose: input.purpose,
        p_application_id: input.applicationId,
        p_extension: file.extension,
        p_mime: file.mime,
        p_size: file.size,
        p_sha256: sha256(bytes),
        p_request_id: input.requestId,
        p_recommendation_id: input.recommendationId,
      }),
    );
    if (!version) throw new VaultError('CONFLICT');
    if (input.draftId)
      checked(
        await command(client, 'vault_draft_origin', {
          p_document_id: version.document_id,
          p_draft_id: input.draftId,
        }),
      );
    if (version.state !== 'uploading')
      return successResponse({ id: version.document_id, state: version.state });
    const result = await client.storage
      .from('student-vault')
      .upload(version.object_path, bytes, {
        contentType: file.mime,
        upsert: false,
        cacheControl: '0',
      });
    if (result.error) {
      // A timed-out previous PUT may already have committed. finish checks object existence.
      const recovery = await command(client, 'vault_finish', {
        p_version_id: version.id,
        p_failed: false,
      });
      if (recovery.error) {
        await command(client, 'vault_finish', {
          p_version_id: version.id,
          p_failed: true,
        });
        throw new VaultError('CONFLICT');
      }
    } else
      checked(
        await command(client, 'vault_finish', {
          p_version_id: version.id,
          p_failed: false,
        }),
      );
    return successResponse({ id: version.document_id, state: 'quarantined' });
  } catch (error) {
    if (error instanceof FileValidationError || error instanceof BodyLimitError)
      return errorResponse('VALIDATION_FAILED', { file: [error.message] });
    return vaultFailure(error);
  }
}
