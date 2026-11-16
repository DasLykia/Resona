import { STORAGE_KEYS } from '../constants';
import { clearAllAudioBlobs, getAudioBlob, listAudioIds, saveAudioBlob } from './storage';
import { packBackup, unpackBackup, BackupHeader } from './backupFormat';

const KEYS = Object.values(STORAGE_KEYS);
const countOf = (storage: Record<string, string>, key: string) => {
  try { const v = JSON.parse(storage[key] ?? '[]'); return Array.isArray(v) ? v.length : 0; } catch { return 0; }
};

// Saves everything in localStorage (and optionally every recording) as one .resona file
export const createBackup = async (includeRecordings: boolean) => {
  const storage: Record<string, string> = {};
  for (const k of KEYS) { const v = localStorage.getItem(k); if (v !== null) storage[k] = v; }
  const blobs: Blob[] = [], recordings: BackupHeader['recordings'] = [];
  if (includeRecordings) {
    for (const id of await listAudioIds()) {
      const b = await getAudioBlob(id);
      if (b) { blobs.push(b); recordings.push({ id, type: b.type, size: b.size }); }
    }
  }
  const file = packBackup({ version: 1, createdAt: Date.now(), includesRecordings: includeRecordings, storage, recordings }, blobs);
  const d = new Date(), p = (n: number) => String(n).padStart(2, '0');
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = `Resona backup ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.resona`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { sessions: countOf(storage, STORAGE_KEYS.SESSIONS), recordings: recordings.length, bytes: file.size };
};

export type ParsedBackup = Awaited<ReturnType<typeof unpackBackup>>;
export const readBackup = (file: File) => unpackBackup(file, KEYS);
export const summarize = (b: ParsedBackup) => ({
  createdAt: b.header.createdAt,
  sessions: countOf(b.header.storage, STORAGE_KEYS.SESSIONS),
  recordings: b.recordings.length,
  includesRecordings: b.header.includesRecordings,
});

// Replaces this PC's data with the backup. Without recordings in the backup, the audio already here stays.
export const applyBackup = async (b: ParsedBackup) => {
  if (b.header.includesRecordings) {
    // Read every blob first so a damaged file fails before anything is deleted
    const audio = await Promise.all(b.recordings.map(async r => ({ id: r.id, blob: new Blob([await r.blob.arrayBuffer()], { type: r.blob.type }) })));
    await clearAllAudioBlobs();
    for (const r of audio) await saveAudioBlob(r.id, r.blob);
  }
  for (const k of KEYS) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(b.header.storage)) localStorage.setItem(k, v);
  window.location.reload();
};
