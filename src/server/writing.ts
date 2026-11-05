import 'server-only';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { EnvironmentError } from '@/lib/env/public';
import { errorResponse } from '@/server/http';
import type { ErrorCode } from '@/domain/result';
export class WritingError extends Error {
  constructor(public code: ErrorCode) {
    super(code);
  }
}
export async function writingSession() {
  const client = await createRequestSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new WritingError('UNAUTHENTICATED');
  return { client, user: data.user };
}
export function checked<T>(result: {
  data: T;
  error: { code?: string } | null;
}): T {
  if (result.error) {
    const code = result.error.code;
    throw new WritingError(
      code === '42501'
        ? 'FORBIDDEN'
        : code === '40001' || code === '23505'
          ? 'CONFLICT'
          : code === 'P0001'
            ? 'RATE_LIMITED'
            : ['23514', '23503', '22001', '22P02'].includes(code ?? '')
              ? 'VALIDATION_FAILED'
              : 'INTERNAL_ERROR',
    );
  }
  return result.data;
}
export function writingFailure(error: unknown) {
  return errorResponse(
    error instanceof WritingError
      ? error.code
      : error instanceof EnvironmentError
        ? 'PROVIDER_NOT_CONFIGURED'
        : 'INTERNAL_ERROR',
  );
}
export function sameOrigin(request: Request) {
  try {
    const raw = request.headers.get('origin');
    if (!raw) return false;
    const origin = new URL(raw),
      requestUrl = new URL(request.url);
    // Next may normalize the internal URL hostname. Host is the browser-facing
    // authority; retain an exact protocol check and never trust forwarded headers.
    return (
      raw === origin.origin &&
      origin.host === request.headers.get('host') &&
      origin.protocol === requestUrl.protocol
    );
  } catch {
    return false;
  }
}
/** Read bytes incrementally; forged/missing Content-Length cannot allocate unbounded input. */
export async function boundedJson(
  request: Request,
  max = 180000,
): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new WritingError('VALIDATION_FAILED');
  if (Number(request.headers.get('content-length') ?? 0) > max)
    throw new WritingError('VALIDATION_FAILED');
  const reader = request.body?.getReader();
  if (!reader) throw new WritingError('VALIDATION_FAILED');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new WritingError('VALIDATION_FAILED');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let pos = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, pos);
      pos += chunk.length;
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof WritingError) throw error;
    throw new WritingError('VALIDATION_FAILED');
  } finally {
    reader.releaseLock();
  }
}
