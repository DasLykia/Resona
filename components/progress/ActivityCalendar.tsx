import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconChevronLeft, IconChevronRight } from '../icons';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface ActivityCalendarProps {
  minutesByDay: Record<string, number>;     // YYYY-MM-DD -> seconds trained (stats.history)
  restDays: Record<string, boolean>;        // YYYY-MM-DD -> rest/sick
  trainingDays: number[];                   // 0=Sun..6=Sat; empty = every day
  onToggleRest: (day: string) => void;
  onOpenDay: (day: string) => void;
}

// Two months side by side. Trained days are tinted by minutes; empty past days toggle as rest days.
export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ minutesByDay, restDays, trainingDays, onToggleRest, onOpenDay }) => {
  const [offset, setOffset] = useState(0); // months back from the current month
  const [dir, setDir] = useState(0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayKey = key(today);

  const go = (delta: number) => { setDir(delta); setOffset(o => Math.max(0, o + delta)); };

  const month = (back: number) => {
    const first = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday first
    return (
      <div key={key(first)} className="min-w-0">
        <div className="text-[13.5px] font-semibold mb-3">{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map(w => <div key={w} className="text-[12px] text-text-muted pb-1">{w.slice(0, 2)}</div>)}
          {Array.from({ length: lead }, (_, i) => <div key={`lead${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = new Date(first.getFullYear(), first.getMonth(), i + 1);
            const k = key(d);
            const secs = minutesByDay[k] || 0;
            const future = d > today;
            const rest = !!restDays[k];
            const scheduled = trainingDays.length === 0 || trainingDays.includes(d.getDay());
            const tint = secs >= 1200 ? 'bg-primary text-on-primary' : secs >= 600 ? 'bg-primary/60 text-text' : secs > 0 ? 'bg-primary/25 text-text' : '';
            const title = secs > 0 ? `${Math.round(secs / 60)} min trained. Open sessions`
              : future ? '' : rest ? 'Rest day. Click to unmark' : 'Click to mark as a rest day';
            return (
              <button
                key={k}
                disabled={future}
                title={title}
                aria-label={`${d.toDateString()}${secs ? `, ${Math.round(secs / 60)} minutes` : rest ? ', rest day' : ''}`}
                aria-pressed={!secs && !future ? rest : undefined}
                onClick={() => (secs ? onOpenDay(k) : onToggleRest(k))}
                className={`relative h-9 rounded-lg text-[12.5px] font-mono tabular-nums transition-[background-color,color,transform] duration-150 active:scale-[0.97]
                  ${tint || (future ? 'text-text-muted/50' : scheduled ? 'text-text hover:bg-text/[0.06]' : 'text-text-muted hover:bg-text/[0.06]')}
                  ${rest && !secs ? 'outline outline-1 outline-dashed outline-text/40 -outline-offset-4' : ''}
                  ${k === todayKey ? 'font-semibold underline underline-offset-4 decoration-2 decoration-primary' : ''}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-end gap-1 mb-1">
        <button aria-label="Earlier months" onClick={() => go(1)} className="w-8 h-8 grid place-items-center rounded-lg text-text-muted hover:text-text hover:bg-text/[0.06] active:scale-[0.97] transition"><IconChevronLeft /></button>
        <button aria-label="Later months" onClick={() => go(-1)} disabled={offset === 0} className="w-8 h-8 grid place-items-center rounded-lg text-text-muted hover:text-text hover:bg-text/[0.06] active:scale-[0.97] transition disabled:opacity-30"><IconChevronRight /></button>
      </div>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={offset}
            custom={dir}
            className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10"
            initial={{ opacity: 0, x: dir * -24 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE_OUT } }}
            exit={{ opacity: 0, x: dir * 24, transition: { duration: 0.18, ease: EASE_OUT } }}
          >
            {/* Wide windows show a third, older month */}
            <div className="hidden 2xl:block">{month(offset + 2)}</div>
            {month(offset + 1)}
            {month(offset)}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-4 text-[12.5px] text-text-muted flex flex-wrap gap-x-5 gap-y-1">
        <span><span className="inline-block w-3 h-3 rounded-[3px] bg-primary/60 align-[-2px] mr-1.5" />Trained, darker means longer</span>
        <span><span className="inline-block w-3 h-3 rounded-[3px] outline outline-1 outline-dashed outline-text/50 align-[-2px] mr-1.5" />Rest day, never breaks your streak</span>
        <span>Click an empty day to mark it as a rest day.</span>
      </p>
    </div>
  );
};
