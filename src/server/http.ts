import 'server-only';
import { errorStatus, type ErrorCode, type Result } from '@/domain/result';

const messages: Record<ErrorCode, string> = {
  UNAUTHENTICATED: 'Authentication is required.',
  FORBIDDEN: 'Access is not permitted.',
  NOT_FOUND: 'The resource was not found.',
  VALIDATION_FAILED: 'Check the submitted fields.',
  CONFLICT: 'The resource changed. Reload and try again.',
  RATE_LIMITED: 'Too many requests. Try again later.',
  PROVIDER_NOT_CONFIGURED: 'This service is not configured.',
  PROVIDER_TIMEOUT: 'The service did not respond in time.',
  INTERNAL_ERROR: 'The request could not be completed.',
};

function headers(requestId: string) {
  return { 'Cache-Control': 'no-store', 'X-Request-ID': requestId };
}
export function successResponse<T>(data: T) {
  const requestId = crypto.randomUUID();
  return Response.json({ data, requestId } satisfies Result<T>, {
    headers: headers(requestId),
  });
}
export function errorResponse(
  code: ErrorCode,
  fieldErrors?: Record<string, string[]>,
) {
  const requestId = crypto.randomUUID();
  return Response.json(
    {
      error: {
        code,
        message: messages[code],
        requestId,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    } satisfies Result<never>,
    {
      status: errorStatus[code],
      headers: headers(requestId),
    },
  );
}
