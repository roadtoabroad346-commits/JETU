import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['ru', 'kk', 'en']) {
  test(`${locale} scholarship catalog keeps search state and explains unavailable data @a11y`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/scholarships/catalog`);
    await expect(page.locator('main h1')).toBeVisible();
    await page.locator('input[name="q"]').fill('Synthetic query');
    await page.locator('select[name="sort"]').selectOption('title');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/q=Synthetic/);
    await page.reload();
    await expect(page.locator('input[name="q"]')).toHaveValue(
      'Synthetic query',
    );
    await expect(page.locator('select[name="sort"]')).toHaveValue('title');
    await expect(page.locator('main')).toContainText(
      /unavailable|недоступен|қолжетімсіз/i,
    );
    const report = await new AxeBuilder({ page }).include('main').analyze();
    expect(report.violations).toEqual([]);
  });
}

test('scholarship catalog fits a narrow phone; admin write is denied without a session', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/en/scholarships/catalog');
  await expect(page.locator('main h1')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const response = await request.post('/api/admin/scholarships', {
    data: { action: 'create' },
    headers: { origin: 'http://127.0.0.1:3100' },
  });
  expect(response.status()).toBeGreaterThanOrEqual(401);
});
