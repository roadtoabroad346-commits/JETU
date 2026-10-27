import { boundedBytes } from '@/lib/http/body';
import { describe, expect, it } from 'vitest';
import {
  FileValidationError,
  MAX_FILE_BYTES,
  safeName,
  validateFile,
} from '@/features/vault/files';
import { zipExport } from '@/features/vault/zip';
import {
  uploadSchema,
  recommendationCommand,
  vaultCommand,
} from '@/features/vault/contracts';
import { compareText, wordCount } from '@/features/writing/domain';
import { writingSaveSchema } from '@/features/writing/contracts';
import { readBoundedJson } from '@/features/roadmap/http';
const encode = (s: string) => new TextEncoder().encode(s);
describe('untrusted documents', () => {
  it('validates plain Unicode writing', () =>
    expect(
      validateFile(
        encode('Әлем. Привет! Hello.'),
        'draft.txt',
        'text/plain',
        'essay',
      ).extension,
    ).toBe('txt'));
  it('validates PDF envelope without claiming scan', () =>
    expect(
      validateFile(
        encode('%PDF-1.7\n1 0 obj <<>> endobj\n%%EOF'),
        'academic.pdf',
        'application/pdf',
        'transcript',
      ).mime,
    ).toBe('application/pdf'));
  it('validates real PNG trailing bytes', () => {
    const bytes = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96,
      130,
    ]);
    expect(
      validateFile(bytes, 'a.png', 'image/png', 'certificate').extension,
    ).toBe('png');
  });
  it.each([
    [encode('hello'), 'a.pdf', 'application/pdf', 'essay'],
    [encode('hello'), 'a.txt', 'application/pdf', 'essay'],
    [encode('hello'), 'a.txt', 'text/plain', 'transcript'],
    [encode('<script>alert(1)</script>'), 'a.txt', 'text/plain', 'essay'],
    [
      encode('%PDF-1.7 /JavaScript (x) %%EOF'),
      'a.pdf',
      'application/pdf',
      'essay',
    ],
    [
      encode('%PDF-1.7 /J#61vaScript (x) %%EOF'),
      'a.pdf',
      'application/pdf',
      'essay',
    ],
    [
      encode('%PDF-1.7 /EmbeddedFile (x) %%EOF'),
      'a.pdf',
      'application/pdf',
      'essay',
    ],
    [Uint8Array.from([0x4d, 0x5a, 1, 2]), 'x.txt', 'text/plain', 'essay'],
    [
      encode('PK' + String.fromCharCode(3, 4)),
      'x.pdf',
      'application/pdf',
      'essay',
    ],
    [Uint8Array.from([0xc0, 0x80]), 'x.txt', 'text/plain', 'essay'],
    [new Uint8Array(MAX_FILE_BYTES + 1), 'x.txt', 'text/plain', 'essay'],
    [new Uint8Array(), 'x.txt', 'text/plain', 'essay'],
    [encode('hello'), 'a.svg', 'image/svg+xml', 'essay'],
  ] as const)(
    'rejects unsupported/mismatched/active bytes case %#',
    (bytes, name, mime, category) =>
      expect(() => validateFile(bytes, name, mime, category)).toThrow(
        FileValidationError,
      ),
  );
  it('normalizes filename controls, bidi, paths and markup', () =>
    expect(safeName('../<name>\u202e\n.txt')).toBe('..name.txt'));
  it('requires sensitive purpose and an application', () => {
    expect(
      uploadSchema.safeParse({
        requestId: crypto.randomUUID(),
        category: 'identity',
        name: 'ID.pdf',
      }).success,
    ).toBe(false);
  });
  it('rejects forged ownership and bucket parameters', () =>
    expect(
      uploadSchema.safeParse({
        requestId: crypto.randomUUID(),
        category: 'essay',
        name: 'x.txt',
        userId: crypto.randomUUID(),
        path: 'other',
      }).success,
    ).toBe(false));
  it('rejects guessed invitation tokens and absent contact permission', () => {
    expect(
      recommendationCommand.safeParse({
        action: 'respond',
        token: 'short',
        accept: true,
      }).success,
    ).toBe(false);
    expect(
      recommendationCommand.safeParse({
        action: 'create',
        applicationId: crypto.randomUUID(),
        email: 'a@example.invalid',
        context: 'real context',
        dueDate: null,
      }).success,
    ).toBe(false);
  });
  it('rejects unsafe portfolio URLs', () =>
    expect(
      vaultCommand.safeParse({
        action: 'portfolio',
        name: 'Portfolio',
        url: 'javascript:alert(1)',
      }).success,
    ).toBe(false));
  it('stops chunked bodies before growth, without content-length', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(9));
        c.enqueue(new Uint8Array(9));
      },
      cancel() {
        cancelled = true;
      },
    });
    const request = new Request('https://example.invalid', {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit);
    await expect(boundedBytes(request, 10)).rejects.toThrow('size');
    expect(cancelled).toBe(true);
  });
  it('bounds JSON with a false small content-length', async () => {
    const r = new Request('https://example.invalid', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': '1' },
      body: JSON.stringify({ x: 'a'.repeat(100) }),
    });
    expect(await readBoundedJson(r, 20)).toEqual({ ok: false });
  });
});
describe('export and writing', () => {
  it.each([
    '../secret.txt',
    '/absolute.pdf',
    'dir/file.pdf',
    '..\\secret.txt',
    'file.html',
  ])('blocks ZIP traversal/unsupported entry %s', (name) =>
    expect(() => zipExport([{ name, bytes: encode('x') }])).toThrow('unsafe'),
  );
  it('emits a bounded ZIP with correct signatures', () => {
    const z = zipExport([{ name: 'doc-v1.txt', bytes: encode('text') }]);
    const view = new DataView(z.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(z.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(z.length - 14, true)).toBe(1);
  });
  it('bounds export count and memory', () => {
    expect(() =>
      zipExport(
        Array.from({ length: 21 }, (_, i) => ({
          name: `x${i}.txt`,
          bytes: encode('x'),
        })),
      ),
    ).toThrow('limit');
    expect(() =>
      zipExport([{ name: 'x.txt', bytes: new Uint8Array(21 * 1024 * 1024) }]),
    ).toThrow('limit');
  });
  it('counts Unicode words consistently and ignores punctuation/emoji', () => {
    expect(wordCount('Әлем, hello! Привет 👋')).toBe(3);
    expect(wordCount(' \n ... 👋')).toBe(0);
    expect(wordCount('中文申请')).toBeGreaterThan(0);
  });
  it('compares large texts linearly and keeps surrogate pairs intact', () => {
    expect(compareText('a👩b', 'a👨b')).toEqual({
      unchanged: 'a',
      removed: '👩',
      added: '👨',
      suffix: 'b',
    });
    expect(
      compareText('a'.repeat(100000), 'a'.repeat(99999) + 'b').removed,
    ).toBe('a');
  });
  it('bounds draft bytes rather than only character count', () => {
    const d = {
      id: crypto.randomUUID(),
      version: 0,
      requestId: crypto.randomUUID(),
      title: 'Essay',
      kind: 'essay',
      content: 'Ә'.repeat(60000),
      prompt: '',
      wordLimit: null,
      applicationId: null,
      rubric: {},
    };
    expect(writingSaveSchema.safeParse(d).success).toBe(false);
  });
});
