import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { deadlineCopy } from '../../src/features/deadlines/copy';
for (const locale of ['ru', 'kk', 'en'] as const) {
  for (const width of [390, 820, 1440]) {
    test(`${locale} ${width} calendar views, filters, keyboard and axe`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/tests/journey/deadlines-fixture.html?locale=${locale}`);
      const t = deadlineCopy[locale];
      await expect(
        page.getByRole('heading', { name: t.calendar, exact: true }),
      ).toBeVisible();
      await expect(page.locator('.deadline-grid-event')).toHaveCount(3);
      await page.getByRole('button', { name: t.agenda, exact: true }).click();
      await expect(page.locator('.deadline-event')).toHaveCount(3);
      await page.getByRole('button', { name: t.custom, exact: true }).click();
      await expect(page.locator('.deadline-event')).toHaveCount(2);
      await expect(page).toHaveURL(/category=custom/);
      await page.reload();
      await expect(page.locator('.deadline-event')).toHaveCount(2);
      await page.getByRole('button', { name: t.all, exact: true }).click();
      await page.getByRole('button', { name: t.month, exact: true }).click();
      await page
        .locator(
          width < 700
            ? '.deadline-month-preview .deadline-event'
            : '.deadline-grid-event',
        )
        .first()
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflow).toBe(false);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      await page.screenshot({
        path: `work/phase23-visual/${locale}-${width}-calendar.png`,
        fullPage: true,
      });
    });
  }
}
for (const locale of ['ru', 'kk', 'en'] as const) {
  for (const section of ['dashboard', 'inbox', 'settings']) {
    for (const width of [390, 1440]) {
      test(`${locale} ${width} ${section} responsive and accessible`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(
          `/tests/journey/deadlines-fixture.html?section=${section}&locale=${locale}`,
        );
        await expect(page.locator('h1')).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
        ).toBe(false);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
        await page.screenshot({
          path: `work/phase23-visual/${locale}-${width}-${section}.png`,
          fullPage: true,
        });
      });
    }
  }
}
test('failed event save retains input and offers retry', async ({ page }) => {
  await page.goto('/tests/journey/deadlines-fixture.html?empty=1');
  const t = deadlineCopy.en;
  await page.getByRole('button', { name: t.newEvent }).first().click();
  await page
    .getByLabel(t.titleLabel, { exact: true })
    .fill('Personal test date');
  await page.route('**/api/deadlines', (route) =>
    route.fulfill({ status: 503, json: { error: { code: 'INTERNAL_ERROR' } } }),
  );
  await page.getByRole('button', { name: t.save, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel(t.titleLabel, { exact: true })).toHaveValue(
    'Personal test date',
  );
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
    t.saveError,
  );
});
