import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Routine } from '../../types';
import { ROUTINE_TEMPLATES } from '../../constants';
import { copyRoutine, routineLength } from '../../services/routines';
import { Button } from '../Button';
import { Popover } from '../Popover';
import { RoutineEditor } from './RoutineEditor';

const newId = () => crypto.randomUUID();
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

interface RoutinesViewProps {
  routines: Routine[];
  activeId: string;
  onChange: (routines: Routine[]) => void;
  onSetActive: (id: string) => void;
}

// Saved routines on the left, the selected one's editor on the right
export const RoutinesView: React.FC<RoutinesViewProps> = ({ routines, activeId, onChange, onSetActive }) => {
  const [selectedId, setSelectedId] = useState(activeId);
  const selected = routines.find(r => r.id === selectedId) ?? routines[0];

  const add = (r: Routine) => { onChange([...routines, r]); setSelectedId(r.id); };
  const replace = (r: Routine) => onChange(routines.map(x => (x.id === r.id ? r : x)));
  const remove = (id: string) => {
    const rest = routines.filter(r => r.id !== id);
    onChange(rest);
    if (id === activeId) onSetActive(rest[0].id);
    setSelectedId(rest[0].id);
  };

  return (
    <div className="grid grid-cols-[10.5rem_1fr] xl:grid-cols-[13rem_1fr] gap-6 xl:gap-10 items-start">
      <div>
        <ul aria-label="Routines">
          {routines.map(r => {
            const on = r.id === selected.id;
            return (
              <li key={r.id}>
                <button onClick={() => setSelectedId(r.id)} aria-current={on ? 'true' : undefined}
                  className={`relative w-full text-left pl-3 pr-2 py-2 rounded-lg transition-colors duration-150 ${on ? 'bg-text/[0.06]' : 'hover:bg-text/[0.04]'}`}>
                  {on && <motion.span layoutId="routine-indicator" className="absolute left-0 top-1/2 -mt-2 h-4 w-[3px] rounded-full bg-primary"
                    transition={{ duration: 0.22, ease: EASE_IN_OUT }} />}
                  <span className={`block text-[13.5px] truncate ${on ? 'text-text font-medium' : 'text-text'}`}>{r.name || 'Untitled routine'}</span>
                  <span className="block text-[12px] text-text-muted">
                    {routineLength(r)}{r.id === activeId && <span className="text-primary"> · on Today</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <NewRoutineMenu onCreate={add} />
      </div>

      <RoutineEditor
        key={selected.id}
        routine={selected}
        isActive={selected.id === activeId}
        canDelete={routines.length > 1}
        onChange={replace}
        onUseOnToday={() => onSetActive(selected.id)}
        onDuplicate={() => add(copyRoutine(selected, `${selected.name} copy`, newId))}
        onDelete={() => remove(selected.id)}
      />
    </div>
  );
};

const NewRoutineMenu: React.FC<{ onCreate: (r: Routine) => void }> = ({ onCreate }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pick = (r: Routine) => { onCreate(r); setOpen(false); };
  const item = 'w-full text-left px-3 py-2 rounded-lg hover:bg-text/[0.06] transition-colors';
  return (
    <>
      <Button ref={trigger} variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(o => !o)} aria-expanded={open}>New routine</Button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} align="start" label="New routine">
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
