'use client';
import type { Locale } from '@/lib/i18n/messages';
import type { CVSection } from './contracts';
import { sectionCopy, writingCopy } from './copy';
export function CVBuilder({
  locale,
  sections,
  onChange,
}: {
  locale: Locale;
  sections: CVSection[];
  onChange: (sections: CVSection[]) => void;
}) {
  const t = writingCopy[locale],
    labels = sectionCopy[locale];
  const update = (id: string, patch: Partial<CVSection>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  return (
    <section className="studio-cv" aria-label={t.cv}>
      <p>{t.sectionPrivacy}</p>
      {sections.map((s, index) => (
        <fieldset key={s.id}>
          <legend>
            {t.section} {index + 1}
          </legend>
          <label>
            {t.section}
            <select
              value={s.category}
              onChange={(e) =>
                update(s.id, {
                  category: e.target.value as CVSection['category'],
                })
              }
            >
              {Object.entries(labels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.heading}
            <input
              maxLength={120}
              value={s.heading}
              onChange={(e) => update(s.id, { heading: e.target.value })}
            />
          </label>
          <div className="studio-date-row">
            <label>
              {t.start}
              <input
                type="month"
                value={s.start}
                onChange={(e) => update(s.id, { start: e.target.value })}
              />
            </label>
            <label>
              {t.end}
              <input
                type="month"
                value={s.end}
                onChange={(e) => update(s.id, { end: e.target.value })}
              />
            </label>
          </div>
          {s.start && s.end && s.start > s.end && (
            <p role="alert">{t.dateError}</p>
          )}
          <label>
            {t.details}
            <textarea
              rows={4}
              maxLength={2000}
              value={s.details}
              onChange={(e) => update(s.id, { details: e.target.value })}
            />
          </label>
          <div className="studio-actions">
            <button
              type="button"
              className="ui-button ui-button--secondary"
              disabled={index === 0}
              onClick={() => {
                const next = [...sections];
                [next[index - 1], next[index]] = [
                  next[index]!,
                  next[index - 1]!,
                ];
                onChange(next);
              }}
            >
              {t.moveUp}
            </button>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              disabled={index === sections.length - 1}
              onClick={() => {
                const next = [...sections];
                [next[index + 1], next[index]] = [
                  next[index]!,
                  next[index + 1]!,
                ];
                onChange(next);
              }}
            >
              {t.moveDown}
            </button>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() =>
                onChange(sections.filter((item) => item.id !== s.id))
              }
            >
              {t.remove}
            </button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        className="ui-button ui-button--secondary"
        disabled={sections.length >= 16}
        onClick={() =>
          onChange([
            ...sections,
            {
              id: crypto.randomUUID(),
              category: 'education',
              heading: '',
              start: '',
              end: '',
              details: '',
            },
          ])
        }
      >
        {t.addSection}
      </button>
    </section>
  );
}
