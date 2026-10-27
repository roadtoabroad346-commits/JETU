import { z } from 'zod';
import { boundedBytes } from '@/lib/http/body';
import { isIanaTimezone } from './engine';

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const parsed = origin ? new URL(origin) : null;
    const requestUrl = new URL(request.url);
    return Boolean(
      parsed &&
      parsed.host === request.headers.get('host') &&
      parsed.protocol === requestUrl.protocol,
    );
  } catch {
    return false;
  }
}

export async function readBoundedJson(request: Request, maxBytes = 16384) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return { ok: false as const };
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes)
    return { ok: false as const };
  try {
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(
      await boundedBytes(request, maxBytes),
    );
    return { ok: true as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false as const };
  }
}

export const generateRoadmapSchema = z.object({
  locale: z.enum(['ru', 'kk', 'en']),
  cycleYear: z.number().int().min(2020).max(2200),
  timezone: z.string().trim().min(1).max(80).refine(isIanaTimezone),
  availabilityMinutesPerWeek: z.number().int().min(30).max(10080),
  targetIds: z
    .array(z.number().int().positive())
    .max(20)
    .refine(
      (items) => new Set(items).size === items.length,
      'Target IDs must be unique.',
    ),
});

const dateValue = z.union([z.iso.date(), z.null()]);
export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(4000).default(''),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  targetDate: dateValue.default(null),
  note: z.string().trim().max(4000).default(''),
  estimatedMinutes: z.number().int().min(5).max(10080).default(30),
});

export const updateTaskSchema = z
  .object({
    version: z.number().int().positive(),
    status: z.enum(['todo', 'in_progress', 'blocked', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    targetDate: dateValue.optional(),
    note: z.string().trim().max(4000).optional(),
    title: z.string().trim().min(1).max(240).optional(),
    description: z.string().trim().max(4000).optional(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'version'),
    'At least one change is required.',
  );

export const deleteTaskSchema = z.object({
  version: z.number().int().positive(),
});
