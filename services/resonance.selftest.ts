import assert from 'node:assert/strict';
import { brightnessPos, medianBrightness, resonanceGoal, spectralCentroid } from './resonance.ts';

const binHz = 10;
const bins = (energy: Record<number, number>) => Array.from({ length: 600 }, (_, i) => (energy[i] !== undefined ? energy[i] : -Infinity));

// Equal energy at 1000 Hz and 2000 Hz → centroid 1500 Hz
assert.equal(spectralCentroid(bins({ 100: 0, 200: 0 }), binHz, 200), 1500);
// More energy up high → brighter
assert.ok(spectralCentroid(bins({ 100: -20, 200: 0 }), binHz, 200)! > 1500);
// The fundamental (and anything below 1.5 × f0) is ignored
assert.equal(spectralCentroid(bins({ 20: 40, 100: 0, 200: 0 }), binHz, 200), 1500);
// Above 5 kHz is ignored; silence gives null
assert.equal(spectralCentroid(bins({ 100: 0, 550: 0 }), binHz, 200), 1000);
assert.equal(spectralCentroid(bins({}), binHz, 200), null);

const pts = (bs: (number | undefined)[]) => bs.map((brightness, i) => ({ time: i, pitch: 200, brightness }));
assert.equal(medianBrightness(pts([1000, 1200, undefined, 1400, 1600, 1800])), 1400);
assert.equal(medianBrightness(pts([1000, 1200])), null); // too few voiced samples
assert.equal(medianBrightness(undefined), null);

assert.equal(resonanceGoal({ low: 165, high: 255 }), 'brighter');
assert.equal(resonanceGoal({ low: 85, high: 155 }), 'darker');
assert.equal(resonanceGoal({ low: 145, high: 185 }), 'neutral');
assert.equal(brightnessPos(500), 0); assert.equal(brightnessPos(4000), 1); assert.equal(brightnessPos(99999), 1);
console.log('resonance ok');
