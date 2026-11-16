import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PitchRange, TrainingSession } from '../../types';
import { computePitchStats } from '../../services/pitchStats';
import { getAudioBlob } from '../../services/storage';
import { Button } from '../Button';
import { Segmented } from '../Segmented';
import { Popover } from '../Popover';
import { PlayPauseIcon, SeekBar, fmtClock } from '../RecordingPlayer';
import { PitchTrace } from './PitchTrace';
import { ExportButton } from '../ExportButton';
import { exportName } from '../../services/wav';

type Side = 'then' | 'now';

const label = (s: TrainingSession, title: (s: TrainingSession) => string) =>
  `${new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${title(s)} · ${Math.round(s.duration / 60)} min`;

const useBlobUrl = (id?: string) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true, made: string | null = null;
    getAudioBlob(id).then(b => { if (alive && b) { made = URL.createObjectURL(b); setUrl(made); } }).catch(() => {});
    return () => { alive = false; if (made) URL.revokeObjectURL(made); setUrl(null); };
  }, [id]);
  return url;
};

// Two sessions with recordings: A/B playback at the same position, both traces over the band
export const CompareRecordings: React.FC<{ sessions: TrainingSession[]; range: PitchRange; title: (s: TrainingSession) => string }> = ({ sessions, range, title }) => {
  const withRec = useMemo(() => sessions.filter(s => s.recordingId).sort((a, b) => a.startTime - b.startTime), [sessions]);
  const [thenId, setThenId] = useState<string | undefined>(withRec[0]?.id);
  const [nowId, setNowId] = useState<string | undefined>(withRec[withRec.length - 1]?.id);
  const [side, setSide] = useState<Side>('now');
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const audio = { then: useRef<HTMLAudioElement>(null), now: useRef<HTMLAudioElement>(null) };
  // The chart takes the window's spare height (tall monitors get a tall chart), 320–640px
  const [winH, setWinH] = useState(window.innerHeight);
  useEffect(() => { const on = () => setWinH(window.innerHeight); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  const chartH = Math.round(Math.min(640, Math.max(320, winH - 380)));

  // Keep picks valid when sessions are added or deleted
  useEffect(() => {
    if (!withRec.some(s => s.id === thenId)) setThenId(withRec[0]?.id);
    if (!withRec.some(s => s.id === nowId)) setNowId(withRec[withRec.length - 1]?.id);
  }, [withRec]);

  const a = withRec.find(s => s.id === thenId), b = withRec.find(s => s.id === nowId);
  const urls = { then: useBlobUrl(a?.recordingId), now: useBlobUrl(b?.recordingId) };

  if (withRec.length < 2) {
    return <p className="text-[13.5px] text-text-muted">Once you have two sessions with recordings, you can play an early one against a recent one here.</p>;
  }

  const current = side === 'then' ? a : b;
  const len = current?.duration ?? 0;

  // Switching sides continues at the same moment in the other recording
  const switchTo = (next: Side) => {
    if (next === side) return;
    const from = audio[side].current, to = audio[next].current;
    from?.pause();
    if (to) {
      to.currentTime = Math.min(t, (next === 'then' ? a : b)?.duration ?? t);
      if (playing) to.play().catch(() => setPlaying(false));
    }
    setSide(next);
  };
  const toggle = () => {
    const el = audio[side].current;
    if (!el) return;
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else { el.pause(); setPlaying(false); }
  };

  const statLine = (s?: TrainingSession) => {
    if (!s) return null;
    const st = computePitchStats(s.pitchData, range);
    return st.median === null ? 'no pitch picked up'
      : <>median <span className="font-mono tabular-nums text-text">{st.median}</span> Hz · <span className="font-mono tabular-nums text-text">{st.inRangePct}%</span> in range</>;
  };

  const pick = (set: (id: string) => void) => (id: string) => {
    set(id);
    audio.then.current?.pause(); audio.now.current?.pause(); setPlaying(false); setT(0);
  };

  const sideRow = (which: Side, s: TrainingSession | undefined, set: (id: string) => void) => (
    <div className="py-3 border-b border-border">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-[13.5px] ${which === 'now' ? 'text-primary' : 'text-text-muted'}`}>{which === 'then' ? 'Then' : 'Now'}</span>
        <RecordingPicker sessions={withRec} value={s?.id} onPick={pick(set)} title={title} range={range} label={which === 'then' ? 'Earlier session' : 'Recent session'} />
      </div>
      <div className="mt-1 text-[13px] text-text-muted text-right">{statLine(s)}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[24rem_minmax(0,1fr)] gap-x-14 gap-y-6 items-start">
      <div>
        <div className="border-t border-border">
          {sideRow('then', a, setThenId)}
          {sideRow('now', b, setNowId)}
        </div>

        {(['then', 'now'] as Side[]).map(k => (
          <audio key={k} ref={audio[k]} src={urls[k] ?? undefined} preload="metadata"
            onTimeUpdate={e => { if (k === side) setT(e.currentTarget.currentTime); }}
            onEnded={() => { if (k === side) setPlaying(false); }} />
        ))}

        <div className="mt-5 flex items-center gap-3">
          <Button variant="secondary" size="icon" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} disabled={!urls[side]}>
            <PlayPauseIcon playing={playing} />
          </Button>
          <Segmented label="Which recording plays" value={side} onChange={switchTo}
            options={[{ value: 'then', label: 'Then' }, { value: 'now', label: 'Now' }]} />
          <span className="ml-auto font-mono tabular-nums text-[12.5px] text-text-muted">{fmtClock(t)} / {fmtClock(len)}</span>
          {current?.recordingId && <ExportButton recordingId={current.recordingId} name={exportName(current.startTime, title(current))} />}
        </div>
        <div className="mt-3 flex"><SeekBar value={t} max={len} label="Seek the playing recording" onSeek={v => { const el = audio[side].current; if (el) { el.currentTime = v; setT(v); } }} /></div>
        <p className="mt-2 text-[12.5px] text-text-muted">Switching between Then and Now keeps your place, so you hear the same moment in both.</p>
      </div>

      <PitchTrace
        range={range}
        height={chartH}
        durationMs={Math.max(a?.duration ?? 0, b?.duration ?? 0) * 1000}
        playheadMs={playing || t > 0 ? t * 1000 : null}
        traces={[
          { data: a?.pitchData ?? [], tone: 'ink', label: 'Then' },
          { data: b?.pitchData ?? [], tone: 'accent', label: 'Now' },
        ]}
      />
    </div>
  );
};

const DAY = 86400000;
const QUICK: { label: string; ago: number | 'first' | 'latest' }[] = [
  { label: 'First', ago: 'first' }, { label: '3 months ago', ago: 91 }, { label: '1 month ago', ago: 30 }, { label: 'Last week', ago: 7 }, { label: 'Latest', ago: 'latest' },
];

// Session chooser that stays usable with hundreds of recordings: quick picks, search, months as groups
const RecordingPicker: React.FC<{
  sessions: TrainingSession[]; value?: string; onPick: (id: string) => void; title: (s: TrainingSession) => string; range: PitchRange; label: string;
}> = ({ sessions, value, onPick, title, range, label }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = sessions.find(s => s.id === value);

  // Closest session to a point in time (sessions are oldest first)
  const nearest = (ago: number | 'first' | 'latest') => {
    if (ago === 'first') return sessions[0];
    if (ago === 'latest') return sessions[sessions.length - 1];
    const target = Date.now() - ago * DAY;
    return sessions.reduce((best, s) => (Math.abs(s.startTime - target) < Math.abs(best.startTime - target) ? s : best), sessions[0]);
  };
  const choose = (s?: TrainingSession) => { if (s) { onPick(s.id); setOpen(false); setQ(''); } };

  const query = q.trim().toLowerCase();
  const rows = [...sessions].reverse().filter(s => !query ||
    `${new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} ${title(s)}`.toLowerCase().includes(query));
  let month = '';

  return (
    <>
      <button ref={trigger} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={`${label}: ${current ? new Date(current.startTime).toDateString() : 'none'}`}
        className="inline-flex items-baseline gap-2 max-w-[17rem] rounded-md -mx-1 px-1 text-[13.5px] hover:bg-text/[0.05] transition-colors">
        <span className="truncate">{current ? new Date(current.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose'}{current && <span className="text-text-muted"> · {title(current)}</span>}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0 text-text-muted"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} align="end" label={label}>
        <div className="w-80 -m-2">
          <div className="flex flex-wrap gap-x-1 gap-y-0.5 px-1 pb-2 border-b border-border">
            {QUICK.map(p => (
              <button key={p.label} onClick={() => choose(nearest(p.ago))}
                className="px-2 py-1 rounded-md text-[12.5px] text-text-muted hover:text-text hover:bg-text/[0.06] transition-colors">{p.label}</button>
            ))}
          </div>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by date or routine" aria-label="Search recordings"
            className="mt-2 mx-1 w-[calc(100%-0.5rem)] h-8 rounded-lg border border-border-strong bg-background px-2.5 text-[13px] outline-none focus:border-primary transition-colors placeholder:text-text-muted" />
          <div className="mt-1 max-h-72 overflow-y-auto">
            {rows.length === 0 && <p className="px-3 py-4 text-[13px] text-text-muted">No recording matches “{q}”.</p>}
            {rows.map(s => {
              const d = new Date(s.startTime);
              const m = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const header = m !== month ? (month = m) : null;
              const median = computePitchStats(s.pitchData, s.targetRange ?? range).median;
              return (
                <React.Fragment key={s.id}>
                  {header && <div className="px-3 pt-2.5 pb-1 text-[12px] text-text-muted">{header}</div>}
                  <button onClick={() => choose(s)} aria-pressed={s.id === value}
                    className={`w-full flex items-baseline gap-3 px-3 py-1.5 rounded-lg text-left text-[13px] hover:bg-text/[0.06] transition-colors ${s.id === value ? 'text-primary' : ''}`}>
                    <span className="font-mono tabular-nums text-[12.5px] w-12 shrink-0">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="flex-1 truncate">{title(s)}</span>
                    <span className="font-mono tabular-nums text-[12.5px] text-text-muted whitespace-nowrap">{median ? `${median} Hz` : '–'}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Popover>
    </>
  );
};
