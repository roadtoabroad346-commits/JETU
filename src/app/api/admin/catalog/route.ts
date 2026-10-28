import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import { hasSameOrigin, readBoundedJson } from '@/features/roadmap/http';
import {
  editorCommandSchema,
  editorCursorSchema,
  editorQueueSchema,
} from '@/features/catalog-editor/contracts';

export const dynamic = 'force-dynamic';

function providerError(code: string | undefined) {
  if (code === '42501') return errorResponse('FORBIDDEN');
  if (code === '40001') return errorResponse('CONFLICT');
  if (code === 'P0002') return errorResponse('NOT_FOUND');
  if (['22023', '22P02', '23514'].includes(code ?? ''))
    return errorResponse('VALIDATION_FAILED');
  return errorResponse('INTERNAL_ERROR');
}

export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get('before');
  const parsed = cursor ? editorCursorSchema.safeParse(cursor) : null;
  if (parsed && !parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const client = await createRequestSupabaseClient();
    const identity = await client.auth.getUser();
    if (identity.error || !identity.data.user)
      return errorResponse('UNAUTHENTICATED');
    const result = await client.rpc('catalog_editor_queue', {
      p_before_id: parsed?.data,
    });
    if (result.error) return providerError(result.error.code);
    return successResponse(editorQueueSchema.parse(result.data));
  } catch {
    return errorResponse('INTERNAL_ERROR');
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = editorCommandSchema.safeParse(body.value);
  if (!parsed.success)
    return errorResponse(
      'VALIDATION_FAILED',
      parsed.error.flatten().fieldErrors,
    );
  try {
    const client = await createRequestSupabaseClient();
    const identity = await client.auth.getUser();
    if (identity.error || !identity.data.user)
      return errorResponse('UNAUTHENTICATED');
    const result = await client.rpc('catalog_editor_command', {
      p_command: parsed.data,
    });
    if (result.error) return providerError(result.error.code);
    return successResponse(result.data);
  } catch {
    return errorResponse('INTERNAL_ERROR');
  }
}
