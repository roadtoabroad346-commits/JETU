import { beforeEach, describe, expect, it, vi } from 'vitest';
const provider = vi.hoisted(() => ({
  create: vi.fn(),
  signUp: vi.fn(),
  signIn: vi.fn(),
}));
vi.mock('@/lib/supabase/request', () => ({
  createRequestSupabaseClient: provider.create,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
import { submitSignUp, submitSignIn } from '@/app/[locale]/(auth)/actions';
import {
  initialAccountState,
  privacyVersion,
} from '@/features/onboarding/model';

const makeForm = () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    locale: 'en',
    name: 'Student',
    email: 'student@example.invalid',
    password: 'a private passphrase',
    terms: 'on',
    age: 'on',
    privacyVersion,
  }))
    form.set(key, value);
  return form;
};
beforeEach(() => {
  vi.clearAllMocks();
  provider.create.mockResolvedValue({
    auth: { signUp: provider.signUp, signInWithPassword: provider.signIn },
  });
});
describe('account actions (mocked Auth transport)', () => {
  it('rejects missing or outdated consent before accessing Auth', async () => {
    const form = makeForm();
    form.delete('terms');
    expect(await submitSignUp(initialAccountState, form)).toMatchObject({
      status: 'error',
      error: 'invalid',
      fields: ['terms'],
    });
    const stale = makeForm();
    stale.set('privacyVersion', 'old');
    expect(await submitSignUp(initialAccountState, stale)).toMatchObject({
      status: 'error',
      error: 'invalid',
    });
    expect(provider.create).not.toHaveBeenCalled();
  });
  it('records dated consent and directs confirmation to onboarding without leaking the password into metadata', async () => {
    provider.signUp.mockResolvedValue({ data: { session: null }, error: null });
    expect(await submitSignUp(initialAccountState, makeForm())).toEqual({
      status: 'check-email',
    });
    const call = provider.signUp.mock.calls[0]![0];
    expect(new URL(call.options.emailRedirectTo).searchParams.get('next')).toBe(
      '/en/onboarding',
    );
    expect(call.options.data.consent).toEqual({
      privacyVersion,
      acceptedAt: expect.any(String),
      ageDeclaration: true,
    });
    expect(JSON.stringify(call.options.data)).not.toContain('passphrase');
    expect(call.options.data).not.toHaveProperty('role');
  });
  it('redirects only an actual session to the private journey', async () => {
    provider.signUp.mockResolvedValue({
      data: { session: { user: { id: 'test' } } },
      error: null,
    });
    await expect(submitSignUp(initialAccountState, makeForm())).rejects.toThrow(
      'redirect:/en/onboarding',
    );
  });
  it('returns a recoverable error on provider failure and rate limit', async () => {
    provider.signUp.mockRejectedValueOnce(new Error('private provider detail'));
    expect(await submitSignUp(initialAccountState, makeForm())).toEqual({
      status: 'error',
      error: 'unavailable',
    });
    provider.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { status: 429 },
    });
    expect(await submitSignUp(initialAccountState, makeForm())).toEqual({
      status: 'error',
      error: 'rate',
    });
  });
  it('does not distinguish unknown accounts from incorrect passwords', async () => {
    provider.signIn.mockResolvedValue({
      error: { status: 400, message: 'private detail' },
    });
    expect(await submitSignIn(initialAccountState, makeForm())).toEqual({
      status: 'error',
      error: 'credentials',
    });
    provider.signIn.mockResolvedValue({ error: null });
    await expect(submitSignIn(initialAccountState, makeForm())).rejects.toThrow(
      'redirect:/en/dashboard',
    );
  });
});
