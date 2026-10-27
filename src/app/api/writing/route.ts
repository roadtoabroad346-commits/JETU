import { hasSameOrigin, readBoundedJson } from '@/features/roadmap/http';
import { writingSaveSchema } from '@/features/writing/contracts';
import { uuidSchema } from '@/features/vault/contracts';
import {
  readPages,
  command,
  checked,
  vaultFailure,
  vaultSession,
} from '@/server/vault';
import { errorResponse, successResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('draft');
  if (raw && !uuidSchema.safeParse(raw).success)
    return errorResponse('VALIDATION_FAILED');
  try {
    const { client, user } = await vaultSession();
    if (raw)
      return successResponse({
        versions: await readPages(
          (first, last) =>
            client
              .from('writing_versions')
              .select('*')
              .eq('draft_id', raw)
              .eq('user_id', user.id)
              .order('version', { ascending: false })
              .range(first, last),
          200,
        ),
      });
    const [drafts, apps] = await Promise.all([
      client
        .from('writing_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100),
      client
        .from('applications')
        .select('id,program_title_snapshot')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .limit(100),
    ]);
    return successResponse({
      drafts: checked(drafts),
      applications: checked(apps),
    });
  } catch (error) {
    return vaultFailure(error);
  }
}
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request, 120000),
    parsed = writingSaveSchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const { client } = await vaultSession(),
      v = parsed.data;
    const draft = checked(
      await command(client, 'writing_save', {
        p_id: v.id,
        p_expected_version: v.version,
        p_title: v.title,
        p_kind: v.kind,
        p_content: v.content,
        p_prompt: v.prompt,
        p_word_limit: v.wordLimit,
        p_rubric: v.rubric,
        p_application_id: v.applicationId,
        p_request_id: v.requestId,
      }),
    );
    return successResponse({ draft });
  } catch (error) {
    return vaultFailure(error);
  }
}
export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request);
  const parsed = writingSaveSchema
    .pick({ id: true, version: true })
    .strict()
    .safeParse(body.ok ? body.value : null);
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const { client } = await vaultSession();
    checked(
      await command(client, 'writing_delete', {
        p_id: parsed.data.id,
        p_expected_version: parsed.data.version,
      }),
    );
    return successResponse({ deleted: true });
  } catch (error) {
    return vaultFailure(error);
  }
}
