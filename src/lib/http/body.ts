export class BodyLimitError extends Error {}
/** Stop reading before an untrusted body can grow without bound. */
export async function boundedBytes(request: Request, max: number) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > max))
    throw new BodyLimitError('size');
  const reader = request.body?.getReader();
  if (!reader) throw new BodyLimitError('empty');
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    void reader.cancel();
  }, 15000);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (timedOut) throw new BodyLimitError('timeout');
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new BodyLimitError('size');
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(deadline);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
