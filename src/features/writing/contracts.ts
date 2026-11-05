import { z } from 'zod';
export const kinds = [
  'personal_statement',
  'supplemental',
  'sop',
  'motivation',
  'scholarship',
  'research',
  'cv',
  'activities',
  'email',
  'interview',
  'essay',
] as const;
export const criteria = [
  'clarity',
  'structure',
  'specificity',
  'evidence',
  'voice',
] as const;
const boundedText = (max: number) =>
  z
    .string()
    .max(max)
    .refine((v) => new TextEncoder().encode(v).length <= max);
export const cvSectionSchema = z
  .object({
    id: z.uuid(),
    category: z.enum([
      'education',
      'experience',
      'projects',
      'awards',
      'activities',
      'skills',
      'languages',
    ]),
    heading: z.string().max(120),
    start: z.string().regex(/^$|^\d{4}-(?:0[1-9]|1[0-2])$/),
    end: z.string().regex(/^$|^\d{4}-(?:0[1-9]|1[0-2])$/),
    details: z.string().max(2000),
  })
  .strict()
  .refine((v) => !v.start || !v.end || v.start <= v.end);
export const commentSchema = z
  .object({
    id: z.string().max(80),
    criterion: z.enum(criteria),
    start: z.number().int().min(0),
    end: z.number().int().min(0),
    quote: z.string().max(1000),
    message: z.string().max(1000),
    replacement: z.string().max(1000).optional(),
    state: z.enum(['open', 'dismissed', 'accepted', 'resolved']),
    provenance: z.literal('deterministic-v1'),
  })
  .strict();
export const studioSchema = z
  .object({
    archived: z.boolean().default(false),
    locale: z.enum(['ru', 'kk', 'en']).default('en'),
    sections: z.array(cvSectionSchema).max(16).default([]),
    comments: z.array(commentSchema).max(40).default([]),
    reviewHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    ready: z.boolean().default(false),
    interview: z
      .object({
        scenario: z.enum([
          'motivation',
          'academic',
          'activities',
          'scholarship',
          'reasoning',
        ]),
        question: z.number().int().min(0).max(2),
        remember: z.literal(true),
        answers: z.array(z.string().max(12000)).length(3).default(['', '', '']),
      })
      .strict()
      .optional(),
  })
  .strict();
export const writingSaveSchema = z
  .object({
    id: z.uuid(),
    version: z.number().int().min(0),
    requestId: z.uuid(),
    title: z.string().trim().min(1).max(160),
    kind: z.enum(kinds),
    content: boundedText(100000),
    prompt: z.string().max(4000),
    wordLimit: z.number().int().min(1).max(20000).nullable(),
    applicationId: z.uuid().nullable(),
    promptId: z.uuid().nullable(),
    rubric: z
      .object({
        clarity: z.boolean().optional(),
        structure: z.boolean().optional(),
        specificity: z.boolean().optional(),
        evidence: z.boolean().optional(),
        voice: z.boolean().optional(),
      })
      .strict(),
    studio: studioSchema.refine(
      (v) => new TextEncoder().encode(JSON.stringify(v)).length <= 48000,
    ),
    checkpoint: z.boolean(),
  })
  .strict();
export type WritingInput = z.infer<typeof writingSaveSchema>;
export type Studio = z.infer<typeof studioSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CVSection = z.infer<typeof cvSectionSchema>;
export type Draft = {
  id: string;
  title: string;
  kind: WritingInput['kind'];
  content: string;
  prompt: string;
  word_limit: number | null;
  application_id: string | null;
  prompt_id: string | null;
  rubric: WritingInput['rubric'];
  studio: unknown;
  version: number;
  updated_at: string;
};
export type Revision = {
  id: string;
  version: number;
  created_at: string;
  snapshot: unknown;
};
export type OfficialPrompt = {
  id: string;
  title: string;
  prompt: string;
  cycle: number;
  source_url: string;
  verified_at: string | null;
  valid_until: string | null;
  state: string;
  word_limit: number | null;
  character_limit: number | null;
  count_spaces: boolean | null;
  ai_policy: string;
  program_id: number | null;
  scholarship_id: number | null;
};
export type WorkspaceData = {
  drafts: Draft[];
  applications: { id: string; program_title_snapshot: string }[];
  prompts: OfficialPrompt[];
  aiAvailable: false;
};
export function fromDraft(row: Draft): WritingInput {
  const studio = studioSchema.safeParse(row.studio);
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    content: row.content,
    prompt: row.prompt,
    wordLimit: row.word_limit,
    applicationId: row.application_id,
    promptId: row.prompt_id ?? null,
    rubric: row.rubric,
    version: row.version,
    requestId: crypto.randomUUID(),
    studio: studio.success ? studio.data : studioSchema.parse({}),
    checkpoint: false,
  };
}
export function blank(
  locale: 'ru' | 'kk' | 'en',
  kind: WritingInput['kind'] = 'personal_statement',
): WritingInput {
  return {
    id: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    version: 0,
    title: '',
    kind,
    content: '',
    prompt: '',
    wordLimit: null,
    applicationId: null,
    promptId: null,
    rubric: {},
    studio: studioSchema.parse({ locale }),
    checkpoint: false,
  };
}
