import { expect, test } from '@playwright/test';

test('application APIs reject unsafe origins and invalid state input', async ({
  request,
}) => {
  const crossOrigin = await request.post('/api/applications', {
    headers: {
      origin: 'https://untrusted.example',
      'content-type': 'application/json',
    },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  expect((await crossOrigin.json()).error.code).toBe('FORBIDDEN');

  const invalid = await request.post('/api/applications', {
    headers: {
      origin: 'http://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: {
      programId: -1,
      intakeId: null,
      cycleYear: 1800,
      idempotencyKey: 'not-a-uuid',
    },
  });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).error.code).toBe('VALIDATION_FAILED');

  const invalidTransition = await request.post(
    '/api/applications/18180000-0000-4000-8000-000000000001/transition',
    {
      headers: {
        origin: 'http://127.0.0.1:3100',
        'content-type': 'application/json',
      },
      data: {
        version: 0,
        toStatus: 'teleported',
        evidence: 'x',
        userConfirmed: true,
        idempotencyKey: 'not-a-uuid',
      },
    },
  );
  expect(invalidTransition.status()).toBe(422);

  const maliciousId = await request.patch('/api/applications/not-a-uuid', {
    headers: {
      origin: 'http://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: { version: 1, notes: '', userReferenceId: '', priority: 'medium' },
  });
  expect(maliciousId.status()).toBe(404);
});

test.describe('configured application auth route', () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL,
    'requires a configured Supabase Auth endpoint',
  );

  test('private applications route redirects anonymous users', async ({
    page,
  }) => {
    await page.goto('/en/applications');
    await expect(page).toHaveURL(/\/en\/login$/);
  });
});
