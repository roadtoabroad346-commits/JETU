import { describe, expect, it, vi } from 'vitest';
import {
  getPublicEnv,
  parsePublicEnv,
  requireSupabaseConfig,
} from '@/lib/env/public';
import { assertPublicEnvironmentSafety } from '@/lib/env/safety';
import { getAdminSecret } from '@/lib/env/server';

const anon = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role: 'anon' }))}.test`;
const privileged = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role: 'service_role' }))}.test`;
const valid = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_test_key_12345',
};

describe('environment boundary', () => {
  it('allows an unconfigured public informational app without fake Supabase values', () => {
    expect(parsePublicEnv({})).toEqual({
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    });
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      }),
    ).toEqual(parsePublicEnv({}));
  });
  it('accepts a paired publishable key or local anon JWT', () => {
    expect(parsePublicEnv(valid).NEXT_PUBLIC_SUPABASE_URL).toBe(
      valid.NEXT_PUBLIC_SUPABASE_URL,
    );
    expect(
      parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anon }),
    ).toBeDefined();
  });
  it.each([
    'http://remote.supabase.co',
    'https://user:password@project.supabase.co',
    'https://project.supabase.co?token=x',
    'https://project.supabase.co/auth',
  ])('rejects unsafe base URL %s', (url) => {
    expect(() =>
      parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: url }),
    ).toThrow('Invalid environment configuration');
  });
  it.each([
    'sb_secret_super_sensitive_key_1234567890',
    privileged,
    'not-a-key',
    'eyJbad.bad.bad',
  ])('rejects privileged/malformed public keys without echoing them', (key) => {
    let message = '';
    try {
      parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(message).not.toContain(key);
  });
  it('rejects partial Supabase configuration', () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL,
      }),
    ).toThrow();
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          valid.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }),
    ).toThrow();
  });
  it('fails closed when an unconfigured SDK is invoked', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(() => requireSupabaseConfig()).toThrow('Check .env.example');
  });
  it('uses the trusted Vercel preview host instead of localhost for public metadata', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'jetu-preview.vercel.app');
    expect(getPublicEnv().NEXT_PUBLIC_APP_URL).toBe(
      'https://jetu-preview.vercel.app',
    );
    vi.stubEnv('VERCEL_URL', 'evil.example');
    expect(getPublicEnv().NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });
  it('refuses sensitive NEXT_PUBLIC names and secret values even under innocent names', () => {
    expect(() =>
      assertPublicEnvironmentSafety({
        NEXT_PUBLIC_SERVICE_ROLE_KEY: 'sensitive',
      }),
    ).toThrow();
    expect(() =>
      assertPublicEnvironmentSafety({ NEXT_PUBLIC_FOO: 'sb_secret_sensitive' }),
    ).toThrow();
    expect(() =>
      assertPublicEnvironmentSafety({ NEXT_PUBLIC_FOO: privileged }),
    ).toThrow();
    expect(() =>
      assertPublicEnvironmentSafety({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anon,
        SUPABASE_SECRET_KEY: 'server_value',
      }),
    ).not.toThrow();
  });
  it('requires a modern admin secret and never places it in public config', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    expect(() => getAdminSecret()).toThrow('SUPABASE_SECRET_KEY');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test_canary_value_123456789');
    expect(getAdminSecret()).toBe('sb_secret_test_canary_value_123456789');
    expect(JSON.stringify(getPublicEnv())).not.toContain('sb_secret_');
  });
});
