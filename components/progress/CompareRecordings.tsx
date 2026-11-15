import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PitchRange, TrainingSession } from '../../types';
import { computePitchStats } from '../../services/pitchStats';
import { getAudioBlob } from '../../services/storage';
import { Button } from '../Button';
import { Segmented } from '../Segmented';
import { PlayPauseIcon, SeekBar, fmtClock } from '../RecordingPlayer';
import { PitchTrace } from './PitchTrace';

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

  const picker = (value: string | undefined, set: (id: string) => void, name: string) => (
    <select value={value} onChange={e => { set(e.target.value); audio.then.current?.pause(); audio.now.current?.pause(); setPlaying(false); setT(0); }}
      aria-label={name}
      className="h-8 max-w-full rounded-lg border border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-primary transition-colors">
      {withRec.map(s => <option key={s.id} value={s.id}>{label(s, title)}</option>)}
    </select>
  );

  return (
    <div>
      <div className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-2 items-center text-[13.5px]">
        <span className="text-text-muted">Then</span>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 min-w-0">{picker(thenId, setThenId, 'Earlier session')}<span className="text-[13px] text-text-muted">{statLine(a)}</span></div>
        <span className="text-primary">Now</span>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 min-w-0">{picker(nowId, setNowId, 'Recent session')}<span className="text-[13px] text-text-muted">{statLine(b)}</span></div>
      </div>

      <div className="mt-6">
        <PitchTrace
          range={range}
          durationMs={Math.max(a?.duration ?? 0, b?.duration ?? 0) * 1000}
          playheadMs={playing || t > 0 ? t * 1000 : null}
          traces={[
            { data: a?.pitchData ?? [], tone: 'ink', label: 'Then' },
            { data: b?.pitchData ?? [], tone: 'accent', label: 'Now' },
          ]}
        />
      </div>

      {(['then', 'now'] as Side[]).map(k => (
        <audio key={k} ref={audio[k]} src={urls[k] ?? undefined} preload="metadata"
          onTimeUpdate={e => { if (k === side) setT(e.currentTarget.currentTime); }}
          onEnded={() => { if (k === side) setPlaying(false); }} />
      ))}

      <div className="mt-4 flex items-center gap-4">
        <Button variant="secondary" size="icon" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} disabled={!urls[side]}>
          <PlayPauseIcon playing={playing} />
        </Button>
        <Segmented label="Which recording plays" value={side} onChange={switchTo}
          options={[{ value: 'then', label: 'Then' }, { value: 'now', label: 'Now' }]} />
        <SeekBar value={t} max={len} label="Seek the playing recording" onSeek={v => { const el = audio[side].current; if (el) { el.currentTime = v; setT(v); } }} />
        <span className="font-mono tabular-nums text-[12.5px] text-text-muted w-24 text-right">{fmtClock(t)} / {fmtClock(len)}</span>
      </div>
      <p className="mt-2 text-[12.5px] text-text-muted">Switching between Then and Now keeps your place, so you can hear the same moment in both.</p>
    </div>
  );
};
