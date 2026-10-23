'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPublicEnv } from '@/lib/env/public';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';

const credentials = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
});

function localeOf(formData: FormData): Locale {
  const locale = String(formData.get('locale') ?? '');
  return isLocale(locale) ? locale : 'ru';
}

function authUrl(locale: Locale, path: string, state?: string) {
  return `/${locale}/${path}${state ? `?${state}` : ''}`;
}

export async function signIn(formData: FormData) {
  const locale = localeOf(formData);
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(authUrl(locale, 'login', 'error=invalid'));
  const supabase = await createRequestSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(authUrl(locale, 'login', 'error=invalid'));
  redirect(authUrl(locale, 'dashboard'));
}

export async function signUp(formData: FormData) {
  const locale = localeOf(formData);
  const parsed = credentials
    .extend({ name: z.string().trim().min(2).max(80) })
    .safeParse(Object.fromEntries(formData));
  if (
    !parsed.success ||
    formData.get('terms') !== 'on' ||
    formData.get('age') !== 'on'
  )
    redirect(authUrl(locale, 'signup', 'error=invalid'));

  const supabase = await createRequestSupabaseClient();
  const callback = new URL(
    '/auth/callback',
    getPublicEnv().NEXT_PUBLIC_APP_URL,
  );
  callback.searchParams.set('next', authUrl(locale, 'dashboard'));
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callback.toString(),
      data: { display_name: parsed.data.name, locale },
    },
  });
  if (error) redirect(authUrl(locale, 'signup', 'error=invalid'));
  redirect(
    data.session
      ? authUrl(locale, 'dashboard')
      : authUrl(locale, 'signup', 'success=check-email'),
  );
}

export async function requestPasswordReset(formData: FormData) {
  const locale = localeOf(formData);
  const email = z
    .string()
    .trim()
    .email()
    .max(320)
    .safeParse(formData.get('email'));
  if (email.success) {
    try {
      const supabase = await createRequestSupabaseClient();
      const callback = new URL(
        '/auth/callback',
        getPublicEnv().NEXT_PUBLIC_APP_URL,
      );
      callback.searchParams.set('next', authUrl(locale, 'reset-password'));
      await supabase.auth.resetPasswordForEmail(email.data, {
        redirectTo: callback.toString(),
      });
    } catch {
      // Do not expose whether the account or auth provider is available.
    }
  }
  redirect(authUrl(locale, 'forgot-password', 'success=sent'));
}

export async function updatePassword(formData: FormData) {
  const locale = localeOf(formData);
  const password = z
    .string()
    .min(8)
    .max(128)
    .safeParse(formData.get('password'));
  if (!password.success)
    redirect(authUrl(locale, 'reset-password', 'error=invalid'));
  const supabase = await createRequestSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub)
    redirect(authUrl(locale, 'login', 'error=recovery'));
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) redirect(authUrl(locale, 'reset-password', 'error=invalid'));
  redirect(authUrl(locale, 'dashboard', 'success=password-updated'));
}
