import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScholarshipEditor } from './scholarship-editor';

export const dynamic = 'force-dynamic';
export default async function AdminScholarships({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  let role: string | null = null;
  try {
    const jar = await cookies();
    const db = createServerSupabaseClient({
      getAll: () => jar.getAll(),
      setAll: (items) =>
        items.forEach(({ name, value, options }) =>
          jar.set(name, value, options),
        ),
    });
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) {
      const membership = await db
        .from('scholarship_editor_memberships')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      role = membership.data?.role ?? null;
    }
  } catch {
    /* Closed when Auth or configuration is unavailable. */
  }
  if (!role) notFound();
  return (
    <main id="main" className="page-shell scholarship-main">
      <div className="scholarship-hero">
        <p className="section-kicker">JETU / EDITORIAL</p>
        <h1>Scholarship desk</h1>
        <p>
          Drafts require official evidence. Reviewer approval is required before
          publication.
        </p>
      </div>
      <ScholarshipEditor role={role} />
    </main>
  );
}
