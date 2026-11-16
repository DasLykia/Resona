import React, { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { PitchRange } from '../../types';
import { STRAIN_LABELS, trendEnds } from '../../services/pitchStats';
import { gridLines } from './PitchTrace';

export interface TrendPoint {
  id: string;
  date: number;
  median: number | null;
  inRangePct: number;
  strain: number | null; // 1..5
  brightness?: number | null; // median resonance estimate, Hz; null before it was measured
  kept?: boolean;        // session deleted; only its strain survives (Persist Analytics)
}

const PAD_L = 72;
const RANGE_H = 44, BRIGHT_H = 36, STRAIN_H = 18, GAP = 14;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// One column per session (oldest left): median pitch over the band, time in range, strain
export const PitchTrend: React.FC<{ points: TrendPoint[]; range: PitchRange; onSelect: (id: string) => void }> = ({ points, range, onSelect }) => {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  const hasPitch = points.some(p => p.median !== null);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return; // empty state renders no chart
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [hasPitch]);

  const withPitch = points.filter(p => p.median !== null);
  if (!hasPitch) {
    return <p className="text-[13.5px] text-text-muted">Train a session with your voice picked up and your pitch over time shows here.</p>;
  }

  const medians = withPitch.map(p => p.median!);
  const ends = trendEnds(medians);
  const rangeEnds = trendEnds(withPitch.map(p => p.inRangePct));

  const plotW = Math.max(40, width - PAD_L - 8);
  // Taller on big screens so the chart keeps a readable aspect instead of a thin strip
  const PITCH_H = Math.round(Math.min(420, Math.max(190, width * 0.2)));
  const n = points.length;
  const step = plotW / n;
  const cx = (i: number) => PAD_L + step * (i + 0.5);
  const lo = Math.min(range.low, ...medians) / 1.15, hi = Math.max(range.high, ...medians) * 1.15;
  const y = (hz: number) => 8 + (PITCH_H - 16) * (1 - (Math.log(hz) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)));
  // Brightness row only once some session measured it; its own scale (min..max of your sessions)
  const brights = points.map(p => p.brightness).filter((b): b is number => !!b);
  const hasBright = brights.length > 0;
  const bLo = Math.min(...brights) * 0.97, bHi = Math.max(...brights) * 1.03;
  const rangeTop = PITCH_H + GAP, brightTop = rangeTop + RANGE_H + GAP;
  const strainTop = hasBright ? brightTop + BRIGHT_H + GAP : brightTop, total = strainTop + STRAIN_H + 22;
  const by = (hz: number) => brightTop + 4 + (BRIGHT_H - 8) * (1 - (hz - bLo) / (bHi - bLo || 1));
  const barW = Math.max(2, Math.min(14, step * 0.6));

  // Line through sessions that had pitch, in order
  const line = points.map((p, i) => (p.median !== null ? [cx(i), y(p.median)] : null)).filter(Boolean) as number[][];
  const d = line.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join('');

  // A few date labels: first, last, and evenly in between
  const labelIdx = n <= 2 ? points.map((_, i) => i) : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];

  const h = hover !== null ? points[hover] : null;

  return (
    <div>
      {ends && (
        <p className="text-[15px] leading-relaxed text-text-muted max-w-[68ch] mb-6">
          Your median pitch moved from <span className="font-mono tabular-nums text-text">{ends.from}</span>{' '}Hz to{' '}
          <span className="font-mono tabular-nums text-text">{ends.to}</span>{' '}Hz
          {rangeEnds && <>, and time in range from <span className="font-mono tabular-nums text-text">{rangeEnds.from}%</span> to <span className="font-mono tabular-nums text-text">{rangeEnds.to}%</span></>}
          {' '}across <span className="font-mono tabular-nums text-text">{withPitch.length}</span> sessions. Earliest three compared with latest three.
        </p>
      )}

      <div ref={wrap} className="relative" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={total} className="block overflow-visible" role="img"
          aria-label={`Median pitch per session against your range of ${range.low} to ${range.high} Hz`}>
          {/* pitch panel */}
          {gridLines(lo, hi, y).map(g => (
            <g key={g}>
              <line x1={PAD_L} x2={width} y1={Math.round(y(g)) + 0.5} y2={Math.round(y(g)) + 0.5} className="stroke-border" />
              <text x={PAD_L - 10} y={y(g)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted font-mono text-[12px]">{g}</text>
            </g>
          ))}
          <rect x={PAD_L} width={plotW} y={y(range.high)} height={y(range.low) - y(range.high)} className="fill-primary/[0.13]" />
          <line x1={PAD_L} x2={PAD_L + plotW} y1={y(range.high)} y2={y(range.high)} className="stroke-primary/50" />
          <line x1={PAD_L} x2={PAD_L + plotW} y1={y(range.low)} y2={y(range.low)} className="stroke-primary/50" />
          <motion.path d={d} fill="none" strokeWidth={1.5} className="stroke-text/35"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, ease: EASE_OUT }} />
          {points.map((p, i) => p.median !== null && (
            <circle key={p.id} cx={cx(i)} cy={y(p.median)} r={hover === i ? 5 : 3.5}
              className={`transition-[r] duration-150 ${p.median >= range.low && p.median <= range.high ? 'fill-primary' : 'fill-text'}`} />
          ))}

          {/* time in range */}
          <text x={PAD_L - 10} y={rangeTop + RANGE_H / 2} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[12px]">In range</text>
          <line x1={PAD_L} x2={PAD_L + plotW} y1={rangeTop + RANGE_H + 0.5} y2={rangeTop + RANGE_H + 0.5} className="stroke-border-strong" />
          {points.map((p, i) => p.median !== null && (
            <rect key={p.id} x={cx(i) - barW / 2} width={barW} y={rangeTop + RANGE_H * (1 - p.inRangePct / 100)} height={Math.max(1, (RANGE_H * p.inRangePct) / 100)}
              rx={1} className={hover === i ? 'fill-primary' : 'fill-primary/55'} />
          ))}

          {/* brightness: higher dot = brighter resonance */}
          {hasBright && <>
            <text x={PAD_L - 10} y={brightTop + BRIGHT_H / 2} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[12px]">Brightness</text>
            <line x1={PAD_L} x2={PAD_L + plotW} y1={brightTop + BRIGHT_H + 0.5} y2={brightTop + BRIGHT_H + 0.5} className="stroke-border" />
            {points.map((p, i) => p.brightness ? (
              <circle key={p.id} cx={cx(i)} cy={by(p.brightness)} r={hover === i ? 4 : 3} className={hover === i ? 'fill-text' : 'fill-text/55'} />
            ) : null)}
          </>}

          {/* strain */}
          <text x={PAD_L - 10} y={strainTop + STRAIN_H / 2} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[12px]">Strain</text>
          {points.map((p, i) => p.strain !== null && (
            <rect key={p.id} x={cx(i) - barW / 2} width={barW} y={strainTop + 2} height={STRAIN_H - 4} rx={2}
              className={p.strain >= 4 ? 'fill-danger' : p.strain === 3 ? 'fill-text/45' : 'fill-text/20'} />
          ))}

          {/* dates */}
          {Array.from(new Set<number>(labelIdx)).map(i => (
            <text key={i} x={cx(i)} y={total - 4} textAnchor={i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}
              className="fill-text-muted font-mono text-[12px]">{fmtDate(points[i].date)}</text>
          ))}

          {/* hover columns: pointer shortcut only; the sessions table is the keyboard path */}
          <g aria-hidden="true">
          {points.map((p, i) => (
            <rect key={p.id} x={PAD_L + step * i} width={step} y={0} height={strainTop + STRAIN_H} fill="transparent" className={p.kept ? '' : 'cursor-pointer'}
              onMouseEnter={() => setHover(i)} onClick={() => !p.kept && onSelect(p.id)} />
          ))}
          </g>
          {hover !== null && <line x1={cx(hover)} x2={cx(hover)} y1={0} y2={strainTop + STRAIN_H} className="stroke-text/25 pointer-events-none" />}
        </svg>

        <AnimatePresence>
          {h && (
            <motion.div
              key="tip"
              className="absolute top-0 pointer-events-none bg-surface border border-border rounded-xl shadow-pop px-3 py-2 text-[12.5px] whitespace-nowrap"
              style={{ left: Math.min(cx(hover!) + 12, width - 190) }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.15, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <div className="font-medium text-text">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              <div className="text-text-muted mt-0.5">
                {h.median !== null ? <>Median <span className="font-mono tabular-nums text-text">{h.median}</span>{' '}Hz · <span className="font-mono tabular-nums text-text">{h.inRangePct}%</span> in range</> : h.kept ? 'Session deleted, strain kept' : 'No pitch picked up'}
              </div>
              {h.brightness ? <div className="text-text-muted">Brightness <span className="font-mono tabular-nums text-text">{h.brightness}</span>{' '}Hz</div> : null}
              {h.strain !== null && <div className="text-text-muted">Strain: <span className="text-text">{STRAIN_LABELS[h.strain - 1]}</span></div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
