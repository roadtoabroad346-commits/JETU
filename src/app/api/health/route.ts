import { successResponse } from '@/server/http';

export const dynamic = 'force-dynamic';

/** Process liveness only. Does not establish database or provider readiness. */
export function GET() {
  return successResponse({ status: 'ok' as const });
}
