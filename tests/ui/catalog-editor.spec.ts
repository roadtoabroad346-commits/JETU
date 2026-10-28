import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Locale } from '../../src/lib/i18n/messages';
import type { EditorQueue } from '../../src/features/catalog-editor/contracts';
import { editorCopy } from '../../src/features/catalog-editor/copy';

function fixture(): EditorQueue {
  return {
    role: 'reviewer',
    nextCursor: null,
    events: [],
    entities: [
      {
        id: 7,
        type: 'eligibility_requirement',
        revision: 1,
        status: 'draft',
        verification: 'needs_review',
        record: {
          title: 'Synthetic catalog requirement',
          description: 'Synthetic fixture only',
        },
        recordHash: 'a'.repeat(32),
        parents: [],
        claims: [
          {
            id: 9,
            key: 'requirement.fact',
            text: 'Synthetic source claim <img src=x onerror="window.unsafe=true">',
            hash: 'b'.repeat(32),
            state: 'needs_review',
            sourceUrl: 'https://catalog-fixture.invalid/source',
            publisher: 'Synthetic fixture publisher',
            checkedAt: '2026-10-28T00:00:00Z',
            sourceActive: true,
          },
        ],
      },
    ],
  };
}
for (const locale of ['en', 'ru', 'kk'] as Locale[]) {
  for (const width of [375, 768, 1440]) {
    test(`${locale} ${width}px synthetic catalog review @a11y`, async ({
      page,
    }) => {
      const t = editorCopy[locale],
        state = fixture();
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/admin/catalog*', async (route) => {
        if (route.request().method() === 'POST') {
          const body = route.request().postDataJSON(),
            entity = state.entities[0]!;
          expect(body.attested).toBe(true);
          expect(body.expectedRevision).toBe(entity.revision);
          const before = { status: entity.status };
          entity.revision++;
          if (body.action === 'review_claim')
            entity.claims[0]!.state = 'verified';
          else {
            entity.status = 'published';
            entity.verification = 'verified';
          }
          state.events.push({
            id: entity.revision,
            entity_id: entity.id,
            action: body.action,
            note: body.note,
            created_at: '2026-10-28T00:00:00Z',
            before_snapshot: before,
            after_snapshot: { status: entity.status },
          });
          await route.fulfill({
            json: { data: { entityId: 7, revision: entity.revision } },
          });
        } else await route.fulfill({ json: { data: state } });
      });
      await page.goto(`/?screen=editor&locale=${locale}`);
      const record = page.locator('.catalog-editor-record').first();
      await expect(
        record.getByRole('heading', {
          name: 'Synthetic catalog requirement',
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        record.getByRole('button', { name: t.publish, exact: true }),
      ).toBeDisabled();
      expect(await page.locator('img').count()).toBe(0);
      const claim = record.locator('.catalog-editor-claim');
      await claim
        .getByRole('textbox')
        .fill('Human synthetic fixture source review');
      await claim.getByRole('checkbox').check();
      await claim.getByRole('button', { name: t.approve, exact: true }).click();
      await expect(
        record.getByRole('button', { name: t.publish, exact: true }),
      ).toBeEnabled();
      const publication = record.locator('form').last();
      await publication
        .getByRole('textbox')
        .fill('Reviewed full fixture record for publication');
      await publication.getByRole('checkbox').check();
      await publication
        .getByRole('button', { name: t.publish, exact: true })
        .click();
      await expect(
        record.getByRole('button', { name: t.unpublish, exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(
        record.getByRole('button', { name: t.unpublish, exact: true }),
      ).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/catalog-editor-${locale}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
test('catalog conflict preserves the entered review note and unchecked claims cannot publish', async ({
  page,
}) => {
  const state = fixture(),
    t = editorCopy.en;
  await page.route('**/api/admin/catalog*', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 409, json: { error: { code: 'CONFLICT' } } })
      : route.fulfill({ json: { data: state } }),
  );
  await page.goto('/?screen=editor');
  const claim = page.locator('.catalog-editor-claim');
  await claim
    .getByRole('textbox')
    .fill('Keep this human review note after a conflict');
  await claim.getByRole('checkbox').check();
  await claim.getByRole('button', { name: t.approve, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(t.conflict);
  await expect(claim.getByRole('textbox')).toHaveValue(
    'Keep this human review note after a conflict',
  );
  await expect(
    page.getByRole('button', { name: t.publish, exact: true }),
  ).toBeDisabled();
});
test('read-only editor sees evidence without write controls; forbidden accounts see no records', async ({
  page,
}) => {
  const state = fixture();
  state.role = 'editor';
  await page.route('**/api/admin/catalog*', (route) =>
    route.fulfill({ json: { data: state } }),
  );
  await page.goto('/?screen=editor');
  await expect(page.getByText(editorCopy.en.readOnly)).toBeVisible();
  await expect(
    page.getByRole('button', { name: editorCopy.en.approve, exact: true }),
  ).toHaveCount(0);
  await page.unrouteAll();
  await page.route('**/api/admin/catalog*', (route) =>
    route.fulfill({ status: 403, json: { error: { code: 'FORBIDDEN' } } }),
  );
  await page.reload();
  await expect(page.getByRole('alert')).toHaveText(editorCopy.en.denied);
  await expect(page.locator('.catalog-editor-record')).toHaveCount(0);
});
