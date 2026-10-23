import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { locales } from '../../src/lib/i18n/messages';
import {
  marketing,
  marketingSlugs,
  type MarketingSlug,
} from '../../src/lib/i18n/marketing';

test('every requested public path resolves with localized metadata and content', async ({
  request,
}) => {
  for (const locale of locales) {
    const slugs: (MarketingSlug | null)[] = [null, ...marketingSlugs];
    for (const slug of slugs) {
      const path = `/${locale}${slug ? `/${slug}` : ''}`;
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      expect(html, path).toContain(`<html lang="${locale}"`);
      expect(html, path).toContain('rel="canonical"');
      expect(html, path).toContain(`/${locale}${slug ? `/${slug}` : ''}`);
      expect(html, path).toContain('hrefLang="ru"');
      expect(html, path).toContain('hrefLang="kk"');
      expect(html, path).toContain('hrefLang="en"');
      expect(html, path).toContain(
        slug === 'opportunities'
          ? {
              ru: 'Возможности вне университета',
              kk: 'Университеттен тыс мүмкіндіктер',
              en: 'Opportunities beyond university',
            }[locale]
          : slug
            ? marketing[locale].pages[slug].title
            : marketing[locale].heroTitle,
      );
    }
  }
  expect((await request.get('/en/not-a-page')).status()).toBe(404);
});

test('compact hero keeps the guide action visible and deep links work without JavaScript', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const locale of locales) {
    await page.goto(`/${locale}`);
    await expect(
      page.locator('.hero-actions .ui-button').first(),
    ).toBeVisible();
    const box = await page
      .locator('.hero-actions .ui-button')
      .first()
      .boundingBox();
    expect(box, locale).not.toBeNull();
    expect(box!.y + box!.height, locale).toBeLessThanOrEqual(700);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      locale,
    ).toBe(true);
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('/en/scholarships');
  await expect(
    staticPage.locator('.language-nav a[lang="kk"]'),
  ).toHaveAttribute('href', '/kk/scholarships');
  await context.close();
});

test('sitemap, robots and social image are real routes', async ({
  request,
}) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('/en/scholarships');
  expect(xml).toContain('/kk/terms');
  expect(xml).not.toContain('design-system');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const image = await request.get('/opengraph-image');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
});

test('landing CTAs resolve and the demo is labeled, interactive and keyboard usable @a11y', async ({
  page,
  request,
}) => {
  await page.goto('/ru');
  await expect(page.getByText(marketing.ru.demoNote)).toBeVisible();
  const mainLinks = await page
    .locator('main a[href]')
    .evaluateAll((elements) =>
      elements.map((element) =>
        (element as HTMLAnchorElement).getAttribute('href'),
      ),
    );
  for (const href of new Set(mainLinks)) {
    expect(href).toMatch(/^\/ru\//);
    expect((await request.get(href!)).status(), href!).toBe(200);
  }
  const essayTab = page.getByRole('tab', { name: marketing.ru.essay });
  await essayTab.click();
  await expect(page.getByRole('tabpanel')).toContainText(
    marketing.ru.previewEssay,
  );
  await essayTab.press('Home');
  await expect(
    page.getByRole('tab', { name: marketing.ru.matching }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText(
    marketing.ru.previewMatch,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('language changes retain the information path and reduced motion keeps content visible', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/scholarships');
  await page.getByRole('link', { name: 'Қазақша', exact: true }).click();
  await expect(page).toHaveURL('/kk/scholarships');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    marketing.kk.pages.scholarships.title,
  );
  await page.goto('/en');
  await expect(page.getByRole('tabpanel')).toBeVisible();
  await page.getByRole('tab', { name: marketing.en.essay }).click();
  await expect(page.getByRole('tabpanel')).toContainText(
    marketing.en.previewEssay,
  );
});
