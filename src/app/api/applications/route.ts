import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import { hasSameOrigin, readBoundedJson } from '@/features/roadmap/http';
import { createApplicationSchema } from '@/features/applications/http';
import { applicationErrorResponse } from '@/server/application-errors';
import {
  createApplication,
  loadApplicationPortfolio,
} from '@/features/applications/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    return successResponse(
      await loadApplicationPortfolio(client, data.user.id),
    );
  } catch (error) {
    return applicationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request);
  if (!body.ok) return errorResponse('VALIDATION_FAILED');
  const parsed = createApplicationSchema.safeParse(body.value);
  if (!parsed.success)
    return errorResponse(
      'VALIDATION_FAILED',
      parsed.error.flatten().fieldErrors,
    );
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    await createApplication(
      client,
      parsed.data.programId,
      parsed.data.intakeId,
      parsed.data.cycleYear,
      parsed.data.idempotencyKey,
    );
    return successResponse(
      await loadApplicationPortfolio(client, data.user.id),
    );
  } catch (error) {
    return applicationErrorResponse(error);
  }
}
