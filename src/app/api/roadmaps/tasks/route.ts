import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import {
  createTaskSchema,
  hasSameOrigin,
  readBoundedJson,
} from '@/features/roadmap/http';
import {
  createManualTask,
  RoadmapNotFound,
  RoadmapUnavailable,
} from '@/features/roadmap/service';

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = createTaskSchema.safeParse(body.value);
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
      await createManualTask(client, data.user.id, parsed.data),
    );
  } catch (error) {
    if (error instanceof RoadmapNotFound) return errorResponse('NOT_FOUND');
    if (error instanceof RoadmapUnavailable)
      return errorResponse('INTERNAL_ERROR');
    return errorResponse('INTERNAL_ERROR');
  }
}
