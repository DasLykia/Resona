import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { PitchDataPoint, PitchRange, Routine } from '../../types';
import { Button } from '../Button';
import { LivePitch } from './LivePitch';
import { RangeEditor } from './RangeEditor';
import { BrightnessMeter } from './BrightnessMeter';
import { resonanceGoal } from '../../services/resonance';
import { IconChevronLeft, IconChevronRight, IconNext, IconPause, IconPlay, IconPrev } from '../icons';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const OPEN_BLOCK_WEIGHT = 120; // open-ended blocks count as 2 min in the progress hairline

// Mono digits, but the colon gives back most of its full character cell
const Clock: React.FC<{ seconds: number }> = ({ seconds }) => (
  <>{Math.floor(seconds / 60)}<span className="-mx-[0.18em]">:</span>{String(seconds % 60).padStart(2, '0')}</>
);

interface FocusSessionProps {
  kind: 'routine' | 'free';
  routine: Routine;
  beepVolume: number;
  dataRef: React.MutableRefObject<PitchDataPoint[]>;
  range: PitchRange;
  onRangeChange: (r: PitchRange) => void;
  onPauseChange: (paused: boolean) => void;
  onEnd: () => void;
  focus: string;
  onFocusChange: (text: string) => void;
  usualBrightness: number | null; // median of recent sessions, for the meter's reference line
}

// The user's standing reminder, one quiet line above the exercise; click to edit it in place
const FocusNote: React.FC<{ text: string; onChange: (t: string) => void }> = ({ text, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  if (editing) {
    const save = () => { onChange(draft.trim()); setEditing(false); };
    return (
      <div className="flex items-start gap-2 max-w-[80ch]">
        <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} aria-label="Your focus for sessions"
          onKeyDown={e => { if (e.key === 'Escape') setEditing(false); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save(); }}
          className="flex-1 resize-none [field-sizing:content] min-h-[2.25rem] rounded-lg border border-border-strong focus:border-primary bg-surface px-3 py-1.5 text-[13.5px] leading-relaxed outline-none transition-colors" />
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        <Button size="sm" onClick={save}>Save</Button>
      </div>
    );
  }
  return (
    <button onClick={() => { setDraft(text); setEditing(true); }} title="Edit your focus"
      className="flex items-baseline gap-2 max-w-[80ch] text-left text-[13px] rounded-md -mx-1 px-1 hover:bg-text/[0.05] transition-colors">
      <span className="shrink-0 font-medium text-text">Focus</span>
      <span className="text-text-muted line-clamp-2 whitespace-pre-wrap">{text || 'Add something to keep in mind while you train'}</span>
    </button>
  );
};

