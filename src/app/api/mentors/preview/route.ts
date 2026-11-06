import { z } from 'zod';
import {
  checked,
  writingSession,
  writingFailure,
  WritingError,
} from '@/server/writing';
import { errorResponse } from '@/server/http';
import { mentorCopy, label } from '@/features/mentors/copy';
export const dynamic = 'force-dynamic';
const input = z.object({
  type: z.enum(['writing', 'vault', 'application']),
  version: z.uuid(),
  expectedVersion: z.coerce.number().int().positive().optional(),
  locale: z.enum(['ru', 'kk', 'en']).default('en'),
});
function preview(
  bytes: ArrayBuffer | string,
  mime = 'text/plain; charset=utf-8',
) {
  return new Response(bytes, {
    headers: {
      'Content-Type':
        mime === 'text/plain' ? 'text/plain; charset=utf-8' : mime,
      'Content-Disposition': 'inline; filename="selected-version"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "sandbox; default-src 'none'",
      'Referrer-Policy': 'no-referrer',
    },
  });
}
/** Owner-only preview before any grant exists. Mentors keep their separate grant proxy. */
export async function GET(request: Request) {
  const values = Object.fromEntries(new URL(request.url).searchParams),
    parsed = input.safeParse(values);
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  const p = parsed.data,
    t = mentorCopy[p.locale];
  try {
    const { client, user } = await writingSession();
    if (p.type === 'writing') {
      const value = checked(
        await client
          .from('writing_versions')
          .select('version,snapshot')
          .eq('id', p.version)
          .eq('user_id', user.id)
          .maybeSingle(),
      );
      if (
        !value ||
        !value.snapshot ||
        typeof value.snapshot !== 'object' ||
        Array.isArray(value.snapshot) ||
        typeof value.snapshot.content !== 'string'
      )
        throw new WritingError('FORBIDDEN');
      return preview(
        `${value.snapshot.title ?? ''}\n${t.versionLabel}: ${value.version}\n${value.snapshot.prompt ?? ''}\n\n${value.snapshot.content}`,
      );
    }
    if (p.type === 'application') {
      if (!p.expectedVersion) return errorResponse('VALIDATION_FAILED');
      const app = checked(
        await client
          .from('applications')
          .select(
            'id,version,program_title_snapshot,institution_name_snapshot,status,program_source_url,program_source_checked_at,official_deadline_at,official_deadline_date,official_deadline_precision,official_deadline_timezone',
          )
          .eq('id', p.version)
          .eq('user_id', user.id)
          .is('archived_at', null)
          .maybeSingle(),
      );
      if (!app) throw new WritingError('FORBIDDEN');
      if (app.version !== p.expectedVersion) throw new WritingError('CONFLICT');
      const checklist =
        checked(
          await client
            .from('application_checklist_items')
            .select('title,status,verification_state')
            .eq('application_id', app.id)
            .eq('user_id', user.id),
        ) ?? [];
      return preview(
        `${t.programLabel}: ${app.program_title_snapshot}\n${t.institutionLabel}: ${app.institution_name_snapshot}\n${t.versionLabel}: ${app.version}\n${t.status}: ${label(t, app.status)}\n${t.source}: ${app.program_source_url ?? t.unknown}\n${t.sourceChecked}: ${app.program_source_checked_at ?? t.unknown}\n${t.precisionLabel}: ${label(t, app.official_deadline_precision)}\n${t.due}: ${app.official_deadline_at ?? app.official_deadline_date ?? t.unknown}\n${t.timezone}: ${app.official_deadline_timezone ?? t.unknown}\n\n${checklist.map((c) => `${c.title} · ${label(t, c.status)} · ${label(t, c.verification_state)}`).join('\n')}\n\n${t.notShared}`,
      );
    }
    const load = async () => {
      const v = checked(
        await client
          .from('vault_versions')
          .select(
            'id,object_path,state,mime,byte_size,sha256,scanned_at,vault_documents!vault_versions_document_id_user_id_fkey(category,sensitivity,deleted_at,archived_at,expires_at)',
          )
          .eq('id', p.version)
          .eq('user_id', user.id)
          .maybeSingle(),
      );
      const d = v?.vault_documents;
      if (
        !v ||
        !d ||
        v.state !== 'available' ||
        !v.scanned_at ||
        d.deleted_at ||
        d.archived_at ||
        new Date(d.expires_at) <= new Date() ||
        !['cv', 'essay', 'transcript', 'certificate', 'language_test'].includes(
          d.category,
        ) ||
        ['restricted', 'confidential'].includes(d.sensitivity)
      )
        throw new WritingError('FORBIDDEN');
      return v;
    };
    const v = await load();
    const blob = checked(
      await client.storage.from('student-vault').download(v.object_path),
    );
    if (!blob || blob.size !== v.byte_size || blob.size > 3145728)
      throw new WritingError('FORBIDDEN');
    const bytes = await blob.arrayBuffer(),
      hash = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
        (b) => b.toString(16).padStart(2, '0'),
      ).join('');
    if (hash !== v.sha256) throw new WritingError('FORBIDDEN');
    await load();
    return preview(bytes, v.mime);
  } catch (error) {
    return writingFailure(error);
  }
}
