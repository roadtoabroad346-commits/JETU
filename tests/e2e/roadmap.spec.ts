import { expect, test } from '@playwright/test';

test('roadmap APIs reject cross-origin and invalid payloads before database access', async ({
  request,
}) => {
  const crossOrigin = await request.post('/api/roadmaps', {
    headers: {
      origin: 'https://untrusted.example',
      'content-type': 'application/json',
    },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  expect((await crossOrigin.json()).error.code).toBe('FORBIDDEN');

  const wrongScheme = await request.post('/api/roadmaps', {
    headers: {
      origin: 'https://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: {},
  });
  expect(wrongScheme.status()).toBe(403);

  const invalid = await request.post('/api/roadmaps', {
    headers: {
      origin: 'http://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: {
      locale: 'en',
      cycleYear: 2027,
      timezone: 'Not/A_Timezone',
      availabilityMinutesPerWeek: -1,
      targetIds: [1, 1],
    },
  });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).error.code).toBe('VALIDATION_FAILED');

  const malformedTask = await request.post('/api/roadmaps/tasks', {
    headers: {
      origin: 'http://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: { title: '', estimatedMinutes: 0 },
  });
  expect(malformedTask.status()).toBe(422);

  const maliciousId = await request.patch('/api/roadmaps/tasks/not-a-uuid', {
    headers: {
      origin: 'http://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    data: { version: 1, status: 'completed' },
  });
  expect(maliciousId.status()).toBe(404);
});

test('private roadmap route redirects unauthenticated users when Supabase is configured', async ({
  page,
}) => {
  await page.goto('/en/plan');
  await expect(page).toHaveURL(/\/en\/login$/);
});
