import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { locales, messages } from '../../src/lib/i18n/messages';
import { marketing } from '../../src/lib/i18n/marketing';

for (const locale of locales) {
  test(`${locale}: localized page, responsive reflow and screenshot @a11y`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`/${locale}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      marketing[locale].heroTitle,
    );
    await expect(
      page.getByText(marketing[locale].heroDescription),
    ).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
      'href',
      `/${locale}`,
    );
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    for (const width of [320, 360, 375, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
    expect(errors).toEqual([]);
  });
}

test('language links, reload and browser history preserve locale', async ({
  page,
}) => {
  await page.goto('/ru');
  await page.getByRole('link', { name: 'Қазақша', exact: true }).click();
  await expect(page).toHaveURL('/kk');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'kk');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    marketing.en.heroTitle,
  );
  await page.goBack();
  await expect(page).toHaveURL('/kk');
});

test('root redirects, unknown locales and missing pages return real 404', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL('/ru');
  for (const path of ['/fr', '/en/missing-page']) {
    expect((await request.get(path)).status()).toBe(404);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('link', { name: /English/ }).click();
    await expect(page).toHaveURL('/en');
  }
});

test('keyboard skip, target sizes, no-JS content and reduced motion', async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: messages.en.skip }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  for (const link of await page.locator('.language-nav a').all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('/en');
  await expect(staticPage.getByRole('heading', { level: 1 })).toHaveText(
    marketing.en.heroTitle,
  );
  await staticPage.getByRole('link', { name: 'Қазақша', exact: true }).click();
  await expect(staticPage).toHaveURL(/\/kk$/);
  await context.close();
});

test('liveness and security headers are real HTTP contracts', async ({
  request,
}) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data).toEqual({ status: 'ok' });
  expect(response.headers()['x-request-id']).toBe(body.requestId);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['x-powered-by']).toBeUndefined();
  expect((await request.post('/api/health')).status()).toBe(405);
  const page = await request.get('/en', { headers: { 'x-jetu-locale': 'ru' } });
  expect(await page.text()).toContain('<html lang="en"');
});
