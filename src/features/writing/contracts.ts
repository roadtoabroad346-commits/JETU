import { z } from 'zod';
export const writingSaveSchema = z
  .object({
    id: z.uuid(),
    version: z.number().int().min(0).max(200),
    requestId: z.uuid(),
    title: z.string().trim().min(1).max(160),
    kind: z.enum(['essay', 'sop', 'personal_statement', 'cv']),
    content: z
      .string()
      .max(100000)
      .refine((v) => new TextEncoder().encode(v).length <= 100000),
    prompt: z.string().max(4000),
    wordLimit: z.number().int().min(1).max(20000).nullable(),
    applicationId: z.uuid().nullable(),
    rubric: z
      .object({
        clarity: z.boolean().optional(),
        evidence: z.boolean().optional(),
        structure: z.boolean().optional(),
        specificity: z.boolean().optional(),
        promptFit: z.boolean().optional(),
      })
      .strict(),
  })
  .strict();
