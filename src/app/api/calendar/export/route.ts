import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { exportIcs } from '@/features/deadlines/ics';
import {
  filterEvents,
  zoneSchema,
  type CalendarEvent,
} from '@/features/deadlines/model';
import { errorResponse } from '@/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    const params = new URL(request.url).searchParams;
    const zone = zoneSchema.safeParse(params.get('timezone') ?? 'UTC');
    if (!zone.success) return errorResponse('VALIDATION_FAILED');
    const { data: events, error } = await client
      .from('calendar_events')
      .select('*')
      .eq('user_id', data.user.id)
      .order('event_key')
      .limit(501);
    if (error) return errorResponse('INTERNAL_ERROR');
    if (events.length > 500) return errorResponse('VALIDATION_FAILED');
    const filtered = filterEvents(
      events as CalendarEvent[],
      {
        q: params.get('q') ?? '',
        category: params.get('category') ?? '',
        status: params.get('status') ?? '',
        sort: 'deadline',
        verified: params.get('verified') === '1',
      },
      zone.data,
    );
    return new Response(exportIcs(filtered, new Date().toISOString()), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="jetu-calendar.ics"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return errorResponse('PROVIDER_NOT_CONFIGURED');
  }
}
