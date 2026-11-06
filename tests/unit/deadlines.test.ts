import { describe, expect, it } from 'vitest';
import {
  atLocal,
  defaultPreferences,
  eventDate,
  filterEvents,
  permittedAt,
  preferencesSchema,
  reminderAt,
  retryDelay,
  type CalendarEvent,
} from '@/features/deadlines/model';
import { exportIcs, foldLine } from '@/features/deadlines/ics';
const event: CalendarEvent = {
  event_key: 'custom:123',
  user_id: 'private-owner',
  title: 'Жеке жоспар, test; \\ safe\nBEGIN:VEVENT',
  category: 'custom',
  origin: 'user_created',
  precision: 'date_only',
  due_at: null,
  due_date: '2026-11-20',
  timezone: null,
  source_url: null,
  checked_at: null,
  verified: false,
  status: 'active',
  revision: 'a',
  version: 1,
  updated_at: '2026-11-06T12:00:00Z',
  muted: false,
};
describe('deadline precision and scheduling', () => {
  it('preserves all-day dates across the date line', () => {
    expect(eventDate(event, 'Pacific/Kiritimati')).toBe('2026-11-20');
    expect(eventDate(event, 'America/Adak')).toBe('2026-11-20');
  });
  it('uses a reminder time without inventing a date-only cutoff', () => {
    expect(reminderAt(event, 1, 'Asia/Almaty')).toBe('2026-11-19T04:00:00Z');
  });
  it.each([
    ['America/New_York', '2026-03-08', '02:30', '2026-03-08T07:30:00Z'],
    ['America/New_York', '2026-11-01', '01:30', '2026-11-01T06:30:00Z'],
    ['Europe/London', '2026-03-29', '01:30', '2026-03-29T01:30:00Z'],
    ['Europe/London', '2026-10-25', '01:30', '2026-10-25T01:30:00Z'],
  ])('handles DST in %s on %s', (zone, date, time, expected) => {
    expect(atLocal(date, time, zone).toInstant().toString()).toBe(expected);
  });
  it('subtracts calendar days over DST rather than 24h intervals', () => {
    expect(
      reminderAt(
        {
          ...event,
          precision: 'instant',
          due_date: null,
          due_at: '2026-03-09T13:00:00Z',
        },
        1,
        'America/New_York',
      ),
    ).toBe('2026-03-08T13:00:00Z');
  });
  it('handles leap day', () => {
    expect(reminderAt({ ...event, due_date: '2028-03-01' }, 1, 'UTC')).toBe(
      '2028-02-29T09:00:00Z',
    );
  });
  it.each([
    { status: 'canceled' },
    { status: 'completed' },
    { muted: true },
    { origin: 'official', verified: false },
    { precision: 'unknown' },
  ] as Partial<CalendarEvent>[])(
    'does not schedule unsafe or inactive sources %j',
    (overrides) => {
      expect(reminderAt({ ...event, ...overrides }, 1, 'UTC')).toBeNull();
    },
  );
  it('moves overnight quiet hours to the following local morning', () => {
    expect(permittedAt('2026-11-06T23:00:00Z', defaultPreferences)).toBe(
      '2026-11-07T08:00:00Z',
    );
  });
  it('handles same-day quiet hours', () => {
    expect(
      permittedAt('2026-11-06T13:00:00Z', {
        ...defaultPreferences,
        quiet_start: '12:00',
        quiet_end: '15:00',
      }),
    ).toBe('2026-11-06T15:00:00Z');
  });
  it('uses daily and Monday delivery windows', () => {
    expect(
      permittedAt('2026-11-06T12:00:00Z', {
        ...defaultPreferences,
        digest: 'daily',
      }),
    ).toBe('2026-11-07T09:00:00Z');
    expect(
      permittedAt('2026-11-06T12:00:00Z', {
        ...defaultPreferences,
        digest: 'weekly',
      }),
    ).toBe('2026-11-09T09:00:00Z');
  });
  it.each([{ paused: true }, { in_app: false }, { digest: 'off' }] as const)(
    'honors global opt-out %j',
    (overrides) => {
      expect(
        permittedAt('2026-11-06T12:00:00Z', {
          ...defaultPreferences,
          ...overrides,
        }),
      ).toBeNull();
    },
  );
  it('rejects timezone and external-channel privilege injection', () => {
    expect(
      preferencesSchema.safeParse({
        ...defaultPreferences,
        timezone: 'Mars/Olympus',
      }).success,
    ).toBe(false);
    expect(
      preferencesSchema.safeParse({ ...defaultPreferences, email: true })
        .success,
    ).toBe(false);
  });
  it('bounds retry jitter and backoff', () => {
    expect(retryDelay(0, 0)).toBe(750);
    expect(retryDelay(100, 1)).toBe(4500000);
  });
});
describe('calendar filtering and safe ICS', () => {
  it('uses stable identity ties and supports Cyrillic', () => {
    const b = { ...event, event_key: 'custom:abc' };
    expect(
      filterEvents(
        [b, event],
        {
          q: 'ЖЕКЕ',
          category: 'custom',
          status: 'active',
          sort: 'deadline',
          verified: false,
        },
        'UTC',
      ).map((e) => e.event_key),
    ).toEqual(['custom:123', 'custom:abc']);
  });
  it('excludes unverified rows from the verified filter', () => {
    expect(
      filterEvents(
        [event],
        { q: '', category: '', status: '', sort: 'deadline', verified: true },
        'UTC',
      ),
    ).toEqual([]);
  });
  it('escapes injection, uses CRLF, preserves dates, and excludes owner identifiers', () => {
    const ics = exportIcs([event], '2026-11-06T12:00:00Z');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261120\r\n');
    expect(ics).toContain('\\nBEGIN:VEVENT');
    expect(ics.split('\r\n').filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(
      1,
    );
    expect(ics).not.toContain('private-owner');
    expect(ics.replaceAll('\r\n', '')).not.toContain('\n');
  });
  it('folds UTF-8 at 75 octets', () => {
    for (const line of foldLine('SUMMARY:' + 'ӘҒҚҢӨҰҮҺІ'.repeat(20)).split(
      '\r\n',
    ))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it('exports precise instants in UTC and cancellation with stable UID', () => {
    const ics = exportIcs(
      [
        {
          ...event,
          precision: 'instant',
          due_date: null,
          due_at: '2026-11-20T09:00:00+05:00',
          status: 'canceled',
        },
      ],
      '2026-11-06T12:00:00Z',
    );
    expect(ics).toContain('DTSTART:20261120T040000Z');
    expect(ics).toContain('STATUS:CANCELLED');
    expect(ics).toContain('UID:custom:123@calendar.jetu');
  });
  it('omits unknown dates', () => {
    expect(
      exportIcs(
        [{ ...event, precision: 'unknown', due_date: null }],
        '2026-11-06T12:00:00Z',
      ),
    ).not.toContain('BEGIN:VEVENT');
  });
});
