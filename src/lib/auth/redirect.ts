import { isLocale, type Locale } from '@/lib/i18n/messages';

const AUTH_DESTINATIONS = new Set([
  'dashboard',
  'onboarding',
  'reset-password',
]);

export function safeAuthDestination(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return fallback;
  const [pathname] = value.split(/[?#]/, 1);
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  if (
    segments.length === 2 &&
    isLocale(segments[0] ?? '') &&
    AUTH_DESTINATIONS.has(segments[1] ?? '')
  ) {
    return pathname!;
  }
  return fallback;
}

export function localeFromDestination(value: string | null): Locale {
  const candidate = value?.split('/').filter(Boolean)[0] ?? '';
  return isLocale(candidate) ? candidate : 'ru';
}
