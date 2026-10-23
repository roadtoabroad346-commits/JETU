import { z } from 'zod';

export class EnvironmentError extends Error {
  constructor(fields: string[]) {
    super(
      `Invalid environment configuration: ${fields.join(', ')}. Check .env.example.`,
    );
    this.name = 'EnvironmentError';
  }
}

export const isLocalUrl = (url: URL) =>
  ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

const safeUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash &&
    url.pathname === '/' &&
    (url.protocol === 'https:' || (url.protocol === 'http:' && isLocalUrl(url)))
  );
});

export function isAnonKey(key: string): boolean {
  try {
    const parts = key.split('.');
    if (parts.length !== 3 || !parts[1]) return false;
    const payload: unknown = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return z.object({ role: z.literal('anon') }).safeParse(payload).success;
  } catch {
    return false;
  }
}

const publishableKey = z
  .string()
  .min(20)
  .refine(
    (key) => /^sb_publishable_[A-Za-z0-9_-]+$/.test(key) || isAnonKey(key),
  );
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional(),
  );
const publicSchema = z
  .object({
    NEXT_PUBLIC_APP_URL: safeUrl.default('http://localhost:3000'),
    NEXT_PUBLIC_SUPABASE_URL: optional(safeUrl),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optional(publishableKey),
  })
  .superRefine((env, context) => {
    if (
      Boolean(env.NEXT_PUBLIC_SUPABASE_URL) !==
      Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_SUPABASE_URL'],
        message: 'Configure both Supabase public values.',
      });
    }
  });

export function parsePublicEnv(input: Record<string, unknown>) {
  const result = publicSchema.safeParse(input);
  if (!result.success)
    throw new EnvironmentError([
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ]);
  return result.data;
}

// Direct references are required for Next.js browser env substitution. Never spread process.env.
export function getPublicEnv() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;
  const vercelHost = process.env.VERCEL_URL;
  const previewUrl =
    process.env.VERCEL_ENV === 'preview' &&
    vercelHost &&
    /^[A-Za-z0-9.-]+\.vercel\.app$/.test(vercelHost)
      ? `https://${vercelHost}`
      : undefined;
  return parsePublicEnv({
    NEXT_PUBLIC_APP_URL:
      previewUrl &&
      (!configuredAppUrl || configuredAppUrl === 'http://localhost:3000')
        ? previewUrl
        : configuredAppUrl,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function requireSupabaseConfig() {
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new EnvironmentError([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ]);
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
