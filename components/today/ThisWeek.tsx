import React, { useRef, useState } from 'react';
import { Popover } from '../Popover';
import { Button } from '../Button';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface ThisWeekProps {
  secondsByDay: Record<string, number>; // stats.history
  restDays: Record<string, boolean>;
  trainingDays: number[];               // 0=Sun..6=Sat; empty = every day
  streak: number;
  onToggleRest: (day: string) => void;
  onTimeOff: (from: string, to: string) => void; // marks every untrained day in the range as rest
}

// Monday to Sunday as one ruled row: trained days carry the accent tint (as on the calendar), rest days a dash
export const ThisWeek: React.FC<ThisWeekProps> = ({ secondsByDay, restDays, trainingDays, streak, onToggleRest, onTimeOff }) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  const isPlanned = (d: Date) => trainingDays.length === 0 || trainingDays.includes(d.getDay());
  const planned = days.filter(isPlanned).length;
  const trained = days.filter(d => secondsByDay[key(d)] && isPlanned(d)).length;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[15px] font-semibold">This week</h2>
        <span className="text-[13px] text-text-muted">
          <span className="whitespace-nowrap"><span className="font-mono tabular-nums text-text">{trained}</span>&nbsp;of&nbsp;<span className="font-mono tabular-nums">{planned}</span>&nbsp;planned&nbsp;{planned === 1 ? 'day' : 'days'}</span> ·{' '}
          <span className="whitespace-nowrap"><span className="font-mono tabular-nums text-text">{streak}</span>&nbsp;day streak</span>
        </span>
      </div>
      <div className="grid grid-cols-7 border-y border-border divide-x divide-border">
        {days.map((d, i) => {
          const k = key(d), secs = secondsByDay[k] || 0, rest = !!restDays[k];
          const future = d > today, isToday = +d === +today, plannedDay = isPlanned(d);
          // Today is never "Missed": the day isn't over yet
          const state = secs ? `${Math.round(secs / 60)} min` : rest ? 'Rest'
            : isToday ? (plannedDay ? 'Today' : 'Off')
            : future ? (plannedDay ? 'Planned' : 'Off')
            : plannedDay ? 'Missed' : 'Off';
          const canToggle = !secs; // upcoming days too, so time off can be planned ahead
          return (
            <div key={k} className="p-1">
              <button disabled={!canToggle} onClick={() => onToggleRest(k)}
                aria-label={`${d.toLocaleDateString('en-US', { weekday: 'long' })}: ${state}${canToggle ? (rest ? '. Click to unmark rest day' : '. Click to mark as rest day') : ''}`}
                className={`w-full h-14 rounded-lg px-2 py-1.5 flex flex-col justify-between text-left transition-[background-color,transform] duration-150 enabled:active:scale-[0.97] disabled:cursor-default
                  ${secs ? 'bg-primary/[0.16]' : rest ? 'outline outline-1 outline-dashed outline-text/40 -outline-offset-2' : 'enabled:hover:bg-text/[0.05]'}`}>
                <span className={`text-[12px] ${isToday ? 'text-text font-semibold underline underline-offset-4 decoration-2 decoration-primary' : 'text-text-muted'}`}>{DAY_NAMES[i]}</span>
                <span className={`text-[12.5px] ${secs ? 'text-primary font-medium font-mono tabular-nums' : state === 'Missed' ? 'text-text' : 'text-text-muted'}`}>{state}</span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <p className="text-[12.5px] text-text-muted">Click a day to mark it as a rest day. Rest never breaks your streak.</p>
        <TimeOff onConfirm={onTimeOff} />
      </div>
    </section>
  );
};

const MAX_DAYS = 60;
const addDays = (k: string, n: number) => { const [y, m, d] = k.split('-').map(Number); return key(new Date(y, m - 1, d + n)); };

// Ill or away for a while: mark a whole stretch as rest in one go
const TimeOff: React.FC<{ onConfirm: (from: string, to: string) => void }> = ({ onConfirm }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const today = key(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 6));
  const span = from && to ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1 : 0;
  const error = !from || !to ? 'Pick both dates.' : span < 1 ? 'The last day is before the first.' : span > MAX_DAYS ? `At most ${MAX_DAYS} days at once.` : null;
  const field = 'h-8 w-full rounded-lg border border-border-strong focus:border-primary bg-surface px-2 text-[13px] font-mono tabular-nums outline-none transition-colors [color-scheme:light_dark]';
  return (
    <>
      <button ref={trigger} onClick={() => { setFrom(today); setTo(addDays(today, 6)); setOpen(o => !o); }} aria-expanded={open}
        className="shrink-0 relative before:absolute before:-inset-1.5 before:content-[''] text-[12.5px] text-text-muted hover:text-text underline decoration-border-strong underline-offset-[3px] transition-colors">
        Take time off
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} align="end" label="Take time off">
        <div className="w-72">
          <p className="text-[13.5px] font-medium">Take time off</p>
          <p className="mt-0.5 text-[12.5px] text-text-muted">Every day in between becomes a rest day, so your streak waits for you.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label><span className="block text-[12px] text-text-muted mb-1">First day</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={field} /></label>
            <label><span className="block text-[12px] text-text-muted mb-1">Last day</span><input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} className={field} /></label>
          </div>
          <p className={`mt-2 text-[12.5px] ${error ? 'text-danger' : 'text-text-muted'}`}>
            {error ?? <><span className="font-mono tabular-nums">{span}</span> {span === 1 ? 'day' : 'days'}. Days you already trained stay as they are.</>}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!!error} onClick={() => { onConfirm(from, to); setOpen(false); }}>Mark as rest</Button>
          </div>
        </div>
      </Popover>
    </>
  );
};
