// Run: node --experimental-strip-types services/pitchStats.selftest.ts
import assert from 'node:assert/strict';
import { computePitchStats, rangeAround, rangeCenter, strainFromEffort } from './pitchStats.ts';

const r = { low: 200, high: 250 };
const pts = (hz: number[]) => hz.map((pitch, i) => ({ time: i * 50, pitch }));

// Silence (-1) is ignored; 3 of 4 voiced samples in range
const s = computePitchStats(pts([-1, 210, 240, 300, 220, -1]), r);
assert.equal(s.inRangePct, 75);
assert.equal(s.median, 230);
assert.ok(Math.abs(s.voicedSeconds - 0.2) < 1e-9);
assert.ok(Math.abs(s.inRangeSeconds - 0.15) < 1e-9);

// Bounds are inclusive; nothing voiced is not 100%
assert.equal(computePitchStats(pts([200, 250]), r).inRangePct, 100);
assert.deepEqual(computePitchStats(pts([-1, -1]), r), { voicedSeconds: 0, inRangeSeconds: 0, inRangePct: 0, median: null });
assert.equal(computePitchStats(undefined, r).median, null);

// Legacy migration: 261 Hz → about 239–285 Hz, centre back near 261
assert.deepEqual(rangeAround(261), { low: 239, high: 285 });
assert.equal(rangeCenter(rangeAround(261)), 261);

assert.deepEqual([1, 2, 3, 5, 8, 10].map(strainFromEffort), [1, 1, 2, 3, 4, 5]);
console.log('pitchStats ok');
