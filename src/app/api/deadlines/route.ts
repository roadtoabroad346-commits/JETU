import { z } from 'zod';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import { loadDeadlineWorkspace } from '@/features/deadlines/service';
import {
  customEventSchema,
  defaultPreferences,
  preferencesSchema,
} from '@/features/deadlines/model';
export const dynamic = 'force-dynamic';
const command = z.discriminatedUnion('action', [
  z
    .object({ action: z.literal('preferences'), value: preferencesSchema })
    .strict(),
  z.object({ action: z.literal('event'), value: customEventSchema }).strict(),
  z
    .object({
      action: z.literal('receipt'),
      id: z.uuid(),
      read: z.boolean().optional(),
      archive: z.boolean().optional(),
    })
    .strict(),
  z.object({ action: z.literal('read_all') }).strict(),
  z
    .object({
      action: z.literal('mute'),
      event_key: z.string().min(1).max(120),
      muted: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal('watch'),
      deadline_id: z.number().int().positive().safe(),
      watch: z.boolean(),
    })
    .strict(),
]);
export async function GET(request?: Request) {
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    const params = request
      ? new URL(request.url).searchParams
      : new URLSearchParams();
    if (params.has('before')) {
      const cursor = z
        .object({ before: z.iso.datetime(), id: z.uuid() })
        .safeParse({
          before: params.get('before'),
          id: params.get('before_id'),
        });
      if (!cursor.success) return errorResponse('VALIDATION_FAILED');
      const { data: rows, error } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', data.user.id)
        .or(
          `created_at.lt.${cursor.data.before},and(created_at.eq.${cursor.data.before},id.lt.${cursor.data.id})`,
        )
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100);
      if (error) return errorResponse('INTERNAL_ERROR');
      return successResponse({
        inbox: rows,
        inboxHasMore: rows.length === 100,
      });
    }
    return successResponse(await loadDeadlineWorkspace(client, data.user.id));
  } catch {
    return errorResponse('PROVIDER_NOT_CONFIGURED');
  }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || new URL(origin).host !== new URL(request.url).host)
      return errorResponse('FORBIDDEN');
  } catch {
    return errorResponse('FORBIDDEN');
  }
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return errorResponse('VALIDATION_FAILED');
  let raw: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 8192)
      return errorResponse('VALIDATION_FAILED');
    raw = JSON.parse(text);
  } catch {
    return errorResponse('VALIDATION_FAILED');
  }
  const parsed = command.safeParse(raw);
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    const user_id = data.user.id;
    const c = parsed.data;
    if (c.action === 'preferences') {
      const { error } = await client
        .from('notification_preferences')
        .upsert({ user_id, ...c.value });
      if (error) return errorResponse('INTERNAL_ERROR');
    } else if (c.action === 'event') {
      const { id, version, ...value } = c.value;
      if (id) {
        if (!version) return errorResponse('VALIDATION_FAILED');
        const { data: row, error } = await client
          .from('calendar_custom_events')
          .update(value)
          .eq('id', id)
          .eq('user_id', user_id)
          .eq('version', version)
          .select('id')
          .maybeSingle();
        if (error) return errorResponse('INTERNAL_ERROR');
        if (!row) return errorResponse('CONFLICT');
      } else {
        const { count, error: countError } = await client
          .from('calendar_custom_events')
          .select('id', { head: true, count: 'exact' })
          .eq('user_id', user_id);
        if (countError) return errorResponse('INTERNAL_ERROR');
        if ((count ?? 0) >= 500) return errorResponse('RATE_LIMITED');
        const { error } = await client
          .from('calendar_custom_events')
          .insert({ user_id, ...value });
        if (error) return errorResponse('INTERNAL_ERROR');
      }
      const { data: exists, error: lookupError } = await client
        .from('notification_preferences')
        .select('user_id')
        .eq('user_id', user_id)
        .maybeSingle();
      if (lookupError) return errorResponse('INTERNAL_ERROR');
      if (!exists) {
        const { error } = await client
          .from('notification_preferences')
          .upsert(
            { user_id, ...defaultPreferences },
            { ignoreDuplicates: true },
          );
        if (error) return errorResponse('INTERNAL_ERROR');
      }
    } else if (c.action === 'receipt') {
      const values = {
        ...(c.read !== undefined
          ? { read_at: c.read ? new Date().toISOString() : null }
          : {}),
        ...(c.archive !== undefined
          ? { archived_at: c.archive ? new Date().toISOString() : null }
          : {}),
      };
      if (!Object.keys(values).length)
        return errorResponse('VALIDATION_FAILED');
      const { data: row, error } = await client
        .from('notifications')
        .update(values)
        .eq('id', c.id)
        .eq('user_id', user_id)
        .select('id')
        .maybeSingle();
      if (error) return errorResponse('INTERNAL_ERROR');
      if (!row) return errorResponse('NOT_FOUND');
    } else if (c.action === 'read_all') {
      const { error } = await client
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .is('read_at', null)
        .is('archived_at', null);
      if (error) return errorResponse('INTERNAL_ERROR');
    } else if (c.action === 'mute') {
      const { data: row, error: lookupError } = await client
        .from('calendar_events')
        .select('event_key')
        .eq('user_id', user_id)
        .eq('event_key', c.event_key)
        .maybeSingle();
      if (lookupError) return errorResponse('INTERNAL_ERROR');
      if (!row) return errorResponse('NOT_FOUND');
      const { error } = await client
        .from('notification_event_settings')
        .upsert({ user_id, event_key: c.event_key, muted: c.muted });
      if (error) return errorResponse('INTERNAL_ERROR');
    } else {
      const result = c.watch
        ? await client
            .from('deadline_watches')
            .upsert(
              { user_id, deadline_id: c.deadline_id },
              { ignoreDuplicates: true },
            )
        : await client
            .from('deadline_watches')
            .delete()
            .eq('user_id', user_id)
            .eq('deadline_id', c.deadline_id);
      if (result.error) return errorResponse('NOT_FOUND');
    }
    return successResponse({ saved: true });
  } catch {
    return errorResponse('INTERNAL_ERROR');
  }
}
