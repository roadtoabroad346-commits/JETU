import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import {
  isMarketingSlug,
  marketing,
  marketingSlugs,
} from '@/lib/i18n/marketing';
import { pageMetadata } from '@/lib/marketing/seo';
import { StructuredData } from '@/components/marketing/structured-data';
import { getPublicEnv } from '@/lib/env/public';
import { Icon } from '@/components/ui/icon';
import { MarketingFooter } from '@/components/marketing/footer';
import { CatalogSearch } from '@/features/catalog/views';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export function generateStaticParams() {
  return marketingSlugs.map((slug) => ({ slug }));
}
export const dynamicParams = false;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isMarketingSlug(slug)) notFound();
  const page = marketing[locale].pages[slug];
  return pageMetadata(locale, slug, page.title, page.description);
}
export default async function MarketingInfoPage({
  params,
  searchParams,
}: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isMarketingSlug(slug)) notFound();
  if (slug === 'universities')
    return <CatalogSearch locale={locale} input={await searchParams} />;
  const t = marketing[locale];
  const content = t.pages[slug];
  return (
    <>
      <main id="main" tabIndex={-1} className="info-main">
        {slug === 'faq' && (
          <StructuredData
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: content.sections.map((section) => ({
                '@type': 'Question',
                name: section.heading,
                acceptedAnswer: { '@type': 'Answer', text: section.body },
              })),
              inLanguage: locale,
              url: new URL(
                `/${locale}/faq`,
                getPublicEnv().NEXT_PUBLIC_APP_URL,
              ).toString(),
            }}
          />
        )}
        <div className="page-shell">
          <div className="info-intro">
            <p className="section-kicker">JETU / {t.availability}</p>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
          </div>
          <div className="info-sections">
            {content.sections.map((section, index) => (
              <section
                className="info-section"
                key={section.heading}
                aria-labelledby={`section-${index}`}
              >
                <span className="journey-number">0{index + 1}</span>
                <div>
                  <h2 id={`section-${index}`}>{section.heading}</h2>
                  <p>{section.body}</p>
                </div>
              </section>
            ))}
          </div>
          <div className="info-next">
            <p>{t.finalBody}</p>
            <a
              className="ui-button ui-button--primary"
              href={`/${locale}/opportunities`}
            >
              {t.heroAction} <Icon name="arrow" />
            </a>
          </div>
        </div>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
