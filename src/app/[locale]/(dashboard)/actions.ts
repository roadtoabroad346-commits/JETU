'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { mergeProfileDocument } from '@/features/matching/profile';

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

const profileSchema = z
  .object({
    country: z.string().trim().min(2).max(80),
    studyLevel: z.enum([
      'foundation',
      'associate',
      'bachelor',
      'master',
      'doctorate',
    ]),
    field: z.string().trim().min(2).max(120),
    budget: z.coerce.number().int().min(0).max(1_000_000),
    nationality: z.union([
      z.literal(''),
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{2}$/),
    ]),
    residency: z.union([
      z.literal(''),
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{2}$/),
    ]),
    educationLevel: z.enum(['', 'secondary', 'bachelor', 'master', 'other']),
    graduationYear: z.union([
      z.literal(''),
      z.coerce.number().int().min(1950).max(2200),
    ]),
    gpa: z.union([z.literal(''), z.coerce.number().min(0).max(100)]),
    gpaScale: z.union([z.literal(''), z.coerce.number().positive().max(100)]),
    ielts: z.union([z.literal(''), z.coerce.number().min(0).max(9)]),
    toefl: z.union([z.literal(''), z.coerce.number().min(0).max(120)]),
    hsk: z.union([z.literal(''), z.coerce.number().min(0).max(300)]),
    topik: z.union([z.literal(''), z.coerce.number().min(0).max(6)]),
    sat: z.union([z.literal(''), z.coerce.number().min(400).max(1600)]),
    act: z.union([z.literal(''), z.coerce.number().min(1).max(36)]),
  })
  .refine(
    (value) =>
      (value.gpa === '') === (value.gpaScale === '') &&
      (value.gpa === '' ||
        value.gpaScale === '' ||
        value.gpa <= value.gpaScale),
    {
      path: ['gpa'],
      message:
        'GPA and grading scale must be entered together and be consistent.',
    },
  );

export async function saveProfile(formData: FormData) {
  const locale = localeOf(formData);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/${locale}/onboarding?error=invalid`);
  const supabase = await createRequestSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/${locale}/login`);
  const { data: current, error: readError } = await supabase
    .from('student_profiles')
    .select('version,document')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (readError) redirect(`/${locale}/onboarding?error=invalid`);
  const { error } = await supabase.from('student_profiles').upsert({
    user_id: userData.user.id,
    document: mergeProfileDocument(current?.document, parsed.data, locale),
    version: current ? current.version + 1 : 1,
    updated_at: new Date().toISOString(),
  });
  if (error) redirect(`/${locale}/onboarding?error=invalid`);
  redirect(`/${locale}/onboarding?success=saved`);
}
