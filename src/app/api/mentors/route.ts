import { z } from 'zod';
import { commandSchema } from '@/features/mentors/contracts';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import {
  checked,
  writingSession,
  writingFailure,
  sameOrigin,
  boundedJson,
} from '@/server/writing';
import { successResponse, errorResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    if (params.get('directory') === '1') {
      const client = await createRequestSupabaseClient();
      return successResponse({
        mentors: checked(await client.rpc('mentor_directory')),
      });
    }
    const { client, user } = await writingSession();
    const grant = params.get('grant');
    if (grant) {
      if (!z.uuid().safeParse(grant).success)
        return errorResponse('VALIDATION_FAILED');
      const resource = checked(
        await client.rpc('mentor_resource', {
          p_grant: grant,
          p_operation: 'view',
        }),
      );
      // Raw Storage descriptors must never cross the browser API boundary.
      if (
        resource &&
        typeof resource === 'object' &&
        !Array.isArray(resource) &&
        resource.type === 'vault'
      )
        return successResponse({
          resource: {
            type: 'vault',
            preview: `/api/mentors/file?grant=${grant}`,
          },
        });
      return successResponse({ resource });
    }
    const caseId = params.get('case');
    if (caseId) {
      if (!z.uuid().safeParse(caseId).success)
        return errorResponse('VALIDATION_FAILED');
      return successResponse({
        context: checked(
          await client.rpc('mentor_case_context', { p_case: caseId }),
        ),
      });
    }
    const writing = params.get('writing');
    if (writing) {
      if (!z.uuid().safeParse(writing).success)
        return errorResponse('VALIDATION_FAILED');
      const grants =
        checked(
          await client
            .from('mentor_resource_grants')
            .select('request_id,version_id')
            .eq('student_id', user.id)
            .eq('resource_type', 'writing')
            .eq('resource_id', writing)
            .limit(100),
        ) ?? [];
      const ids = [...new Set(grants.map((g) => g.request_id))];
      if (!ids.length)
        return successResponse({ comments: [], reviews: [], grants: [] });
      const [comments, reviews] = await Promise.all([
        client
          .from('mentor_comments')
          .select('*')
          .in('request_id', ids)
          .order('created_at', { ascending: false })
          .limit(100),
        client
          .from('mentor_reviews')
          .select('*')
          .in('request_id', ids)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      return successResponse({
        comments: checked(comments),
        reviews: checked(reviews),
        grants,
      });
    }
    const [
      slots,
      availabilityRules,
      blackouts,
      requestDrafts,
      actor,
      profile,
      clearance,
      requests,
      grants,
      comments,
      reviews,
      events,
      bookings,
      evidence,
      profiles,
      reports,
      versions,
      documents,
      applications,
    ] = await Promise.all([
      client
        .from('mentor_slots')
        .select('id,starts_at,ends_at,timezone,cancelled_at')
        .eq('mentor_id', user.id)
        .order('starts_at')
        .limit(200),
      client
        .from('mentor_availability_rules')
        .select('*')
        .eq('mentor_id', user.id)
        .limit(100),
      client
        .from('mentor_blackouts')
        .select('*')
        .eq('mentor_id', user.id)
        .limit(100),
      client
        .from('mentor_request_drafts')
        .select('*')
        .eq('student_id', user.id)
        .limit(100),
      client.rpc('mentor_actor'),
      client
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      client
        .from('mentor_student_clearances')
        .select('approved_until')
        .eq('student_id', user.id)
        .maybeSingle(),
      client
        .from('mentor_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      client.from('mentor_resource_grants').select('*').limit(1000),
      client
        .from('mentor_comments')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1000),
      client
        .from('mentor_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      client
        .from('mentor_events')
        .select('id,request_id,kind,actor_id,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      client
        .from('mentor_bookings')
        .select('id,request_id,slot_id,state')
        .limit(100),
      client
        .from('mentor_evidence')
        .select('id,mentor_id,claim,state,retain_until')
        .limit(100),
      client
        .from('mentor_profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(100),
      client.from('mentor_reports').select('*').limit(100),
      client
        .from('writing_versions')
        .select('id,draft_id,version,title:snapshot->>title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),
      client
        .from('vault_versions')
        .select(
          'id,document_id,sequence,state,vault_documents!vault_versions_document_id_user_id_fkey(display_name,category,sensitivity)',
        )
        .eq('user_id', user.id)
        .eq('state', 'available')
        .limit(100),
      client
        .from('applications')
        .select('id,program_title_snapshot,version')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .limit(100),
    ]);
    const materialVersions = checked(versions) ?? [];
    const materialDocs = checked(documents) ?? [];
    const materialApps = checked(applications) ?? [];
    return successResponse({
      slots: checked(slots),
      availabilityRules: checked(availabilityRules),
      blackouts: checked(blackouts),
      requestDrafts: checked(requestDrafts),
      actor: checked(actor),
      profile: checked(profile),
      clearance: checked(clearance),
      requests: checked(requests),
      grants: checked(grants),
      comments: checked(comments),
      reviews: checked(reviews),
      events: checked(events),
      bookings: checked(bookings),
      evidence: checked(evidence),
      profiles: checked(profiles),
      reports: checked(reports),
      materials: [
        ...materialVersions.map((v) => ({
          type: 'writing',
          resource: v.draft_id,
          version: v.id,
          title: `${v.title ?? 'Writing'} · v${v.version}`,
          download: false,
        })),
        ...materialDocs
          .filter(
            (v) =>
              v.vault_documents &&
              [
                'cv',
                'essay',
                'transcript',
                'certificate',
                'language_test',
              ].includes(v.vault_documents.category),
          )
          .map((v) => ({
            type: 'vault',
            resource: v.document_id,
            version: v.id,
            title: `${v.vault_documents?.display_name ?? 'Document'} · v${v.sequence}`,
            download: false,
          })),
        ...materialApps.map((a) => ({
          type: 'application',
          resource: a.id,
          version: a.id,
          title: `${a.program_title_snapshot} · v${a.version}`,
          download: false,
        })),
      ],
    });
  } catch (error) {
    return writingFailure(error);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorResponse('FORBIDDEN');
  try {
    const parsed = commandSchema.safeParse(await boundedJson(request, 60000));
    if (!parsed.success) return errorResponse('VALIDATION_FAILED');
    const { client } = await writingSession();
    return successResponse(
      checked(
        await client.rpc('mentor_command', {
          p_input: JSON.parse(JSON.stringify(parsed.data)),
        }),
      ),
    );
  } catch (error) {
    return writingFailure(error);
  }
}
