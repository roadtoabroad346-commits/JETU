import { requestData } from '@/features/writing/client';
import { commandSchema, type Command } from './contracts';
export async function mentorCommand(value: Command): Promise<{ id?: string }> {
  const parsed = commandSchema.safeParse(value);
  if (!parsed.success) throw new Error('VALIDATION_FAILED');
  return requestData('/api/mentors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
}
export function fields(form: HTMLFormElement) {
  return new FormData(form);
}
export function csv(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
