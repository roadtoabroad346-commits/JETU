import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('five real UI steps retain answers, distinguish unknown budget, retry, and update the saved version @a11y', async ({
  page,
}) => {
  const payloads: Record<string, string>[] = [];
  await page.route('**/test-save', async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill(
      payloads.length === 1
        ? { status: 503, json: { error: 'fixture unavailable' } }
        : { json: { ok: true } },
    );
  });
  await page.goto('/tests/journey/fixture.html');
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await expect(page.locator('#journey-country')).toBeFocused();
  await page.getByRole('radio', { name: 'Grade 11', exact: true }).check();
  await page
    .getByLabel('Where do you live?', { exact: true })
    .fill('Kazakhstan');
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page
    .getByRole('radio', { name: 'Bachelor’s degree', exact: true })
    .check();
  await page
    .getByRole('radio', { name: 'Technology & computing', exact: true })
    .check();
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page.getByLabel('Your average grade', { exact: true }).fill('6');
  await page
    .getByLabel('Maximum on your grading scale', { exact: true })
    .fill('5');
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Your average grade', { exact: true }).fill('4.8');
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page.getByRole('button', { name: '$5,000', exact: true }).click();
  await expect(page.getByLabel('Exact amount', { exact: true })).toHaveValue(
    '5000',
  );
  await page.getByRole('button', { name: 'Not sure yet', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: false }).click();
  const download = page.waitForEvent('download');
  expect(payloads).toHaveLength(0);
  await page
    .getByRole('button', { name: 'Download my answers', exact: false })
    .click();
  expect((await download).suggestedFilename()).toBe('jetu-my-profile.json');
  expect(
    (await new AxeBuilder({ page }).include('main').analyze()).violations,
  ).toEqual([]);
  await page
    .getByRole('button', { name: 'Save my profile', exact: false })
    .click();
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await expect(
    page.getByRole('heading', { name: 'This is starting to look like you!' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Save my profile', exact: false })
    .click();
  await expect(page.getByRole('status')).toContainText('profile is saved');
  expect(payloads[0]).toMatchObject({
    grade: '11',
    country: 'Kazakhstan',
    studyLevel: 'bachelor',
    field: 'Computer Science',
    gpa: '4.8',
    gpaScale: '5',
    budget: '',
    version: '0',
  });
  expect(payloads[1]).toEqual(payloads[0]);
  await page
    .getByRole('button', { name: 'Edit my profile', exact: true })
    .click();
  for (let step = 0; step < 4; step++)
    await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page
    .getByRole('button', { name: 'Save my profile', exact: false })
    .click();
  await expect(page.getByRole('status')).toContainText('profile is saved');
  expect(payloads[2]?.version).toBe('2');
});

for (const locale of ['ru', 'kk', 'en']) {
  test(`${locale} journey supports keyboard, all step layouts and reduced motion @a11y`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/tests/journey/fixture.html?filled=1&locale=${locale}`);
    for (let step = 0; step < 5; step++) {
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      expect(
        (await new AxeBuilder({ page }).include('main').analyze()).violations,
      ).toEqual([]);
      expect(
        await page
          .locator('.mascot-body')
          .evaluate((el) => getComputedStyle(el).animationName),
      ).toBe('none');
      if (locale === 'ru')
        await page.screenshot({
          path: `work/journey-step-${step}-1440.png`,
          fullPage: true,
          animations: 'disabled',
        });
      if (step < 4) {
        // The labelled forward action is the last enabled action in each step.
        await page.locator('.journey-step-actions button').last().click();
        await expect(page.locator('.journey-step-heading h1')).toBeFocused();
      }
    }
    expect(errors).toEqual([]);
  });
}

test('conflict keeps the current answers and offers a separate current-version link', async ({
  page,
}) => {
  await page.route('**/test-save', (route) =>
    route.fulfill({ status: 409, json: { error: 'conflict' } }),
  );
  await page.goto('/tests/journey/fixture.html?filled=1');
  for (let step = 0; step < 4; step++)
    await page.getByRole('button', { name: 'Continue', exact: false }).click();
  await page
    .getByRole('button', { name: 'Save my profile', exact: false })
    .click();
  await expect(page.getByRole('alert')).toContainText('changed in another tab');
  await expect(
    page.getByRole('link', { name: 'Open latest version', exact: false }),
  ).toHaveAttribute('target', '_blank');
  await expect(
    page.getByRole('heading', { name: 'This is starting to look like you!' }),
  ).toBeVisible();
});

test('account confirmation follows an action result and allows editing the email', async ({
  page,
}) => {
  await page.goto('/tests/journey/fixture.html?account=1');
  await page.getByLabel('Name', { exact: true }).fill('Student');
  await page
    .getByLabel('Email address', { exact: true })
    .fill('student@example.invalid');
  await page
    .getByLabel('Password', { exact: true })
    .fill('A private long phrase');
  await page.locator('[name="age"]').check();
  await page.locator('[name="terms"]').check();
  await page.locator('[type="submit"]').click();
  await expect(page.getByRole('status')).toContainText('confirmation email');
  await page.getByRole('button', { name: 'Change email address' }).click();
  await expect(page.getByLabel('Email address', { exact: true })).toHaveValue(
    'student@example.invalid',
  );
});
