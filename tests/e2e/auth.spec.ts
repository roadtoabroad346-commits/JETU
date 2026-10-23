import { expect, test } from '@playwright/test';

test('anonymous users are redirected from the private dashboard', async ({
  page,
}) => {
  // The redirect needs real claims: unauthenticated -> login. Without a
  // configured Supabase environment the app fails closed with the documented
  // EnvironmentError instead, so the configured-path assertion must be gated
  // explicitly rather than red in degraded CI runs.
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL,
    'requires a configured Supabase environment; degraded fail-close behavior is covered by env unit tests',
  );
  await page.goto('/en/dashboard');
  await expect(page).toHaveURL(/\/en\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
});

test('signup exposes consent and accessible account fields @a11y', async ({
  page,
}) => {
  await page.goto('/en/signup');
  await expect(
    page.getByRole('heading', { name: 'Create your JETU account' }),
  ).toBeVisible();
  await expect(page.getByLabel('Email address')).toHaveAttribute(
    'autocomplete',
    'email',
  );
  await expect(page.getByLabel(/I am at least 16/)).toHaveAttribute(
    'required',
    '',
  );
  await expect(page.getByLabel(/I accept the terms/)).toHaveAttribute(
    'required',
    '',
  );
});

test('password reset does not reveal whether an email exists', async ({
  page,
}) => {
  await page.goto('/en/forgot-password');
  await page.getByLabel('Email address').fill('missing-user@example.invalid');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page).toHaveURL(/success=sent/, { timeout: 15_000 });
  await expect(page.getByRole('status')).toContainText('If an account exists');
});
