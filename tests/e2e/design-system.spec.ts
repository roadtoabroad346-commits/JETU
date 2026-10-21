import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { locales } from '../../src/lib/i18n/messages';
import { designMessages } from '../../src/lib/i18n/design-system';

test('no-JS content has inert previews and usable navigation; vector assets resolve', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3100/en/design-system');
  await expect(
    page.getByText(designMessages.en.javascriptRequired, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: designMessages.en.preview, exact: true }),
  ).toBeDisabled();
  await page.getByRole('link', { name: 'Қазақша', exact: true }).click();
  await expect(page).toHaveURL(/\/kk\/design-system$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    designMessages.kk.title,
  );
  await context.close();
  for (const path of [
    '/icon.svg',
    '/brand/jetu-mark.svg',
    '/brand/jetu-wordmark.svg',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
    expect(await response.text()).toContain('<path');
  }
});

for (const locale of locales) {
  const t = designMessages[locale];
  test(`${locale}: design system responsive, axe and visual baseline @a11y`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await page.goto(`/${locale}/design-system`))?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.title);
    await expect(page.locator('.showcase-note')).toContainText(t.previewNote);
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
      'href',
      `/${locale}/design-system`,
    );
    for (const [width, height] of [
      [320, 900],
      [375, 812],
      [768, 900],
      [1024, 900],
      [1440, 900],
      [1920, 1080],
      [812, 375],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    const width = info.project.name.startsWith('mobile') ? 375 : 1440;
    await page.setViewportSize({ width, height: 900 });
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    await info.attach('axe-report.json', {
      body: JSON.stringify(axe, null, 2),
      contentType: 'application/json',
    });
    expect(axe.violations).toEqual([]);
    await expect(page).toHaveScreenshot(`${locale}-showcase.png`, {
      fullPage: true,
      animations: 'disabled',
      // Chromium versions rasterize font edges slightly differently in CI.
      maxDiffPixelRatio: 0.015,
    });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.setViewportSize({ width: 375, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('semantic text, control, chart and hover pairs meet measured contrast', async ({
  page,
}, info) => {
  await page.goto('/en/design-system');
  const report = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const hex = (token: string) => {
      const value = css.getPropertyValue(`--${token}`).trim();
      const resolved = value.startsWith('var(')
        ? css.getPropertyValue(value.slice(4, -1)).trim()
        : value;
      return resolved.length === 4
        ? '#' + [...resolved.slice(1)].map((char) => char + char).join('')
        : resolved;
    };
    const luminance = (color: string) => {
      const rgb = [1, 3, 5]
        .map((n) => parseInt(color.slice(n, n + 2), 16) / 255)
        .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
    };
    const pairs: [string, string, number][] = [
      ['ink', 'surface', 4.5],
      ['muted', 'canvas', 4.5],
      ['muted', 'surface', 4.5],
      ['on-brand', 'brand', 4.5],
      ['ink', 'brand', 3],
      ['ink', 'accent', 4.5],
      ['ink', 'accent-hover', 4.5],
      ['on-primary', 'primary', 4.5],
      ['on-primary', 'primary-hover', 4.5],
      ['primary-hover', 'surface-blue', 4.5],
      ['success', 'success-surface', 4.5],
      ['warning', 'warning-surface', 4.5],
      ['danger', 'danger-surface', 4.5],
      ['focus', 'surface', 3],
      ['focus', 'canvas', 3],
      ['control-border', 'surface', 3],
      ['primary', 'surface-blue', 3],
      ['warning', 'surface-blue', 3],
      ['success', 'surface-blue', 3],
    ];
    return pairs.map(([fg, bg, minimum]) => {
      const a = luminance(hex(fg)),
        b = luminance(hex(bg));
      return {
        fg,
        bg,
        minimum,
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
  });
  await info.attach('contrast.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  for (const pair of report)
    expect(pair.ratio, `${pair.fg} / ${pair.bg}`).toBeGreaterThanOrEqual(
      pair.minimum,
    );
  const primary = page.getByRole('button', {
    name: 'Try feedback',
    exact: true,
  });
  await primary.hover();
  await expect(primary).toHaveCSS('background-color', 'rgb(0, 84, 139)');
  await primary.focus();
  expect(
    await primary.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe('none');
});

test('keyboard tabs, native dialog containment, Escape and tooltip @a11y', async ({
  page,
}, info) => {
  const t = designMessages.en;
  await page.goto('/en/design-system');
  const tab = page.getByRole('tab', { name: t.overview, exact: true });
  await expect(tab).toBeEnabled();
  await tab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: t.details, exact: true }),
  ).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveText(t.detailsBody);
  await page.keyboard.press('Home');
  await expect(tab).toBeFocused();
  await page.keyboard.press('End');
  await expect(
    page.getByRole('tab', { name: t.details, exact: true }),
  ).toBeFocused();
  const trigger = page.getByRole('button', {
    name: t.dialogTrigger,
    exact: true,
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: t.dialogTitle });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: t.close, exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('button', { name: t.dialogDone, exact: true }),
    ).toBeFocused();
    for (let n = 0; n < 5; n++) {
      await page.keyboard.press('Tab');
      expect(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
      ).toBe(true);
    }
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    await info.attach(`dialog-axe-${attempt}.json`, {
      body: JSON.stringify(axe),
      contentType: 'application/json',
    });
    expect(axe.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  await trigger.click();
  await page.getByRole('button', { name: t.dialogDone, exact: true }).click();
  await expect(trigger).toBeFocused();
  const help = page.getByRole('button', { name: t.tooltip, exact: true });
  await help.focus();
  await expect(page.getByRole('tooltip')).toHaveText(t.tooltipBody);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await help.blur();
  await help.click();
  await expect(page.getByRole('tooltip')).toBeVisible();
});

test('local form errors, long text, state feedback, offline behavior and reload', async ({
  page,
  context,
}) => {
  const t = designMessages.en;
  const mutations: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET')
      mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto('/en/design-system');
  const input = page.getByRole('textbox', { name: t.textLabel, exact: true });
  await input.fill('   ');
  await page.getByRole('button', { name: t.preview, exact: true }).click();
  await expect(
    page.getByRole('alert', { name: t.errorSummary, exact: true }),
  ).toBeFocused();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await page
    .getByRole('link', { name: t.validationError, exact: true })
    .click();
  await expect(input).toBeFocused();
  await input.fill('Қ'.repeat(81));
  await page.getByRole('button', { name: t.preview, exact: true }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('Қ'.repeat(80));
  await page.getByLabel(t.style, { exact: true }).selectOption('title');
  await context.setOffline(true);
  await page.getByRole('button', { name: t.preview, exact: true }).click();
  await expect(page.getByLabel(t.previewOutput, { exact: true })).toHaveText(
    'Қ'.repeat(80),
  );
  await expect(page.getByText(t.localSuccess, { exact: true })).toBeVisible();
  await page.getByLabel(t.state, { exact: true }).selectOption('error');
  await expect(page.getByText(t.errorBody, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: t.tryAction, exact: true }).click();
  await expect(page.locator('.feedback-box')).toHaveText(t.success);
  await page.getByRole('button', { name: t.reset, exact: true }).click();
  await expect(page.locator('.feedback-box')).toHaveText(t.idle);
  await expect(
    page.getByRole('button', { name: t.disabled, exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: t.pending, exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: t.build, exact: true }).click();
  await expect(
    page.getByText(t.buildBody, { exact: true }).first(),
  ).toBeVisible();
  await context.setOffline(false);
  await page.reload();
  await expect(input).toHaveValue('Әлемге жол · Путь в мир');
  expect(mutations).toEqual([]);
});

test('real registry filters, sort, empty recovery and spotlight destination', async ({
  page,
}) => {
  const t = designMessages.en;
  await page.goto('/en/design-system');
  const table = page.getByRole('table', { name: t.tableCaption });
  await expect(table.locator('tbody tr')).toHaveCount(6);
  const first = await table.locator('tbody tr').first().innerText();
  await page.getByRole('button', { name: t.sort, exact: true }).click();
  expect(await table.locator('tbody tr').first().innerText()).not.toBe(first);
  await expect(table.getByRole('columnheader').first()).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await page.getByLabel(t.group, { exact: true }).selectOption('foundation');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel(t.filter, { exact: true }).fill('no-such-component');
  await expect(
    page.getByRole('heading', { name: t.noResults, exact: true }),
  ).toBeVisible();
  await page
    .locator('#data')
    .getByRole('button', { name: t.clear, exact: true })
    .last()
    .click();
  await expect(table.locator('tbody tr')).toHaveCount(6);
  await page.getByRole('button', { name: t.search, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: t.search });
  await dialog.getByLabel(t.query, { exact: true }).fill('nothing');
  await expect(
    dialog.getByRole('heading', { name: t.noResults, exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: t.clear, exact: true }).click();
  await dialog.getByLabel(t.query, { exact: true }).fill('Fields');
  await dialog.getByRole('link', { name: t.forms, exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#forms')).toBeFocused();
  await expect(page).toHaveURL(/#forms$/);
  await page.getByRole('link', { name: 'Қазақша', exact: true }).click();
  await expect(page).toHaveURL('/kk/design-system');
});
