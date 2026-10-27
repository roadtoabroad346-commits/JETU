import { createRoot } from 'react-dom/client';
import { VaultWorkspace } from '../../src/features/vault/workspace';
import { WritingWorkspace } from '../../src/features/writing/workspace';
import type { Locale } from '../../src/lib/i18n/messages';
import '../../src/app/globals.css';
const params = new URLSearchParams(window.location.search),
  locale = (params.get('locale') ?? 'en') as Locale;
document.documentElement.lang = locale;
createRoot(document.getElementById('root')!).render(
  params.get('screen') === 'writing' ? (
    <WritingWorkspace locale={locale} />
  ) : (
    <VaultWorkspace locale={locale} />
  ),
);
