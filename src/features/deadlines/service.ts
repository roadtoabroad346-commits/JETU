import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import {
  defaultPreferences,
  preferencesSchema,
  type CalendarEvent,
  type InboxItem,
} from './model';

export async function loadDeadlineWorkspace(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const [events, preferences, inbox, unread, saved, applications, profile] =
    await Promise.all([
      client
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(500),
      client
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100),
      client
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null)
        .is('archived_at', null),
      client
        .from('saved_catalog_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      client
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('archived_at', null),
      client
        .from('student_profiles')
        .select('document')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);
  if (
    [events, preferences, inbox, unread, saved, applications, profile].some(
      (r) => r.error,
    )
  )
    throw new Error('Workspace unavailable');
  const stored = preferences.data;
  const parsed = stored
    ? preferencesSchema.safeParse({
        timezone: stored.timezone,
        in_app: stored.in_app,
        paused: stored.paused,
        categories: stored.categories,
        source_changes: stored.source_changes,
        lead_days: stored.lead_days,
        digest: stored.digest,
        digest_time: stored.digest_time.slice(0, 5),
        quiet_start: stored.quiet_start.slice(0, 5),
        quiet_end: stored.quiet_end.slice(0, 5),
      })
    : null;
  if (stored && !parsed?.success) throw new Error('Invalid stored preferences');
  return {
    events: events.data as CalendarEvent[],
    preferences: parsed?.success ? parsed.data : defaultPreferences,
    inbox: inbox.data as InboxItem[],
    unread: unread.count ?? 0,
    saved: saved.count ?? 0,
    applications: applications.count ?? 0,
    hasProfile: Boolean(profile.data),
    truncated: events.data?.length === 500,
    inboxHasMore: inbox.data?.length === 100,
  };
}
export type DeadlineWorkspaceData = Awaited<
  ReturnType<typeof loadDeadlineWorkspace>
>;
