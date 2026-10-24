import 'server-only';
import { z } from 'zod';
import { EnvironmentError } from './public';

export function getAdminSecret(): string {
  const result = z
    .string()
    .regex(/^sb_secret_[A-Za-z0-9_-]{20,}$/)
    .safeParse(process.env.SUPABASE_SECRET_KEY);
  if (!result.success) throw new EnvironmentError(['SUPABASE_SECRET_KEY']);
  return result.data;
}
