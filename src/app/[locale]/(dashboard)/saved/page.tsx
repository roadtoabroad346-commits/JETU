import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { searchCopy } from '@/features/search/copy';
import {
  removeCatalogItem,
  removeSavedSearch,
  updateCatalogItem,
} from '@/features/search/actions';
import { searchFiltersSchema } from '@/features/search/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: searchCopy[locale].savedTitle,
    robots: { index: false, follow: false },
  };
}

type ItemLabel = { title: string; href: string; type: string };

function savedSearchHref(locale: Locale, value: unknown) {
  const parsed = searchFiltersSchema.safeParse(value);
  if (!parsed.success) return `/${locale}/search`;
  const params = new URLSearchParams();
  for (const [key, field] of Object.entries(parsed.data)) {
    if (
      field !== '' &&
      !(key === 'page' && field === 1) &&
      !(key === 'sort' && field === 'relevance')
    ) {
      params.set(key, String(field));
    }
  }
  return `/${locale}/search?${params}`;
}

export default async function SavedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const t = searchCopy[locale];
  const supabase = await createRequestSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? '';
  const [
    { data: items, error: itemError },
    { data: searches, error: searchError },
  ] = await Promise.all([
    supabase
      .from('saved_catalog_items')
      .select(
        'id,catalog_entity_id,list_name,note,updated_at,catalog_entities(entity_type)',
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('saved_searches')
      .select('id,name,filters,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50),
  ]);
  const groups = {
    degree_program: [] as number[],
    scholarship: [] as number[],
    opportunity: [] as number[],
  };
  for (const item of items ?? []) {
    const type = item.catalog_entities?.entity_type;
    if (
      type === 'degree_program' ||
      type === 'scholarship' ||
      type === 'opportunity'
    )
      groups[type].push(item.catalog_entity_id);
  }
  const [{ data: programs }, { data: scholarships }, { data: opportunities }] =
    await Promise.all([
      groups.degree_program.length
        ? supabase
            .from('degree_programs')
            .select('id,title')
            .in('id', groups.degree_program)
        : Promise.resolve({ data: [] }),
      groups.scholarship.length
        ? supabase
            .from('scholarships')
            .select('id,title,slug')
            .in('id', groups.scholarship)
        : Promise.resolve({ data: [] }),
      groups.opportunity.length
        ? supabase
            .from('opportunities')
            .select('id,title,slug')
            .in('id', groups.opportunity)
        : Promise.resolve({ data: [] }),
    ]);
  const labels = new Map<number, ItemLabel>();
  for (const row of programs ?? [])
    labels.set(row.id, {
      title: row.title,
      href: `/${locale}/programs/${row.id}`,
      type: t.program,
    });
  for (const row of scholarships ?? [])
    labels.set(row.id, {
      title: row.title,
      href: `/${locale}/scholarships/${row.slug}`,
      type: t.scholarship,
    });
  for (const row of opportunities ?? [])
    labels.set(row.id, {
      title: row.title,
      href: `/${locale}/opportunities/${row.slug}`,
      type: t.opportunity,
    });
  const status = (await searchParams).status;
  const statusText =
    status === 'saved'
      ? t.saved
      : status === 'updated'
        ? t.updated
        : status === 'removed'
          ? t.removed
          : status === 'error'
            ? t.actionError
            : '';
  return (
    <main
      id="main"
      tabIndex={-1}
      className="dashboard-main page-shell saved-main"
    >
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">JETU / {t.savedDestination}</p>
          <h1>{t.savedTitle}</h1>
          <p>{t.savedIntro}</p>
        </div>
        <a className="ui-button ui-button--accent" href={`/${locale}/search`}>
          {t.search}
        </a>
      </header>
      {statusText && (
        <p
          className={`feedback-box ${status === 'error' ? 'feedback-box--error' : 'feedback-box--success'}`}
          role="status"
        >
          {statusText}
        </p>
      )}
      {(itemError || searchError) && (
        <p className="feedback-box feedback-box--error" role="alert">
          {t.actionError}
        </p>
      )}
      <section className="saved-section" aria-labelledby="saved-items-title">
        <h2 id="saved-items-title">{t.savedItems}</h2>
        {!items?.length ? (
          <div className="search-state">
            <p>{t.noSavedItems}</p>
            <a href={`/${locale}/search`}>{t.search}</a>
          </div>
        ) : (
          <div className="saved-grid">
            {items.map((item) => {
              const label = labels.get(item.catalog_entity_id);
              return (
                <article className="saved-card" key={item.id}>
                  <p className="section-kicker">{label?.type ?? t.unknown}</p>
                  <h3>
                    {label ? <a href={label.href}>{label.title}</a> : t.unknown}
                  </h3>
                  <form action={updateCatalogItem.bind(null, locale, item.id)}>
                    <input
                      type="hidden"
                      name="entityId"
                      value={item.catalog_entity_id}
                    />
                    <label>
                      {t.listName}
                      <input
                        name="listName"
                        required
                        maxLength={40}
                        defaultValue={item.list_name}
                      />
                    </label>
                    <label>
                      {t.note}
                      <textarea
                        name="note"
                        maxLength={1000}
                        defaultValue={item.note ?? ''}
                      />
                    </label>
                    <button className="ui-button" type="submit">
                      {t.update}
                    </button>
                  </form>
                  <form action={removeCatalogItem.bind(null, locale, item.id)}>
                    <button
                      className="ui-button ui-button--danger"
                      type="submit"
                    >
                      {t.remove}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section className="saved-section" aria-labelledby="saved-searches-title">
        <h2 id="saved-searches-title">{t.savedSearches}</h2>
        {!searches?.length ? (
          <div className="search-state">
            <p>{t.noSavedSearches}</p>
          </div>
        ) : (
          <div className="saved-grid">
            {searches.map((search) => (
              <article className="saved-card" key={search.id}>
                <h3>
                  <a href={savedSearchHref(locale, search.filters)}>
                    {search.name}
                  </a>
                </h3>
                <a
                  className="ui-button"
                  href={savedSearchHref(locale, search.filters)}
                >
                  {t.openSearch}
                </a>
                <form action={removeSavedSearch.bind(null, locale, search.id)}>
                  <button className="ui-button ui-button--danger" type="submit">
                    {t.remove}
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
