import { createRoot } from 'react-dom/client';
import { DeadlineWorkspace } from '../../src/features/deadlines/workspace';
import {
  defaultPreferences,
  type CalendarEvent,
} from '../../src/features/deadlines/model';
import type { Locale } from '../../src/lib/i18n/messages';
import '../../src/app/globals.css';
// Test-only renderer. Synthetic rows never enter application routes or a database.
const p = new URLSearchParams(location.search);
const locale = (p.get('locale') || window.name || 'en') as Locale;
document.documentElement.lang = locale;
window.name = locale;
const labels =
  locale === 'ru'
    ? [
        'Подготовить мотивационное письмо',
        'Личная встреча с наставником',
        'Проверить официальный источник',
      ]
    : locale === 'kk'
      ? [
          'Мотивациялық хат дайындау',
          'Тәлімгермен жеке кездесу',
          'Ресми дереккөзді тексеру',
        ]
      : [
          'Prepare motivation letter',
          'Personal mentor meeting',
          'Check official source',
        ];
const base: CalendarEvent = {
  event_key: 'custom:23000000-0000-4000-8000-000000000010',
  user_id: 'test-only',
  title: labels[0]!,
  category: 'custom',
  origin: 'user_created',
  precision: 'date_only',
  due_date: '2026-11-12',
  due_at: null,
  timezone: null,
  source_url: null,
  checked_at: null,
  verified: false,
  status: 'active',
  revision: '1',
  version: 1,
  updated_at: '2026-11-06T12:00:00Z',
  muted: false,
};
const events =
  p.get('empty') === '1'
    ? []
    : [
        base,
        {
          ...base,
          event_key: 'custom:23000000-0000-4000-8000-000000000011',
          title: labels[1]!,
          due_date: '2026-11-18',
        },
        {
          ...base,
          event_key: 'official:23',
          title: labels[2]!,
          category: 'application' as const,
          origin: 'official' as const,
          verified: true,
          source_url: 'https://fixture.example/official',
          checked_at: '2026-11-05T12:00:00Z',
          due_date: '2026-11-28',
        },
      ];
const data = {
  events,
  preferences: defaultPreferences,
  inbox: [
    {
      id: '23000000-0000-4000-8000-000000000020',
      event_key: base.event_key,
      title: labels[0]!,
      kind: 'reminder' as const,
      category: 'custom',
      created_at: '2026-11-06T12:00:00Z',
      read_at: null,
      archived_at: null,
      due_date: base.due_date,
      due_at: null,
      lead_days: 7,
    },
  ],
  unread: 1,
  saved: 2,
  applications: 0,
  hasProfile: true,
  truncated: false,
  inboxHasMore: false,
};
createRoot(document.getElementById('root')!).render(
  <DeadlineWorkspace
    locale={locale}
    section={(p.get('section') ?? 'calendar') as 'calendar'}
    initial={data}
    today="2026-11-06"
    query={p.toString()}
  />,
);
