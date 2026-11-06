'use client';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import type { Command, Workspace } from './contracts';
import { mentorCopy } from './copy';
export function MentorAvailability({
  locale,
  data,
  run,
  busy,
}: {
  locale: Locale;
  data: Workspace;
  run: (v: Command) => Promise<void>;
  busy: boolean;
}) {
  const t = mentorCopy[locale],
    [key, setKey] = useState(() => crypto.randomUUID());
  return (
    <section className="mentor-stack">
      <form
        className="mentor-panel mentor-form"
        onChange={() => setKey(crypto.randomUUID())}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run({
            op: 'weekly_slots',
            firstDate: String(f.get('date')),
            startTime: String(f.get('start')),
            endTime: String(f.get('end')),
            weeks: Number(f.get('weeks')),
            key,
          });
        }}
      >
        <h3>{t.weekly}</h3>
        <p>{data.profile?.timezone}</p>
        <label>
          {t.firstDate}
          <input type="date" name="date" required />
        </label>
        <label>
          {t.localStart}
          <input name="start" type="time" required />
        </label>
        <label>
          {t.localEnd}
          <input name="end" type="time" required />
        </label>
        <label>
          {t.weeks}
          <input
            type="number"
            name="weeks"
            defaultValue={4}
            min={1}
            max={12}
            required
          />
        </label>
        <button className="ui-button ui-button--primary" disabled={busy}>
          {t.saveSlot}
        </button>
      </form>
      {(data.availabilityRules ?? [])
        .filter((r) => !r.cancelled_at)
        .map((r) => (
          <article className="mentor-panel" key={r.id}>
            <p>
              {r.first_date} · {r.start_time}–{r.end_time} · {r.weeks} {t.weeks}
            </p>
            <button
              disabled={busy}
              className="ui-button ui-button--secondary"
              onClick={() => void run({ op: 'cancel_rule', id: r.id })}
            >
              {t.cancelRule}
            </button>
          </article>
        ))}
      <form
        className="mentor-panel mentor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run({
            op: 'blackout',
            start: new Date(String(f.get('start'))).toISOString(),
            end: new Date(String(f.get('end'))).toISOString(),
          });
        }}
      >
        <h3>{t.blackout}</h3>
        <label>
          {t.slotStart}
          <input
            name="start"
            pattern=".*(Z|[+-][0-9]{2}:[0-9]{2})"
            placeholder="2026-12-01T10:00:00+05:00"
            required
          />
        </label>
        <label>
          {t.slotEnd}
          <input
            name="end"
            pattern=".*(Z|[+-][0-9]{2}:[0-9]{2})"
            placeholder="2026-12-02T10:00:00+05:00"
            required
          />
        </label>
        <button disabled={busy} className="ui-button ui-button--secondary">
          {t.blackout}
        </button>
      </form>
      {(data.blackouts ?? []).map((b) => (
        <article key={b.id} className="mentor-panel">
          <p>
            {new Date(b.starts_at).toLocaleString(locale)} —{' '}
            {new Date(b.ends_at).toLocaleString(locale)}
          </p>
          <button
            disabled={busy}
            className="ui-button ui-button--secondary"
            onClick={() => void run({ op: 'remove_blackout', id: b.id })}
          >
            {t.removeBlackout}
          </button>
        </article>
      ))}
      <section className="mentor-panel">
        <h3>{t.availability}</h3>
        {(data.slots ?? [])
          .filter((s) => !s.cancelled_at)
          .map((s) => (
            <div className="mentor-service" key={s.id}>
              <p>
                {new Date(s.starts_at).toLocaleString(locale)} —{' '}
                {new Date(s.ends_at).toLocaleString(locale)} · {s.timezone}
              </p>
              <button
                disabled={busy}
                className="ui-button ui-button--secondary"
                onClick={() => void run({ op: 'cancel_slot', id: s.id })}
              >
                {t.cancelSlot}
              </button>
            </div>
          ))}
      </section>
    </section>
  );
}
