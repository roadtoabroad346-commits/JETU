/** A funding label is editorial metadata; never infer a full ride from tuition alone. */
export function fundingDescription(label: string) {
  return (
    (
      {
        unknown: 'Coverage unknown',
        partial: 'Partial coverage',
        full_tuition: 'Full tuition only',
        tuition_stipend: 'Tuition and stipend',
        comprehensive: 'Comprehensive coverage',
      } as Record<string, string>
    )[label] ?? 'Coverage unknown'
  );
}
export function freshness(checked: string | null, now = new Date()) {
  if (!checked) return 'unknown';
  const age = now.getTime() - new Date(checked).getTime();
  if (!Number.isFinite(age) || age < 0) return 'unknown';
  return age > 180 * 86400000 ? 'review_due' : 'current';
}
export async function serverNow() {
  return Date.now();
}
