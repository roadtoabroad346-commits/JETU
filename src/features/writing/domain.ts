import type { Comment, CVSection, WritingInput } from './contracts';
export function counts(text: string) {
  return {
    words: [
      ...new Intl.Segmenter('und', { granularity: 'word' }).segment(text),
    ].filter((p) => p.isWordLike).length,
    characters: Array.from(text).length,
    withoutSpaces: Array.from(text.replace(/\s/gu, '')).length,
  };
}
/** Code-point-safe linear changed-range comparison, not an edit-distance score. */
export function compareText(before: string, after: string) {
  const a = Array.from(before),
    b = Array.from(after);
  let start = 0,
    endA = a.length,
    endB = b.length;
  while (start < endA && start < endB && a[start] === b[start]) start++;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  return {
    unchanged: a.slice(0, start).join(''),
    removed: a.slice(start, endA).join(''),
    added: b.slice(start, endB).join(''),
    suffix: a.slice(endA).join(''),
  };
}
/** Anchors use browser/textarea UTF-16 offsets, including exact quote identity.
 * Changed reviews never silently reattach to repeated or unrelated text. */
export function anchorValid(
  text: string,
  c: Comment,
  reviewedHash: string | undefined,
  currentHash: string,
) {
  return (
    Boolean(reviewedHash) &&
    currentHash === reviewedHash &&
    text.slice(c.start, c.end) === c.quote
  );
}
export async function contentHash(text: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
export type ReviewCode =
  'paragraphs' | 'longSentence' | 'repeated' | 'reflection' | 'specificity';
export function deterministicReview(text: string): {
  criterion: Comment['criterion'];
  start: number;
  end: number;
  quote: string;
  code: ReviewCode;
  replacement?: string;
}[] {
  const result: ReturnType<typeof deterministicReview> = [];
  const add = (
    criterion: Comment['criterion'],
    start: number,
    quote: string,
    code: ReviewCode,
    replacement?: string,
  ) => {
    if (quote && result.length < 12)
      result.push({
        criterion,
        start,
        end: start + quote.length,
        quote,
        code,
        ...(replacement === undefined ? {} : { replacement }),
      });
  };
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/u)
    .filter(Boolean);
  if (counts(text).words > 100 && paragraphs.length === 1)
    add(
      'structure',
      0,
      text.slice(0, Math.min(text.length, 100)),
      'paragraphs',
    );
  for (const part of new Intl.Segmenter('und', {
    granularity: 'sentence',
  }).segment(text)) {
    if (counts(part.segment).words > 35)
      add('clarity', part.index, part.segment.slice(0, 900), 'longSentence');
  }
  const duplicate = /(?<![\p{L}\p{N}])([\p{L}]+)([ \t]+)\1(?![\p{L}\p{N}])/giu;
  for (const m of text.matchAll(duplicate))
    add('clarity', m.index, m[0], 'repeated', m[1]);
  if (text.trim() && result.length === 0) {
    const start = text.search(/\S/u);
    add(
      'specificity',
      start,
      text.slice(start, start + Math.min(120, text.length - start)),
      'specificity',
    );
  }
  if (text.trim()) {
    const start = Math.max(0, text.lastIndexOf('\n') + 1);
    add('voice', start, text.slice(start, start + 160), 'reflection');
  }
  return result;
}
export function cvText(
  title: string,
  sections: CVSection[],
  labels: Record<CVSection['category'], string>,
) {
  return [
    title,
    ...sections.map((s) =>
      [
        labels[s.category],
        s.heading,
        [s.start, s.end].filter(Boolean).join(' — '),
        s.details,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ].join('\n\n');
}
export function readyToMark(input: WritingInput) {
  return (
    Boolean(input.content.trim()) &&
    (!input.wordLimit || counts(input.content).words <= input.wordLimit) &&
    ['clarity', 'structure', 'specificity', 'evidence', 'voice'].every(
      (k) => input.rubric[k as keyof typeof input.rubric],
    ) &&
    !input.studio.comments.some((c) => c.state === 'open')
  );
}
export function exportText(title: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 70) || 'JETU'}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
