'use client';

import { createBrowserClient } from '@supabase/ssr';
import { requireSupabaseConfig } from '@/lib/env/public';
import type { Database } from './database.types';

export function createBrowserSupabaseClient() {
  const { url, key } = requireSupabaseConfig();
  return createBrowserClient<Database>(url, key);
}
