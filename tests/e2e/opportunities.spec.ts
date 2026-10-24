import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['ru', 'kk', 'en']) {
  test(`${locale} opportunities filters retain URL state and stay accessible @a11y`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/opportunities`);
    await expect(page.locator('main h1')).toBeVisible();
    await page.locator('select[name="kind"]').selectOption('hackathon');
    await page.locator('input[name="age"]').fill('16');
    await page.locator('input[name="grade"]').fill('10');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/kind=hackathon/);
    await page.reload();
    await expect(page.locator('input[name="age"]')).toHaveValue('16');
    await expect(page.locator('input[name="grade"]')).toHaveValue('10');
    await expect(page.locator('select[name="kind"]')).toHaveValue('hackathon');
    await expect(
      page.getByRole('link', {
        name:
          locale === 'en' ? 'Reset' : locale === 'ru' ? 'Сбросить' : 'Тазарту',
      }),
    ).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include('main').analyze()).violations,
    ).toEqual([]);
  });
}
test('opportunities fit 320px with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/opportunities');
  await expect(page.locator('main h1')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const locale of ['ru', 'kk', 'en']) {
  test(`${locale} schools directory renders a separate sourced catalog @a11y`, async ({
    page,
  }) => {
    const response = await page.goto(`/${locale}/schools`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveText(/.+/);
    await expect(page.locator('main a[href$="/opportunities"]')).toBeVisible();
    await expect(page.locator('main a[href$="/for-schools"]')).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include('main').analyze()).violations,
    ).toEqual([]);
  });
}

test('opportunity detail slug reaches the app route', async ({ page }) => {
  await page.goto('/en/opportunities/reviewed-example');
  await expect(page.locator('main#main')).toBeVisible();
});

test('schools directory fits 320px with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/schools');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('schools directory rejects an unbounded page', async ({ page }) => {
  await page.goto('/en/schools?page=201');
  await expect(page.getByRole('status')).toContainText(
    'Check the page number.',
  );
});
