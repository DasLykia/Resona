import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconSearch } from '../icons';

export type Section = 'today' | 'progress' | 'routines' | 'settings';
export interface Route { section: Section; sub: string }

export const PROGRESS_PAGES = [
  { id: 'overview', label: 'Overview' },
  { id: 'compare', label: 'Then and now' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'goals', label: 'Goals and achievements' },
] as const;

export const SETTINGS_PAGES = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'training', label: 'Training' },
  { id: 'microphone', label: 'Microphone' },
  { id: 'data', label: 'Progress and data' },
  { id: 'updates', label: 'Updates' },
] as const;

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface SidebarProps {
  route: Route;
  onNavigate: (route: Route) => void;
  routines: { id: string; name: string }[];
  activeRoutineId: string;
  newRoutine: React.ReactNode; // the "New routine" trigger (owns its popover)
  disabled?: boolean;
  streak: number;
  level: number;
  levelProgress: number; // 0..100
  showLevel: boolean;
  xpMultiplier: number;
  onOpenLevel: () => void;
  updateVersion?: string;
  onUpdate: () => void;
  onOpenCommands: () => void;
}

const Indicator: React.FC<{ animate: boolean }> = ({ animate }) => (
  // One layoutId for every item: the bar slides between them and stretches ~12% while moving
  <motion.span
    layoutId="nav-indicator"
    className="absolute left-0 top-1/2 -mt-2 h-4 w-[3px] rounded-full bg-primary"
    initial={animate ? { scaleY: 1 } : false}
    animate={{ scaleY: [1, 1.12, 1] }}
    transition={{ layout: { duration: 0.25, ease: EASE_IN_OUT }, scaleY: { duration: 0.25, ease: EASE_IN_OUT } }}
  />
);

const Item: React.FC<{ label: React.ReactNode; selected: boolean; open?: boolean; sub?: boolean; onClick: () => void; animate: boolean; title?: string }> = ({ label, selected, open, sub, onClick, animate, title }) => (
  <button
    onClick={onClick}
    title={title}
    aria-current={selected ? 'page' : undefined}
    aria-expanded={open}
    className={`relative w-full flex items-center text-left rounded-lg transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] active:duration-75
      ${sub ? 'h-8 pl-7 pr-3 text-[13px]' : 'h-9 pl-4 pr-3 text-[13.5px]'}
      ${selected ? 'bg-text/[0.07] text-text font-medium' : open ? 'text-text font-medium hover:bg-text/[0.045]' : 'text-text-muted hover:text-text hover:bg-text/[0.045]'}`}
  >
    {selected && <Indicator animate={animate} />}
    {label}
  </button>
);

// Children of the open section; height animates so the list below moves instead of jumping
const Children: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        className="overflow-hidden"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.22, ease: EASE_IN_OUT }, opacity: { duration: 0.18, ease: EASE_OUT } } }}
        exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.18, ease: EASE_IN_OUT }, opacity: { duration: 0.12 } } }}
      >
        <div className="py-0.5 space-y-0.5">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Sidebar: React.FC<SidebarProps> = ({
  route, onNavigate, routines, activeRoutineId, newRoutine, disabled, streak, level, levelProgress, showLevel, xpMultiplier,
  onOpenLevel, updateVersion, onUpdate, onOpenCommands,
}) => {
  // Skip the stretch on first paint; only real moves animate
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  const a = mounted.current;
  const is = (section: Section, sub = '') => route.section === section && route.sub === sub;
  const go = (section: Section, sub = '') => onNavigate({ section, sub });

  return (
    <nav
      aria-label="Main"
      className={`w-[var(--sidebar-w)] shrink-0 flex flex-col px-2 pb-3 pt-1 overflow-y-auto transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {/* The way into the Ctrl+K menu; the shortcut sits beside it so it can be learned */}
      <button onClick={onOpenCommands}
        className="relative mb-2 w-full h-8 pl-3 pr-2 flex items-center gap-2 rounded-lg text-[13px] text-text-muted border border-border hover:text-text hover:bg-text/[0.045] transition-colors active:scale-[0.97]">
        <IconSearch size={14} />
        <span className="flex-1 text-left">Search</span>
        <kbd className="font-sans text-[12px] text-text-muted">Ctrl K</kbd>
      </button>

      <div className="space-y-0.5">
        <Item label="Today" selected={is('today')} onClick={() => go('today')} animate={a} />

        <Item label="Progress" selected={false} open={route.section === 'progress'} onClick={() => go('progress', 'overview')} animate={a} />
        <Children open={route.section === 'progress'}>
          {PROGRESS_PAGES.map(p => <Item key={p.id} sub label={p.label} selected={is('progress', p.id)} onClick={() => go('progress', p.id)} animate={a} />)}
        </Children>

        <Item label="Routines" selected={false} open={route.section === 'routines'} onClick={() => go('routines', activeRoutineId)} animate={a} />
        <Children open={route.section === 'routines'}>
          {routines.map(r => (
            <Item key={r.id} sub selected={is('routines', r.id)} onClick={() => go('routines', r.id)} animate={a}
              title={r.id === activeRoutineId ? `${r.name} (used on Today)` : r.name}
              label={<>
                <span className="truncate">{r.name || 'Untitled routine'}</span>
                {r.id === activeRoutineId && <span aria-label="used on Today" className="ml-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              </>} />
          ))}
          {newRoutine}
        </Children>
      </div>

      <div className="flex-1 min-h-6" />

      {updateVersion && (
        <button
          onClick={onUpdate}
          className="mx-1 mb-3 px-3 py-2 rounded-lg text-left text-[12.5px] leading-snug hover:bg-text/[0.045] transition-colors"
        >
          <span className="block text-text font-medium">Update {updateVersion} ready</span>
          <span className="block text-text-muted">Install and restart</span>
        </button>
      )}

      <button
        onClick={onOpenLevel}
        disabled={!showLevel}
        className="mx-1 px-3 py-2.5 rounded-lg text-left hover:bg-text/[0.045] disabled:hover:bg-transparent transition-colors"
      >
        <span className="flex items-baseline gap-1.5 text-[13px] text-text">
          <span className="font-mono tabular-nums font-medium">{streak}</span>
          <span className="text-text-muted">day streak</span>
        </span>
        {showLevel && (
          <>
            <span className="mt-2 flex items-center gap-2.5 text-[12px] text-text-muted">
              <span className="shrink-0">Level <span className="font-mono tabular-nums text-text">{level}</span></span>
              <span className="relative h-[3px] flex-1 rounded-full bg-text/10 overflow-hidden">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${levelProgress}%` }}
                />
              </span>
            </span>
            {xpMultiplier > 1 && (
              <span className="mt-1.5 block text-[12px] text-primary">{xpMultiplier}× XP today</span>
            )}
          </>
        )}
      </button>

      <div className="mt-1 pt-1 border-t border-border mx-1 space-y-0.5">
        <Item label="Settings" selected={false} open={route.section === 'settings'} onClick={() => go('settings', 'appearance')} animate={a} />
        <Children open={route.section === 'settings'}>
          {SETTINGS_PAGES.map(p => <Item key={p.id} sub label={p.label} selected={is('settings', p.id)} onClick={() => go('settings', p.id)} animate={a} />)}
        </Children>
      </div>
    </nav>
  );
};
