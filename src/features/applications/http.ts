import { z } from 'zod';

const uuid = z.uuid();

export const createApplicationSchema = z.object({
  programId: z.number().int().positive(),
  intakeId: z.number().int().positive().nullable().default(null),
  cycleYear: z.number().int().min(2020).max(2200),
  idempotencyKey: uuid,
});

export const updateApplicationSchema = z.object({
  version: z.number().int().positive(),
  notes: z.string().trim().max(12000),
  userReferenceId: z.string().trim().max(160),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export const transitionApplicationSchema = z.object({
  version: z.number().int().positive(),
  toStatus: z.enum([
    'researching',
    'shortlisted',
    'preparing',
    'ready_for_review',
    'ready_to_submit',
    'submitted_external_confirmed',
    'under_review',
    'interview',
    'offer',
    'waitlist',
    'rejected',
    'accepted',
    'declined',
    'enrollment',
    'withdrawn',
  ]),
  reason: z.string().trim().max(2000).default(''),
  evidence: z.string().trim().max(2000).default(''),
  userConfirmed: z.boolean().default(false),
  idempotencyKey: uuid,
});

export const checklistChangeSchema = z.object({
  itemId: uuid.nullable().default(null),
  version: z.number().int().positive().nullable().default(null),
  title: z.string().trim().min(1).max(240),
  status: z.enum(['todo', 'completed', 'not_applicable']),
  mandatory: z.boolean(),
});

export const addScholarshipSchema = z.object({
  scholarshipId: z.number().int().positive(),
  scholarshipCycleId: z.number().int().positive().nullable().default(null),
  cycleYear: z.number().int().min(2020).max(2200),
  idempotencyKey: uuid,
});

export const transitionScholarshipSchema = z.object({
  version: z.number().int().positive(),
  toStatus: z.enum([
    'researching',
    'preparing',
    'ready_to_submit',
    'submitted_external_confirmed',
    'under_review',
    'awarded',
    'not_awarded',
    'withdrawn',
  ]),
  reason: z.string().trim().max(2000).default(''),
  evidence: z.string().trim().max(2000).default(''),
  userConfirmed: z.boolean().default(false),
  idempotencyKey: uuid,
});

export function isUuid(value: string) {
  return uuid.safeParse(value).success;
}
