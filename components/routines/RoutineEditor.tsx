import React, { useEffect, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import type { ExerciseBlock, Routine } from '../../types';
import { parseDuration } from '../../services/routines';
import { Button } from '../Button';
import { ConfirmButton } from '../ConfirmButton';
import { IconGrip } from '../icons';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
// No width here: each field sets its own (a shared w-full would override the duration's w-16)
const input = 'bg-transparent outline-none rounded-md px-2 -mx-2 py-1 transition-colors hover:bg-text/[0.04] focus:bg-surface focus:ring-1 focus:ring-border-strong';

interface RoutineEditorProps {
  routine: Routine;
  isActive: boolean;
  days: string; // "Mon, Thu" from the week plan; empty when not planned
  canDelete: boolean;
  onChange: (r: Routine) => void;
  onUseOnToday: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStart: () => void;
  undoable: (label: string, run: () => void) => void;
}

export const RoutineEditor: React.FC<RoutineEditorProps> = ({ routine, isActive, days, canDelete, onChange, onUseOnToday, onDuplicate, onDelete, onStart, undoable }) => {
  // One exercise open for editing at a time; the rest are one-line rows so a routine fits on screen
  const [openId, setOpenId] = useState<string | null>(null);
  const total = routine.blocks.reduce((a, b) => a + b.duration, 0);
  const openCount = routine.blocks.filter(b => b.duration === 0).length;
  const setBlocks = (blocks: ExerciseBlock[]) => onChange({ ...routine, blocks });
  const updateBlock = (id: string, patch: Partial<ExerciseBlock>) => setBlocks(routine.blocks.map(b => (b.id === id ? { ...b, ...patch } : b)));
  // Keyboard reorder from the drag handle (Arrow Up / Down)
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= routine.blocks.length) return;
    const next = [...routine.blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };
  const addBlock = (kind: 'timed' | 'open' | 'rest') => { const id = crypto.randomUUID(); setOpenId(id); setBlocks([...routine.blocks, {
    id,
    title: kind === 'open' ? 'Open practice' : kind === 'rest' ? 'Rest' : 'New exercise',
    duration: kind === 'open' ? 0 : kind === 'rest' ? 30 : 60,
    description: '',
  }]); };

  return (
    <div>
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-x-6 gap-y-2 pb-4 border-b border-border-strong">
        {/* The routine's name is the page title (editable there) */}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-text-muted xl:pt-1.5">
            <span className="font-mono tabular-nums">{routine.blocks.length}</span> {routine.blocks.length === 1 ? 'exercise' : 'exercises'} ·{' '}
            <span className="font-mono tabular-nums">{fmt(total)}</span>{openCount > 0 && <> plus <span className="font-mono tabular-nums">{openCount}</span> open-ended</>}
            {' · '}{days ? <>planned {days === 'Every day' ? 'every day' : `on ${days}`}</> : 'not in your week plan'}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 xl:pt-1 -ml-2 xl:ml-0">
          {isActive ? <span className="text-[13px] text-primary px-2 mr-1">Runs today</span>
            : <Button size="sm" onClick={onUseOnToday} title="Run this routine today only; your week plan stays the same">Use today</Button>}
          <Button variant="ghost" size="sm" onClick={onDuplicate}>Duplicate</Button>
          {routine.blocks.length > 0 && <Button variant="secondary" size="sm" onClick={onStart} className="ml-1">Start this routine</Button>}
          {canDelete && (
            <ConfirmButton confirmLabel="Delete routine" message={`Delete “${routine.name}”? Past sessions keep their logs.`} onConfirm={onDelete}>
              Delete
            </ConfirmButton>
          )}
        </div>
      </div>

      {routine.blocks.length === 0 && (
        <p className="py-8 text-[13.5px] text-text-muted">No exercises yet. Add a timed exercise, an open-ended one you move on from yourself, or a rest.</p>
      )}

      <Reorder.Group axis="y" values={routine.blocks} onReorder={setBlocks} as="ol">
        {routine.blocks.map((b, i) => (
          <BlockRow key={b.id} block={b} index={i} expanded={openId === b.id} onToggle={() => setOpenId(o => (o === b.id ? null : b.id))} onChange={patch => updateBlock(b.id, patch)} onMove={dir => move(i, dir)}
            onRemove={() => undoable(`Removed “${b.title || 'exercise'}”`, () => setBlocks(routine.blocks.filter(x => x.id !== b.id)))} />
        ))}
      </Reorder.Group>

      <div className="flex gap-1 pt-4">
        <Button variant="secondary" size="sm" onClick={() => addBlock('timed')}>Add exercise</Button>
        <Button variant="ghost" size="sm" onClick={() => addBlock('open')}>Add open-ended</Button>
        <Button variant="ghost" size="sm" onClick={() => addBlock('rest')}>Add rest</Button>
      </div>
    </div>
  );
};

