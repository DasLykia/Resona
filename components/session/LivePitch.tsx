import React, { useEffect, useRef, useState } from 'react';
import type { PitchDataPoint, PitchRange } from '../../types';
import { SCALE_MIN, SCALE_MAX } from './RangeBand';
import { rangeCenter } from '../../services/pitchStats';

const WINDOW_MS = 20000;
const TICKS = [100, 150, 200, 250, 300, 400];
const L0 = Math.log(SCALE_MIN), L1 = Math.log(SCALE_MAX);

type Status = 'listening' | 'in' | 'below' | 'above';

// Resolve a CSS colour token to something canvas understands
const resolveColor = (probe: HTMLElement, token: string) => {
  probe.style.color = `var(${token})`;
  return getComputedStyle(probe).color;
};

interface LivePitchProps {
  dataRef: React.MutableRefObject<PitchDataPoint[]>;
  range: PitchRange;
  aside?: React.ReactNode;
}

export const LivePitch: React.FC<LivePitchProps> = ({ dataRef, range, aside }) => {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [readout, setReadout] = useState<{ hz: number | null; status: Status }>({ hz: null, status: 'listening' });
  const rangeRef = useRef(range);
  rangeRef.current = range;

  useEffect(() => {
    const c = canvas.current!, w = wrap.current!, p = probe.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0, lastReadout = 0, colors = { primary: '', ink: '', muted: '', line: '', band: '' }, lastColors = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(w.clientWidth * dpr);
      c.height = Math.round(w.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(w);
    resize();

    const draw = (now: number) => {
      const W = w.clientWidth, H = w.clientHeight;
      const padL = 44, padR = 16, padT = 12, padB = 12;
      const plotW = W - padL - padR, plotH = H - padT - padB;
      const y = (hz: number) => padT + plotH - ((Math.log(hz) - L0) / (L1 - L0)) * plotH;

      if (now - lastColors > 500) {
        colors = {
          primary: resolveColor(p, '--col-primary'),
          ink: resolveColor(p, '--text-main'),
          muted: resolveColor(p, '--text-muted'),
          line: resolveColor(p, '--border-color'),
          band: resolveColor(p, '--col-primary'),
        };
        lastColors = now;
      }

      const r = rangeRef.current;
      const data = dataRef.current;
      const tEnd = data.length ? data[data.length - 1].time : 0;
      const tStart = tEnd - WINDOW_MS;
      const x = (t: number) => padL + ((t - tStart) / WINDOW_MS) * plotW;

      ctx.clearRect(0, 0, W, H);

      // grid + labels
      ctx.font = '12px "Geist Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      for (const t of TICKS) {
        ctx.strokeStyle = colors.line; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, Math.round(y(t)) + 0.5); ctx.lineTo(W - padR, Math.round(y(t)) + 0.5); ctx.stroke();
        ctx.fillStyle = colors.muted; ctx.fillText(String(t), padL - 10, y(t));
      }

      // the range band
      const yHi = y(r.high), yLo = y(r.low);
      ctx.globalAlpha = 0.13; ctx.fillStyle = colors.band;
      ctx.fillRect(padL, yHi, plotW, yLo - yHi);
      ctx.globalAlpha = 0.5; ctx.strokeStyle = colors.band;
      ctx.beginPath();
      ctx.moveTo(padL, Math.round(yHi) + 0.5); ctx.lineTo(W - padR, Math.round(yHi) + 0.5);
      ctx.moveTo(padL, Math.round(yLo) + 0.5); ctx.lineTo(W - padR, Math.round(yLo) + 0.5);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // trace: walk back from the newest sample; break on silence or big jumps
      let i = data.length - 1;
      while (i > 0 && data[i - 1].time >= tStart) i--;
      ctx.lineWidth = 2.25; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      let prev: PitchDataPoint | null = null;
      for (; i < data.length; i++) {
        const pt = data[i];
        if (pt.pitch <= 0 || pt.pitch < SCALE_MIN || pt.pitch > SCALE_MAX) { prev = null; continue; }
        if (prev && Math.abs(12 * Math.log2(pt.pitch / prev.pitch)) < 4 && pt.time - prev.time < 200) {
          const inBand = pt.pitch >= r.low && pt.pitch <= r.high;
          ctx.strokeStyle = inBand ? colors.primary : colors.ink;
          ctx.globalAlpha = inBand ? 1 : 0.55;
          ctx.beginPath(); ctx.moveTo(x(prev.time), y(prev.pitch)); ctx.lineTo(x(pt.time), y(pt.pitch)); ctx.stroke();
        }
        prev = pt;
      }
      ctx.globalAlpha = 1;

      // readout ~8 times a second: median of recent voiced samples
      if (now - lastReadout > 120) {
        lastReadout = now;
        const recent: number[] = [];
        for (let k = data.length - 1; k >= 0 && data[k].time > tEnd - 300; k--) if (data[k].pitch > 0) recent.push(data[k].pitch);
        if (recent.length < 2) setReadout(o => (o.status === 'listening' ? o : { hz: null, status: 'listening' }));
        else {
          recent.sort((a, b) => a - b);
          const hz = Math.round(recent[Math.floor(recent.length / 2)]);
          const status: Status = hz < r.low ? 'below' : hz > r.high ? 'above' : 'in';
          setReadout({ hz, status });
        }
      }

      // head dot on the newest voiced sample
      const last = data[data.length - 1];
      if (last && last.pitch > SCALE_MIN && last.pitch < SCALE_MAX) {
        const inBand = last.pitch >= r.low && last.pitch <= r.high;
        ctx.fillStyle = inBand ? colors.primary : colors.ink;
        ctx.beginPath(); ctx.arc(x(last.time), y(last.pitch), 4, 0, Math.PI * 2); ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [dataRef]);

  const statusText = { listening: 'Listening', in: 'In range', below: 'Below range', above: 'Above range' }[readout.status];

  return (
    <div className="relative h-full flex flex-col">
      <span ref={probe} className="hidden" />
      <div className="flex items-baseline justify-between gap-6 pb-3">
        <div className="flex items-baseline gap-3">
          <span className={`font-mono tabular-nums text-[34px] leading-none tracking-[-0.02em] transition-colors duration-150 ${readout.status === 'in' ? 'text-primary' : 'text-text'}`}>
            {readout.hz ?? '–––'}
          </span>
          <span className="text-[13px] text-text-muted">Hz</span>
          <span className={`ml-2 text-[20px] font-medium tracking-[-0.01em] transition-colors duration-150 ${
            readout.status === 'in' ? 'text-primary' : readout.status === 'listening' ? 'text-text-muted' : 'text-text'
          }`}>
            {statusText}
          </span>
        </div>
        <div className="flex items-baseline gap-5">
          {aside}
          <RefTone hz={rangeCenter(range)} />
        </div>
      </div>
      <div ref={wrap} className="relative flex-1 min-h-0">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};

// Press and hold to hear the middle of the target range
const RefTone: React.FC<{ hz: number }> = ({ hz }) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const node = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const [on, setOn] = useState(false);

  const start = () => {
    if (node.current) return;
    const ctx = ctxRef.current ?? (ctxRef.current = new AudioContext());
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    node.current = { osc, gain };
    setOn(true);
  };
  const stop = () => {
    const n = node.current, ctx = ctxRef.current;
    if (!n || !ctx) return;
    n.gain.gain.cancelScheduledValues(ctx.currentTime);
    n.gain.gain.setValueAtTime(n.gain.gain.value, ctx.currentTime);
    n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    n.osc.stop(ctx.currentTime + 0.06);
    node.current = null;
    setOn(false);
  };
  useEffect(() => () => { stop(); ctxRef.current?.close(); }, []);

  return (
    <button
      onPointerDown={start} onPointerUp={stop} onPointerLeave={stop}
      className={`text-[13px] transition-colors ${on ? 'text-primary' : 'text-text-muted hover:text-text'}`}
    >
      {on ? <>Playing <span className="font-mono tabular-nums">{hz}</span> Hz</> : 'Hold for reference tone'}
    </button>
  );
};
