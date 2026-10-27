import { z } from 'zod';
import { categories } from './files';
const id = z.uuid();
export const uploadSchema = z
  .object({
    documentId: id.nullable().default(null),
    category: z.enum(categories),
    name: z.string().min(1).max(240),
    purpose: z.string().trim().max(500).default(''),
    applicationId: id.nullable().default(null),
    draftId: id.nullable().default(null),
    recommendationId: id.nullable().default(null),
    requestId: id,
  })
  .strict()
  .refine(
    (v) =>
      !['identity', 'financial'].includes(v.category) ||
      (v.applicationId && v.purpose.length >= 10),
    'Sensitive documents need a relevant application and a specific purpose.',
  );
export const vaultCommand = z.discriminatedUnion('action', [
  z
    .object({
      action: z.enum(['archive', 'restore', 'delete']),
      documentId: id,
      confirmed: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.enum(['link', 'unlink']),
      documentId: id,
      versionId: id,
      applicationId: id,
      taskId: id.nullable().default(null),
    })
    .strict(),
  z
    .object({
      action: z.literal('portfolio'),
      name: z.string().trim().min(1).max(160),
      url: z
        .url()
        .max(2048)
        .refine((v) => {
          const u = new URL(v);
          return u.protocol === 'https:' && !u.username && !u.password;
        }),
    })
    .strict(),
]);
export const recommendationCommand = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('create'),
      applicationId: id,
      email: z.email().max(254),
      context: z.string().trim().min(10).max(2000),
      dueDate: z.iso.date().nullable(),
      consent: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.literal('respond'),
      token: z.string().regex(/^[a-f0-9]{64}$/),
      accept: z.boolean(),
    })
    .strict(),
  z.object({ action: z.literal('cancel'), id }).strict(),
]);
export const uuidSchema = id;
