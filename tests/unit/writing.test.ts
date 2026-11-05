import { describe, it, expect, vi } from 'vitest';
import {
  blank,
  cvSectionSchema,
  writingSaveSchema,
  type Draft,
  type WritingInput,
} from '@/features/writing/contracts';
import {
  anchorValid,
  compareText,
  contentHash,
  counts,
  cvText,
  deterministicReview,
  readyToMark,
} from '@/features/writing/domain';
import { SaveQueue } from '@/features/writing/save-queue';
import { RequestFailure } from '@/features/writing/client';
const input = () => ({ ...blank('kk'), title: 'Менің жолым' });
function row(v: WritingInput): Draft {
  return {
    id: v.id,
    title: v.title,
    kind: v.kind,
    content: v.content,
    prompt: v.prompt,
    word_limit: v.wordLimit,
    application_id: v.applicationId,
    prompt_id: v.promptId,
    rubric: v.rubric,
    studio: v.studio,
    version: v.version + 1,
    updated_at: new Date().toISOString(),
  };
}
describe('Unicode writing domain', () => {
  it.each([
    ['Hello, world!', 2, 13],
    ['Менің елім — Қазақстан', 3, 22],
    ['Привет\nмир', 2, 10],
    ["don't stop", 2, 10],
    ['👩🏽‍💻', 0, 4],
    ['e\u0301', 1, 2],
    ['  \n\t', 0, 4],
  ])(
    'counts %s without guessed admissions rules',
    (text, words, characters) => {
      expect(counts(text)).toMatchObject({ words, characters });
    },
  );
  it('counts all Unicode whitespace explicitly', () =>
    expect(counts('а\u00a0ә\nб').withoutSpaces).toBe(3));
  it('compares changed code points without splitting emoji', () =>
    expect(compareText('A👩🏽‍💻 old Z', 'A👩🏽‍💻 new Z')).toEqual({
      unchanged: 'A👩🏽‍💻 ',
      removed: 'old',
      added: 'new',
      suffix: ' Z',
    }));
  it('handles identical, empty and entirely changed drafts', () => {
    expect(compareText('', 'x').added).toBe('x');
    expect(compareText('x', '').removed).toBe('x');
    expect(compareText('same', 'same').removed).toBe('');
  });
  it('rejects stale anchors even when a quotation still exists', async () => {
    const text = '🙂 I I learned.';
    const r = deterministicReview(text).find((c) => c.code === 'repeated')!;
    const c = {
      ...r,
      id: 'x',
      message: 'Remove duplicate',
      state: 'open' as const,
      provenance: 'deterministic-v1' as const,
    };
    const hash = await contentHash(text);
    expect(anchorValid(text, c, hash, hash)).toBe(true);
    expect(
      anchorValid(`${text} More`, c, hash, await contentHash(`${text} More`)),
    ).toBe(false);
    expect(text.slice(c.start, c.end)).toBe('I I');
  });
  it('labels review as questions instead of fabricated biographical evidence', () => {
    const result = deterministicReview('Мен зерттеуді бастадым.');
    expect(result.map((c) => c.code)).toContain('specificity');
    expect(result.map((c) => c.criterion)).toContain('voice');
  });
  it('finds paragraph and long sentence issues using text evidence', () => {
    const text = Array(110).fill('word').join(' ');
    expect(deterministicReview(text).map((c) => c.code)).toEqual(
      expect.arrayContaining(['paragraphs', 'longSentence']),
    );
  });
  it('keeps untrusted HTML as plain text in export model', () => {
    const sections = [
      {
        id: crypto.randomUUID(),
        category: 'projects' as const,
        heading: '<img src=x onerror=alert(1)>',
        start: '',
        end: '',
        details: 'Қазақша 🙂',
      },
    ];
    expect(
      cvText('CV', sections, {
        education: 'Education',
        experience: 'Experience',
        projects: 'Projects',
        awards: 'Awards',
        activities: 'Activities',
        skills: 'Skills',
        languages: 'Languages',
      }),
    ).toContain('Қазақша 🙂');
  });
  it('validates months, date ordering and UTF-8 size', () => {
    expect(
      cvSectionSchema.safeParse({
        id: crypto.randomUUID(),
        category: 'education',
        heading: '',
        start: '2026-13',
        end: '',
        details: '',
      }).success,
    ).toBe(false);
    expect(
      cvSectionSchema.safeParse({
        id: crypto.randomUUID(),
        category: 'education',
        heading: '',
        start: '2026-02',
        end: '2025-01',
        details: '',
      }).success,
    ).toBe(false);
    expect(
      writingSaveSchema.safeParse({ ...input(), content: 'ә'.repeat(50001) })
        .success,
    ).toBe(false);
  });
  it('requires all self-review criteria and actual text before ready', () => {
    const v = input();
    expect(readyToMark(v)).toBe(false);
    v.content = 'A truthful reflection';
    v.rubric = {
      clarity: true,
      structure: true,
      specificity: true,
      evidence: true,
      voice: true,
    };
    expect(readyToMark(v)).toBe(true);
    v.wordLimit = 1;
    expect(readyToMark(v)).toBe(false);
  });
});
describe('acknowledged save queue', () => {
  it('keeps edits made while an earlier save is in flight', async () => {
    const initial = input();
    let resolve!: (v: Draft) => void;
    const persist = vi.fn(
      (v: WritingInput) =>
        new Promise<Draft>((r) => {
          resolve = () => r(row(v));
        }),
    );
    const queue = new SaveQueue(initial, persist);
    const running = queue.flush();
    queue.edit({ ...initial, content: 'Typed during save' });
    resolve(row(initial));
    await running;
    expect(queue.getSnapshot().input.content).toBe('Typed during save');
    expect(queue.getSnapshot().status).toBe('unsaved');
    expect(queue.getSnapshot().input.version).toBe(1);
  });
  it('retries an uncertain committed save with the identical UUID and payload', async () => {
    const initial = input();
    const persist = vi
      .fn()
      .mockRejectedValueOnce(new Error('lost acknowledgement'))
      .mockImplementation(async (v: WritingInput) => row(v));
    const queue = new SaveQueue(initial, persist);
    await queue.flush();
    expect(queue.getSnapshot().status).toBe('error');
    queue.edit({ ...initial, content: 'new local text' });
    await queue.flush();
    expect(persist.mock.calls[0]![0]).toEqual(persist.mock.calls[1]![0]);
    expect(queue.getSnapshot().input.content).toBe('new local text');
    expect(queue.getSnapshot().status).toBe('unsaved');
    await queue.flush();
    expect(persist.mock.calls[2]![0].version).toBe(1);
    expect(queue.getSnapshot().status).toBe('saved');
  });
  it('blocks silent overwrite after conflict and offers a distinct project', async () => {
    const persist = vi.fn().mockRejectedValue(new RequestFailure('CONFLICT'));
    const initial = { ...input(), version: 3, content: 'private local text' };
    const queue = new SaveQueue(initial, persist);
    queue.edit({ ...initial, content: 'changed local text' });
    await queue.flush();
    await queue.flush();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot().status).toBe('conflict');
    expect(queue.fork()).toMatchObject({
      version: 0,
      content: 'changed local text',
    });
    expect(queue.fork().id).not.toBe(initial.id);
  });
  it('does not issue duplicate requests when flushed concurrently', async () => {
    let release!: (row: Draft) => void;
    const initial = input();
    const persist = vi.fn(() => new Promise<Draft>((r) => (release = r)));
    const queue = new SaveQueue(initial, persist);
    const a = queue.flush(),
      b = queue.flush();
    release(row(initial));
    await Promise.all([a, b]);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot().status).toBe('saved');
  });
  it('does not create immutable checkpoints on ordinary autosaves', async () => {
    const persist = vi.fn(async (v: WritingInput) => row(v));
    const initial = { ...input(), version: 1 };
    const queue = new SaveQueue(initial, persist);
    queue.edit({ ...initial, content: 'new' });
    await queue.flush();
    expect(persist.mock.calls[0]![0].checkpoint).toBe(false);
    await queue.flush(true);
    expect(persist.mock.calls[1]![0].checkpoint).toBe(true);
  });
});
