import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  checked,
  writingSession,
  writingFailure,
  sameOrigin,
  boundedJson,
  WritingError,
} from '@/server/writing';
import { successResponse, errorResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
const schema = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('reserve'),
      claim: z.string().trim().min(10).max(1000),
      mime: z.enum(['application/pdf', 'image/png', 'image/jpeg']),
      size: z.number().int().min(1).max(3145728),
    })
    .strict(),
  z.object({ op: z.literal('submit'), id: z.uuid() }).strict(),
]);
export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorResponse('FORBIDDEN');
  try {
    const parsed = schema.safeParse(await boundedJson(request, 5000));
    if (!parsed.success) return errorResponse('VALIDATION_FAILED');
    const { client } = await writingSession();
    return successResponse(
      checked(
        await client.rpc('mentor_command', {
          p_input: {
            ...parsed.data,
            op:
              parsed.data.op === 'reserve'
                ? 'evidence_reserve'
                : 'evidence_submit',
          },
        }),
      ),
    );
  } catch (error) {
    return writingFailure(error);
  }
}
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!z.uuid().safeParse(id).success)
    return errorResponse('VALIDATION_FAILED');
  try {
    const { client } = await writingSession();
    const descriptor = checked(
      await client.rpc('mentor_evidence_access', { p_id: id! }),
    );
    if (
      !descriptor ||
      typeof descriptor !== 'object' ||
      Array.isArray(descriptor) ||
      typeof descriptor.path !== 'string' ||
      typeof descriptor.mime !== 'string'
    )
      throw new WritingError('FORBIDDEN');
    const blob = checked(
      await createAdminSupabaseClient()
        .storage.from('mentor-evidence')
        .download(descriptor.path),
    );
    if (!blob || blob.size !== descriptor.size || blob.size > 3145728)
      throw new WritingError('FORBIDDEN');
    const bytes = await blob.arrayBuffer();
    checked(await client.rpc('mentor_evidence_access', { p_id: id! }));
    return new Response(bytes, {
      headers: {
        'Content-Type': descriptor.mime,
        'Content-Disposition': 'attachment; filename="verification-evidence"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'",
      },
    });
  } catch (error) {
    return writingFailure(error);
  }
}
