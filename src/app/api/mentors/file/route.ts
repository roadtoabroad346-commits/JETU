import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  checked,
  writingSession,
  writingFailure,
  WritingError,
} from '@/server/writing';
import { errorResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get('grant'),
    download = params.get('download') === '1';
  if (!z.uuid().safeParse(id).success)
    return errorResponse('VALIDATION_FAILED');
  try {
    const { client } = await writingSession();
    const args = { p_grant: id!, p_operation: download ? 'download' : 'view' };
    const descriptor = checked(await client.rpc('mentor_resource', args));
    if (
      !descriptor ||
      typeof descriptor !== 'object' ||
      Array.isArray(descriptor) ||
      descriptor.type !== 'vault' ||
      typeof descriptor.path !== 'string' ||
      typeof descriptor.mime !== 'string'
    )
      throw new WritingError('FORBIDDEN');
    const object = checked(
      await createAdminSupabaseClient()
        .storage.from('student-vault')
        .download(descriptor.path),
    );
    if (!object || object.size !== descriptor.size || object.size > 3145728)
      throw new WritingError('FORBIDDEN');
    const bytes = await object.arrayBuffer();
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
      (b) => b.toString(16).padStart(2, '0'),
    ).join('');
    if (hash !== descriptor.sha256) throw new WritingError('FORBIDDEN');
    // Recheck after fetching: revocation during download prevents emitting the bytes.
    checked(await client.rpc('mentor_resource', args));
    return new Response(bytes, {
      headers: {
        'Content-Type':
          descriptor.mime === 'text/plain'
            ? 'text/plain; charset=utf-8'
            : descriptor.mime,
        'Content-Length': String(object.size),
        'Content-Disposition': download
          ? 'attachment; filename="review-material"'
          : 'inline; filename="review-material"',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          "sandbox; default-src 'none'; frame-ancestors 'self'",
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    return writingFailure(error);
  }
}
