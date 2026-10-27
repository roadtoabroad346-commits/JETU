export class RequestFailure extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export async function requestData<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload.data)
    throw new RequestFailure(payload.error?.code ?? 'INTERNAL_ERROR');
  return payload.data as T;
}
export function jsonCommand<T>(url: string, body: unknown) {
  return requestData<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
