import { z } from 'zod';
export const serviceKinds = [
  'essay',
  'scholarship',
  'sop',
  'cv',
  'shortlist',
  'readiness',
  'interview',
  'documents',
  'session',
] as const;
export const rubricKeys = [
  'clarity',
  'structure',
  'specificity',
  'evidence',
  'voice',
  'prompt_fit',
  'grammar',
] as const;
export const safeText = (text: string) =>
  !/(https?:\/\/|www\.|@[\p{L}\p{N}_]|[\w.%+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d ()-]{7,}\d|telegram|whatsapp|instagram|snapchat|discord|телеграм|ватсап)/iu.test(
    text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ''),
  );
const text = (min: number, max: number) =>
  z.string().trim().min(min).max(max).refine(safeText);
const uuid = z.uuid();
const key = uuid;
const request = uuid;
const revision = z.number().int().positive();
const item = z
  .object({
    type: z.enum(['writing', 'vault', 'application']),
    resource: uuid,
    version: uuid,
    download: z.boolean().default(false),
  })
  .strict();
export const commandSchema = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('save_request_draft'),
      service: uuid,
      goal: z.string().max(2000),
      items: z.array(item).max(10),
      expires: z.iso.datetime(),
      revision: z.number().int().min(0),
    })
    .strict(),

  z
    .object({
      op: z.literal('apply'),
      name: text(2, 100),
      bio: text(10, 2000),
      expertise: z.array(text(2, 60)).min(1).max(16),
      languages: z
        .array(z.enum(['ru', 'kk', 'en']))
        .min(1)
        .max(6),
      countries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(20),
      degrees: z.array(z.enum(['bachelor', 'master', 'phd', 'school'])).max(4),
      timezone: z.string().max(80),
      capacity: z.number().int().min(1).max(20),
      terms: z.literal(true),
    })
    .strict(),
  z
    .object({
      op: z.literal('service'),
      kind: z.enum(serviceKinds),
      summary: text(10, 1000),
      deliverables: text(10, 2000),
      hours: z.number().int().min(1).max(720),
      price: z.number().int().min(0).max(100000000),
      currency: z.enum(['KZT', 'USD', 'EUR']),
    })
    .strict(),
  z
    .object({
      op: z.literal('verify'),
      mentor: uuid,
      revision,
      state: z.enum([
        'needs_info',
        'verified',
        'rejected',
        'suspended',
        'revoked',
      ]),
      reason: z.string().trim().min(10).max(1000),
      summary: text(10, 1000),
      attest: z.literal(true),
    })
    .strict(),
  z
    .object({
      op: z.literal('clearance'),
      student: uuid,
      until: z.iso.datetime(),
      guardianRequired: z.boolean(),
      reason: z.string().trim().min(10).max(1000),
      attest: z.literal(true),
    })
    .strict(),
  z
    .object({
      op: z.literal('create'),
      service: uuid,
      goal: text(10, 2000),
      expires: z.iso.datetime(),
      consent: z.literal(true),
      policy: z.literal('mentor-consent-v1'),
      items: z.array(item).max(10),
      key,
    })
    .strict(),
  z
    .object({
      op: z.literal('transition'),
      request,
      revision,
      state: z.enum([
        'accepted',
        'in_review',
        'needs_student_action',
        'completed',
        'disputed',
      ]),
    })
    .strict(),
  ...(['revoke', 'cancel', 'block'] as const).map((op) =>
    z.object({ op: z.literal(op), request }).strict(),
  ),
  z
    .object({
      op: z.literal('comment'),
      request,
      grant: uuid.nullable(),
      parent: uuid.nullable(),
      body: text(1, 2000),
      anchor: z
        .object({
          start: z.number().int().min(0),
          end: z.number().int().positive(),
          quote: z.string().min(1).max(1000),
        })
        .strict()
        .nullable(),
      key,
    })
    .strict(),
  z
    .object({
      op: z.literal('resolve'),
      request,
      id: uuid,
      revision,
      state: z.enum(['suggested', 'resolved', 'rejected']),
    })
    .strict(),
  z
    .object({
      op: z.literal('review'),
      request,
      outcome: z.enum([
        'more_work_needed',
        'ready_for_student_review',
        'incomplete_information',
      ]),
      summary: text(10, 4000),
      rubric: z
        .object(
          Object.fromEntries(
            rubricKeys.map((k) => [k, z.number().int().min(1).max(5)]),
          ) as Record<(typeof rubricKeys)[number], z.ZodNumber>,
        )
        .strict(),
      actions: z
        .array(
          z
            .object({
              text: text(3, 500),
              source: z.url().startsWith('https://').max(2048).nullable(),
            })
            .strict(),
        )
        .max(10),
      key,
    })
    .strict(),
  z
    .object({
      op: z.literal('slot'),
      start: z.iso.datetime(),
      end: z.iso.datetime(),
      timezone: z.string().max(80),
    })
    .strict(),
  z.object({ op: z.literal('book'), request, slot: uuid, key }).strict(),
  z.object({ op: z.literal('cancel_booking'), request, id: uuid }).strict(),
  z
    .object({
      op: z.literal('report'),
      request,
      reason: z.enum([
        'contact',
        'harassment',
        'privacy',
        'integrity',
        'other',
      ]),
      explanation: z.string().max(2000),
    })
    .strict(),
  z.object({ op: z.literal('appeal'), request, id: uuid }).strict(),
  z
    .object({
      op: z.literal('moderate'),
      id: uuid,
      revision,
      state: z.enum(['triaged', 'investigating', 'actioned', 'closed']),
      reason: z.string().min(10).max(1000),
    })
    .strict(),
]);
export type Command = z.infer<typeof commandSchema>;
export type Service = {
  id: string;
  kind: (typeof serviceKinds)[number];
  summary: string;
  deliverables: string;
  turnaround_hours: number;
  price_minor: number;
  currency: string;
};
export type Mentor = {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  languages: string[];
  countries: string[];
  degrees: string[];
  timezone: string;
  verifiedSummary: string;
  capacity: number;
  services: Service[];
  slots: { id: string; starts_at: string; ends_at: string; timezone: string }[];
};
export type RequestRow = {
  id: string;
  student_id: string;
  mentor_id: string;
  goal: string;
  status: string;
  expires_at: string;
  due_at: string;
  revoked_at: string | null;
  revision: number;
  terms_snapshot: Service;
  created_at: string;
};
export type Grant = {
  id: string;
  request_id: string;
  resource_type: 'writing' | 'vault' | 'application';
  resource_id: string;
  version_id: string;
  operations: string[];
  snapshot: { title?: string };
  expires_at: string;
  revoked_at: string | null;
};
export type Comment = {
  id: string;
  request_id: string;
  grant_id: string | null;
  author_id: string;
  parent_id: string | null;
  body: string;
  anchor: { start: number; end: number; quote: string } | null;
  disposition: string;
  revision: number;
  created_at: string;
};
export type Profile = {
  user_id: string;
  display_name: string;
  bio: string;
  expertise: string[];
  languages: string[];
  countries: string[];
  degrees: string[];
  timezone: string;
  capacity: number;
  state: string;
  verified_summary: string;
  decision_reason: string;
  revision: number;
};
export type Material = {
  type: 'writing' | 'vault' | 'application';
  resource: string;
  version: string;
  title: string;
  download: boolean;
};
export type Workspace = {
  requestDrafts: {
    service_id: string;
    goal: string;
    items: {
      type: Material['type'];
      resource: string;
      version: string;
      download: boolean;
    }[];
    consent_until: string;
    revision: number;
  }[];
  actor: { id: string; verifier: boolean; moderator: boolean };
  profile: Profile | null;
  clearance: { approved_until: string } | null;
  requests: RequestRow[];
  grants: Grant[];
  comments: Comment[];
  reviews: {
    id: string;
    request_id: string;
    author_id: string;
    summary: string;
    outcome: string;
    rubric: Record<string, number>;
    actions: { text: string; source: string | null }[];
    created_at: string;
  }[];
  events: {
    id: number;
    request_id: string | null;
    kind: string;
    actor_id: string;
    created_at: string;
  }[];
  materials: Material[];
  bookings: {
    id: string;
    request_id: string;
    slot_id: string;
    state: string;
  }[];
  evidence: {
    id: string;
    mentor_id: string;
    claim: string;
    state: string;
    retain_until: string;
  }[];
  profiles: Profile[];
  reports: {
    id: string;
    request_id: string;
    reason: string;
    explanation: string;
    status: string;
    resolution: string;
    revision: number;
  }[];
};
