import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

export const categories = [
  'application',
  'scholarship',
  'roadmap',
  'custom',
] as const;
export const zoneSchema = z
  .string()
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return !/^[+-]/.test(value);
    } catch {
      return false;
    }
  });
export const preferencesSchema = z
  .object({
    timezone: zoneSchema,
    in_app: z.boolean(),
    paused: z.boolean(),
    categories: z.array(z.enum(categories)).max(4),
    source_changes: z.boolean(),
    lead_days: z.array(z.number().int().min(0).max(90)).min(1).max(8),
    digest: z.enum(['immediate', 'daily', 'weekly', 'off']),
    digest_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    quiet_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    quiet_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export const defaultPreferences: Preferences = {
  timezone: 'UTC',
  in_app: true,
  paused: false,
  categories: [...categories],
  source_changes: true,
  lead_days: [30, 14, 7, 1],
  digest: 'immediate',
  digest_time: '09:00',
  quiet_start: '22:00',
  quiet_end: '08:00',
};
export const customEventSchema = z
  .object({
    id: z.uuid().optional(),
    version: z.number().int().positive().optional(),
    title: z.string().trim().min(1).max(240),
    due_date: z.iso.date(),
    status: z.enum(['active', 'completed', 'canceled']).default('active'),
  })
  .strict();
export type CalendarEvent = {
  event_key: string;
  user_id: string;
  title: string;
  category: (typeof categories)[number];
  origin: 'official' | 'user_created' | 'derived';
  precision: 'instant' | 'date_only' | 'unknown' | 'rolling';
  due_at: string | null;
  due_date: string | null;
  timezone: string | null;
  source_url: string | null;
  checked_at: string | null;
  verified: boolean;
  status: string;
  revision: string;
  version: number;
  updated_at: string;
  muted: boolean;
};
export type InboxItem = {
  id: string;
  event_key: string;
  title: string;
  kind: 'reminder' | 'source_change';
  category: string;
  created_at: string;
  read_at: string | null;
  archived_at: string | null;
  due_date: string | null;
  due_at: string | null;
  lead_days: number;
  previous_due_date?: string | null;
  previous_due_at?: string | null;
};
export function localDate(instant: string, zone: string) {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO(zone)
    .toPlainDate()
    .toString();
}
export function eventDate(event: CalendarEvent, zone: string) {
  return event.precision === 'date_only'
    ? event.due_date
    : event.due_at
      ? localDate(event.due_at, zone)
      : null;
}
/** PostgreSQL-compatible DST policy: later instant in gaps and overlaps. */
export function atLocal(date: string, time: string, zone: string) {
  return Temporal.PlainDate.from(date)
    .toPlainDateTime(time)
    .toZonedDateTime(zone, { disambiguation: 'later' });
}
export function reminderAt(event: CalendarEvent, lead: number, zone: string) {
  if (
    event.status !== 'active' ||
    event.muted ||
    (event.origin === 'official' && !event.verified)
  )
    return null;
  if (event.precision === 'date_only' && event.due_date) {
    return atLocal(
      Temporal.PlainDate.from(event.due_date)
        .subtract({ days: lead })
        .toString(),
      '09:00',
      zone,
    )
      .toInstant()
      .toString();
  }
  if (event.precision !== 'instant' || !event.due_at) return null;
  const local = Temporal.Instant.from(event.due_at)
    .toZonedDateTimeISO(zone)
    .toPlainDateTime()
    .subtract({ days: lead });
  return local
    .toZonedDateTime(zone, { disambiguation: 'later' })
    .toInstant()
    .toString();
}
export function permittedAt(instant: string, p: Preferences) {
  let local = Temporal.Instant.from(instant).toZonedDateTimeISO(p.timezone);
  if (p.digest === 'off' || p.paused || !p.in_app) return null;
  if (p.digest !== 'immediate') {
    let date = local.toPlainDate();
    if (p.digest === 'weekly')
      date = date.add({ days: (8 - date.dayOfWeek) % 7 });
    let next = atLocal(date.toString(), p.digest_time, p.timezone);
    if (Temporal.ZonedDateTime.compare(next, local) < 0)
      next = atLocal(
        date.add({ days: p.digest === 'weekly' ? 7 : 1 }).toString(),
        p.digest_time,
        p.timezone,
      );
    local = next;
  }
  const time = local.toPlainTime().toString().slice(0, 5);
  const crosses = p.quiet_start > p.quiet_end;
  if (
    p.quiet_start !== p.quiet_end &&
    (crosses
      ? time >= p.quiet_start || time < p.quiet_end
      : time >= p.quiet_start && time < p.quiet_end)
  ) {
    const day = local
      .toPlainDate()
      .add({ days: crosses && time >= p.quiet_start ? 1 : 0 });
    local = atLocal(day.toString(), p.quiet_end, p.timezone);
  }
  return local.toInstant().toString();
}
export type CalendarFilters = {
  q: string;
  category: string;
  status: string;
  sort: string;
  verified: boolean;
};
export function filterEvents(
  events: CalendarEvent[],
  filters: CalendarFilters,
  zone: string,
) {
  const q = filters.q.trim().normalize('NFKC').toLocaleLowerCase();
  return events
    .filter(
      (e) =>
        (!q || e.title.normalize('NFKC').toLocaleLowerCase().includes(q)) &&
        (!filters.category || e.category === filters.category) &&
        (!filters.status || e.status === filters.status) &&
        (!filters.verified || e.verified),
    )
    .sort((a, b) => {
      const primary =
        filters.sort === 'title'
          ? a.title.localeCompare(b.title)
          : filters.sort === 'recent'
            ? b.updated_at.localeCompare(a.updated_at)
            : (eventDate(a, zone) ?? '9999').localeCompare(
                eventDate(b, zone) ?? '9999',
              );
      return primary || a.event_key.localeCompare(b.event_key);
    });
}
export function retryDelay(attempt: number, random = 0.5) {
  return (
    Math.min(3600000, 1000 * 2 ** Math.min(12, Math.max(0, attempt))) *
    (0.75 + Math.max(0, Math.min(1, random)) * 0.5)
  );
}
