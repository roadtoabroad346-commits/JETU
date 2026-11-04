'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPublicEnv } from '@/lib/env/public';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import {
  accountSchema,
  registrationSchema,
  privacyVersion,
  type AccountState,
} from '@/features/onboarding/model';

function localeOf(formData: FormData): Locale {
  const locale = String(formData.get('locale') ?? '');
  return isLocale(locale) ? locale : 'ru';
}

function authUrl(locale: Locale, path: string, state?: string) {
  return `/${locale}/${path}${state ? `?${state}` : ''}`;
}

export async function submitSignIn(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const locale = localeOf(formData);
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: 'error',
      error: 'invalid',
      fields: parsed.error.issues.map((issue) => String(issue.path[0])),
    };
  try {
    const supabase = await createRequestSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error)
      return {
        status: 'error',
        error: error.status === 429 ? 'rate' : 'credentials',
      };
  } catch {
    return { status: 'error', error: 'unavailable' };
  }
  redirect(authUrl(locale, 'dashboard'));
}

export async function submitSignUp(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const locale = localeOf(formData);
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || formData.get('privacyVersion') !== privacyVersion)
    return {
      status: 'error',
      error: 'invalid',
      fields: parsed.success
        ? ['terms']
        : parsed.error.issues.map((issue) => String(issue.path[0])),
    };
  let signedIn = false;
  try {
    const supabase = await createRequestSupabaseClient();
    const callback = new URL(
      '/auth/callback',
      getPublicEnv().NEXT_PUBLIC_APP_URL,
    );
    callback.searchParams.set('next', authUrl(locale, 'onboarding'));
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: callback.toString(),
        // Consent is a dated declaration, never an authorization claim.
        data: {
          display_name: parsed.data.name,
          locale,
          consent: {
            privacyVersion,
            acceptedAt: new Date().toISOString(),
            ageDeclaration: true,
          },
        },
      },
    });
    if (error)
      return {
        status: 'error',
        error: error.status === 429 ? 'rate' : 'unavailable',
      };
    signedIn = Boolean(data.session);
  } catch {
    return { status: 'error', error: 'unavailable' };
  }
  if (signedIn) redirect(authUrl(locale, 'onboarding'));
  return { status: 'check-email' };
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
