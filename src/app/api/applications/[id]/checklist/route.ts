import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import { hasSameOrigin, readBoundedJson } from '@/features/roadmap/http';
import { checklistChangeSchema, isUuid } from '@/features/applications/http';
import { applicationErrorResponse } from '@/server/application-errors';
import {
  changeChecklistItem,
  loadApplicationWorkspace,
} from '@/features/applications/service';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const { id } = await context.params;
  if (!isUuid(id)) return errorResponse('NOT_FOUND');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = checklistChangeSchema.safeParse(body.value);
  if (!parsed.success)
    return errorResponse(
      'VALIDATION_FAILED',
      parsed.error.flatten().fieldErrors,
    );
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    await changeChecklistItem(client, { applicationId: id, ...parsed.data });
    return successResponse(
      await loadApplicationWorkspace(client, data.user.id, id),
    );
  } catch (error) {
    return applicationErrorResponse(error);
  }
}
