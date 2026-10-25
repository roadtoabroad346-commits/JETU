import { expect, test } from '@playwright/test';

test('matching API rejects cross-origin and malformed input before database access', async ({
  request,
}) => {
  const crossOrigin = await request.post('/api/matching/run', {
    headers: {
      origin: 'https://untrusted.example',
      'content-type': 'application/json',
    },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  expect((await crossOrigin.json()).error.code).toBe('FORBIDDEN');

  const wrongScheme = await request.post('/api/matching/run', {
    headers: {
      origin: 'https://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: {},
  });
  expect(wrongScheme.status()).toBe(403);

  const wrongType = await request.post('/api/matching/run', {
    headers: { origin: 'http://127.0.0.1:3100', 'content-type': 'text/plain' },
    data: '{}',
  });
  expect(wrongType.status()).toBe(422);

  const invalid = await request.post('/api/matching/run', {
    headers: {
      origin: 'http://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: {
      countries: ['INVALID'],
      majors: [],
      levels: [],
      languages: [],
      fundingRequired: false,
    },
  });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).error.code).toBe('VALIDATION_FAILED');
});

test('private matching route redirects unauthenticated users when Supabase is configured', async ({
  page,
}) => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL,
    'requires a configured Supabase Auth endpoint',
  );
  await page.goto('/en/match');
  await expect(page).toHaveURL(/\/en\/login$/);
});
