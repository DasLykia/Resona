import assert from 'node:assert/strict';
import { monthRecaps } from './recap.ts';

const t = (m: number, d: number) => new Date(2026, m - 1, d, 12).getTime();
const r = monthRecaps(
  [
    { startTime: t(10, 1), median: 150 }, { startTime: t(10, 5), median: 160 }, { startTime: t(10, 9), median: null },
    { startTime: t(10, 20), median: 180 }, { startTime: t(10, 30), median: 190 },
    { startTime: t(11, 2), median: 200 },
  ],
  { '2026-10-01': 600, '2026-10-05': 900, '2026-10-30': 300, '2026-09-28': 1200, '2026-11-02': 0 },
);
assert.deepEqual(r.map(x => x.month), ['2026-11', '2026-10', '2026-09']); // newest first, history-only months too
const oct = r[1];
assert.equal(oct.minutes, 30);
assert.equal(oct.sessions, 5);
assert.equal(oct.daysTrained, 3);
assert.equal(oct.startMedian, 155); // first 2 of 4 measured
assert.equal(oct.endMedian, 185);   // last 2
assert.equal(r[0].startMedian, null); // one session: no start vs end
assert.equal(r[0].daysTrained, 0);    // zero-second day doesn't count
assert.equal(r[2].sessions, 0);
console.log('recap ok');
