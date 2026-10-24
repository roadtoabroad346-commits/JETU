import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getAdminSecret } from '@/lib/env/server';
import { requireSupabaseConfig } from '@/lib/env/public';
import type { Database } from './database.types';

/** Bypasses RLS. Never use for ordinary user queries; authorize before every future call. */
export function createAdminSupabaseClient() {
  const { url } = requireSupabaseConfig();
  return createClient<Database>(url, getAdminSecret(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
