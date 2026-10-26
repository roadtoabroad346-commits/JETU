import { errorResponse } from '@/server/http';
import {
  ApplicationBlocked,
  ApplicationConflict,
  ApplicationNotFound,
  ApplicationUnavailable,
} from '@/features/applications/service';

export function applicationErrorResponse(error: unknown) {
  if (error instanceof ApplicationConflict) return errorResponse('CONFLICT');
  if (error instanceof ApplicationBlocked)
    return errorResponse('CONFLICT', { status: [error.message] });
  if (error instanceof ApplicationNotFound) return errorResponse('NOT_FOUND');
  if (error instanceof ApplicationUnavailable)
    return errorResponse('INTERNAL_ERROR');
  return errorResponse('INTERNAL_ERROR');
}
