import React, { useRef, useState } from 'react';
import type { Routine } from '../../types';
import { ROUTINE_TEMPLATES } from '../../constants';
import { copyRoutine, routineLength, WeekPlan } from '../../services/routines';
import { Button } from '../Button';
import { Popover } from '../Popover';
import { RoutineEditor } from './RoutineEditor';

const newId = () => crypto.randomUUID();
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first; values are Date.getDay()
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// "Mon, Thu" for the days a routine is planned on
export const daysLabel = (plan: WeekPlan, id: string) => {
  const days = ORDER.filter(d => plan[d] === id);
  return days.length === 7 ? 'Every day' : days.map(d => SHORT[d]).join(', ');
};

interface RoutinePageProps {
  routine: Routine;
  routines: Routine[];
  activeId: string;
  plan: WeekPlan;
  onChange: (routines: Routine[]) => void;
  onSetActive: (id: string) => void;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
}

// One routine: its editor (duplicate and delete are handled here)
export const RoutinePage: React.FC<RoutinePageProps> = ({ routine, routines, activeId, plan, onChange, onSetActive, onSelect, onStart }) => {
  const replace = (r: Routine) => onChange(routines.map(x => (x.id === r.id ? r : x)));
  const remove = () => {
    const rest = routines.filter(r => r.id !== routine.id);
    onChange(rest);
    if (routine.id === activeId) onSetActive(rest[0].id);
    onSelect(''); // back to the list
  };
  const duplicate = () => {
    const c = copyRoutine(routine, `${routine.name} copy`, newId);
    onChange([...routines, c]);
    onSelect(c.id);
  };
  return (
      <RoutineEditor
        key={routine.id}
        routine={routine}
        isActive={routine.id === activeId}
        days={daysLabel(plan, routine.id)}
        canDelete={routines.length > 1}
        onChange={replace}
        onUseOnToday={() => onSetActive(routine.id)}
        onDuplicate={duplicate}
        onDelete={remove}
        onStart={() => onStart(routine.id)}
      />
  );
};

// The Routines page: every routine as one row; click to edit
// selectedId: wide layout, where the list is a narrow column beside the editor (details go on a second line)
export const RoutineList: React.FC<{ routines: Routine[]; plan: WeekPlan; todayId: string | null; onOpen: (id: string) => void; selectedId?: string }> = ({ routines, plan, todayId, onOpen, selectedId }) => selectedId !== undefined ? (
  <ul className="border-t border-border" aria-label="Routines">
    {routines.map(r => {
      const on = r.id === selectedId;
      return (
        <li key={r.id}>
          <button onClick={() => onOpen(r.id)} aria-current={on ? 'true' : undefined}
            className={`relative w-full text-left px-3 py-3 border-b border-border transition-colors ${on ? 'bg-text/[0.06]' : 'hover:bg-text/[0.03]'}`}>
            {on && <span className="absolute left-0 top-1/2 -mt-3 h-6 w-[3px] rounded-full bg-primary" />}
            <span className="flex items-baseline gap-3">
              <span className="flex-1 min-w-0 truncate text-[14px] font-medium">{r.name || 'Untitled routine'}</span>
              {r.id === todayId && <span className="text-[12.5px] text-primary">Today</span>}
            </span>
            <span className="block mt-0.5 text-[12.5px] text-text-muted truncate">
              {daysLabel(plan, r.id) || 'Not planned'} · {r.blocks.length ? routineLength(r) : 'No exercises'}
            </span>
          </button>
        </li>
      );
    })}
  </ul>
) : (
  <ul className="border-t border-border">
    {routines.map(r => (
      <li key={r.id}>
        <button onClick={() => onOpen(r.id)}
          className="w-full flex items-baseline gap-4 px-3 -mx-3 py-3.5 border-b border-border text-left rounded-none hover:bg-text/[0.03] transition-colors">
          <span className="flex-1 min-w-0 truncate text-[14px] font-medium">{r.name || 'Untitled routine'}</span>
          {r.id === todayId && <span className="text-[13px] text-primary">Today</span>}
          <span className="w-40 text-right text-[13px] text-text-muted truncate">{daysLabel(plan, r.id) || 'Not planned'}</span>
          <span className="w-28 text-right text-[13px] text-text-muted">{r.blocks.length ? routineLength(r) : 'No exercises'}</span>
        </button>
      </li>
    ))}
  </ul>
);

