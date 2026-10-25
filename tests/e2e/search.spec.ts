import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['ru', 'kk', 'en']) {
  test(`${locale} unified search keeps URL state and has an accessible recovery state @a11y`, async ({
    page,
  }) => {
    await page.goto(
      `/${locale}/search?q=%D0%9C%D3%99%D1%81%D0%BA%D0%B5%D1%83&type=program&country=KZ`,
    );
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('input[name="q"]')).toHaveValue('Мәскеу');
    await expect(page.locator('select[name="type"]')).toHaveValue('program');
    await expect(page.locator('input[name="country"]')).toHaveValue('KZ');
    await page.reload();
    await expect(page.locator('input[name="q"]')).toHaveValue('Мәскеу');
    const results = await new AxeBuilder({ page }).include('main').analyze();
    expect(results.violations).toEqual([]);
  });
}

test('search and comparison stay within a 320px page viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/search?compare=1');
  await expect(
    page.getByRole('heading', { name: 'Search JETU' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto('/en/compare?ids=1');
  await expect(page.locator('.search-state[role="alert"]')).toContainText(
    'Choose two to four different programs.',
  );
});

test('autocomplete supports keyboard selection without exposing hidden data', async ({
  page,
}) => {
  await page.route('**/api/search/suggest**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              id: '42',
              title: 'Published computer science',
              subtitle: 'Reviewed university',
              type: 'program',
              href: '/en/search?q=Published+computer+science&type=program',
            },
          ],
        },
      }),
    });
  });
  await page.goto('/en/search');
  const input = page.getByRole('combobox', { name: 'Search terms' });
  await input.fill('computer');
  const option = page.getByRole('option', {
    name: /Published computer science/,
  });
  await expect(option).toBeVisible();
  await input.press('ArrowDown');
  await expect(option).toHaveAttribute('aria-selected', 'true');
  await input.press('Enter');
  await expect(page).toHaveURL(
    /\/en\/search\?q=Published\+computer\+science&type=program/,
  );
});
