import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { PitchRange } from '../../types';
import { VOICE_DIRECTIONS } from '../../constants';
import { Button } from '../Button';
import { MicCheck } from '../session/MicCheck';
import { TrainingDaysPicker } from '../settings/SettingsView';

type DirectionKey = typeof VOICE_DIRECTIONS[number]['key'];
export interface SetupResult { direction: DirectionKey; range: PitchRange | null; trainingDays: number[] }

interface SetupProps {
  isUpdate: boolean;              // existing data: say so, so nobody worries about losing it
  currentRange: PitchRange;
  trainingDays: number[];
  deviceId: string;
  gain: number;
  setGain: (g: number) => void;
  onFinish: (r: SetupResult) => void;
  onSkip: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Three steps that each set something real: direction → range + routine, training days, microphone
export const Setup: React.FC<SetupProps> = ({ isUpdate, currentRange, trainingDays, deviceId, gain, setGain, onFinish, onSkip }) => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // slide direction for the step transition
  const [direction, setDirection] = useState<DirectionKey | null>(null);
  const [low, setLow] = useState(String(currentRange.low));
  const [high, setHigh] = useState(String(currentRange.high));
  const [days, setDays] = useState<number[]>(trainingDays);

  const lo = parseInt(low, 10), hi = parseInt(high, 10);
  const customError = direction === 'custom' && (!(lo >= 60 && hi <= 600) || lo >= hi) ? 'Enter a low and a high between 60 and 600 Hz, low first.' : null;
  const canNext = step === 0 ? !!direction && !customError : true;

  const go = (to: number) => { setDir(to > step ? 1 : -1); setStep(to); };
  const finish = () => {
    const d = VOICE_DIRECTIONS.find(x => x.key === direction)!;
    onFinish({ direction: d.key, range: d.range ? { ...d.range } : { low: lo, high: hi }, trainingDays: days });
  };

  const steps = [
    <div key="direction">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">What are you training toward?</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-text-muted max-w-[56ch]">
        {isUpdate && 'Resona has a new look, and your sessions and recordings stay exactly as they are. '}
        This sets a starting target range and adds a matching routine. Both are easy to change later.
      </p>
      <div role="radiogroup" aria-label="Training goal" className="mt-8 border-t border-border">
        {VOICE_DIRECTIONS.map(d => {
          const on = direction === d.key;
          return (
            <button key={d.key} role="radio" aria-checked={on} onClick={() => setDirection(d.key)}
              className={`relative w-full flex items-center gap-4 py-3.5 pl-4 pr-3 border-b border-border text-left transition-colors duration-150 hover:bg-text/[0.03] ${on ? 'bg-primary/[0.06]' : ''}`}>
              {on && <motion.span layoutId="setup-choice" className="absolute left-0 top-1/2 -mt-3 h-6 w-[3px] rounded-full bg-primary" transition={{ duration: 0.22, ease: [0.65, 0, 0.35, 1] }} />}
              <span className="flex-1 min-w-0">
                <span className={`block text-[14px] ${on ? 'font-medium text-text' : 'text-text'}`}>{d.label}</span>
                <span className="block text-[13px] text-text-muted">{d.detail}</span>
              </span>
              {d.range && <span className="font-mono tabular-nums text-[13px] text-text-muted whitespace-nowrap">{d.range.low}–{d.range.high}&nbsp;Hz</span>}
            </button>
          );
        })}
      </div>
      <AnimatePresence initial={false}>
        {direction === 'custom' && (
          <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}>
            <div className="pt-5 flex items-end gap-3">
              {([['Low', low, setLow], ['High', high, setHigh]] as const).map(([label, v, set]) => (
                <label key={label} className="w-28">
                  <span className="block text-[12px] text-text-muted mb-1">{label}</span>
                  <span className="flex items-center h-8 rounded-lg border border-border-strong focus-within:border-primary bg-surface px-2.5 transition-colors">
                    <input type="number" value={v} onChange={e => set(e.target.value)} aria-label={`${label} end of your range`}
                      className="w-full bg-transparent outline-none font-mono tabular-nums text-[13px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    <span className="text-[12px] text-text-muted">Hz</span>
                  </span>
                </label>
              ))}
              <p className={`text-[12.5px] pb-2 ${customError ? 'text-danger' : 'text-text-muted'}`}>{customError ?? 'Your current routine stays as it is.'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,

    <div key="days">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Which days do you want to train?</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-text-muted max-w-[56ch]">
        Your streak only counts these days, so resting on the others never breaks it. With no days picked, every day counts.
      </p>
      <div className="mt-8"><TrainingDaysPicker days={days} onChange={setDays} /></div>
      <p className="mt-6 text-[13px] text-text-muted max-w-[56ch]">Ill or your voice needs a break? Mark the day as a rest day on Today or in Progress.</p>
    </div>,
  ];

  return (
    <div className="h-full overflow-y-auto">
      {step < 2 ? (
        <div className="max-w-[600px] mx-auto px-12 pt-[10vh] pb-10">
          <div className="relative">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div key={step}
                initial={{ opacity: 0, x: dir * 24 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE_OUT } }}
                exit={{ opacity: 0, x: dir * -16, transition: { duration: 0.18, ease: EASE_OUT } }}>
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-10 flex items-center justify-between">
            <span className="flex items-center gap-3">
              <Button variant="ghost" onClick={onSkip}>Skip setup</Button>
              <span className="text-[13px] text-text-muted">Step <span className="font-mono tabular-nums">{step + 1}</span> of <span className="font-mono tabular-nums">3</span></span>
            </span>
            <div className="flex gap-2">
              {step > 0 && <Button variant="ghost" onClick={() => go(step - 1)}>Back</Button>}
              <Button size="lg" onClick={() => go(step + 1)} disabled={!canNext}>Continue</Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <MicCheck deviceId={deviceId} gain={gain} setGain={setGain} skipNextTime={false} setSkipNextTime={() => {}}
            showSkip={false} requireMic={false} readyLabel="Finish setup" cancelLabel="Back" onReady={finish} onCancel={() => go(1)} />
        </div>
      )}
    </div>
  );
};
