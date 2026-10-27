// Bounded, uncompressed ZIP export. No imported archive is ever accepted.
export function zipExport(entries: { name: string; bytes: Uint8Array }[]) {
  if (
    !entries.length ||
    entries.length > 20 ||
    entries.reduce((n, e) => n + e.bytes.length, 0) > 20 * 1024 * 1024
  )
    throw new Error('export limit');
  const parts: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    if (!/^[a-zA-Z0-9_-]+\.(pdf|png|jpg|txt)$/.test(entry.name))
      throw new Error('unsafe ZIP entry');
    const name = new TextEncoder().encode(entry.name);
    let crc = 0xffffffff;
    for (const byte of entry.bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const header = new Uint8Array(30 + name.length),
      h = new DataView(header.buffer);
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, entry.bytes.length, true);
    h.setUint32(22, entry.bytes.length, true);
    h.setUint16(26, name.length, true);
    header.set(name, 30);
    const central = new Uint8Array(46 + name.length),
      c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, entry.bytes.length, true);
    c.setUint32(24, entry.bytes.length, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.set(name, 46);
    parts.push(header, entry.bytes);
    directory.push(central);
    offset += header.length + entry.bytes.length;
  }
  const directorySize = directory.reduce((n, p) => n + p.length, 0);
  const end = new Uint8Array(22),
    e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, entries.length, true);
  e.setUint16(10, entries.length, true);
  e.setUint32(12, directorySize, true);
  e.setUint32(16, offset, true);
  const result = new Uint8Array(offset + directorySize + end.length);
  let at = 0;
  for (const part of [...parts, ...directory, end]) {
    result.set(part, at);
    at += part.length;
  }
  return result;
}
