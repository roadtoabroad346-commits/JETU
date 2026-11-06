import { test, expect } from '@playwright/test';
for (const locale of ['ru', 'kk', 'en']) {
  test(`mentor directory and private routing ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/mentors`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[name=q]')).toBeVisible();
    await page.goto(`/${locale}/mentoring`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
  });
}
test('mentor mutation fails closed in the production bundle', async ({
  request,
}) => {
  const denied = await request.post('/api/mentors', {
    data: { op: 'revoke', request: '22000000-0000-4000-8000-000000000001' },
  });
  expect(denied.status()).toBe(403);
  expect(denied.headers()['cache-control']).toBe('no-store');
  const file = await request.get('/api/mentors/file?grant=guessed');
  expect(file.status()).toBe(422);
});