const BlockRow: React.FC<{ block: ExerciseBlock; index: number; expanded: boolean; onToggle: () => void; onChange: (p: Partial<ExerciseBlock>) => void; onMove: (dir: -1 | 1) => void; onRemove: () => void }> = ({ block, index, expanded, onToggle, onChange, onMove, onRemove }) => {
  const drag = useDragControls();
  const open = block.duration === 0;
  const [durText, setDurText] = useState(fmt(block.duration));
  const [showPhrases, setShowPhrases] = useState((block.prompts || []).some(p => p.trim()));
  useEffect(() => { if (!open) setDurText(fmt(block.duration)); }, [block.duration, open]);

  const commitDuration = () => {
    const s = parseDuration(durText);
    if (s && s > 0 && s <= 3600) onChange({ duration: s });
    else setDurText(fmt(block.duration)); // unreadable: put the old value back
  };
  const phrases = (block.prompts || []).filter(p => p.trim()).length;

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={drag}
      // Follows the pointer 1:1 while held; only the neighbours tween out of the way
      transition={{ duration: 0.2, ease: [0.65, 0, 0.35, 1] }}
      whileDrag={{ scale: 1.01, boxShadow: 'var(--shadow-pop)' }}
      className={`relative grid grid-cols-[1.5rem_1.5rem_1fr] gap-x-2 border-b border-border bg-background rounded-lg ${expanded ? 'py-3' : 'py-1'}`}
    >
      <button
        onPointerDown={e => drag.start(e)}
        onKeyDown={e => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); onMove(e.key === 'ArrowUp' ? -1 : 1); }
        }}
        aria-label={`Move ${block.title}: drag, or use the arrow keys`}
        className="mt-1 h-7 grid place-items-center rounded-md text-text-muted hover:text-text hover:bg-text/[0.06] cursor-grab active:cursor-grabbing touch-none"
      >
        <IconGrip />
      </button>
      <span className="mt-1.5 font-mono tabular-nums text-[12px] text-text-muted text-right">{index + 1}</span>

      {!expanded ? (
        <button onClick={onToggle} aria-expanded={false} aria-label={`Edit ${block.title || 'exercise'}`}
          className="min-w-0 flex items-baseline gap-4 rounded-md -mx-2 px-2 py-1.5 text-left hover:bg-text/[0.04] transition-colors">
          <span className="shrink-0 max-w-[45%] truncate text-[14px] font-medium">{block.title || 'Untitled exercise'}</span>
          <span className="flex-1 min-w-0 truncate text-[13px] text-text-muted">{block.description.split('\n')[0]}</span>
          {phrases > 0 && <span className="shrink-0 text-[12.5px] text-text-muted">{phrases} {phrases === 1 ? 'phrase' : 'phrases'}</span>}
          <span className="shrink-0 w-16 text-right font-mono tabular-nums text-[13px] text-text-muted">{open ? 'open' : fmt(block.duration)}</span>
        </button>
      ) : (
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <input autoFocus value={block.title} onChange={e => onChange({ title: e.target.value })} aria-label={`Exercise ${index + 1} title`}
            className={`${input} text-[14px] font-medium flex-1 min-w-0`} />
          {open ? (
            <span className="text-[13px] text-text-muted whitespace-nowrap">Open-ended</span>
          ) : (
            <input value={durText} onChange={e => setDurText(e.target.value)} onBlur={commitDuration}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              aria-label={`Duration of ${block.title}, minutes and seconds`}
              className={`${input} w-16 text-right font-mono tabular-nums text-[13px]`} />
          )}
          <button onClick={() => onChange({ duration: open ? 60 : 0 })} className="relative before:absolute before:-inset-1.5 before:content-[''] text-[12.5px] text-text-muted hover:text-text whitespace-nowrap transition-colors">
            {open ? 'Add timer' : 'Remove timer'}
          </button>
        </div>
        <textarea value={block.description} onChange={e => onChange({ description: e.target.value })}
          placeholder="What to do and what to pay attention to" rows={2} aria-label={`Instructions for ${block.title}`}
          className={`${input} w-full mt-1 resize-none [field-sizing:content] min-h-[2.5rem] text-[13.5px] leading-relaxed text-text-muted focus:text-text placeholder:text-text-muted/80`} />
        <div className="mt-1 flex items-center gap-4">
          <button onClick={() => setShowPhrases(s => !s)} aria-expanded={showPhrases} className="relative before:absolute before:-inset-1.5 before:content-[''] text-[12.5px] text-text-muted hover:text-text transition-colors">
            {showPhrases ? 'Hide phrases' : phrases ? `Phrases (${phrases})` : 'Add phrases to read'}
          </button>
          <ConfirmButton align="start" confirmLabel="Remove" message={`Remove “${block.title}” from this routine?`} onConfirm={onRemove}>
            Remove
          </ConfirmButton>
          <button onClick={onToggle} aria-expanded className="ml-auto relative before:absolute before:-inset-1.5 before:content-[''] text-[12.5px] text-text hover:text-primary transition-colors">Done</button>
        </div>
        {showPhrases && (
          <textarea value={(block.prompts || []).join('\n')} onChange={e => onChange({ prompts: e.target.value.split('\n') })}
            placeholder={'One phrase per line, e.g.\nGood morning, how are you?'} rows={3} aria-label={`Phrases for ${block.title}`}
            className="mt-2 w-full resize-none [field-sizing:content] min-h-[4rem] rounded-lg border border-border-strong focus:border-primary bg-surface px-3 py-2 text-[13.5px] leading-relaxed outline-none transition-colors placeholder:text-text-muted" />
        )}
      </div>
      )}
    </Reorder.Item>
  );
};

// The routine name as the page title, renamed in place; an empty name falls back on blur
export const RoutineNameTitle: React.FC<{ routine: Routine; onRename: (name: string) => void }> = ({ routine, onRename }) => (
  <input
    value={routine.name}
    onChange={e => onRename(e.target.value)}
    onBlur={e => { if (!e.target.value.trim()) onRename('Untitled routine'); }}
    aria-label="Routine name"
    className={`${input} w-full min-w-0 font-[inherit] text-[length:inherit] tracking-[inherit] leading-[inherit]`}
  />
);
