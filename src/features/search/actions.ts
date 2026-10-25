'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { searchFiltersSchema } from './server';

const itemSchema = z.object({
  entityId: z.coerce.number().int().positive(),
  listName: z.string().trim().min(1).max(40).default('Saved'),
  note: z.string().trim().max(1000).optional().default(''),
});

function validLocale(locale: string): Locale {
  return isLocale(locale) ? locale : 'ru';
}

async function authenticatedClient(locale: Locale) {
  try {
    const supabase = await createRequestSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect(`/${locale}/login`);
    return { supabase, user: data.user };
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    redirect(`/${locale}/login`);
  }
}

export async function saveCatalogItem(localeInput: string, entityId: number) {
  const locale = validLocale(localeInput);
  const parsed = itemSchema.safeParse({ entityId, listName: 'Saved' });
  if (!parsed.success) redirect(`/${locale}/search?status=error`);
  const { supabase, user } = await authenticatedClient(locale);
  const { error } = await supabase.from('saved_catalog_items').upsert(
    {
      user_id: user.id,
      catalog_entity_id: parsed.data.entityId,
      list_name: parsed.data.listName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,catalog_entity_id', ignoreDuplicates: true },
  );
  redirect(`/${locale}/saved?status=${error ? 'error' : 'saved'}`);
}

export async function updateCatalogItem(
  localeInput: string,
  id: string,
  formData: FormData,
) {
  const locale = validLocale(localeInput);
  const parsed = itemSchema.safeParse({
    entityId: formData.get('entityId'),
    listName: formData.get('listName'),
    note: formData.get('note'),
  });
  if (!parsed.success) redirect(`/${locale}/saved?status=error`);
  const { supabase, user } = await authenticatedClient(locale);
  const { error } = await supabase
    .from('saved_catalog_items')
    .update({
      list_name: parsed.data.listName,
      note: parsed.data.note || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);
  redirect(`/${locale}/saved?status=${error ? 'error' : 'updated'}`);
}

export async function removeCatalogItem(localeInput: string, id: string) {
  const locale = validLocale(localeInput);
  const { supabase, user } = await authenticatedClient(locale);
  const { error } = await supabase
    .from('saved_catalog_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  redirect(`/${locale}/saved?status=${error ? 'error' : 'removed'}`);
}

export async function saveSearch(
  localeInput: string,
  filtersInput: string,
  formData: FormData,
) {
  const locale = validLocale(localeInput);
  let raw: unknown;
  try {
    raw = JSON.parse(filtersInput);
  } catch {
    redirect(`/${locale}/search?status=error`);
  }
  const parsed = searchFiltersSchema.safeParse(raw);
  const name = z.string().trim().min(1).max(80).safeParse(formData.get('name'));
  if (!parsed.success || !name.success)
    redirect(`/${locale}/search?status=error`);
  const filters = Object.fromEntries(
    Object.entries(parsed.data).filter(
      ([key, value]) =>
        key !== 'page' &&
        key !== 'compare' &&
        value !== '' &&
        value !== 'relevance',
    ),
  );
  const { supabase, user } = await authenticatedClient(locale);
  const { error } = await supabase.from('saved_searches').upsert(
    {
      user_id: user.id,
      name: name.data,
      filters,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,fingerprint' },
  );
  redirect(`/${locale}/saved?status=${error ? 'error' : 'saved'}`);
}

export async function removeSavedSearch(localeInput: string, id: string) {
  const locale = validLocale(localeInput);
  const { supabase, user } = await authenticatedClient(locale);
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  redirect(`/${locale}/saved?status=${error ? 'error' : 'removed'}`);
}
