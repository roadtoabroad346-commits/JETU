import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mentorCopy } from '../../src/features/mentors/copy';
import type { Locale } from '../../src/lib/i18n/messages';
import type {
  Mentor,
  Workspace,
  Command,
} from '../../src/features/mentors/contracts';
const A = '22000000-0000-4000-8000-000000000001',
  X = '22000000-0000-4000-8000-000000000003',
  S = '22020000-0000-4000-8000-000000000003',
  R = '22050000-0000-4000-8000-000000000001',
  G = '22050000-0000-4000-8000-000000000002',
  D = '22030000-0000-4000-8000-000000000001',
  V = '22040000-0000-4000-8000-000000000001';
const mentor: Mentor = {
  id: X,
  name: 'SYNTHETIC QA Mentor',
  bio: 'Clearly isolated synthetic browser fixture.',
  expertise: ['Essays'],
  languages: ['ru', 'kk', 'en'],
  countries: ['KZ'],
  degrees: ['bachelor'],
  timezone: 'Asia/Almaty',
  verifiedSummary: 'SYNTHETIC QA approval, not a real person.',
  capacity: 2,
  services: [
    {
      id: S,
      kind: 'essay',
      summary: 'Focused essay feedback',
      deliverables: 'Actionable feedback and rubric',
      turnaround_hours: 72,
      price_minor: 0,
      currency: 'KZT',
    },
  ],
  slots: [],
};
function workspace(): Workspace {
  return {
    requestDrafts: [],
    actor: { id: A, verifier: false, moderator: false },
    profile: null,
    clearance: { approved_until: '2027-01-01T00:00:00Z' },
    requests: [],
    grants: [],
    comments: [],
    reviews: [],
    events: [],
    bookings: [],
    evidence: [],
    profiles: [],
    reports: [],
    materials: [
      {
        type: 'writing',
        resource: D,
        version: V,
        title: 'SYNTHETIC essay · v1',
        download: false,
      },
    ],
  };
}
async function fixture(page: Page, data = workspace(), mentors = [mentor]) {
  const posts: Command[] = [];
  let failure = false;
  await page.route('**/api/mentors*', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Command;
      posts.push(body);
      if (failure) {
        failure = false;
        return route.fulfill({
          status: 503,
          json: { error: { code: 'PROVIDER_TIMEOUT' } },
        });
      }
      if (body.op === 'create') {
        data.requests = [
          {
            id: R,
            student_id: A,
            mentor_id: X,
            goal: body.goal,
            status: 'submitted',
            expires_at: body.expires,
            due_at: '2026-12-01T00:00:00Z',
            revoked_at: null,
            revision: 1,
            terms_snapshot: mentor.services[0]!,
            created_at: '2026-11-06T00:00:00Z',
          },
        ];
        data.grants = [
          {
            id: G,
            request_id: R,
            resource_type: 'writing',
            resource_id: D,
            version_id: V,
            operations: ['view', 'comment', 'review'],
            snapshot: { title: 'SYNTHETIC essay' },
            expires_at: body.expires,
            revoked_at: null,
          },
        ];
      }
      if (['revoke', 'block', 'cancel'].includes(body.op)) {
        data.requests = data.requests.map((r) => ({
          ...r,
          revoked_at: new Date().toISOString(),
          revision: r.revision + 1,
        }));
      }
      return route.fulfill({ json: { data: { id: R } } });
    }
    if (url.searchParams.get('directory'))
      return route.fulfill({ json: { data: { mentors } } });
    if (url.searchParams.get('grant'))
      return route.fulfill({
        json: {
          data: {
            resource: {
              type: 'writing',
              title: 'SYNTHETIC essay',
              content: 'My 🙂 private essay',
              version: 1,
              draft: D,
              prompt: 'A specific personal story',
              wordLimit: 500,
            },
          },
        },
      });
    return route.fulfill({ json: { data } });
  });
  return {
    data,
    posts,
    fail: () => {
      failure = true;
    },
  };
}
for (const [locale, width] of [
  ['en', 1440],
  ['ru', 768],
  ['kk', 320],
] as [Locale, number][]) {
  test(`directory empty state, keyboard and axe ${locale} ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await fixture(page, workspace(), []);
    await page.goto(`/tests/journey/fixture.html?mentors=1&locale=${locale}`);
    await expect(
      page.getByRole('heading', { name: mentorCopy[locale].empty }),
    ).toBeVisible();
    await page.getByLabel(mentorCopy[locale].search, { exact: true }).focus();
    await expect(
      page.getByLabel(mentorCopy[locale].search, { exact: true }),
    ).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: `work/phase22-ui/empty-${locale}-${width}.png`,
      fullPage: true,
    });
  });
}
test('consent wizard sends exact selected version and revocation removes preview', async ({
  page,
}) => {
  const { posts } = await fixture(page);
  const t = mentorCopy.en;
  const q = encodeURIComponent(`mentor=${X}&service=${S}`);
  await page.goto(`/tests/journey/fixture.html?mentoring=1&query=${q}`);
  await page
    .getByLabel(t.goal, { exact: true })
    .fill('Please review the clarity of my essay');
  await page.getByLabel(/SYNTHETIC essay · v1/).check();
  await page.getByRole('button', { name: t.next, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: t.consentPolicy }),
  ).toBeVisible();
  await page.getByLabel(t.consent, { exact: true }).check();
  await page.getByRole('button', { name: t.confirm, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: t.original, exact: true }),
  ).toBeVisible();
  expect(posts[0]).toMatchObject({
    op: 'create',
    items: [{ type: 'writing', resource: D, version: V, download: false }],
    consent: true,
    policy: 'mentor-consent-v1',
  });
  await expect(
    page.getByRole('textbox', { name: t.quote, exact: true }),
  ).toHaveValue('My 🙂 private essay');
  await page.getByRole('button', { name: t.revoke, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: t.original, exact: true }),
  ).toHaveCount(0);
  expect(posts.at(-1)?.op).toBe('revoke');
});
test('uncertain request retry keeps its idempotency key and input', async ({
  page,
}) => {
  const f = await fixture(page);
  const t = mentorCopy.en;
  await page.goto(
    `/tests/journey/fixture.html?mentoring=1&query=${encodeURIComponent(`mentor=${X}&service=${S}`)}`,
  );
  await page
    .getByLabel(t.goal, { exact: true })
    .fill('Please review my essay structure');
  await page.getByLabel(/SYNTHETIC essay · v1/).check();
  await page.getByRole('button', { name: t.next, exact: true }).click();
  await page.getByLabel(t.consent, { exact: true }).check();
  f.fail();
  await page.getByRole('button', { name: t.confirm, exact: true }).click();
  await expect(page.getByRole('status')).toContainText(t.failed);
  await page.getByRole('button', { name: t.confirm, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: t.original, exact: true }),
  ).toBeVisible();
  expect(f.posts[0]).toEqual(f.posts[1]);
});
test('missing safeguarding clearance keeps confirmation unavailable', async ({
  page,
}) => {
  const data = workspace();
  data.clearance = null;
  await fixture(page, data);
  const t = mentorCopy.en;
  await page.goto(
    `/tests/journey/fixture.html?mentoring=1&query=${encodeURIComponent(`mentor=${X}&service=${S}`)}`,
  );
  await page
    .getByLabel(t.goal, { exact: true })
    .fill('Please review my essay structure');
  await page.getByLabel(/SYNTHETIC essay · v1/).check();
  await page.getByRole('button', { name: t.next, exact: true }).click();
  await page.getByLabel(t.consent, { exact: true }).check();
  await expect(
    page.getByRole('button', { name: t.confirm, exact: true }),
  ).toBeDisabled();
});
test('applicant cannot see administrative approval controls', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/tests/journey/fixture.html?mentoring=1&query=tab%3Dadmin');
  await expect(page.getByText(mentorCopy.en.staffOnly)).toBeVisible();
  await expect(
    page.getByRole('button', { name: mentorCopy.en.saveDecision }),
  ).toHaveCount(0);
});
test('populated directory shows transparent terms and no external contact', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/tests/journey/fixture.html?mentors=1');
  await expect(page.getByRole('heading', { name: mentor.name })).toBeVisible();
  await expect(page.getByText(/Essay review · Free · 72 h/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: 'work/phase22-ui/directory-en-1440.png',
    fullPage: true,
  });
});
