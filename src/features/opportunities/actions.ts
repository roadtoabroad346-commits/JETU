'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import {
  defaultOpportunityFilters,
  opportunityRest,
  searchOpportunities,
} from './server';

const actionSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum([
    'saved',
    'planned',
    'preparing',
    'applied_external',
    'completed',
    'withdrawn',
  ]),
  locale: z.string(),
  returnTo: z.enum(['detail', 'activities']),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
type Plan = { id: string; status: string; version: number };

export async function saveOpportunityAction(formData: FormData) {
  const parsed = actionSchema.safeParse(Object.fromEntries(formData));
  const locale =
    parsed.success && isLocale(parsed.data.locale) ? parsed.data.locale : 'ru';
  const target =
    parsed.success && parsed.data.returnTo === 'detail'
      ? `/${locale}/opportunities/${parsed.data.slug}`
      : `/${locale}/dashboard/opportunities`;
  if (!parsed.success) redirect(`${target}?error=invalid`);
  const supabase = await createRequestSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/${locale}/login`);
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('No authenticated session');
    const visible = (
      await searchOpportunities(defaultOpportunityFilters, parsed.data.slug)
    )[0];
    if (!visible || visible.id !== parsed.data.id)
      throw new Error('Opportunity unavailable');
    const token = sessionData.session.access_token;
    if (parsed.data.status === 'saved') {
      await opportunityRest<unknown>(
        'student_opportunity_saves?on_conflict=user_id,opportunity_id',
        {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify({
            user_id: userData.user.id,
            opportunity_id: visible.id,
          }),
        },
        token,
      );
    } else {
      const existing = await opportunityRest<Plan[]>(
        `student_opportunity_plan_actions?user_id=eq.${userData.user.id}&opportunity_id=eq.${visible.id}&select=id,status,version&limit=1`,
        undefined,
        token,
      );
      if (existing[0]) {
        if (existing[0].status !== parsed.data.status) {
          const changed = await opportunityRest<Plan[]>(
            `student_opportunity_plan_actions?id=eq.${existing[0].id}&version=eq.${existing[0].version}`,
            {
              method: 'PATCH',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({
                status: parsed.data.status,
                version: existing[0].version + 1,
              }),
            },
            token,
          );
          if (changed.length !== 1) throw new Error('Concurrent update');
        }
      } else {
        await opportunityRest<unknown>(
          'student_opportunity_plan_actions',
          {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              user_id: userData.user.id,
              opportunity_id: visible.id,
              status: parsed.data.status,
            }),
          },
          token,
        );
      }
    }
  } catch {
    redirect(`${target}?error=save`);
  }
  redirect(`${target}?success=saved`);
}
