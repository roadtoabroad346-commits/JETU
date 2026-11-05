import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writingCopy, kindCopy } from '../../src/features/writing/copy';
import type {
  Draft,
  Revision,
  WritingInput,
} from '../../src/features/writing/contracts';
import { mkdirSync } from 'node:fs';
const evidence = 'work/phase21-ui';
async function fixture(page: Page) {
  const drafts = new Map<string, Draft>();
  const versions = new Map<string, Revision[]>();
  let fail = false,
    conflict = false;
  const posts: WritingInput[] = [];
  await page.route('**/api/writing*', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as WritingInput;
      posts.push(body);
      if (conflict)
        return route.fulfill({
          status: 409,
          json: { error: { code: 'CONFLICT' } },
        });
      if (fail) {
        fail = false;
        return route.abort('failed');
      }
      const draft: Draft = {
        id: body.id,
        title: body.title,
        kind: body.kind,
        content: body.content,
        prompt: body.prompt,
        word_limit: body.wordLimit,
        application_id: body.applicationId,
        prompt_id: body.promptId,
        studio: body.studio,
        rubric: body.rubric,
        version: body.version + 1,
        updated_at: new Date().toISOString(),
      };
      drafts.set(draft.id, draft);
      if (body.checkpoint || draft.version === 1)
        versions.set(draft.id, [
          {
            id: crypto.randomUUID(),
            version: draft.version,
            created_at: draft.updated_at,
            snapshot: structuredClone(draft),
          },
          ...(versions.get(draft.id) ?? []),
        ]);
      return route.fulfill({ json: { data: { draft } } });
    }
    const project = url.searchParams.get('project'),
      id = url.searchParams.get('draft'),
      version = url.searchParams.get('version');
    if (project)
      return route.fulfill({ json: { data: { draft: drafts.get(project) } } });
    if (id)
      return route.fulfill({
        json: {
          data: version
            ? {
                version: versions
                  .get(id)
                  ?.find((v) => v.version === Number(version)),
              }
            : { versions: versions.get(id) ?? [] },
        },
      });
    return route.fulfill({
      json: {
        data: {
          drafts: [...drafts.values()],
          applications: [],
          prompts: [],
          aiAvailable: false,
        },
      },
    });
  });
  return {
    posts,
    drafts,
    versions,
    failNext: () => (fail = true),
    conflict: () => (conflict = true),
  };
}
async function create(page: Page, kind = 'personal_statement') {
  await page
    .getByLabel('Project title', { exact: true })
    .fill('My authentic experience');
  await page.getByLabel('Writing goal').selectOption(kind);
  await page
    .getByRole('button', { name: 'Open a blank page', exact: true })
    .click();
}
test('autosave acknowledgement, reload, checkpoint compare/restore and stale comments (mocked API)', async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto('/tests/journey/fixture.html?writing=1');
  await create(page);
  const editor = page.getByRole('textbox', { name: 'Draft', exact: true });
  await editor.fill('I I learned from my real experience.');
  await expect(
    page.getByText('Saved on server', { exact: true }),
  ).toBeVisible();
  expect(f.posts.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await page
    .getByRole('button', { name: 'Run local checks', exact: true })
    .click();
  await expect(
    page.getByText('A word repeats consecutively.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Accept proposed edit', exact: true })
    .click();
  await expect(editor).toHaveValue('I learned from my real experience.');
  await expect(
    page.getByText('Stale review', { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Undo last accepted edit', exact: true })
    .click();
  await expect(editor).toHaveValue('I I learned from my real experience.');
  await page
    .getByRole('button', { name: 'Save checkpoint', exact: true })
    .click();
  await expect(
    page.getByText('Saved on server', { exact: true }),
  ).toBeVisible();
  await editor.fill('A truthful new version.');
  await page
    .getByRole('button', { name: 'Save checkpoint', exact: true })
    .click();
  await expect(
    page.getByText('Saved on server', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Versions', exact: true }).click();
  await page
    .getByRole('button', { name: 'Compare with current draft' })
    .last()
    .click();
  await expect(page.locator('del')).toContainText('I I learned');
  await page
    .getByRole('button', { name: 'Restore as new checkpoint' })
    .last()
    .click();
  await expect(editor).toHaveValue('I I learned from my real experience.');
  await expect(
    page.getByText('Saved on server', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: 'Continue writing', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Draft', exact: true }),
  ).toHaveValue('I I learned from my real experience.');
});
test('network error preserves local text, retries identical request, conflict forks safely', async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto('/tests/journey/fixture.html?writing=1');
  await create(page);
  f.failNext();
  const editor = page.getByRole('textbox', { name: 'Draft', exact: true });
  await editor.fill('Keep this local text.');
  await page
    .getByRole('button', { name: 'Save checkpoint', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Retry save', exact: true }),
  ).toBeVisible();
  await expect(editor).toHaveValue('Keep this local text.');
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await expect(
    page.getByText('Saved on server', { exact: true }),
  ).toBeVisible();
  expect(f.posts[0]!.requestId).toBe(f.posts[1]!.requestId);
  f.conflict();
  await editor.fill('My local conflict recovery');
  await page
    .getByRole('button', { name: 'Save checkpoint', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Save a separate copy', exact: true }),
  ).toBeVisible();
  const original = f.posts.at(-1)!.id;
  await page
    .getByRole('button', { name: 'Save a separate copy', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Draft', exact: true }),
  ).toHaveValue('My local conflict recovery');
  await page
    .getByRole('button', { name: 'Save checkpoint', exact: true })
    .click();
  expect(f.posts.at(-1)!.id).not.toBe(original);
});
test('CV sections, Unicode TXT export and preview contain only supplied facts', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/tests/journey/fixture.html?writing=1');
  await create(page, 'cv');
  await page.getByRole('button', { name: 'Add section', exact: true }).click();
  await page
    .getByLabel('Role / qualification / project')
    .fill('Қазақша research');
  await page
    .getByLabel('Your contributions and evidence')
    .fill('Мен зерттеуді өзім жасадым. 🙂');
  await expect(
    page.getByRole('region', { name: 'Document preview' }),
  ).toContainText('Қазақша research');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export TXT', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.txt$/);
  const path = await file.path();
  const { readFile } = await import('node:fs/promises');
  expect(await readFile(path!, 'utf8')).toContain(
    'Мен зерттеуді өзім жасадым. 🙂',
  );
  mkdirSync(evidence, { recursive: true });
  await page.pdf({
    path: `${evidence}/unicode-cv.pdf`,
    format: 'A4',
    printBackground: true,
  });
});
test('text interview asks no microphone permission and does not save without opt-in', async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto('/tests/journey/fixture.html?writing=1');
  await create(page, 'interview');
  await page
    .getByRole('button', { name: 'Start practice', exact: true })
    .click();
  await page
    .getByLabel('Your answer', { exact: true })
    .fill('This answer stays in this tab.');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(
    page.getByText('Practice paused', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page
    .getByRole('button', { name: 'Next question', exact: true })
    .click();
  await expect(
    page
      .getByText('What do you hope to learn, and why?', { exact: false })
      .first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'End practice', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(
    page.getByRole('button', { name: 'Save checkpoint', exact: true }),
  ).toBeDisabled();
  expect(f.posts).toHaveLength(0);
  expect(
    await page.evaluate(
      () =>
        navigator.mediaDevices?.getUserMedia === undefined ||
        document.querySelectorAll('audio,video').length === 0,
    ),
  ).toBe(true);
});
for (const locale of ['ru', 'kk', 'en'] as const) {
  test(`${locale} studio/editor mobile-tablet-desktop, reduced motion and axe (synthetic API)`, async ({
    page,
  }) => {
    await fixture(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/tests/journey/fixture.html?writing=1&locale=${locale}`);
    await expect(
      page.getByRole('heading', {
        name: writingCopy[locale].title,
        exact: true,
      }),
    ).toBeVisible();
    mkdirSync(evidence, { recursive: true });
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${evidence}/${locale}-home-${width}.png`,
        fullPage: true,
      });
    }
    expect(
      (await new AxeBuilder({ page }).include('main').analyze()).violations,
    ).toEqual([]);
    await page
      .getByLabel(writingCopy[locale].projectTitle, { exact: true })
      .fill('Менің тарихым / Моя история');
    await page
      .getByRole('button', { name: writingCopy[locale].create, exact: true })
      .click();
    await page
      .getByRole('textbox', { name: writingCopy[locale].editor, exact: true })
      .fill('<img src=x onerror=alert(1)> Қазақша 🙂');
    await expect(
      page.getByText(kindCopy[locale].personal_statement!, { exact: true }),
    ).toBeVisible();
    expect(await page.locator('img').count()).toBe(0);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${evidence}/${locale}-editor-${width}.png`,
        fullPage: true,
      });
    }
    expect(
      (await new AxeBuilder({ page }).include('main').analyze()).violations,
    ).toEqual([]);
  });
}

test('opted-in interview retains each answer under its own question', async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto('/tests/journey/fixture.html?writing=1');
  await create(page, 'interview');
  await page
    .getByLabel('Save private practice history', { exact: true })
    .check();
  await page
    .getByRole('button', { name: 'Start practice', exact: true })
    .click();
  await page
    .getByLabel('Your answer', { exact: true })
    .fill('First truthful answer');
  await page
    .getByRole('button', { name: 'Next question', exact: true })
    .click();
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue('');
  await page
    .getByLabel('Your answer', { exact: true })
    .fill('Second truthful answer');
  await page
    .getByRole('button', { name: 'Save checkpoint', exact: true })
    .click();
  await expect(
    page.getByText('Saved on server', { exact: true }),
  ).toBeVisible();
  expect(f.posts.at(-1)!.studio.interview?.answers).toEqual([
    'First truthful answer',
    'Second truthful answer',
    '',
  ]);
});