export const FocusSession: React.FC<FocusSessionProps> = ({ kind, routine, beepVolume, dataRef, range, onRangeChange, onPauseChange, onEnd, focus, onFocusChange, usualBrightness }) => {
  const blocks = routine.blocks;
  const isRoutine = kind === 'routine' && blocks.length > 0;
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(blocks[0]?.duration ?? 0);
  const [elapsed, setElapsed] = useState(0); // open blocks and free sessions count up
  const [paused, setPaused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const beepCtx = useRef<AudioContext | null>(null);

  const block = isRoutine ? blocks[index] : null;
  const isOpen = !isRoutine || block!.duration === 0;
  const prompts = (block?.prompts || []).filter(p => p.trim());

  useEffect(() => { onPauseChange(paused); }, [paused]);
  useEffect(() => () => { beepCtx.current?.close(); }, []);

  const beep = (twice = false) => {
    if (beepVolume <= 0) return;
    const ctx = beepCtx.current ?? (beepCtx.current = new AudioContext());
    [0, twice ? 0.25 : null].forEach(offset => {
      if (offset === null) return;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.frequency.value = 440;
      gain.gain.value = beepVolume;
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.18);
    });
  };

  const goTo = (i: number) => {
    setIndex(i);
    setTimeLeft(blocks[i].duration);
    setElapsed(0);
    setPromptIndex(0);
  };

  const next = () => {
    if (!isRoutine) return;
    if (index < blocks.length - 1) { beep(); goTo(index + 1); }
    else { beep(true); onEnd(); }
  };
  const prev = () => { if (isRoutine && index > 0) goTo(index - 1); };

  // One-second clock
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (isOpen) setElapsed(e => e + 1);
      else setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, isOpen, index]);

  // A timed block that reaches zero moves on
  useEffect(() => { if (isRoutine && !isOpen && timeLeft === 0) next(); }, [timeLeft]);

  const weights = blocks.map(b => b.duration || OPEN_BLOCK_WEIGHT);
  const blockDone = (i: number) =>
    i < index ? 1 : i > index ? 0 : isOpen ? Math.min(1, elapsed / OPEN_BLOCK_WEIGHT) : 1 - timeLeft / (blocks[i].duration || 1);

  return (
    <div className="h-full flex flex-col">
      {isRoutine && (
        <div className="flex gap-[3px] px-12 pt-4" aria-hidden="true">
          {blocks.map((b, i) => (
            <div key={b.id} className="h-[3px] rounded-full bg-text/10 overflow-hidden" style={{ flexGrow: weights[i], flexBasis: 0 }}>
              <div className="h-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${blockDone(i) * 100}%` }} />
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col px-12 pt-6 pb-6">
        <div className="mb-6 shrink-0"><FocusNote text={focus} onChange={onFocusChange} /></div>
        <header className="flex items-start justify-between gap-10 shrink-0">
          <div className="min-w-0 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={block?.id ?? 'free'}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.19, ease: EASE_OUT } }}
              >
                <h1 className="text-[34px] font-semibold tracking-[-0.025em] leading-[1.1]">
                  {block?.title ?? 'Free session'}
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-text-muted max-w-[62ch]">
                  {block?.description || (isRoutine ? '' : 'Train however you like. Pitch and recording run until you end the session.')}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className={`text-right shrink-0 transition-opacity duration-200 ${paused ? 'opacity-45' : ''}`}>
            <div className="font-mono tabular-nums text-[64px] leading-none tracking-[-0.03em]">
              <Clock seconds={isOpen ? elapsed : timeLeft} />
            </div>
            <div className="mt-2 text-[13px] text-text-muted h-5">
              {paused ? 'Paused' : isRoutine && isOpen ? 'Open-ended, move on when ready' : ''}
            </div>
          </div>
        </header>

        {prompts.length > 0 && (
          <div className="mt-6 flex items-center gap-2 shrink-0">
            <button aria-label="Previous phrase" onClick={() => setPromptIndex(i => (i - 1 + prompts.length) % prompts.length)}
              className="w-8 h-8 grid place-items-center rounded-lg text-text-muted hover:text-text hover:bg-text/[0.06] active:scale-[0.97] transition">
              <IconChevronLeft />
            </button>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={promptIndex}
                className="text-[20px] font-medium text-text"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.2 } }}
                exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.16 } }}
              >
                “{prompts[promptIndex]}”
              </motion.p>
            </AnimatePresence>
            <button aria-label="Next phrase" onClick={() => setPromptIndex(i => (i + 1) % prompts.length)}
              className="w-8 h-8 grid place-items-center rounded-lg text-text-muted hover:text-text hover:bg-text/[0.06] active:scale-[0.97] transition">
              <IconChevronRight />
            </button>
            <span className="ml-1 font-mono tabular-nums text-[12px] text-text-muted">{promptIndex + 1}/{prompts.length}</span>
          </div>
        )}

        <div className="mt-8 shrink-0"><BrightnessMeter dataRef={dataRef} goal={resonanceGoal(range)} usual={usualBrightness} /></div>

        <div className="flex-1 min-h-[220px] mt-4">
          <LivePitch dataRef={dataRef} range={range} aside={<RangeEditor range={range} onChange={onRangeChange} />} />
        </div>
      </div>

      <footer className="h-16 shrink-0 px-12 border-t border-border grid grid-cols-[1fr_auto_1fr] items-center">
        <div>
          <Button variant="ghost" onClick={onEnd}>End session</Button>
        </div>

        <div className="flex items-center gap-2">
          {isRoutine && (
            <Button variant="ghost" size="icon" aria-label="Previous exercise" onClick={prev} disabled={index === 0}><IconPrev /></Button>
          )}
          <Button size="lg" aria-label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused(p => !p)} className="w-12 px-0">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={paused ? 'play' : 'pause'}
                initial={{ opacity: 0, scale: 0.6, filter: 'blur(3px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.18, ease: EASE_OUT } }}
                exit={{ opacity: 0, scale: 0.6, filter: 'blur(3px)', transition: { duration: 0.14, ease: EASE_OUT } }}
                className="grid place-items-center"
              >
                {paused ? <IconPlay size={18} /> : <IconPause size={18} />}
              </motion.span>
            </AnimatePresence>
          </Button>
          {isRoutine && (
            <Button variant={isOpen ? 'secondary' : 'ghost'} size={isOpen ? 'md' : 'icon'} aria-label="Next exercise" onClick={next}>
              {isOpen ? (index === blocks.length - 1 ? 'Finish' : 'Next') : <IconNext />}
            </Button>
          )}
        </div>

        <div className="text-right text-[13px] text-text-muted truncate">
          {isRoutine && (
            <>
              <span className="font-mono tabular-nums">{index + 1}/{blocks.length}</span>
              {blocks[index + 1] && <> · Next: <span className="text-text">{blocks[index + 1].title}</span></>}
            </>
          )}
        </div>
      </footer>
    </div>
  );
};
