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

test('suggestions discard old query choices and dismiss with Escape and focus exit @a11y', async ({
  page,
}) => {
  await page.route('**/api/search/suggest**', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('q');
    await route.fulfill({
      json: {
        data: {
          items: [
            {
              id: '42',
              title: `Result for ${query}`,
              subtitle: 'Test fixture',
              type: 'program',
              href: '/en/search?q=selected',
            },
          ],
        },
      },
    });
  });
  await page.goto('/en/search');
  const input = page.getByRole('combobox', { name: 'Search terms' });
  await input.fill('first');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveText(
    'Result for firstTest fixture',
  );
  await input.press('ArrowDown');
  await input.fill('second');
  await expect(page.getByRole('option', { name: /first/ })).toHaveCount(0);
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(page.getByRole('listbox').getByRole('option')).toContainText(
    'second',
  );
  expect(
    (await new AxeBuilder({ page }).include('main').analyze()).violations,
  ).toEqual([]);
  await input.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).not.toHaveAttribute('aria-controls');
  await input.press('ArrowDown');
  await expect(page.getByRole('listbox').getByRole('option')).toBeVisible();
  await input.press('Tab');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.locator('select[name="type"]')).toBeFocused();
  await input.focus();
  await page.getByRole('listbox').getByRole('option').click();
  await expect(page).toHaveURL(/\/en\/search\?q=selected$/);
});

test('late suggestions cannot reopen after Escape; a new query recovers after failure', async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested = false;
  await page.route('**/api/search/suggest**', async (route) => {
    const q = new URL(route.request().url()).searchParams.get('q');
    if (q === 'slow') {
      requested = true;
      await held;
    }
    if (q === 'error') {
      await route.fulfill({ status: 503, json: { error: 'unavailable' } });
      return;
    }
    await route.fulfill({
      json: {
        data: {
          items: [
            {
              id: '1',
              title: `Result ${q}`,
              subtitle: null,
              type: 'program',
              href: '/en/search?q=result',
            },
          ],
        },
      },
    });
  });
  await page.goto('/en/search');
  const input = page.getByRole('combobox', { name: 'Search terms' });
  await input.fill('slow');
  await expect.poll(() => requested).toBe(true);
  await input.press('Escape');
  release();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await input.fill('error');
  await page.waitForResponse((response) => response.url().includes('q=error'));
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(0);
  await input.fill('recovered');
  await expect(page.getByRole('listbox').getByRole('option')).toContainText(
    'recovered',
  );
  await input.fill('x');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(0);
  await expect(input).not.toHaveAttribute('aria-activedescendant');
});

test('suggestion motion respects reduced motion and long content fits tablet and phone', async ({
  page,
}) => {
  await page.route('**/api/search/suggest**', async (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: '1',
              title: 'Long published program name '.repeat(5),
              subtitle: 'University',
              type: 'program',
              href: '/en/search?q=long',
            },
          ],
        },
      },
    }),
  );
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en/search');
    await page.getByRole('combobox', { name: 'Search terms' }).fill('long');
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    expect(
      await list.evaluate((element) => getComputedStyle(element).animationName),
    ).toBe('none');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(
    await page
      .getByRole('listbox')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('discovery-arrive');
});
