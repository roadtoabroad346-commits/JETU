import type { CalendarEvent } from './model';
const escape = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
const stamp = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
/** RFC 5545: fold by UTF-8 octets, never in the middle of a code point. */
export function foldLine(value: string) {
  let line = '';
  let size = 0;
  const lines: string[] = [];
  for (const char of value) {
    const bytes = new TextEncoder().encode(char).length;
    if (size + bytes > 75) {
      lines.push(line);
      line = ' ';
      size = 1;
    }
    line += char;
    size += bytes;
  }
  lines.push(line);
  return lines.join('\r\n');
}
export function exportIcs(events: CalendarEvent[], now: string) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JETU//Student Calendar//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const e of events) {
    if (
      (e.precision !== 'date_only' || !e.due_date) &&
      (e.precision !== 'instant' || !e.due_at)
    )
      continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.event_key.replace(/[^a-zA-Z0-9:-]/g, '')}@calendar.jetu`,
      `DTSTAMP:${stamp(now)}`,
      `LAST-MODIFIED:${stamp(e.updated_at)}`,
      `SEQUENCE:${Math.min(2147483647, e.version)}`,
      e.precision === 'date_only'
        ? `DTSTART;VALUE=DATE:${e.due_date!.replace(/-/g, '')}`
        : `DTSTART:${stamp(e.due_at!)}`,
      `SUMMARY:${escape(e.title)}`,
      `DESCRIPTION:${escape(e.origin === 'official' ? (e.verified ? 'Official source. Verify the current deadline before applying.' : 'Unverified deadline. Check the official source.') : 'Personal planning date. Not an official deadline.')}`,
      `STATUS:${e.status === 'canceled' || e.status === 'superseded' ? 'CANCELLED' : 'CONFIRMED'}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
