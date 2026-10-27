import { expect, test } from '@playwright/test';
test('vault and writing reject unsafe origins, paths and payloads', async ({
  request,
}) => {
  for (const path of [
    '/api/vault',
    '/api/vault/upload',
    '/api/writing',
    '/api/recommendations',
  ]) {
    const r = await request.post(path, {
      headers: {
        origin: 'https://untrusted.invalid',
        'content-type': 'application/json',
      },
      data: { userId: 'other', bucket: 'public' },
    });
    expect(r.status()).toBe(403);
    expect(r.headers()['cache-control']).toContain('no-store');
  }
  for (const path of [
    '/api/vault/file?version=bad&path=other',
    '/api/vault/export?application=bad',
    '/api/writing?draft=bad',
  ]) {
    const r = await request.get(path);
    expect(r.status()).toBe(422);
    expect(r.headers()['cache-control']).toContain('no-store');
  }
  const invalid = await request.post('/api/writing', {
    headers: { origin: 'http://127.0.0.1:3100' },
    data: {
      id: 'swapped',
      version: null,
      content: '<script>alert(1)</script>',
    },
  });
  expect(invalid.status()).toBe(422);
  const anon = await request.get('/api/vault');
  expect([401, 503]).toContain(anon.status());
  expect((await anon.json()).data).toBeUndefined();
});
for (const locale of ['en', 'ru', 'kk'])
  test(`anonymous ${locale} vault/writing routes require sign-in`, async ({
    page,
  }) => {
    for (const route of ['vault', 'writing']) {
      await page.goto(`/${locale}/${route}`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/login$`));
    }
  });
test('private invitation survives sign-in redirect without entering the query string', async ({
  page,
}) => {
  const token = 'a'.repeat(64);
  await page.goto(`/en/vault#invite=${token}`);
  await expect(page).toHaveURL(new RegExp(`/en/login#invite=${token}$`));
  await expect(page.locator('input[name="inviteToken"]')).toHaveValue(token);
  expect(new URL(page.url()).search).toBe('');
  await page.goto('/en/login#invite=javascript:alert(1)');
  await expect(page.locator('input[name="inviteToken"]')).toHaveValue('');
});
