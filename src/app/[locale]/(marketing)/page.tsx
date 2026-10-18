import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DemoPreview } from '@/components/marketing/demo-preview';
import { isLocale } from '@/lib/i18n/messages';
import { marketing } from '@/lib/i18n/marketing';
import { pageMetadata } from '@/lib/marketing/seo';
import { Icon } from '@/components/ui/icon';
import { MarketingFooter } from '@/components/marketing/footer';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = marketing[locale];
  return pageMetadata(locale, '', t.heroTitle, t.heroDescription);
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = marketing[locale];
  return (
    <>
      <main id="main" tabIndex={-1}>
        <section className="landing-hero">
          <div className="page-shell hero-grid">
            <div className="hero-copy">
              <p className="hero-eyebrow">{t.availability}</p>
              <h1>{t.heroTitle}</h1>
              <p className="hero-description">{t.heroDescription}</p>
              <div className="hero-actions">
                <a
                  className="ui-button ui-button--accent"
                  href={`/${locale}/opportunities`}
                >
                  {t.heroAction} <Icon name="arrow" />
                </a>
                <a className="hero-text-link" href={`/${locale}/how-it-works`}>
                  {t.heroSecondary} <Icon name="arrow" />
                </a>
              </div>
            </div>
            <DemoPreview locale={locale} />
          </div>
        </section>

        <section
          className="landing-section page-shell"
          aria-labelledby="journey-title"
        >
          <div className="section-intro">
            <p className="section-kicker">01 / JETU</p>
            <h2 id="journey-title">{t.sectionJourney}</h2>
            <p>{t.sectionJourneyIntro}</p>
          </div>
          <ol className="journey-grid">
            {t.steps.map((step, index) => (
              <li key={step.title} className="journey-card">
                <span className="journey-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="landing-section landing-section-tint"
          aria-labelledby="tools-title"
        >
          <div className="page-shell">
            <div className="section-intro">
              <p className="section-kicker">02 / JETU</p>
              <h2 id="tools-title">{t.sectionTools}</h2>
            </div>
            <div className="tool-grid">
              {t.tools.map((tool, index) => (
                <article className="tool-card" key={tool.title}>
                  <span className="tool-index" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <h3>{tool.title}</h3>
                  <p>{tool.body}</p>
                  <a href={`/${locale}/${tool.slug}`}>
                    {t.explore} <Icon name="arrow" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="landing-section page-shell trust-grid"
          aria-labelledby="trust-title"
        >
          <div>
            <p className="section-kicker">03 / JETU</p>
            <h2 id="trust-title">{t.sectionTrust}</h2>
          </div>
          <div className="trust-copy">
            <p>{t.trustBody}</p>
            <a href={`/${locale}/scholarships`}>
              {t.pages.scholarships.title} <Icon name="arrow" />
            </a>
          </div>
        </section>

        <section
          className="landing-section landing-section-tint"
          aria-labelledby="pricing-title"
        >
          <div className="page-shell trust-grid">
            <div>
              <p className="section-kicker">04 / JETU</p>
              <h2 id="pricing-title">{t.sectionPricing}</h2>
            </div>
            <div className="trust-copy">
              <p>{t.pricingBody}</p>
              <a href={`/${locale}/pricing`}>
                {t.pages.pricing.title} <Icon name="arrow" />
              </a>
            </div>
          </div>
        </section>

        <section
          className="landing-section page-shell"
          aria-labelledby="faq-title"
        >
          <div className="section-intro">
            <p className="section-kicker">05 / JETU</p>
            <h2 id="faq-title">{t.sectionFaq}</h2>
          </div>
          <div className="faq-list">
            {t.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <a className="section-more" href={`/${locale}/faq`}>
            {t.pages.faq.title} <Icon name="arrow" />
          </a>
        </section>

        <section className="landing-end" aria-labelledby="end-title">
          <div className="page-shell end-inner">
            <div>
              <h2 id="end-title">{t.finalTitle}</h2>
              <p>{t.finalBody}</p>
            </div>
            <a
              className="ui-button ui-button--accent"
              href={`/${locale}/opportunities`}
            >
              {t.heroAction} <Icon name="arrow" />
            </a>
          </div>
        </section>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
