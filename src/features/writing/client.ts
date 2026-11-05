import type { Result, ErrorCode } from '@/domain/result';
export class RequestFailure extends Error {
  constructor(public code: ErrorCode) {
    super(code);
  }
}
export async function requestData<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
    });
    const result = (await response.json()) as Result<T>;
    if (!response.ok || result.error)
      throw new RequestFailure(result.error?.code ?? 'INTERNAL_ERROR');
    return result.data as T;
  } finally {
    clearTimeout(timeout);
  }
}