// Monday to Sunday, each with its routine or Rest
export const WeekPlanEditor: React.FC<{ plan: WeekPlan; routines: Routine[]; onChange: (p: WeekPlan) => void }> = ({ plan, routines, onChange }) => {
  const today = new Date().getDay();
  return (
    <section className="mb-12">
      <h2 className="text-[15px] font-semibold">Week plan</h2>
      <p className="mt-1 text-[13px] text-text-muted">Which routine Start runs on each day. Rest days never break your streak.</p>
      <div className="mt-4 grid grid-cols-7 border-y border-border divide-x divide-border">
        {ORDER.map(d => (
          <label key={d} className="block p-2">
            <span className={`block mb-1.5 text-[12px] ${d === today ? 'text-text font-semibold underline underline-offset-4 decoration-2 decoration-primary' : 'text-text-muted'}`}>{SHORT[d]}</span>
            <select value={plan[d] ?? ''} aria-label={`Routine on ${FULL[d]}`}
              onChange={e => onChange(plan.map((x, i) => (i === d ? e.target.value || null : x)))}
              className={`w-full h-8 rounded-lg border border-border-strong bg-surface px-1.5 text-[13px] outline-none focus:border-primary transition-colors truncate ${plan[d] ? '' : 'text-text-muted'}`}>
              <option value="">Rest</option>
              {routines.map(r => <option key={r.id} value={r.id}>{r.name || 'Untitled routine'}</option>)}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
};

// Opens the template choice for a new routine
export const NewRoutineMenu: React.FC<{ onCreate: (r: Routine) => void }> = ({ onCreate }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pick = (r: Routine) => { onCreate(r); setOpen(false); };
  const item = 'w-full text-left px-3 py-2 rounded-lg hover:bg-text/[0.06] transition-colors';
  return (
    <>
      <Button ref={trigger} variant="secondary" onClick={() => setOpen(o => !o)} aria-expanded={open}>New routine</Button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} align="end" label="New routine">
        <div className="w-72 -m-2">
          <button className={item} onClick={() => pick({ id: newId(), name: 'New routine', blocks: [] })}>
            <span className="block text-[13.5px]">Blank routine</span>
            <span className="block text-[12.5px] text-text-muted">Start empty and add your own exercises.</span>
          </button>
          {ROUTINE_TEMPLATES.map(t => (
            <button key={t.key} className={item} onClick={() => pick(copyRoutine({ name: t.name, blocks: t.blocks.map(b => ({ ...b, id: '' })) }, t.name, newId))}>
              <span className="block text-[13.5px]">{t.name}</span>
              <span className="block text-[12.5px] text-text-muted">{t.summary}</span>
            </button>
          ))}
        </div>
      </Popover>
    </>
  );
};

// Today: the routine name opens a menu to switch which routine Start runs
export const RoutinePicker: React.FC<{ routines: Routine[]; activeId: string; onPick: (id: string) => void; onEdit: () => void }> = ({ routines, activeId, onPick, onEdit }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const active = routines.find(r => r.id === activeId) ?? routines[0];
  return (
    <>
      <button ref={trigger} onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="group inline-flex items-baseline gap-2 max-w-full text-[17px] font-semibold tracking-[-0.01em] rounded-md -mx-1 px-1 hover:bg-text/[0.05] transition-colors">
        <span className="truncate">{active?.name}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0 text-text-muted group-hover:text-text transition-colors">
          <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} align="start" label="Choose routine">
        <div className="w-64 -m-2">
          {routines.map(r => (
            <button key={r.id} aria-pressed={r.id === activeId} onClick={() => { onPick(r.id); setOpen(false); }}
              className="w-full flex items-baseline justify-between gap-3 text-left px-3 py-2 rounded-lg hover:bg-text/[0.06] transition-colors">
              <span className={`text-[13.5px] truncate ${r.id === activeId ? 'text-primary font-medium' : ''}`}>{r.name}</span>
              <span className="text-[12px] text-text-muted shrink-0">{routineLength(r)}</span>
            </button>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <button onClick={() => { setOpen(false); onEdit(); }} className="w-full text-left px-3 py-2 rounded-lg text-[13.5px] text-text-muted hover:text-text hover:bg-text/[0.06] transition-colors">Edit routines</button>
          </div>
        </div>
      </Popover>
    </>
  );
};
