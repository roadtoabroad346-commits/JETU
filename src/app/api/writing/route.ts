import { z } from 'zod';
import { writingSaveSchema } from '@/features/writing/contracts';
import {
  boundedJson,
  checked,
  sameOrigin,
  writingFailure,
  writingSession,
} from '@/server/writing';
import { errorResponse, successResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get('draft'),
    project = params.get('project'),
    revision = params.get('version');
  if (project && !z.uuid().safeParse(project).success)
    return errorResponse('VALIDATION_FAILED');
  if (revision && !/^[1-9][0-9]{0,8}$/.test(revision))
    return errorResponse('VALIDATION_FAILED');
  if (id && !z.uuid().safeParse(id).success)
    return errorResponse('VALIDATION_FAILED');
  try {
    const { client, user } = await writingSession();
    if (project) {
      const draft = checked(
        await client
          .from('writing_drafts')
          .select('*')
          .eq('id', project)
          .eq('user_id', user.id)
          .maybeSingle(),
      );
      return draft ? successResponse({ draft }) : errorResponse('NOT_FOUND');
    }
    if (id) {
      const draft = checked(
        await client
          .from('writing_drafts')
          .select('id')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle(),
      );
      if (!draft) return errorResponse('NOT_FOUND');
      if (revision) {
        const value = checked(
          await client
            .from('writing_versions')
            .select('id,version,created_at,snapshot')
            .eq('draft_id', id)
            .eq('user_id', user.id)
            .eq('version', Number(revision))
            .maybeSingle(),
        );
        return value
          ? successResponse({ version: value })
          : errorResponse('NOT_FOUND');
      }
      return successResponse({
        versions: checked(
          await client
            .from('writing_versions')
            .select('id,version,created_at')
            .eq('draft_id', id)
            .eq('user_id', user.id)
            .order('version', { ascending: false })
            .limit(200),
        ),
      });
    }
    const [drafts, apps, prompts] = await Promise.all([
      client
        .from('writing_drafts')
        .select('id,title,kind,studio,version,updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100),
      client
        .from('applications')
        .select('id,program_title_snapshot')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .limit(100),
      client.from('writing_prompts').select('*').limit(50),
    ]);
    return successResponse({
      drafts: checked(drafts),
      applications: checked(apps),
      prompts: checked(prompts),
      aiAvailable: false,
    });
  } catch (error) {
    return writingFailure(error);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorResponse('FORBIDDEN');
  try {
    const body = await boundedJson(request);
    const parsed = writingSaveSchema.safeParse(body);
    if (!parsed.success) return errorResponse('VALIDATION_FAILED');
    const { client } = await writingSession();
    const result = await client.rpc('writing_studio_save', {
      p_input: JSON.parse(JSON.stringify(parsed.data)),
    });
    return successResponse({ draft: checked(result) });
  } catch (error) {
    return writingFailure(error);
  }
}
