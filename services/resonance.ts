import type { PitchDataPoint, PitchRange } from '../types';

// Brightness: an estimate of resonance. It's the spectral centroid (the "centre of mass" of the sound's
// energy) of the harmonics above the fundamental, up to 5 kHz. Starting above the fundamental keeps
// pitch itself from dominating; brighter (more forward) resonance moves energy up and raises it.
// It is an estimate, not a lab measure, and it still rises somewhat with pitch.
export const spectralCentroid = (db: ArrayLike<number>, binHz: number, f0: number, maxHz = 5000): number | null => {
  const lo = Math.max(1, Math.ceil((f0 * 1.5) / binHz));
  const hi = Math.min(db.length - 1, Math.floor(maxHz / binHz));
  let weight = 0, sum = 0;
  for (let i = lo; i <= hi; i++) {
    const m = 10 ** (db[i] / 20); // dB → magnitude; -Infinity (silence) → 0
    weight += m;
    sum += m * i * binHz;
  }
  return weight > 0 ? Math.round(sum / weight) : null;
};

// Median brightness of a session's voiced samples; null for sessions recorded before this existed
export const medianBrightness = (points?: PitchDataPoint[]): number | null => {
  const xs = (points ?? []).map(p => p.brightness).filter((b): b is number => typeof b === 'number' && b > 0).sort((a, b) => a - b);
  if (xs.length < 5) return null;
  const m = Math.floor(xs.length / 2);
  return Math.round(xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2);
};

// Which way counts as progress, from the target range: high ranges train brighter, low ones darker
export type ResonanceGoal = 'brighter' | 'darker' | 'neutral';
export const resonanceGoal = (range: PitchRange): ResonanceGoal => {
  const centre = (range.low + range.high) / 2;
  return centre >= 180 ? 'brighter' : centre <= 140 ? 'darker' : 'neutral'; // fem ~210, masc ~120, androgynous ~165
};

// Position on the meter, 0..1, on a log scale from 500 Hz to 4 kHz
export const BRIGHT_MIN = 500, BRIGHT_MAX = 4000;
export const brightnessPos = (hz: number) =>
  Math.max(0, Math.min(1, (Math.log(hz) - Math.log(BRIGHT_MIN)) / (Math.log(BRIGHT_MAX) - Math.log(BRIGHT_MIN))));
