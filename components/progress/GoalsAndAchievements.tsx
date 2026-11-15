import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Goal, UserStats } from '../../types';
import { ACHIEVEMENTS_LIST } from '../../constants';
import { Button } from '../Button';
import { ConfirmButton } from '../ConfirmButton';
import { Popover } from '../Popover';

const UNIT: Record<Goal['type'], string> = { sessions: 'sessions', duration: 'minutes', streak: 'day streak' };
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Baseline for a new goal: progress counts from what the stat is today
const statFor = (type: Goal['type'], stats: UserStats) =>
  type === 'sessions' ? stats.totalSessions : type === 'duration' ? Math.floor(stats.totalTrainingTime / 60) : stats.currentStreak;

interface GoalsProps {
  goals: Goal[];
  stats: UserStats;
  onAdd: (g: Goal) => void;
  onRemove: (id: string) => void;
  onClaim: (id: string) => void;
  onRemoveHistory: (id: string) => void;
}

export const Goals: React.FC<GoalsProps> = ({ goals, stats, onAdd, onRemove, onClaim, onRemoveHistory }) => {
  const history = stats.goalHistory || [];
  const [showHistory, setShowHistory] = useState(false);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[15px] font-semibold">Goals</h3>
        <AddGoal stats={stats} onAdd={onAdd} />
      </div>
      {goals.length === 0 && <p className="text-[13.5px] text-text-muted py-2">No goals yet. Something small works well, like 10 more sessions.</p>}
      <ul>
        {goals.map(g => {
          const done = Math.max(0, g.current - g.startValue);
          const pct = Math.min(100, (done / g.target) * 100);
          return (
            <li key={g.id} className="py-3 border-b border-border">
              <div className="flex items-center gap-4 text-[13.5px]">
                <span className="truncate flex-1">{g.label}</span>
                {g.isCompleted && <Button size="sm" onClick={() => onClaim(g.id)}>Complete goal</Button>}
                <ConfirmButton confirmLabel="Remove goal" message={`Remove “${g.label}”? Progress on it is lost.`} onConfirm={() => onRemove(g.id)}>Remove</ConfirmButton>
                <span className="shrink-0 text-[12.5px] text-text-muted w-28 text-right">
                  <span className="font-mono tabular-nums text-text">{Math.min(done, g.target)}</span>/<span className="font-mono tabular-nums">{g.target}</span> {UNIT[g.type]}
                </span>
              </div>
              <div className="mt-2 h-[3px] rounded-full bg-text/10 overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.25, ease: EASE_OUT }} />
              </div>
            </li>
          );
        })}
      </ul>
      {history.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowHistory(h => !h)} aria-expanded={showHistory} className="text-[13px] text-text-muted hover:text-text transition-colors">
            {showHistory ? 'Hide' : 'Show'} completed goals (<span className="font-mono tabular-nums">{history.length}</span>)
          </button>
          <AnimatePresence initial={false}>
            {showHistory && (
              <motion.ul className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}>
                {history.map(g => (
                  <li key={g.id} className="flex items-center justify-between gap-4 py-2 border-b border-border text-[13px]">
                    <span className="truncate">{g.label}</span>
                    <span className="flex items-center gap-3 shrink-0 text-text-muted">
                      {g.completedAt && <span className="font-mono tabular-nums text-[12.5px]">{new Date(g.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      <ConfirmButton confirmLabel="Remove" message="Remove this goal from your history?" onConfirm={() => onRemoveHistory(g.id)}>Remove</ConfirmButton>
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const AddGoal: React.FC<{ stats: UserStats; onAdd: (g: Goal) => void }> = ({ stats, onAdd }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<Goal['type']>('sessions');
  const [target, setTarget] = useState('10');
  const t = parseInt(target, 10);
  const valid = label.trim().length > 0 && Number.isFinite(t) && t > 0;

  const add = () => {
    if (!valid) return;
    const start = statFor(type, stats);
    onAdd({ id: crypto.randomUUID(), label: label.trim(), type, target: t, current: start, startValue: start, isCompleted: false });
    setLabel(''); setTarget('10'); setOpen(false);
  };

  const input = 'h-8 w-full rounded-lg border border-border-strong bg-background px-2.5 text-[13px] outline-none focus:border-primary transition-colors';
  return (
    <>
      <Button ref={trigger} variant="ghost" size="sm" onClick={() => setOpen(o => !o)} aria-expanded={open}>Add goal</Button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} label="Add goal">
        <div className="w-72 space-y-3">
          <label className="block">
            <span className="block text-[12px] text-text-muted mb-1">Goal</span>
            <input autoFocus value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="e.g. 10 more sessions" className={input} />
          </label>
          <div className="flex gap-3">
            <label className="w-24">
              <span className="block text-[12px] text-text-muted mb-1">Target</span>
              <input type="number" min={1} value={target} onChange={e => setTarget(e.target.value)} className={`${input} font-mono tabular-nums`} />
            </label>
            <label className="flex-1">
              <span className="block text-[12px] text-text-muted mb-1">Counting</span>
              <select value={type} onChange={e => setType(e.target.value as Goal['type'])} className={input}>
                <option value="sessions">Sessions</option>
                <option value="duration">Minutes trained</option>
                <option value="streak">Days of streak</option>
              </select>
            </label>
          </div>
          <p className="text-[12px] text-text-muted">Counts from today, not from your past training.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={add} disabled={!valid}>Add goal</Button>
          </div>
        </div>
      </Popover>
    </>
  );
};

export const Achievements: React.FC<{ unlockedIds: string[] }> = ({ unlockedIds }) => (
  <div>
    <div className="flex items-baseline justify-between mb-3">
      <h3 className="text-[15px] font-semibold">Achievements</h3>
      <span className="text-[12.5px] text-text-muted"><span className="font-mono tabular-nums text-text">{unlockedIds.length}</span> of <span className="font-mono tabular-nums">{ACHIEVEMENTS_LIST.length}</span></span>
    </div>
    <ul>
      {ACHIEVEMENTS_LIST.map(a => {
        const got = unlockedIds.includes(a.id);
        return (
          <li key={a.id} className="py-3 border-b border-border flex items-baseline justify-between gap-4">
            <span className="min-w-0">
              <span className={`block text-[13.5px] ${got ? 'text-text font-medium' : 'text-text-muted'}`}>{a.title}</span>
              <span className="block text-[12.5px] text-text-muted">{a.description}</span>
            </span>
            <span className={`shrink-0 text-[12.5px] ${got ? 'text-primary' : 'text-text-muted'}`}>{got ? 'Unlocked' : 'Locked'}</span>
          </li>
        );
      })}
    </ul>
  </div>
);
