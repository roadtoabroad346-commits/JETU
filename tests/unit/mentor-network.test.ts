import { describe, it, expect } from 'vitest';
import {
  commandSchema,
  safeText,
  type Mentor,
} from '@/features/mentors/contracts';
import {
  anchorMatches,
  filterMentors,
  utcSlot,
} from '@/features/mentors/domain';
const id = '22000000-0000-4000-8000-000000000001';
const mentor: Mentor = {
  id,
  name: 'Fixture mentor',
  bio: 'Synthetic mentoring fixture',
  expertise: ['essay'],
  languages: ['kk', 'en'],
  countries: ['KZ'],
  degrees: ['bachelor'],
  timezone: 'Asia/Almaty',
  verifiedSummary: 'Synthetic approval summary',
  capacity: 2,
  services: [
    {
      id,
      kind: 'essay',
      summary: 'Essay feedback',
      deliverables: 'Anchored comments',
      turnaround_hours: 48,
      price_minor: 0,
      currency: 'KZT',
    },
  ],
  slots: [],
};
describe('mentor boundary contracts', () => {
  it.each([
    'Message @outside',
    'Call +7 777 123 4567',
    'email someone@example.com',
    'https://example.com',
    'Telegram me',
    'WhatsApp invitation',
  ])('rejects personal contact: %s', (body) => {
    expect(safeText(body)).toBe(false);
  });
  it('allows ISO dates in useful feedback', () => {
    expect(safeText('Check the deadline 2026-11-06.')).toBe(true);
  });
  it('permits bounded process feedback without claiming acceptance', () => {
    expect(safeText('Clarify your contribution and preserve your voice.')).toBe(
      true,
    );
  });
  it('rejects actor and role mass assignment', () => {
    expect(
      commandSchema.safeParse({
        op: 'revoke',
        request: id,
        student: id,
        role: 'admin',
      }).success,
    ).toBe(false);
  });
  it('requires exact consent version and affirmative consent', () => {
    const input = {
      op: 'create',
      service: id,
      goal: 'Improve my essay structure',
      expires: '2026-12-01T00:00:00Z',
      items: [],
      key: id,
    };
    expect(commandSchema.safeParse(input).success).toBe(false);
    expect(
      commandSchema.safeParse({
        ...input,
        policy: 'mentor-consent-v1',
        consent: false,
      }).success,
    ).toBe(false);
  });
  it('rejects fabricated comment authors', () => {
    expect(
      commandSchema.safeParse({
        op: 'comment',
        request: id,
        grant: id,
        parent: null,
        body: 'Useful advice',
        anchor: null,
        key: id,
        author: id,
      }).success,
    ).toBe(false);
  });
  it('requires every rubric criterion', () => {
    expect(
      commandSchema.safeParse({
        op: 'review',
        request: id,
        outcome: 'ready_for_student_review',
        summary: 'Some actionable feedback',
        rubric: { clarity: 5 },
        actions: [],
        key: id,
      }).success,
    ).toBe(false);
  });
  it('anchors supplementary Unicode by code points on immutable text', () => {
    expect(
      anchorMatches('My 🙂 essay', { start: 3, end: 4, quote: '🙂' }),
    ).toBe(true);
    expect(
      anchorMatches('My new 🙂 essay', { start: 3, end: 4, quote: '🙂' }),
    ).toBe(false);
  });
  it('intersects URL filters with a matching service', () => {
    expect(
      filterMentors(
        [mentor],
        new URLSearchParams('language=kk&country=kz&service=essay&price=free'),
      ),
    ).toHaveLength(1);
    expect(
      filterMentors([mentor], new URLSearchParams('language=ru')),
    ).toHaveLength(0);
    expect(
      filterMentors([mentor], new URLSearchParams('available=on')),
    ).toHaveLength(0);
  });
  it('does not mutate the directory while sorting', () => {
    const list = [mentor, { ...mentor, id: 'b', name: 'Alpha' }];
    expect(filterMentors(list, new URLSearchParams())[0]?.name).toBe('Alpha');
    expect(list[0]?.name).toBe('Fixture mentor');
  });
  it('requires explicit offsets for DST ambiguous scheduling', () => {
    expect(utcSlot('2026-11-01T01:30', 'America/New_York')).toBeNull();
    expect(utcSlot('2026-11-01T01:30:00-04:00', 'America/New_York')).toBe(
      '2026-11-01T05:30:00.000Z',
    );
    expect(utcSlot('2026-11-01T01:30:00-05:00', 'America/New_York')).toBe(
      '2026-11-01T06:30:00.000Z',
    );
    expect(utcSlot('2026-11-01T01:30:00Z', 'No/Such_Zone')).toBeNull();
  });
});
