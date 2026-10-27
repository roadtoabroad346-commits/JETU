export function wordCount(text: string) {
  return [
    ...new Intl.Segmenter('und', { granularity: 'word' }).segment(text),
  ].filter((part) => part.isWordLike).length;
}
/** Linear, bounded changed-range comparison; no quadratic diff on large drafts. */
export function compareText(before: string, after: string) {
  const a = Array.from(before),
    b = Array.from(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length,
    endB = b.length;
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
export const rubricKeys = [
  'clarity',
  'evidence',
  'structure',
  'specificity',
  'promptFit',
] as const;
