import React, { useEffect, useState } from 'react';
import { audioService } from '../../services/audio';
import { Button } from '../Button';

interface MicCheckProps {
  deviceId: string;
  gain: number;
  setGain: (g: number) => void;
  skipNextTime: boolean;
  setSkipNextTime: (v: boolean) => void;
  onReady: () => void;
  onCancel: () => void;
  readyLabel?: string;   // setup reuses this screen as its last step
  cancelLabel?: string;
  showSkip?: boolean;
  requireMic?: boolean;  // a session needs the mic; setup can finish without one
}

const NOISE_THRESHOLD = 0.02;

export const MicCheck: React.FC<MicCheckProps> = ({ deviceId, gain, setGain, skipNextTime, setSkipNextTime, onReady, onCancel, readyLabel = 'Start session', cancelLabel = 'Cancel', showSkip = true, requireMic = true }) => {
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [noise, setNoise] = useState<'idle' | 'checking' | 'quiet' | 'noisy'>('idle');

  useEffect(() => {
    let alive = true;
    audioService.initialize(deviceId)
      .then(() => { audioService.setGain(gain); return audioService.resume(); })
      .then(() => alive && setError(null))
      .catch(() => alive && setError('Resona can’t reach your microphone. Check that it’s plugged in and allowed in Windows privacy settings.'));
    const id = setInterval(() => setLevel(Math.min(1, audioService.getVolume() * 5)), 50);
    return () => { alive = false; clearInterval(id); };
  }, [deviceId]);

  useEffect(() => { audioService.setGain(gain); }, [gain]);

  const checkNoise = () => {
    setNoise('checking');
    let total = 0, n = 0;
    const start = performance.now();
    const tick = () => {
      if (performance.now() - start > 3000) { setNoise(total / n < NOISE_THRESHOLD ? 'quiet' : 'noisy'); return; }
      total += audioService.getVolume(); n++;
      requestAnimationFrame(tick);
    };
    tick();
  };

  const clipping = level > 0.9;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[560px] mx-auto px-12 pt-[10vh] pb-10">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Check your microphone</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-text-muted max-w-[52ch]">
          Say a few words at the volume you’ll train at. The bar should reach about the middle without touching the end.
        </p>

        {error ? (
          <p className="mt-8 text-[14px] text-danger leading-relaxed">{error}</p>
        ) : (
          <div className="mt-8">
            <div className="flex justify-between text-[13px] mb-2">
              <span className="text-text">Input level</span>
              <span className={clipping ? 'text-danger' : 'text-text-muted'}>{clipping ? 'Too loud, lower the gain' : ' '}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-text/10 overflow-hidden" role="meter" aria-valuenow={Math.round(level * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Microphone level">
              <div className={`h-full rounded-full transition-[width] duration-75 ${clipping ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${level * 100}%` }} />
            </div>
          </div>
        )}

        <div className="mt-8 py-4 border-y border-border space-y-4">
          <label className="flex items-center justify-between gap-6 text-[13.5px]">
            <span>Input gain</span>
            <span className="flex items-center gap-3">
              <input type="range" min="0" max="2" step="0.1" value={gain} onChange={e => setGain(parseFloat(e.target.value))} className="w-48" />
              <span className="font-mono tabular-nums text-[12.5px] text-text-muted w-9 text-right">{gain.toFixed(1)}×</span>
            </span>
          </label>
          <div className="flex items-center justify-between gap-6 text-[13.5px]">
            <span>Room noise</span>
            <span className="text-text-muted text-[13px]">
              {noise === 'idle' && <button onClick={checkNoise} className="text-text underline decoration-border-strong underline-offset-[3px] hover:decoration-text">Check for 3 seconds</button>}
              {noise === 'checking' && 'Listening… stay quiet'}
              {noise === 'quiet' && 'Quiet. Good for recording'}
              {noise === 'noisy' && <>Noisy. A quieter spot gives cleaner pitch. <button onClick={checkNoise} className="text-text underline decoration-border-strong underline-offset-[3px]">Retry</button></>}
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          {showSkip ? <label className="flex items-center gap-2 text-[13px] text-text-muted cursor-pointer">
            <input type="checkbox" checked={skipNextTime} onChange={e => setSkipNextTime(e.target.checked)} />
            Skip this check next time
          </label> : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
            <Button size="lg" onClick={onReady} disabled={requireMic && !!error}>{readyLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
