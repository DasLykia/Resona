import assert from 'node:assert/strict';
import { encodeWav, exportName } from './wav.ts';

const wav = new DataView(encodeWav(new Float32Array([0, 1, -1, 2]), 48000));
const tag = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map(i => wav.getUint8(o + i)));
assert.equal(tag(0), 'RIFF'); assert.equal(tag(8), 'WAVE'); assert.equal(tag(36), 'data');
assert.equal(wav.byteLength, 44 + 8);
assert.equal(wav.getUint32(24, true), 48000);
assert.equal(wav.getUint16(22, true), 1); // mono
assert.deepEqual([0, 1, 2, 3].map(i => wav.getInt16(44 + i * 2, true)), [0, 32767, -32768, 32767]); // clipped

assert.equal(exportName(new Date(2026, 10, 16, 18, 5).getTime(), 'Fem: basics?'), 'Resona 2026-11-16 18-05 Fem basics.wav');
assert.equal(exportName(new Date(2026, 0, 2, 9, 0).getTime(), ''), 'Resona 2026-01-02 09-00.wav');
console.log('wav selftest ok');
