import { z } from 'zod';

const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const verificationState = z.enum([
  'needs_review',
  'verified',
  'conflicted',
  'stale',
  'rejected',
]);
const base = {
  entityId: id,
  expectedRevision: id,
  note: z.string().trim().min(10).max(1000),
  attested: z.literal(true),
};
const claim = {
  claimId: id,
  expectedHash: z.string().regex(/^[a-f0-9]{32,64}$/),
  expectedState: verificationState,
};
export const editorCommandSchema = z.discriminatedUnion('action', [
  z.object({ ...base, ...claim, action: z.literal('review_claim') }).strict(),
  z.object({ ...base, ...claim, action: z.literal('reject_claim') }).strict(),
  z
    .object({
      ...base,
      expectedRecordHash: z.string().regex(/^[a-f0-9]{32}$/),
      action: z.literal('publish'),
    })
    .strict(),
  z.object({ ...base, action: z.literal('unpublish') }).strict(),
]);
export type EditorCommand = z.infer<typeof editorCommandSchema>;

const sourceClaim = z.object({
  id,
  key: z.string(),
  text: z.string(),
  hash: z.string(),
  state: verificationState,
  sourceUrl: z.url().refine((url) => url.startsWith('https://')),
  publisher: z.string(),
  checkedAt: z.string(),
  sourceActive: z.boolean(),
});
export const editorQueueSchema = z.object({
  role: z.enum(['editor', 'reviewer', 'admin']),
  entities: z
    .array(
      z.object({
        id,
        type: z.string(),
        status: z.string(),
        verification: z.string(),
        revision: id,
        record: z.record(z.string(), z.unknown()).nullable(),
        recordHash: z.string(),
        parents: z.array(
          z.object({
            id,
            type: z.string(),
            status: z.string(),
            verification: z.string(),
          }),
        ),
        claims: z.array(sourceClaim),
      }),
    )
    .max(20),
  nextCursor: id.nullable(),
  events: z
    .array(
      z.object({
        id,
        entity_id: id,
        action: z.string(),
        note: z.string(),
        created_at: z.string(),
        before_snapshot: z.record(z.string(), z.unknown()),
        after_snapshot: z.record(z.string(), z.unknown()),
      }),
    )
    .max(20),
});
export type EditorQueue = z.infer<typeof editorQueueSchema>;

export const editorCursorSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
