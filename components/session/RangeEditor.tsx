import React, { useRef, useState } from 'react';
import type { PitchRange } from '../../types';
import { Popover } from '../Popover';
import { Button } from '../Button';

const MIN_HZ = 60, MAX_HZ = 600;

// "239–285 Hz · Edit" trigger that opens a small editor growing from it
export const RangeEditor: React.FC<{ range: PitchRange; onChange: (r: PitchRange) => void; align?: 'start' | 'end' }> = ({ range, onChange, align = 'end' }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [low, setLow] = useState(String(range.low));
  const [high, setHigh] = useState(String(range.high));

  const lo = parseInt(low, 10), hi = parseInt(high, 10);
  const error =
    !Number.isFinite(lo) || !Number.isFinite(hi) ? 'Enter both numbers.'
    : lo < MIN_HZ || hi > MAX_HZ ? `Keep it between ${MIN_HZ} and ${MAX_HZ} Hz.`
    : lo >= hi ? 'The low end must be below the high end.'
    : null;

  const openEditor = () => { setLow(String(range.low)); setHigh(String(range.high)); setOpen(true); };
  const save = () => { if (!error) { onChange({ low: lo, high: hi }); setOpen(false); } };

  const field = (label: string, value: string, set: (v: string) => void, autoFocus?: boolean) => (
    <label className="flex-1">
      <span className="block text-[12px] text-text-muted mb-1">{label}</span>
      <span className="flex items-center h-8 rounded-lg border border-border-strong focus-within:border-primary bg-background px-2.5 transition-colors">
        <input
          type="number" inputMode="numeric" value={value} autoFocus={autoFocus}
          onChange={e => set(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); }}
          className="w-full bg-transparent outline-none font-mono tabular-nums text-[13px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[12px] text-text-muted">Hz</span>
      </span>
    </label>
  );

  return (
    <>
      <button
        ref={trigger}
        onClick={() => (open ? setOpen(false) : openEditor())}
        aria-expanded={open}
        className="text-[13px] text-text-muted hover:text-text transition-colors"
      >
        <span className="font-mono tabular-nums text-text">{range.low}–{range.high}</span> Hz
        <span className="ml-2 underline decoration-border-strong underline-offset-[3px]">Edit</span>
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} align={align} label="Target range">
        <div className="w-64">
          <div className="text-[13px] font-semibold mb-3">Target range</div>
          <div className="flex gap-3">
            {field('Low', low, setLow, true)}
            {field('High', high, setHigh)}
          </div>
          <p className={`mt-2 text-[12px] min-h-[1.25rem] ${error ? 'text-danger' : 'text-text-muted'}`}>
            {error ?? 'Feedback shows in range, below or above.'}
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={!!error}>Save</Button>
          </div>
        </div>
      </Popover>
    </>
  );
};
