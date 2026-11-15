import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from './Button';
import { IconPause, IconPlay } from './icons';
import { getAudioBlob } from '../services/storage';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Play/pause with blurred icon crossfade; used by every recording player
export const PlayPauseIcon: React.FC<{ playing: boolean }> = ({ playing }) => (
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.span key={playing ? 'pause' : 'play'} className="grid place-items-center"
      initial={{ opacity: 0, scale: 0.6, filter: 'blur(3px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.18, ease: EASE_OUT } }}
      exit={{ opacity: 0, scale: 0.6, filter: 'blur(3px)', transition: { duration: 0.14 } }}>
      {playing ? <IconPause /> : <IconPlay />}
    </motion.span>
  </AnimatePresence>
);

export const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// WebM from MediaRecorder reports Infinity as its duration in Chromium, so the session length stands in
export const RecordingPlayer: React.FC<{ blob: Blob; fallbackLength: number; label?: string; onTime?: (s: number) => void }> = ({ blob, fallbackLength, label = 'Recording', onTime }) => {
  // Created in the effect (not useMemo): a cleanup that revokes the URL must also be able to recreate it
  const [url, setUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [len, setLen] = useState(fallbackLength);

  const toggle = () => { const a = audio.current!; if (a.paused) a.play().catch(() => setPlaying(false)); else a.pause(); };

  return (
    <div className="flex items-center gap-4">
      <audio
        ref={audio} src={url} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={e => { setT(e.currentTarget.currentTime); onTime?.(e.currentTarget.currentTime); }}
        onLoadedMetadata={e => Number.isFinite(e.currentTarget.duration) && setLen(e.currentTarget.duration)}
        onDurationChange={e => Number.isFinite(e.currentTarget.duration) && setLen(e.currentTarget.duration)}
      />
      <Button variant="secondary" size="icon" aria-label={playing ? `Pause ${label.toLowerCase()}` : `Play ${label.toLowerCase()}`} onClick={toggle}>
        <PlayPauseIcon playing={playing} />
      </Button>
      <span className="text-[13.5px]">{label}</span>
      <SeekBar value={t} max={len} label={`Seek ${label.toLowerCase()}`} onSeek={v => { audio.current!.currentTime = v; }} />
      <span className="font-mono tabular-nums text-[12.5px] text-text-muted w-24 text-right">{fmtClock(t)}{len ? ` / ${fmtClock(len)}` : ''}</span>
    </div>
  );
};

// Loads a stored recording from IndexedDB, then plays it
export const StoredRecording: React.FC<{ id: string; fallbackLength: number; onTime?: (s: number) => void }> = ({ id, fallbackLength, onTime }) => {
  const [blob, setBlob] = useState<Blob | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    getAudioBlob(id).then(b => alive && setBlob(b ?? null)).catch(() => alive && setBlob(null));
    return () => { alive = false; };
  }, [id]);

  if (blob === undefined) return <div className="h-8 flex items-center text-[13px] text-text-muted">Loading recording…</div>;
  if (blob === null) return <div className="h-8 flex items-center text-[13px] text-text-muted">The audio file for this recording is missing.</div>;
  return <RecordingPlayer blob={blob} fallbackLength={fallbackLength} onTime={onTime} />;
};

// Native range input (keyboard and screen-reader operable), drawn as a thin hairline track
export const SeekBar: React.FC<{ value: number; max: number; label: string; onSeek: (v: number) => void }> = ({ value, max, label, onSeek }) => (
  <input
    type="range" min={0} max={max || 0} step={1} value={Math.min(value, max || 0)} aria-label={label}
    aria-valuetext={`${fmtClock(value)} of ${fmtClock(max)}`}
    onChange={e => onSeek(parseFloat(e.target.value))}
    className="seek flex-1"
    style={{ ['--pct' as string]: `${max ? Math.min(100, (value / max) * 100) : 0}%` }}
  />
);
