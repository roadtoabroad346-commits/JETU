import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { opportunityCopy } from '@/features/opportunities/copy';
import {
  OpportunityUnavailable,
  opportunityRest,
} from '@/features/opportunities/server';
import { saveOpportunityAction } from '@/features/opportunities/actions';
import { OpportunitySubmitButton } from '@/features/opportunities/submit-button';

export const dynamic = 'force-dynamic';
type Saved = { opportunity_id: number };
type Plan = {
  opportunity_id: number;
  status:
    'planned' | 'preparing' | 'applied_external' | 'completed' | 'withdrawn';
};
type Detail = {
  id: number;
  slug: string;
  title: string;
  opportunity_type: string;
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = opportunityCopy[locale];
  const supabase = await createRequestSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();
  let saves: Saved[] = [];
  let plans: Plan[] = [];
  let details: Detail[] = [];
  let unavailable = false;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new OpportunityUnavailable('No session');
    const token = sessionData.session.access_token;
    [saves, plans] = await Promise.all([
      opportunityRest<Saved[]>(
        'student_opportunity_saves?select=opportunity_id&order=created_at.desc&limit=50',
        undefined,
        token,
      ),
      opportunityRest<Plan[]>(
        'student_opportunity_plan_actions?select=opportunity_id,status&order=updated_at.desc&limit=50',
        undefined,
        token,
      ),
    ]);
    const ids = [
      ...new Set([...saves, ...plans].map((row) => row.opportunity_id)),
    ];
    if (ids.length)
      details = await opportunityRest<Detail[]>(
        `opportunities?id=in.(${ids.join(',')})&select=id,slug,title,opportunity_type`,
        undefined,
        token,
      );
  } catch {
    unavailable = true;
  }
  const query = await searchParams;
  const rows = [
    ...new Set([...saves, ...plans].map((row) => row.opportunity_id)),
  ];
  return (
    <main id="main" className="dashboard-main page-shell catalog-main">
      <p className="section-kicker">JETU / {t.activities}</p>
      <h1>{t.activities}</h1>
      <p>{t.intro}</p>
      <p>
        <a href={`/${locale}/opportunities`}>{t.back}</a>
      </p>
      {query.success && (
        <p role="status" className="feedback-box feedback-box--success">
          {t.success}
        </p>
      )}
      {query.error && (
        <p role="alert" className="feedback-box feedback-box--error">
          {t.failure}
        </p>
      )}
      {unavailable ? (
        <p role="status" className="catalog-state">
          {t.unavailable}
        </p>
      ) : rows.length === 0 ? (
        <p role="status" className="catalog-state">
          {t.noActions}
        </p>
      ) : (
        <div className="catalog-list">
          {rows.map((id) => {
            const item = details.find((detail) => detail.id === id);
            const plan = plans.find((row) => row.opportunity_id === id);
            return (
              <article className="catalog-card" key={id}>
                <p className="section-kicker">
                  {item
                    ? t.kinds[item.opportunity_type as keyof typeof t.kinds]
                    : t.unknown}
                </p>
                <h2>
                  {item ? (
                    <a href={`/${locale}/opportunities/${item.slug}`}>
                      {item.title}
                    </a>
                  ) : (
                    `${t.unknown} #${id}`
                  )}
                </h2>
                <p>
                  {t.status}: {plan ? t[plan.status] : t.saved}
                </p>
                {item && (
                  <form
                    action={saveOpportunityAction}
                    className="catalog-filter-actions"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="returnTo" value="activities" />
                    <label>
                      {t.status}
                      <select
                        name="status"
                        defaultValue={plan?.status ?? 'saved'}
                      >
                        {(
                          [
                            'saved',
                            'planned',
                            'preparing',
                            'applied_external',
                            'completed',
                            'withdrawn',
                          ] as const
                        ).map((status) => (
                          <option key={status} value={status}>
                            {t[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <OpportunitySubmitButton
                      label={t.update}
                      pendingLabel={t.working}
                    />
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
