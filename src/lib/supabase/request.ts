import 'server-only';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './server';

export async function createRequestSupabaseClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      } catch {
        // Server Components cannot write cookies. The proxy refreshes them.
      }
    },
  });
}
