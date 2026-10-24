'use client';

import { usePathname } from 'next/navigation';
import { LanguageLink } from '@/components/ui/language-link';
import {
  locales,
  localeNames,
  messages,
  type Locale,
} from '@/lib/i18n/messages';

export function MarketingLanguageNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const path = pathname.replace(/^\/(ru|kk|en)(?=\/|$)/, '');
  return (
    <nav className="language-nav" aria-label={messages[locale].language}>
      {locales.map((item) => (
        <LanguageLink
          key={item}
          locale={item}
          label={localeNames[item]}
          current={item === locale}
          path={path}
        />
      ))}
    </nav>
  );
}
