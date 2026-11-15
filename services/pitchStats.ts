import type { PitchDataPoint, PitchRange } from '../types';

export interface PitchStats {
  voicedSeconds: number;
  inRangeSeconds: number;
  inRangePct: number; // 0..100 of voiced time; 0 when nothing was voiced
  median: number | null; // Hz, null when nothing was voiced
}

const SAMPLE_SECONDS = 0.05; // App samples pitch every 50ms

export const computePitchStats = (data: PitchDataPoint[] | undefined, range: PitchRange): PitchStats => {
  const voiced = (data || []).map(p => p.pitch).filter(p => p > 0);
  if (voiced.length === 0) return { voicedSeconds: 0, inRangeSeconds: 0, inRangePct: 0, median: null };

  const inRange = voiced.filter(p => p >= range.low && p <= range.high).length;
  const sorted = [...voiced].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    voicedSeconds: voiced.length * SAMPLE_SECONDS,
    inRangeSeconds: inRange * SAMPLE_SECONDS,
    inRangePct: Math.round((inRange / voiced.length) * 100),
    median: Math.round(median),
  };
};

// Median voiced pitch per time bucket (one bucket ≈ one pixel); null where nothing was voiced
export const bucketPitch = (data: PitchDataPoint[], durationMs: number, buckets: number): (number | null)[] => {
  const bins: number[][] = Array.from({ length: buckets }, () => []);
  for (const p of data) {
    if (p.pitch <= 0 || p.time < 0 || p.time > durationMs) continue;
    bins[Math.min(buckets - 1, Math.floor((p.time / durationMs) * buckets))].push(p.pitch);
  }
  return bins.map(b => {
    if (!b.length) return null;
    b.sort((x, y) => x - y);
    return b[Math.floor(b.length / 2)];
  });
};

// "Then vs now": mean of the first and last few values, rounded (needs at least 2 values)
export const trendEnds = (values: number[], n = 3): { from: number; to: number } | null => {
  if (values.length < 2) return null;
  const k = Math.min(n, Math.floor(values.length / 2));
  const mean = (a: number[]) => Math.round(a.reduce((s, v) => s + v, 0) / a.length);
  return { from: mean(values.slice(0, k)), to: mean(values.slice(-k)) };
};

// ±1.5 semitones around a single legacy target pitch
export const rangeAround = (hz: number): PitchRange => ({
  low: Math.round(hz * Math.pow(2, -1.5 / 12)),
  high: Math.round(hz * Math.pow(2, 1.5 / 12)),
});

// Geometric centre: what a single "target pitch" means for a range
export const rangeCenter = (r: PitchRange) => Math.round(Math.sqrt(r.low * r.high));

// Old 1–10 effort maps onto the 5-step strain scale
export const strainFromEffort = (effort: number) => Math.min(5, Math.max(1, Math.ceil(effort / 2)));

export const STRAIN_LABELS = ['Easy', 'Fine', 'Some effort', 'Strained', 'Hurt'] as const;
