import assert from 'node:assert/strict';
import { packBackup, unpackBackup, type BackupHeader } from './backupFormat.ts';

const keys = ['resona_settings_v3', 'resona_sessions_v2'];
const a = new Blob(['hello'], { type: 'audio/webm' }), b = new Blob(['world!!'], { type: 'audio/webm' });
const header: BackupHeader = {
  version: 1, createdAt: 1, includesRecordings: true,
  storage: { resona_settings_v3: '{"theme":"dark"}', resona_sessions_v2: '[]' },
  recordings: [{ id: 'a', type: a.type, size: a.size }, { id: 'b', type: b.type, size: b.size }],
};
const file = packBackup(header, [a, b]);
const out = await unpackBackup(file, keys);
assert.deepEqual(out.header, header);
assert.deepEqual(await Promise.all(out.recordings.map(r => r.blob.text())), ['hello', 'world!!']);
assert.deepEqual(out.recordings.map(r => r.id), ['a', 'b']);

// Rejections
await assert.rejects(unpackBackup(new Blob(['not a backup at all']), keys), /isn’t a Resona backup/);
await assert.rejects(unpackBackup(file.slice(0, file.size - 2), keys), /damaged or incomplete/);
await assert.rejects(unpackBackup(packBackup({ ...header, storage: { evil: '1' } }, [a, b]), keys), /unexpected data/);
await assert.rejects(unpackBackup(packBackup({ ...header, storage: { resona_sessions_v2: '{oops' } }, [a, b]), keys), /damaged/);
console.log('backup format ok');
