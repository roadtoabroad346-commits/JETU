import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { isLocale } from '@/lib/i18n/messages';
import { loadDeadlineWorkspace, type DeadlineWorkspaceData } from './service';
import { DeadlineWorkspace } from './workspace';
import { localDate } from './model';
export async function DeadlinePage({
  params,
  searchParams,
  section,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  section: 'dashboard' | 'calendar' | 'inbox' | 'settings';
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  let initial: DeadlineWorkspaceData | null = null;
  let failed = false;
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (data.user) initial = await loadDeadlineWorkspace(client, data.user.id);
    else failed = true;
  } catch {
    failed = true;
  }
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams))
    if (typeof v === 'string') query.set(k, v);
  return (
    <DeadlineWorkspace
      locale={locale}
      section={section}
      initial={initial}
      initialError={failed}
      today={localDate(
        new Date().toISOString(),
        initial?.preferences.timezone ?? 'UTC',
      )}
      query={query.toString()}
    />
  );
}
