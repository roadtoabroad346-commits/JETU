import { describe, expect, it } from 'vitest';
import {
  localeFromDestination,
  safeAuthDestination,
} from '@/lib/auth/redirect';

describe('auth redirect validation', () => {
  it('allows only known locale-scoped private destinations', () => {
    expect(safeAuthDestination('/en/dashboard', '/ru/dashboard')).toBe(
      '/en/dashboard',
    );
    expect(safeAuthDestination('/kk/onboarding?x=1', '/ru/dashboard')).toBe(
      '/kk/onboarding',
    );
  });
  it('blocks external, protocol-relative, and arbitrary redirects', () => {
    for (const value of [
      'https://evil.test',
      '//evil.test',
      '/en/unknown',
      '/auth/callback',
    ]) {
      expect(safeAuthDestination(value, '/ru/dashboard')).toBe('/ru/dashboard');
    }
  });
  it('derives only a supported locale', () => {
    expect(localeFromDestination('/en/dashboard')).toBe('en');
    expect(localeFromDestination('/xx/dashboard')).toBe('ru');
  });
});
