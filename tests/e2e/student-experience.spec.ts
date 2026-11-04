import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('account forms remain visible and validate on the server without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/en/signup');
  await expect(
    page.getByRole('heading', { name: 'Create your JETU account' }),
  ).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Check');
  await page.goto('/en/login');
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await context.close();
});

for (const locale of ['ru', 'kk', 'en']) {
  test(`${locale} account and privacy experience is accessible and responsive @a11y`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${locale}/signup`);
    await expect(page.locator('.jetu-mascot')).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include('main').analyze()).violations,
    ).toEqual([]);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page
        .locator('.mascot-body')
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    await page.goto(`/${locale}/privacy`);
    await expect(page.getByText(/Мырзабек Нұржан/).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'jetuu1550@gmail.com', exact: true }),
    ).toHaveAttribute('href', 'mailto:jetuu1550@gmail.com');
    await expect(page.locator('.policy-content section')).toHaveCount(14);
    expect(
      (await new AxeBuilder({ page }).include('main').analyze()).violations,
    ).toEqual([]);
    await page.setViewportSize({ width: 320, height: 700 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('registration validates locally and retains entries when the real unconfigured provider fails', async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    'This scenario intentionally tests an unconfigured provider; it must not create a hosted account.',
  );
  await page.goto('/en/signup');
  const submit = page.locator('button[type="submit"]');
  await submit.click();
  await expect(page.locator('[name="name"]')).toBeFocused();
  await page.getByLabel('Name', { exact: true }).fill('Test Student');
  await page
    .getByLabel('Email address', { exact: true })
    .fill('student@example.invalid');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('My long passphrase');
  await page
    .getByRole('button', { name: 'Show password', exact: true })
    .click();
  await expect(password).toHaveAttribute('type', 'text');
  await page
    .getByRole('button', { name: 'Hide password', exact: true })
    .click();
  await page.locator('[name="age"]').check();
  await page.locator('[name="terms"]').check();
  await submit.click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'unavailable',
  );
  await expect(page.getByLabel('Email address', { exact: true })).toHaveValue(
    'student@example.invalid',
  );
  await expect(password).toHaveValue('My long passphrase');
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
});
