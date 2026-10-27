import { randomBytes } from 'node:crypto';
import { hasSameOrigin, readBoundedJson } from '@/features/roadmap/http';
import { recommendationCommand } from '@/features/vault/contracts';
import {
  command,
  checked,
  sha256,
  vaultFailure,
  vaultSession,
} from '@/server/vault';
import { errorResponse, successResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request),
    parsed = recommendationCommand.safeParse(body.ok ? body.value : null);
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const { client } = await vaultSession(),
      v = parsed.data;
    if (v.action === 'create') {
      const token = randomBytes(32).toString('hex');
      const id = checked(
        await command(client, 'recommendation_create', {
          p_application_id: v.applicationId,
          p_email: v.email,
          p_context: v.context,
          p_due_date: v.dueDate,
          p_token_hash: sha256(token),
        }),
      );
      return successResponse({ id, token, delivery: 'manual_unsent' });
    }
    if (v.action === 'respond')
      return successResponse({
        id: checked(
          await command(client, 'recommendation_respond', {
            p_token_hash: sha256(v.token),
            p_accept: v.accept,
          }),
        ),
      });
    checked(await command(client, 'recommendation_cancel', { p_id: v.id }));
    return successResponse({ cancelled: true });
  } catch (error) {
    return vaultFailure(error);
  }
}
