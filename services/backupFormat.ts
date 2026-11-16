// One backup file: a magic line, a 4-byte header length, a JSON header, then the audio blobs back to back.
// No zip library needed, and recordings are copied as they are (no base64 blow-up).

const MAGIC = 'RESONA-BACKUP-1\n';
const MAX_HEADER = 200_000_000;

export interface BackupHeader {
  version: 1;
  createdAt: number;
  includesRecordings: boolean;
  storage: Record<string, string>;                         // localStorage key → raw JSON string
  recordings: { id: string; type: string; size: number }[]; // in file order
}

export const packBackup = (header: BackupHeader, blobs: Blob[]): Blob => {
  const json = new TextEncoder().encode(JSON.stringify(header));
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, json.length, true);
  return new Blob([MAGIC, len, json, ...blobs], { type: 'application/octet-stream' });
};

// Reads and checks a backup; throws a readable message if the file is not one or is damaged
export const unpackBackup = async (file: Blob, allowedKeys: string[]) => {
  const bad = (why: string) => new Error(`This file can’t be restored: ${why}`);
  const start = MAGIC.length + 4;
  if (file.size < start) throw bad('it isn’t a Resona backup.');
  const head = new Uint8Array(await file.slice(0, start).arrayBuffer());
  if (new TextDecoder().decode(head.slice(0, MAGIC.length)) !== MAGIC) throw bad('it isn’t a Resona backup.');
  const n = new DataView(head.buffer).getUint32(MAGIC.length, true);
  if (n > MAX_HEADER || start + n > file.size) throw bad('it is damaged or incomplete.');

  let header: BackupHeader;
  try { header = JSON.parse(await file.slice(start, start + n).text()); } catch { throw bad('it is damaged.'); }
  if (header?.version !== 1 || typeof header.storage !== 'object' || !Array.isArray(header.recordings)) throw bad('it is from an unknown version.');
  // Only Resona's own keys, only strings that parse as JSON
  for (const [k, v] of Object.entries(header.storage)) {
    if (!allowedKeys.includes(k) || typeof v !== 'string') throw bad('it contains unexpected data.');
    try { JSON.parse(v); } catch { throw bad('it is damaged.'); }
  }

  let offset = start + n;
  const recordings = header.recordings.map(r => {
    if (typeof r.id !== 'string' || !Number.isInteger(r.size) || r.size < 0) throw bad('it is damaged.');
    const blob = file.slice(offset, offset + r.size, typeof r.type === 'string' ? r.type : 'audio/webm');
    offset += r.size;
    return { id: r.id, blob };
  });
  if (offset !== file.size) throw bad('it is damaged or incomplete.');
  return { header, recordings };
};
