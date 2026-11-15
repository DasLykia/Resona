import React from 'react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface ThisWeekProps {
  secondsByDay: Record<string, number>; // stats.history
  restDays: Record<string, boolean>;
  trainingDays: number[];               // 0=Sun..6=Sat; empty = every day
  streak: number;
  onToggleRest: (day: string) => void;
}

// Monday to Sunday as one ruled row: trained days carry the accent tint (as on the calendar), rest days a dash
export const ThisWeek: React.FC<ThisWeekProps> = ({ secondsByDay, restDays, trainingDays, streak, onToggleRest }) => {
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
          const canToggle = !secs && !future;
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
      <p className="mt-2 text-[12.5px] text-text-muted">Click an empty day to mark it as a rest day. Rest never breaks your streak.</p>
    </section>
  );
};
