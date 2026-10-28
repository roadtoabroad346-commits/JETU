import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { RoadmapState } from '../../src/features/roadmap/service';
import { roadmapCopy } from '../../src/features/roadmap/copy';
import type { Locale } from '../../src/lib/i18n/messages';

function fixture(): RoadmapState {
  const base: RoadmapState['tasks'][number] = {
    id: 'task-prepare',
    milestoneId: null,
    targetId: null,
    generationKey: 'test:prepare',
    origin: 'generated',
    taskKind: 'document',
    title: 'Synthetic preparation task',
    description: 'Synthetic test data only',
    whyItMatters: 'Synthetic test evidence',
    status: 'todo',
    priority: 'high',
    generatedPriority: 'high',
    priorityOverride: null,
    mandatory: true,
    officialDeadlineAt: null,
    officialDeadlineDate: '2026-11-01',
    deadlinePrecision: 'date_only',
    deadlineTimezone: null,
    sourceUrl: null,
    sourceCheckedAt: null,
    recommendedDueDate: '2026-10-30',
    targetDate: null,
    estimatedMinutes: 150,
    note: null,
    completedAt: null,
    obsoleteAt: null,
    version: 1,
  };
  return {
    roadmap: {
      id: 'synthetic-roadmap',
      cycleYear: 2027,
      timezone: 'Asia/Qyzylorda',
      availabilityMinutesPerWeek: 60,
      generationVersion: 'roadmap-v1',
      lastGeneratedAt: '2026-10-28',
      version: 1,
    },
    tasks: [
      base,
      {
        ...base,
        id: 'task-submit',
        generationKey: 'test:submit',
        title: 'Synthetic submit task',
        taskKind: 'application',
        status: 'blocked',
        estimatedMinutes: 30,
      },
    ],
    milestones: [],
    targets: [],
    dependencies: [
      {
        id: 'edge',
        taskId: 'task-submit',
        dependsOnTaskId: 'task-prepare',
        dependencyType: 'mandatory',
      },
    ],
    availableTargets: [],
  };
}

for (const locale of ['en', 'ru', 'kk'] as Locale[]) {
  for (const width of [375, 768, 1440]) {
    test(`${locale} ${width}px synthetic populated roadmap workload @a11y`, async ({
      page,
    }) => {
      await page.clock.install({ time: new Date('2026-10-28T10:00:00Z') });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const state = fixture();
      await page.route('**/api/roadmaps', async (route) => {
        if (route.request().method() === 'POST') {
          state.roadmap!.availabilityMinutesPerWeek = route
            .request()
            .postDataJSON().availabilityMinutesPerWeek;
          await route.fulfill({ json: { data: { unchanged: false } } });
        } else await route.fulfill({ json: { data: state } });
      });
      await page.goto(`/?screen=roadmap&locale=${locale}`);
      const workload = page.locator('.roadmap-workload');
      await expect(workload).toBeVisible();
      await expect(workload.locator('.feedback-box--error')).toBeVisible();
      await expect(workload.locator('.roadmap-week-list > li')).toHaveCount(3);
      await workload
        .getByRole('button', { name: 'Synthetic preparation task' })
        .first()
        .click();
      await expect(page.locator('.roadmap-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.roadmap-dialog')).not.toBeVisible();
      const violations = (await new AxeBuilder({ page }).analyze()).violations;
      expect(violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.locator('[name="availability"]').fill('600');
      await page.locator('#roadmap-generator button[type="submit"]').click();
      await expect(workload.locator('.feedback-box--error')).toHaveCount(0);
      await expect(workload.locator('.roadmap-week-list > li')).toHaveCount(1);
      await page.reload();
      await expect(workload.locator('.roadmap-week-list > li')).toHaveCount(1);
    });
  }
}

for (const view of ['kanban', 'timeline', 'calendar', 'checklist']) {
  test(`synthetic populated roadmap ${view} renders without overflow`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-10-28T10:00:00Z') });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.route('**/api/roadmaps', (route) =>
      route.fulfill({ json: { data: fixture() } }),
    );
    await page.goto(`/?screen=roadmap&locale=en&view=${view}`);
    await expect(
      page.getByRole('heading', { name: roadmapCopy.en.title, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
