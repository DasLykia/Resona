import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { PitchRange, TrainingSession } from '../../types';
import { computePitchStats, STRAIN_LABELS } from '../../services/pitchStats';
import { RangeBand } from './RangeBand';
import { Button } from '../Button';
import { RecordingPlayer } from '../RecordingPlayer';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Numbers in mono, units in the text face
const Duration: React.FC<{ s: number }> = ({ s }) => {
  const m = Math.floor(s / 60), sec = s % 60;
  const n = (v: number) => <span className="text-text font-mono tabular-nums">{v}</span>;
  return m ? <>{n(m)}{' '}min {n(sec)}{' '}s</> : <>{n(sec)}{' '}s</>;
};

interface SessionSummaryProps {
  session: TrainingSession;
  range: PitchRange;
  recording: Blob | null;
  xpGained: number;
  levelUpTo: number | null;
  onStrain: (strain: number) => void;
  onNote: (note: string) => void;
  onDone: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ session, range, recording, xpGained, levelUpTo, onStrain, onNote, onDone }) => {
  const stats = useMemo(() => computePitchStats(session.pitchData, range), [session, range]);
  const samples = useMemo(() => (session.pitchData || []).map(p => p.pitch).filter(p => p > 0), [session]);
  const [strain, setStrain] = useState<number | null>(session.healthLog?.strain ?? null);
  const [savedPulse, setSavedPulse] = useState(0);
  const [note, setNote] = useState(session.notes ?? '');

  const pick = (s: number) => {
    setStrain(s);
    onStrain(s);
    setSavedPulse(p => p + 1);
  };

  const finish = () => { if (note !== (session.notes ?? '')) onNote(note); onDone(); };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[760px] mx-auto px-12 pt-[8vh] pb-10">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Session complete</h1>

        <p className="mt-3 text-[15px] leading-relaxed text-text-muted max-w-[60ch]">
          You trained for <Duration s={session.duration} />.{' '}
          {stats.median === null
            ? 'Resona didn’t pick up any pitch this time. Check the microphone if that seems wrong.'
            : <>
                <span className="text-text font-mono tabular-nums">{stats.inRangePct}%</span> of your voiced time was inside{' '}
                <span className="font-mono tabular-nums">{range.low}–{range.high}</span>{' '}Hz, with a median of{' '}
                <span className="text-text font-mono tabular-nums">{stats.median}</span>{' '}Hz.
              </>}
        </p>

        {stats.median !== null && (
          <div className="mt-8">
            <RangeBand range={range} samples={samples} height={56} markers={[{ hz: stats.median, label: `${stats.median}`, current: true }]} />
          </div>
        )}

        {recording && recording.size > 0 && <div className="mt-8"><RecordingPlayer blob={recording} fallbackLength={session.duration} /></div>}

        <section className="mt-10 pt-8 border-t border-border">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">How does your voice feel?</h2>
            <AnimatePresence mode="popLayout">
              {savedPulse > 0 && (
                <motion.span
                  key={savedPulse}
                  className="text-[12.5px] text-primary"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: [0.97, 1.03, 1], transition: { duration: 0.24, ease: EASE_OUT } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div role="radiogroup" aria-label="Voice strain" className="mt-3 grid grid-cols-5 gap-1.5">
            {STRAIN_LABELS.map((label, i) => {
              const value = i + 1, active = strain === value;
              return (
                <button
                  key={label}
                  role="radio"
                  aria-checked={active}
                  onClick={() => pick(value)}
                  className={`h-10 rounded-lg text-[13px] transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${
                    active
                      ? value >= 4 ? 'bg-danger/[0.14] text-danger font-medium' : 'bg-primary/[0.14] text-primary font-medium'
                      : 'bg-text/[0.05] text-text-muted hover:text-text hover:bg-text/[0.08]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <AnimatePresence initial={false}>
            {strain !== null && strain >= 4 && (
              <motion.p
                key={strain}
                className="mt-3 text-[13px] leading-relaxed text-text-muted max-w-[60ch] overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', transition: { duration: 0.22, ease: EASE_OUT } }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
              >
                {strain === 5
                  ? 'Stop training for today and let your voice rest. If pain or hoarseness lasts more than a few days, see a doctor or a voice therapist.'
                  : 'Give your voice a rest. If it still feels this way tomorrow, mark a rest day under Progress; it won’t break your streak.'}
              </motion.p>
            )}
          </AnimatePresence>

          <label className="block mt-6">
            <span className="block text-[13px] text-text-muted mb-1.5">Note (optional)</span>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => { if (note !== (session.notes ?? '')) onNote(note); }}
              placeholder="Anything worth remembering about this session?"
              className="w-full min-h-[5rem] resize-y rounded-lg border border-border-strong focus:border-primary bg-surface px-3 py-2 text-[13.5px] leading-relaxed outline-none transition-colors placeholder:text-text-muted"
            />
          </label>
        </section>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-[13px] text-text-muted">
            {xpGained > 0 && <>+<span className="font-mono tabular-nums">{xpGained}</span> XP</>}
            {levelUpTo && <> · <span className="text-primary">Level {levelUpTo} reached</span></>}
          </span>
          <Button size="lg" onClick={finish}>Done</Button>
        </div>
      </div>
    </div>
  );
};
