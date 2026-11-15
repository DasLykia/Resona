import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export type Page = 'today' | 'progress' | 'routines' | 'settings';

const NAV: { id: Page; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'progress', label: 'Progress' },
  { id: 'routines', label: 'Routines' },
];

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  disabled?: boolean;
  streak: number;
  level: number;
  levelProgress: number; // 0..100
  showLevel: boolean;
  xpMultiplier: number;
  onOpenLevel: () => void;
  updateVersion?: string;
  onUpdate: () => void;
}

const NavItem: React.FC<{ active: boolean; label: string; onClick: () => void; animateIndicator: boolean }> = ({ active, label, onClick, animateIndicator }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`relative w-full h-9 pl-4 pr-3 text-left text-[13.5px] rounded-lg transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] active:duration-75 ${
      active ? 'bg-text/[0.07] text-text font-medium' : 'text-text-muted hover:text-text hover:bg-text/[0.045]'
    }`}
  >
    {active && (
      // Same layoutId on every item: the bar slides between them and stretches ~12% while moving
      <motion.span
        layoutId="nav-indicator"
        className="absolute left-0 top-1/2 -mt-2 h-4 w-[3px] rounded-full bg-primary"
        initial={animateIndicator ? { scaleY: 1 } : false}
        animate={{ scaleY: [1, 1.12, 1] }}
        transition={{ layout: { duration: 0.25, ease: EASE_IN_OUT }, scaleY: { duration: 0.25, ease: EASE_IN_OUT } }}
      />
    )}
    {label}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  page, onNavigate, disabled, streak, level, levelProgress, showLevel, xpMultiplier, onOpenLevel, updateVersion, onUpdate,
}) => {
  // Skip the stretch on first paint; only real moves animate
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);

  const item = (id: Page, label: string) => (
    <NavItem key={id} label={label} active={page === id} onClick={() => onNavigate(id)} animateIndicator={mounted.current} />
  );

  return (
    <nav
      aria-label="Main"
      className={`w-[var(--sidebar-w)] shrink-0 flex flex-col px-2 pb-3 pt-1 transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="space-y-0.5">{NAV.map(n => item(n.id, n.label))}</div>

      <div className="flex-1" />

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

      <div className="mt-1 pt-1 border-t border-border mx-1">
        {item('settings', 'Settings')}
      </div>
    </nav>
  );
};
