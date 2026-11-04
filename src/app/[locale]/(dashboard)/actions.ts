'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { mergeProfileDocument } from '@/features/matching/profile';
import {
  profileFormSchema,
  type ProfileSaveState,
} from '@/features/onboarding/model';

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

async function persistProfile(formData: FormData): Promise<ProfileSaveState> {
  const locale = localeOf(formData);
  const expectedVersion = z.coerce
    .number()
    .int()
    .nonnegative()
    .safeParse(formData.get('version'));
  if (!expectedVersion.success) return { status: 'error', error: 'invalid' };
  const parsed = profileFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: 'error',
      error: 'invalid',
      fields: parsed.error.issues.map((issue) => String(issue.path[0])),
    };
  const supabase = await createRequestSupabaseClient();
  const { data: userData, error: identityError } =
    await supabase.auth.getUser();
  if (identityError)
    return {
      status: 'error',
      error:
        identityError.status === 401 || identityError.status === 403
          ? 'session'
          : 'unavailable',
    };
  if (!userData.user) return { status: 'error', error: 'session' };
  const { data: current, error: readError } = await supabase
    .from('student_profiles')
    .select('version,document')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (readError) return { status: 'error', error: 'unavailable' };
  if ((current?.version ?? 0) !== expectedVersion.data)
    return { status: 'error', error: 'conflict' };
  const profileInput: Record<string, string | number> = { ...parsed.data };
  // The older all-fields form does not own the new school-stage field.
  if (!formData.has('grade')) delete profileInput.grade;
  const values = {
    user_id: userData.user.id,
    document: mergeProfileDocument(current?.document, profileInput, locale),
    version: expectedVersion.data + 1,
    updated_at: new Date().toISOString(),
  };
  // Compare at write time too: another request may have saved since our read.
  // A first insert must never overwrite a profile created concurrently.
  const mutation = current
    ? supabase
        .from('student_profiles')
        .update(values)
        .eq('user_id', userData.user.id)
        .eq('version', expectedVersion.data)
    : supabase.from('student_profiles').insert(values);
  const { data: saved, error } = await mutation.select('version').maybeSingle();
  if (error?.code === '23505' || (!error && !saved))
    return { status: 'error', error: 'conflict' };
  if (error) return { status: 'error', error: 'unavailable' };
  return { status: 'saved', version: saved!.version };
}

export async function submitProfile(
  _previous: ProfileSaveState,
  formData: FormData,
): Promise<ProfileSaveState> {
  try {
    return await persistProfile(formData);
  } catch {
    return { status: 'error', error: 'unavailable' };
  }
}

/** Existing form contract retained for links and clients from the previous release. */
export async function saveProfile(formData: FormData) {
  const locale = localeOf(formData);
  const view = formData.get('view') === 'all' ? '&view=all' : '';
  const result = await submitProfile({ status: 'idle' }, formData);
  if (result.error === 'session') redirect(`/${locale}/login`);
  if (result.status === 'error')
    redirect(
      `/${locale}/onboarding?error=${result.error === 'conflict' ? 'conflict' : 'invalid'}${view}`,
    );
  redirect(`/${locale}/onboarding?success=saved${view}`);
}
