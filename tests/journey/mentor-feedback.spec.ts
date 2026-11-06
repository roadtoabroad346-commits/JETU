import { test, expect } from '@playwright/test';

test('draft changes hide stale human feedback while loading and after failure', async ({
  page,
}) => {
  let releaseB!: () => void;
  const pendingB = new Promise<void>((resolve) => {
    releaseB = resolve;
  });
  await page.route('**/api/mentors?writing=*', async (route) => {
    const draft = new URL(route.request().url()).searchParams.get('writing');
    if (draft === 'draft-b') {
      await pendingB;
      return route.fulfill({
        status: 503,
        json: { error: { code: 'PROVIDER_TIMEOUT' } },
      });
    }
    return route.fulfill({
      json: {
        data: {
          comments: [],
          reviews: [
            {
              id: 'review-a',
              request_id: 'request-a',
              summary: 'Feedback exclusively for draft A',
              outcome: 'more_work_needed',
              author_id: 'synthetic-mentor',
              created_at: '2026-11-06T10:00:00Z',
            },
          ],
        },
      },
    });
  });
  await page.goto('/tests/journey/fixture.html?humanFeedback=1');
  await expect(
    page.getByText('Feedback exclusively for draft A', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open B', exact: true }).click();
  await expect(
    page.getByText('Feedback exclusively for draft A', { exact: true }),
  ).toHaveCount(0);
  releaseB();
  await expect(page.getByRole('status')).toContainText(
    'Mentor data is unavailable',
  );
  await expect(
    page.getByText('Feedback exclusively for draft A', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Open A', exact: true }).click();
  await expect(
    page.getByText('Feedback exclusively for draft A', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});
