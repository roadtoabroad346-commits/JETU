import { marketing } from '@/lib/i18n/marketing';
import type { Locale } from '@/lib/i18n/messages';

export function MarketingFooter({ locale }: { locale: Locale }) {
  const t = marketing[locale];
  const links = [
    'about',
    'opportunities',
    'mentors',
    'faq',
    'contact',
    'privacy',
    'terms',
  ] as const;
  return (
    <footer className="marketing-footer">
      <div className="page-shell">
        <p>{t.footer}</p>
        <nav aria-label={t.nav}>
          {links.map((slug) => (
            <a key={slug} href={`/${locale}/${slug}`}>
              {t.pages[slug].title}
            </a>
          ))}
        </nav>
        <p className="footer-note">{t.availability}</p>
      </div>
    </footer>
  );
}
