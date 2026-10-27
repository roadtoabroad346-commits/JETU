/** Shared validation; the trusted scanner rechecks downloaded bytes before release. */
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const categories = [
  'transcript',
  'certificate',
  'cv',
  'essay',
  'language_test',
  'portfolio',
  'financial',
  'identity',
  'recommendation',
] as const;
export type Category = (typeof categories)[number];
export const formats = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  txt: 'text/plain',
} as const;
export type Extension = keyof typeof formats;
export class FileValidationError extends Error {}

export function safeName(name: string) {
  return (
    name
      .normalize('NFKC')
      .replace(/[\p{Cc}\p{Cf}<>/\\]/gu, '')
      .trim()
      .slice(0, 160) || 'Document'
  );
}
export function fileExtension(name: string): Extension {
  const extension = name.split('.').pop()?.toLowerCase();
  if (extension === 'jpeg') return 'jpg';
  if (!extension || !Object.hasOwn(formats, extension))
    throw new FileValidationError('format');
  return extension as Extension;
}
export function validateFile(
  bytes: Uint8Array,
  name: string,
  mime: string,
  category: Category,
) {
  if (bytes.length < 1 || bytes.length > MAX_FILE_BYTES)
    throw new FileValidationError('size');
  const extension = fileExtension(name);
  if (mime !== formats[extension]) throw new FileValidationError('mime');
  if (
    extension === 'txt' &&
    !['cv', 'essay', 'recommendation'].includes(category)
  )
    throw new FileValidationError('category');
  const start = [...bytes.slice(0, 8)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  // Exclude active PDF features; this is a conservative filter, never a malware verdict.
  const binary = new TextDecoder('latin1').decode(bytes);
  if (
    /<\s*(?:script|html|svg|iframe)|<\?php/i.test(binary) ||
    binary.includes('PK' + String.fromCharCode(3, 4))
  )
    throw new FileValidationError('active');
  if (
    extension === 'pdf' &&
    (!binary.startsWith('%PDF-') ||
      !/%%EOF\s*$/.test(binary.slice(-1024)) ||
      /\/(?:JavaScript|JS|Launch|OpenAction|AA|EmbeddedFile|RichMedia|XFA)\b/i.test(
        binary.replace(/#([\da-f]{2})/gi, (_, h: string) =>
          String.fromCharCode(parseInt(h, 16)),
        ),
      ))
  )
    throw new FileValidationError('signature');
  if (
    extension === 'png' &&
    (start !== '89504e470d0a1a0a' ||
      ![0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82].every(
        (b, i) => bytes[bytes.length - 8 + i] === b,
      ))
  )
    throw new FileValidationError('signature');
  if (
    extension === 'jpg' &&
    (!start.startsWith('ffd8ff') ||
      bytes.at(-2) !== 0xff ||
      bytes.at(-1) !== 0xd9)
  )
    throw new FileValidationError('signature');
  if (extension === 'txt') {
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new FileValidationError('encoding');
    }
    if (
      Array.from(text).some((c) => {
        const n = c.codePointAt(0) ?? 0;
        return n < 32 && ![9, 10, 13].includes(n);
      }) ||
      start.startsWith('4d5a') ||
      binary.startsWith('%PDF-')
    )
      throw new FileValidationError('signature');
  }
  return {
    extension,
    mime: formats[extension],
    size: bytes.length,
    displayName: safeName(name),
  };
}
