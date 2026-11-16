import React, { useRef, useState } from 'react';
import type { Routine } from '../../types';
import { ROUTINE_TEMPLATES } from '../../constants';
import { copyRoutine, routineLength } from '../../services/routines';
import { Button } from '../Button';
import { Popover } from '../Popover';
import { RoutineEditor } from './RoutineEditor';

const newId = () => crypto.randomUUID();
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const OPEN_WEIGHT = 120; // open-ended blocks drawn as 2 min, same as the session progress hairline

interface RoutinePageProps {
  routine: Routine;
  routines: Routine[];
  activeId: string;
  onChange: (routines: Routine[]) => void;
  onSetActive: (id: string) => void;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
}

// One routine: its editor, and on wide windows a side column showing how a session will run
export const RoutinePage: React.FC<RoutinePageProps> = ({ routine, routines, activeId, onChange, onSetActive, onSelect, onStart }) => {
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
  const weights = routine.blocks.map(b => b.duration || OPEN_WEIGHT);
  const total = routine.blocks.reduce((a, b) => a + b.duration, 0);

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_22rem] gap-x-16 gap-y-10 items-start">
      <RoutineEditor
        key={routine.id}
        routine={routine}
        isActive={routine.id === activeId}
        canDelete={routines.length > 1}
        onChange={replace}
        onUseOnToday={() => onSetActive(routine.id)}
        onDuplicate={duplicate}
        onDelete={remove}
      />

      <aside className="hidden 2xl:block sticky top-0">
        <h2 className="text-[15px] font-semibold">How it runs</h2>
        <p className="mt-1 text-[13px] text-text-muted">{routineLength(routine)}, one exercise after another.</p>
        {routine.blocks.length > 0 ? (
          <>
            <div className="mt-4 flex gap-[3px]" aria-hidden="true">
              {routine.blocks.map((b, i) => (
                <div key={b.id} className={`h-[6px] rounded-full ${b.duration ? 'bg-primary/60' : 'bg-text/20'}`} style={{ flexGrow: weights[i], flexBasis: 0 }} />
              ))}
            </div>
            <ol className="mt-4">
              {routine.blocks.map((b, i) => (
                <li key={b.id} className="flex items-baseline gap-3 py-1.5 text-[13px]">
                  <span className="font-mono tabular-nums text-[12px] text-text-muted w-4 text-right">{i + 1}</span>
                  <span className="flex-1 truncate">{b.title}</span>
                  <span className="font-mono tabular-nums text-[12.5px] text-text-muted">{b.duration ? fmt(b.duration) : 'open'}</span>
                  <span className="w-10 text-right font-mono tabular-nums text-[12px] text-text-muted">{b.duration && total ? `${Math.round((b.duration / total) * 100)}%` : ''}</span>
                </li>
              ))}
            </ol>
            <Button size="lg" className="mt-6 w-full" onClick={() => onStart(routine.id)}>Start this routine</Button>
          </>
        ) : (
          <p className="mt-4 text-[13px] text-text-muted">Add exercises to see the session take shape.</p>
        )}
      </aside>
    </div>
  );
};

// The Routines page: every routine as one row; click to edit
export const RoutineList: React.FC<{ routines: Routine[]; activeId: string; onOpen: (id: string) => void }> = ({ routines, activeId, onOpen }) => (
  <ul className="border-t border-border">
    {routines.map(r => (
      <li key={r.id}>
        <button onClick={() => onOpen(r.id)}
          className="w-full flex items-baseline gap-4 px-3 -mx-3 py-3.5 border-b border-border text-left rounded-none hover:bg-text/[0.03] transition-colors">
          <span className="flex-1 min-w-0 truncate text-[14px] font-medium">{r.name || 'Untitled routine'}</span>
          {r.id === activeId && <span className="text-[13px] text-primary">Used on Today</span>}
          <span className="w-28 text-right text-[13px] text-text-muted">{r.blocks.length ? routineLength(r) : 'No exercises'}</span>
        </button>
      </li>
    ))}
  </ul>
);

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
