import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const locale of ['ru', 'kk', 'en']) {
  test(`${locale} catalog search retains URL state and gives actionable failure @a11y`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/universities`);
    await expect(page.locator('main h1')).toBeVisible();
    await page
      .getByRole('textbox', {
        name: locale === 'en' ? 'Search' : locale === 'ru' ? 'Поиск' : 'Іздеу',
      })
      .fill('Synthetic query');
    await page
      .getByRole('button', {
        name:
          locale === 'en'
            ? 'Show results'
            : locale === 'ru'
              ? 'Показать'
              : 'Көрсету',
      })
      .click();
    await expect(page).toHaveURL(/q=Synthetic/);
    await page.reload();
    await expect(page.locator('input[name="q"]')).toHaveValue(
      'Synthetic query',
    );
    await expect(
      page
        .getByRole('link', {
          name:
            locale === 'en'
              ? 'Reset filters'
              : locale === 'ru'
                ? 'Сбросить фильтры'
                : 'Сүзгілерді тазарту',
        })
        .first(),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).include('main').analyze();
    expect(results.violations).toEqual([]);
  });
}

test('catalog fits a 320px viewport and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/universities');
  await expect(page.locator('main h1')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Show results' }),
  ).toBeVisible();
});
