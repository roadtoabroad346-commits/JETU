import type { Mentor } from './contracts';
export function filterMentors(mentors: Mentor[], params: URLSearchParams) {
  const q = (params.get('q') ?? '').trim().toLocaleLowerCase();
  const language = params.get('language'),
    country = params.get('country'),
    degree = params.get('degree'),
    kind = params.get('service'),
    price = params.get('price');
  const max = Number(params.get('maxPrice') ?? '');
  return mentors
    .filter(
      (m) =>
        (!q ||
          [m.name, m.bio, ...m.expertise, ...m.services.map((s) => s.summary)]
            .join(' ')
            .toLocaleLowerCase()
            .includes(q)) &&
        (!language || m.languages.includes(language)) &&
        (!country || m.countries.includes(country.toUpperCase())) &&
        (!degree || m.degrees.includes(degree)) &&
        (!params.has('available') || m.slots.length > 0) &&
        m.services.some(
          (s) =>
            (!kind || s.kind === kind) &&
            (!price ||
              (price === 'free' ? s.price_minor === 0 : s.price_minor > 0)) &&
            (!params.get('maxPrice') || s.price_minor <= max * 100),
        ),
    )
    .sort((a, b) =>
      params.get('sort') === 'availability'
        ? b.slots.length - a.slots.length
        : a.name.localeCompare(b.name),
    );
}
export function anchorMatches(
  content: string,
  anchor: { start: number; end: number; quote: string },
) {
  return (
    anchor.start >= 0 &&
    anchor.end > anchor.start &&
    Array.from(content).slice(anchor.start, anchor.end).join('') ===
      anchor.quote
  );
}
export function utcSlot(local: string, timezone: string): string | null {
  // Require an explicit offset. Ambiguous/nonexistent wall times are never guessed.
  if (!/T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(local)) return null;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format(
      new Date(local),
    );
    return new Date(local).toISOString();
  } catch {
    return null;
  }
}

export function localDateTimeInput(value: number | string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
