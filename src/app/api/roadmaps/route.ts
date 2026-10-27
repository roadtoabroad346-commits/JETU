import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import {
  generateAndPersistRoadmap,
  loadRoadmapState,
  RoadmapUnavailable,
  RoadmapConflict,
  RoadmapValidationError,
} from '@/features/roadmap/service';
import {
  generateRoadmapSchema,
  hasSameOrigin,
  readBoundedJson,
} from '@/features/roadmap/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    return successResponse(await loadRoadmapState(client, data.user.id));
  } catch {
    return errorResponse('INTERNAL_ERROR');
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = generateRoadmapSchema.safeParse(body.value);
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
      await generateAndPersistRoadmap(client, data.user.id, parsed.data),
    );
  } catch (error) {
    if (error instanceof RoadmapConflict) return errorResponse('CONFLICT');
    if (error instanceof RoadmapValidationError)
      return errorResponse('VALIDATION_FAILED');
    if (error instanceof RoadmapUnavailable)
      return errorResponse('INTERNAL_ERROR');
    return errorResponse('INTERNAL_ERROR');
  }
}
