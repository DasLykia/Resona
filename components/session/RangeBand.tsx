import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { PitchRange } from '../../types';

// Log-frequency scale wide enough for both lower and higher speaking voices
export const SCALE_MIN = 70;
export const SCALE_MAX = 420;
const L0 = Math.log(SCALE_MIN), L1 = Math.log(SCALE_MAX);
export const toPct = (hz: number) => Math.min(100, Math.max(0, ((Math.log(hz) - L0) / (L1 - L0)) * 100));

const TICKS = [80, 100, 150, 200, 250, 300, 400];
const BINS = 72;

interface RangeBandProps {
  range: PitchRange;
  markers?: { hz: number; label?: string; current?: boolean }[];
  samples?: number[]; // voiced pitch values; drawn as a density strip
  height?: number;
}

export const RangeBand: React.FC<RangeBandProps> = ({ range, markers = [], samples, height = 44 }) => {
  const bins = useMemo(() => {
    if (!samples?.length) return null;
    const counts = new Array(BINS).fill(0);
    for (const hz of samples) counts[Math.min(BINS - 1, Math.floor((toPct(hz) / 100) * BINS))]++;
    const max = Math.max(...counts);
    return counts.map(c => (max ? c / max : 0));
  }, [samples]);

  const lo = toPct(range.low), hi = toPct(range.high);

  return (
    <div className="select-none" aria-label={`Target range ${range.low} to ${range.high} Hz`} role="img">
      <div className="relative mt-5" style={{ height }}>
        {/* Masked layer: baseline, band and density fade out at the scale's ends */}
        <div className="absolute inset-0" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent)' }}>
        {/* baseline */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-border-strong" />

        {/* the band */}
        <div
          className="absolute top-0 bottom-0 bg-primary/[0.13] border-x border-primary/50"
          style={{ left: `${lo}%`, width: `${hi - lo}%` }}
        />

        {bins && bins.map((v, i) => {
          const center = ((i + 0.5) / BINS) * 100;
          const inBand = center >= lo && center <= hi;
          return v > 0 ? (
            <motion.div
              key={i}
              className={`absolute bottom-0 w-[3px] -ml-[1.5px] rounded-t-[1px] origin-bottom ${inBand ? 'bg-primary' : 'bg-text/30'}`}
              style={{ left: `${center}%`, height: `${Math.max(6, v * 92)}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.24, delay: (i / BINS) * 0.2, ease: [0.23, 1, 0.32, 1] }}
            />
          ) : null;
        })}
        </div>

        {markers.map((m, i) => (
          <div
            key={i}
            className={`absolute bottom-0 -ml-px w-[2px] rounded-full ${m.current ? 'bg-primary h-full' : 'bg-text/35 h-1/2'}`}
            style={{ left: `${toPct(m.hz)}%` }}
          >
            {m.label && (
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 font-mono tabular-nums text-[12px] text-primary whitespace-nowrap">
                {m.label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="relative h-5 mt-1.5 font-mono tabular-nums text-[12px] text-text-muted">
        {TICKS.map(t => (
          <span key={t} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${toPct(t)}%` }}>
            {t}{t === TICKS[TICKS.length - 1] && ' Hz'}
          </span>
        ))}
      </div>
    </div>
  );
};
