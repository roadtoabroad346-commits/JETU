import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';
import { errorResponse } from '@/server/http';
import { errorStatus } from '@/domain/result';

describe('HTTP result contracts', () => {
  it('returns liveness only with a server-issued request ID and no caching', async () => {
    const response = GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: { status: 'ok' },
      requestId: expect.any(String),
    });
    expect(response.headers.get('x-request-id')).toBe(body.requestId);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(GET().headers.get('x-request-id')).not.toBe(body.requestId);
  });
  it.each(Object.entries(errorStatus))(
    'maps %s to %s without success data or internal exceptions',
    async (code, status) => {
      const response = errorResponse(code as keyof typeof errorStatus);
      const body = await response.json();
      expect(response.status).toBe(status);
      expect(body.data).toBeUndefined();
      expect(body.error.code).toBe(code);
      expect(body.error.requestId).toBe(response.headers.get('x-request-id'));
      expect(JSON.stringify(body)).not.toMatch(/stack|postgres|password/i);
    },
  );
});
