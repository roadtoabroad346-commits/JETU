import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import {
  deleteTaskSchema,
  hasSameOrigin,
  readBoundedJson,
  updateTaskSchema,
} from '@/features/roadmap/http';
import {
  deleteManualTask,
  RoadmapBlocked,
  RoadmapConflict,
  RoadmapNotFound,
  RoadmapUnavailable,
  RoadmapValidationError,
  updateRoadmapTask,
} from '@/features/roadmap/service';

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const { id } = await context.params;
  if (!validId(id)) return errorResponse('NOT_FOUND');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = updateTaskSchema.safeParse(body.value);
  if (!parsed.success)
    return errorResponse(
      'VALIDATION_FAILED',
      parsed.error.flatten().fieldErrors,
    );
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    return successResponse(
      await updateRoadmapTask(client, data.user.id, id, parsed.data),
    );
  } catch (error) {
    if (error instanceof RoadmapConflict) return errorResponse('CONFLICT');
    if (error instanceof RoadmapBlocked)
      return errorResponse('CONFLICT', { status: [error.message] });
    if (error instanceof RoadmapValidationError)
      return errorResponse('VALIDATION_FAILED');
    if (error instanceof RoadmapNotFound) return errorResponse('NOT_FOUND');
    if (error instanceof RoadmapUnavailable)
      return errorResponse('INTERNAL_ERROR');
    return errorResponse('INTERNAL_ERROR');
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const { id } = await context.params;
  if (!validId(id)) return errorResponse('NOT_FOUND');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = deleteTaskSchema.safeParse(body.value);
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    await deleteManualTask(client, data.user.id, id, parsed.data.version);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof RoadmapConflict) return errorResponse('CONFLICT');
    if (error instanceof RoadmapUnavailable)
      return errorResponse('INTERNAL_ERROR');
    return errorResponse('INTERNAL_ERROR');
  }
}
