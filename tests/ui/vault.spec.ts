import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { vaultCopy } from '../../src/features/vault/copy';
import type { Locale } from '../../src/lib/i18n/messages';
const docId = '19190000-0000-4000-8000-000000000001',
  versionId = '19190000-0000-4000-8000-000000000002',
  appId = '19190000-0000-4000-8000-000000000003';
const fixture = {
  documents: [
    {
      id: docId,
      user_id: 'fixture-owner',
      category: 'transcript',
      sensitivity: 'academic',
      display_name: 'Synthetic academic transcript.pdf',
      purpose: '',
      current_version_id: versionId,
      expires_at: '2027-10-27T00:00:00Z',
      created_at: '2026-10-27T00:00:00Z',
      archived_at: null,
    },
  ],
  versions: [
    {
      id: versionId,
      document_id: docId,
      sequence: 1,
      state: 'quarantined',
      extension: 'pdf',
      mime: 'application/pdf',
      byte_size: 1200,
      sha256: 'a'.repeat(64),
      created_at: '2026-10-27T00:00:00Z',
    },
  ],
  links: [],
  applications: [
    { id: appId, program_title_snapshot: 'Synthetic application · test only' },
  ],
  tasks: [],
  requests: [],
};
for (const locale of ['en', 'ru', 'kk'] as Locale[])
  for (const width of [375, 768, 1440])
    test(`${locale} ${width}px synthetic Vault and Writing @a11y`, async ({
      page,
    }) => {
      const t = vaultCopy(locale);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/vault', (r) =>
        r.fulfill({ json: { data: fixture } }),
      );
      await page.route('**/api/writing', async (r) => {
        if (r.request().method() === 'POST') {
          const b = r.request().postDataJSON();
          await r.fulfill({
            json: {
              data: {
                draft: {
                  ...b,
                  user_id: 'fixture-owner',
                  version: 1,
                  word_limit: b.wordLimit,
                  application_id: b.applicationId,
                  created_at: '2026-10-27',
                  updated_at: '2026-10-27',
                },
              },
            },
          });
        } else
          await r.fulfill({
            json: { data: { drafts: [], applications: fixture.applications } },
          });
      });
      await page.route('**/api/writing?draft=*', (r) =>
        r.fulfill({ json: { data: { versions: [] } } }),
      );
      await page.goto(`/?locale=${locale}`);
      await expect(
        page.getByRole('heading', { name: t.vault, exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Synthetic academic transcript/ }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: /Synthetic academic transcript/ })
        .click();
      await expect(page.locator('#document-detail')).toBeVisible();
      await expect(
        page
          .locator('#document-detail')
          .getByRole('link', { name: t.download, exact: true }),
      ).toHaveCount(0);
      await expect(
        page
          .locator('#document-detail')
          .getByRole('button', { name: t.link, exact: true }),
      ).toBeDisabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (width !== 768)
        await page.screenshot({
          path: `docs/evidence/phase19/${locale}-vault-${width}-synthetic.png`,
          fullPage: true,
        });
      await page.goto(`/?screen=writing&locale=${locale}`);
      await page
        .getByRole('button', { name: t.createDraft, exact: true })
        .click();
      await page
        .getByLabel(t.title, { exact: true })
        .fill('<img src=x onerror=alert(1)>');
      await page
        .getByLabel(t.editor, { exact: true })
        .fill('Әлем hello Привет');
      await page.getByLabel(t.wordLimit, { exact: true }).fill('2');
      await expect(page.getByText(t.overLimit, { exact: true })).toBeVisible();
      await expect(page.locator('textarea.writing-text')).toHaveValue(
        'Әлем hello Привет',
      );
      await page.getByRole('button', { name: t.save, exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(t.saved);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (width !== 768)
        await page.screenshot({
          path: `docs/evidence/phase19/${locale}-writing-${width}-synthetic.png`,
          fullPage: true,
        });
    });

test('failed upload replay preserves the file and offers a real version retry', async ({
  page,
}) => {
  const t = vaultCopy('en');
  let attempts = 0;
  await page.route('**/api/vault', (r) =>
    r.fulfill({
      json: {
        data: {
          ...fixture,
          documents: [{ ...fixture.documents[0], category: 'essay' }],
          versions: [{ ...fixture.versions[0], state: 'failed' }],
        },
      },
    }),
  );
  await page.route('**/api/vault/upload', (r) => {
    attempts++;
    return r.fulfill({
      json: {
        data: { id: docId, state: attempts === 1 ? 'failed' : 'quarantined' },
      },
    });
  });
  await page.goto('/');
  const form = page
    .locator('form')
    .filter({ has: page.locator('input[type="file"]') });
  await form.locator('select:has(option[value="essay"])').selectOption('essay');
  await form.locator('input[type="file"]').setInputFiles({
    name: 'Retry.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('My own words.'),
  });
  await form.getByRole('button', { name: t.upload, exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText(t.quarantinedNotice);
  await expect(form.getByText(/Retry.txt/)).toBeVisible();
  await form.getByRole('button', { name: t.upload, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(t.quarantinedNotice);
  expect(attempts).toBe(2);
});

test('removed attachment stays visible and can be detached without deleting the application', async ({
  page,
}) => {
  const t = vaultCopy('en');
  let detached = false;
  const link = {
    id: '19190000-0000-4000-8000-000000000004',
    document_id: docId,
    version_id: versionId,
    application_id: appId,
    user_id: 'fixture-owner',
    task_id: null,
  };
  await page.route('**/api/vault', async (r) => {
    if (r.request().method() === 'POST') {
      const body = r.request().postDataJSON();
      expect(body).toMatchObject({
        action: 'unlink',
        documentId: docId,
        versionId,
        applicationId: appId,
      });
      detached = true;
      return r.fulfill({ json: { data: { saved: true } } });
    }
    return r.fulfill({
      json: {
        data: { ...fixture, documents: [], versions: [], links: [link] },
      },
    });
  });
  await page.goto('/?screen=attachments');
  await expect(page.getByRole('listitem')).toContainText(t.unavailableDocument);
  await page
    .getByRole('button', {
      name: `${t.unlink}: ${t.unavailableDocument}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole('listitem')).toHaveCount(0);
  expect(detached).toBe(true);
  await expect(
    page.getByRole('heading', { name: 'Application fixture' }),
  ).toBeVisible();
});
