import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import { hasSameOrigin, readBoundedJson } from '@/features/roadmap/http';
import { isUuid, updateApplicationSchema } from '@/features/applications/http';
import { applicationErrorResponse } from '@/server/application-errors';
import {
  loadApplicationWorkspace,
  updateApplicationMetadata,
} from '@/features/applications/service';

export const dynamic = 'force-dynamic';

async function identity(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return isUuid(id) ? id : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await identity(context);
  if (!id) return errorResponse('NOT_FOUND');
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    return successResponse(
      await loadApplicationWorkspace(client, data.user.id, id),
    );
  } catch (error) {
    return applicationErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const id = await identity(context);
  if (!id) return errorResponse('NOT_FOUND');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = updateApplicationSchema.safeParse(body.value);
  if (!parsed.success)
    return errorResponse(
      'VALIDATION_FAILED',
      parsed.error.flatten().fieldErrors,
    );
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    await updateApplicationMetadata(client, {
      applicationId: id,
      ...parsed.data,
    });
    return successResponse(
      await loadApplicationWorkspace(client, data.user.id, id),
    );
  } catch (error) {
    return applicationErrorResponse(error);
  }
}
