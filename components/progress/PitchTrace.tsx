import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PitchDataPoint, PitchRange } from '../../types';
import { bucketPitch } from '../../services/pitchStats';

export interface Trace {
  data: PitchDataPoint[];
  tone: 'accent' | 'ink';
  label?: string;
}

interface PitchTraceProps {
  traces: Trace[];
  range: PitchRange;
  durationMs: number;
  playheadMs?: number | null;
  height?: number;
}

const GRID = [80, 100, 120, 150, 180, 200, 250, 300, 350, 400];
const PAD_L = 40;

// Grid values inside the domain, dropping any that would sit closer than minGap px to the last one kept
export const gridLines = (lo: number, hi: number, y: (hz: number) => number, minGap = 32) => {
  const kept: number[] = [];
  for (const g of GRID) if (g > lo && g < hi && (!kept.length || Math.abs(y(kept[kept.length - 1]) - y(g)) >= minGap)) kept.push(g);
  return kept;
};

// Static pitch-over-time chart with the range band behind it (session detail, then-vs-now)
export const PitchTrace: React.FC<PitchTraceProps> = ({ traces, range, durationMs, playheadMs, height = 180 }) => {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useLayoutEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(10, width - PAD_L);
  const series = useMemo(
    () => traces.map(t => ({ ...t, points: bucketPitch(t.data, durationMs || 1, Math.max(2, Math.round(plotW / 2))) })),
    [traces, durationMs, plotW]
  );

  // y domain wraps the band and every voiced value, on a log scale
  const voiced = series.flatMap(s => s.points.filter((p): p is number => p !== null));
  const lo = Math.min(range.low, ...voiced) / 1.12;
  const hi = Math.max(range.high, ...voiced) * 1.12;
  const y = (hz: number) => 8 + (height - 16) * (1 - (Math.log(hz) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)));
  const x = (i: number, n: number) => PAD_L + (i / Math.max(1, n - 1)) * plotW;

  const path = (pts: (number | null)[]) => {
    let d = '', pen = false;
    pts.forEach((p, i) => {
      if (p === null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i, pts.length).toFixed(1)} ${y(p).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  return (
    <div ref={wrap} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} className="absolute inset-0 overflow-visible" role="img"
        aria-label={`Pitch over time against a target range of ${range.low} to ${range.high} Hz`}>
        {gridLines(lo, hi, y).map(g => (
          <g key={g}>
            <line x1={PAD_L} x2={width} y1={Math.round(y(g)) + 0.5} y2={Math.round(y(g)) + 0.5} className="stroke-border" />
            <text x={PAD_L - 8} y={y(g)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted font-mono text-[12px]">{g}</text>
          </g>
        ))}
        <rect x={PAD_L} width={plotW} y={y(range.high)} height={y(range.low) - y(range.high)} className="fill-primary/[0.13]" />
        <line x1={PAD_L} x2={width} y1={y(range.high)} y2={y(range.high)} className="stroke-primary/50" />
        <line x1={PAD_L} x2={width} y1={y(range.low)} y2={y(range.low)} className="stroke-primary/50" />
        {series.map((s, i) => (
          <path key={i} d={path(s.points)} fill="none" strokeWidth={s.tone === 'accent' ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round"
            className={s.tone === 'accent' ? 'stroke-primary' : 'stroke-text/45'} />
        ))}
        {playheadMs != null && durationMs > 0 && (
          <line x1={PAD_L + (playheadMs / durationMs) * plotW} x2={PAD_L + (playheadMs / durationMs) * plotW} y1={0} y2={height} className="stroke-text/60" />
        )}
      </svg>
      {voiced.length === 0 && (
        <p className="absolute inset-0 grid place-items-center text-[13px] text-text-muted">No pitch was picked up in this session.</p>
      )}
    </div>
  );
};
