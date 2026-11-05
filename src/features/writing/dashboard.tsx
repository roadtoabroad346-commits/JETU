import { createRequestSupabaseClient } from '@/lib/supabase/request';
import type { Locale } from '@/lib/i18n/messages';
import { writingCopy } from './copy';
export async function WritingContinuation({ locale }: { locale: Locale }) {
  const t = writingCopy[locale];
  let latest: { id: string; title: string; updated_at: string } | null = null;
  let unavailable = false;
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (data.user) {
      const result = await client
        .from('writing_drafts')
        .select('id,title,updated_at,studio')
        .eq('user_id', data.user.id)
        .order('updated_at', { ascending: false })
        .limit(100);
      if (result.error) unavailable = true;
      else
        latest =
          result.data?.find(
            (row) => !(row.studio as { archived?: boolean } | null)?.archived,
          ) ?? null;
    }
  } catch {
    unavailable = true;
  }
  return (
    <section className="ui-card studio-dashboard-card">
      <p className="eyebrow">{t.private}</p>
      <h2>{t.title}</h2>
      <p>{latest?.title ?? (unavailable ? t.loadError : t.empty)}</p>
      <a
        className="ui-button ui-button--accent"
        href={`/${locale}/writing${latest ? `?draft=${latest.id}` : ''}`}
      >
        {latest ? t.continue : t.newProject}
      </a>
    </section>
  );
}
