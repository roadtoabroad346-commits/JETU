import { expect, test } from '@playwright/test';
import { blank } from '../../src/features/writing/contracts';
for (const locale of ['en', 'ru', 'kk'])
  test(`${locale} private writing redirects anonymous visitors to sign-in`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/writing`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login$`));
    await expect(page.locator('.studio-textarea')).toHaveCount(0);
  });
test('writing API rejects forged origins, invalid IDs and unauthenticated mutations', async ({
  request,
}) => {
  expect((await request.get('/api/writing?project=invalid')).status()).toBe(
    422,
  );
  expect(
    (
      await request.post('/api/writing', {
        headers: { origin: 'https://evil.invalid' },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const response = await request.post('/api/writing', {
    headers: { origin: 'http://127.0.0.1:3100' },
    data: { ...blank('en'), title: 'Anonymous write' },
  });
  expect([401, 503]).toContain(response.status());
  expect((await response.json()).data).toBeUndefined();
});
