'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';

function localeOf(formData: FormData): Locale {
  const locale = String(formData.get('locale') ?? '');
  return isLocale(locale) ? locale : 'ru';
}

export async function signOut(formData: FormData) {
  const locale = localeOf(formData);
  const supabase = await createRequestSupabaseClient();
  await supabase.auth.signOut({ scope: 'global' });
  redirect(`/${locale}/login`);
}

const profileSchema = z.object({
  country: z.string().trim().min(2).max(80),
  studyLevel: z.string().trim().min(2).max(80),
  field: z.string().trim().min(2).max(120),
  budget: z.coerce.number().int().min(0).max(1_000_000),
});

export async function saveProfile(formData: FormData) {
  const locale = localeOf(formData);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/${locale}/onboarding?error=invalid`);
  const supabase = await createRequestSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/${locale}/login`);
  const { data: current, error: readError } = await supabase
    .from('student_profiles')
    .select('version')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (readError) redirect(`/${locale}/onboarding?error=invalid`);
  const { error } = await supabase.from('student_profiles').upsert({
    user_id: userData.user.id,
    document: { ...parsed.data, consent: { accepted: true }, locale },
    version: current ? current.version + 1 : 1,
    updated_at: new Date().toISOString(),
  });
  if (error) redirect(`/${locale}/onboarding?error=invalid`);
  redirect(`/${locale}/onboarding?success=saved`);
}
