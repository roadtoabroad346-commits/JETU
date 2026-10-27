import { hasSameOrigin, readBoundedJson } from '@/features/roadmap/http';
import { vaultCommand } from '@/features/vault/contracts';
import {
  readPages,
  command,
  checked,
  vaultFailure,
  vaultSession,
} from '@/server/vault';
import { safeName } from '@/features/vault/files';
import { successResponse, errorResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { client, user } = await vaultSession();
    const docs =
      checked(
        await client
          .from('vault_documents')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(100),
      ) ?? [];
    const ids = docs.map((d) => d.id);
    const [versions, links, apps, tasks, requests, receivedRequests] =
      await Promise.all([
        readPages((first, last) =>
          client
            .from('vault_versions')
            .select('*')
            .eq('user_id', user.id)
            .in('document_id', ids)
            .order('id')
            .range(first, last),
        ),
        readPages((first, last) =>
          client
            .from('vault_links')
            .select('*')
            .eq('user_id', user.id)
            .order('id')
            .range(first, last),
        ),
        client
          .from('applications')
          .select('id,program_title_snapshot')
          .eq('user_id', user.id)
          .is('archived_at', null)
          .limit(100),
        client
          .from('roadmap_tasks')
          .select('id,title,target_id')
          .eq('user_id', user.id)
          .limit(1000),
        client
          .from('recommendation_requests')
          .select(
            'id,application_id,invited_email,context,due_date,expires_at,status,created_at',
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        command(client, 'recommendation_received', {}),
      ]);
    return successResponse({
      documents: docs,
      versions: versions,
      links: links,
      applications: checked(apps),
      tasks: checked(tasks),
      requests: checked(requests),
      receivedRequests: checked(receivedRequests),
    });
  } catch (error) {
    return vaultFailure(error);
  }
}
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return errorResponse('FORBIDDEN');
  const body = await readBoundedJson(request);
  const input = vaultCommand.safeParse(body.ok ? body.value : null);
  if (!input.success) return errorResponse('VALIDATION_FAILED');
  try {
    const { client } = await vaultSession(),
      v = input.data;
    if (v.action === 'portfolio')
      checked(
        await command(client, 'vault_portfolio', {
          p_name: safeName(v.name),
          p_url: v.url,
        }),
      );
    else if (v.action === 'link' || v.action === 'unlink')
      checked(
        await command(client, 'vault_link', {
          p_document_id: v.documentId,
          p_version_id: v.versionId,
          p_application_id: v.applicationId,
          p_task_id: v.taskId,
          p_remove: v.action === 'unlink',
        }),
      );
    else
      checked(
        await command(client, 'vault_manage', {
          p_document_id: v.documentId,
          p_action: v.action,
        }),
      );
    return successResponse({ saved: true });
  } catch (error) {
    return vaultFailure(error);
  }
}
