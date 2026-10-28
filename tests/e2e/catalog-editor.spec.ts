import { expect, test } from '@playwright/test';

test('catalog editorial writes reject cross-origin and unattested payloads', async ({
  request,
}) => {
  const unsafe = await request.post('/api/admin/catalog', {
    headers: { origin: 'https://untrusted.example' },
    data: {},
  });
  expect(unsafe.status()).toBe(403);
  const unattested = await request.post('/api/admin/catalog', {
    headers: { origin: 'http://127.0.0.1:3100' },
    data: {
      action: 'publish',
      entityId: 7,
      expectedRevision: 1,
      note: 'test',
      attested: false,
    },
  });
  expect(unattested.status()).toBe(422);
});
test('catalog editorial page requires authentication', async ({ page }) => {
  await page.goto('/en/admin');
  await expect(page).toHaveURL(/\/en\/login$/);
});
