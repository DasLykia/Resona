import React, { useEffect, useRef } from 'react';
import type { PitchDataPoint } from '../../types';
import { brightnessPos, ResonanceGoal } from '../../services/resonance';

const WINDOW = 16; // last 16 samples ≈ 0.8 s at 50 ms

// Darker ↔ brighter, live. Reads the sample ref every frame and moves the dot directly (no React render per frame).
// The goal end is emphasised; the hairline marks your usual brightness from recent sessions.
export const BrightnessMeter: React.FC<{ dataRef: React.MutableRefObject<PitchDataPoint[]>; goal: ResonanceGoal; usual: number | null }> = ({ dataRef, goal, usual }) => {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const recent = dataRef.current.slice(-WINDOW).map(p => p.brightness).filter((b): b is number => !!b);
      const el = dot.current;
      if (el) {
        if (recent.length >= 4) {
          // Geometric mean: the scale is logarithmic
          const hz = Math.exp(recent.reduce((a, b) => a + Math.log(b), 0) / recent.length);
          el.style.left = `${brightnessPos(hz) * 100}%`;
          el.style.opacity = '1';
        } else {
          el.style.opacity = '0.3'; // not speaking: stay where it was, faded
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dataRef]);

  const end = (side: ResonanceGoal, label: string) =>
    <span className={`text-[12.5px] shrink-0 ${goal === side ? 'text-text font-medium' : 'text-text-muted'}`}>{label}</span>;

  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <span className="text-[13px] font-medium w-24 shrink-0">Resonance</span>
      {end('darker', 'Darker')}
      <div className="relative flex-1 h-5">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border-strong" />
        {usual && <div className="absolute top-0.5 bottom-0.5 w-px bg-text/40" style={{ left: `${brightnessPos(usual) * 100}%` }} />}
        <div ref={dot} className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 rounded-full bg-primary opacity-30 transition-[left,opacity] duration-150 ease-out" style={{ left: '50%' }} />
      </div>
      {end('brighter', 'Brighter')}
      <span className="w-32 shrink-0 text-[12px] text-text-muted">{usual ? 'Line: your usual' : 'Estimate'}</span>
    </div>
  );
};
