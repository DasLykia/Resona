import React, { useState } from 'react';
import type { TrainingSession } from '../../types';
import type { MonthRecap } from '../../services/recap';
import { StoredRecording } from '../RecordingPlayer';

const monthKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const monthName = (m: string) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
const N: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-mono tabular-nums text-text">{children}</span>;
const hm = (min: number) => (min >= 60 ? <><N>{Math.floor(min / 60)}</N> h <N>{min % 60}</N> min</> : <><N>{min}</N> min</>);

// Month by month, newest first: what you did, how your pitch moved, and the milestones you marked
export const Journey: React.FC<{
  recaps: MonthRecap[];
  sessions: TrainingSession[];
  title: (s: TrainingSession) => string;
  onOpenSession: (id: string) => void;
}> = ({ recaps, sessions, title, onOpenSession }) => {
  const [playing, setPlaying] = useState<string | null>(null);
  const current = monthKey(Date.now());
  const milestones = sessions.filter(s => s.milestone).sort((a, b) => b.startTime - a.startTime);

  if (!recaps.length) {
    return <p className="text-[13.5px] text-text-muted max-w-[60ch]">After your first session, each month gets a recap here. Mark a session as a milestone in Sessions and it shows up too.</p>;
  }

  return (
    <div className="max-w-[860px]">
      {milestones.length === 0 && (
        <p className="mb-8 text-[13px] text-text-muted max-w-[60ch]">Tip: open a session in Sessions and choose “Mark as milestone” to keep moments like your first time in range here.</p>
      )}
      {recaps.map(r => {
        const inMonth = milestones.filter(s => monthKey(s.startTime) === r.month);
        const diff = r.startMedian !== null && r.endMedian !== null ? r.endMedian - r.startMedian : null;
        return (
          <section key={r.month} className="grid grid-cols-1 md:grid-cols-[11rem_minmax(0,1fr)] gap-x-10 gap-y-2 py-6 border-t border-border">
            <h2 className="text-[15px] font-semibold">
              {monthName(r.month)}{r.month === current && <span className="block text-[12.5px] font-normal text-text-muted">so far</span>}
            </h2>
            <div>
              <p className="text-[14px] leading-relaxed text-text-muted">
                {r.sessions > 0 || r.daysTrained > 0
                  ? <>You trained on <N>{r.daysTrained}</N> {r.daysTrained === 1 ? 'day' : 'days'} for {hm(r.minutes)}, across <N>{r.sessions}</N> {r.sessions === 1 ? 'session' : 'sessions'}.</>
                  : 'No training this month.'}
                {diff !== null && <>{' '}Your median pitch went from <N>{r.startMedian}</N> Hz to <N>{r.endMedian}</N> Hz{diff !== 0 && <> (<N>{diff > 0 ? '+' : '−'}{Math.abs(diff)}</N> Hz)</>}.</>}
              </p>
              {inMonth.length > 0 && (
                <ul className="mt-4 border-t border-border">
                  {inMonth.map(s => (
                    <li key={s.id} className="py-3 border-b border-border">
                      <div className="flex items-baseline gap-4 text-[13.5px]">
                        <span className="w-14 shrink-0 font-mono tabular-nums text-[12.5px] text-text-muted">{new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="flex-1 min-w-0 truncate"><span className="text-primary font-medium">{s.milestone}</span><span className="text-text-muted"> · {title(s)}</span></span>
                        {s.recordingId && (
                          <button onClick={() => setPlaying(p => (p === s.id ? null : s.id))} className="text-[12.5px] text-text-muted hover:text-text transition-colors">{playing === s.id ? 'Close' : 'Play'}</button>
                        )}
                        <button onClick={() => onOpenSession(s.id)} className="text-[12.5px] text-text-muted hover:text-text transition-colors">Open session</button>
                      </div>
                      {playing === s.id && s.recordingId && <div className="mt-3"><StoredRecording id={s.recordingId} fallbackLength={s.duration} /></div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};
