import React from 'react';
import { motion } from 'motion/react';
import type { UserStats } from '../types';
import { LEVEL_REWARDS, THEMES, XP_LEVEL_BASE, XP_PER_MINUTE, XP_PER_SESSION } from '../constants';
import { Modal } from './Modal';

interface LevelProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}

// Level, XP to the next one, and what levels unlock. Quiet by design: no confetti, no badges.
export const LevelProgressModal: React.FC<LevelProgressModalProps> = ({ isOpen, onClose, stats }) => {
  const need = stats.level * XP_LEVEL_BASE;
  const pct = Math.min(100, (stats.xp / need) * 100);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Level ${stats.level}`} width="max-w-md">
      <div className="text-[13.5px]">
        <div className="h-[3px] rounded-full bg-text/10 overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} />
        </div>
        <p className="mt-2 text-text-muted">
          <span className="whitespace-nowrap"><span className="font-mono tabular-nums text-text">{Math.floor(stats.xp).toLocaleString('en-US')}</span> of <span className="font-mono tabular-nums">{need.toLocaleString('en-US')}</span> XP</span> to level{' '}
          <span className="font-mono tabular-nums">{stats.level + 1}</span>.
        </p>
        <p className="mt-4 leading-relaxed text-text-muted">
          Each saved session earns <span className="font-mono tabular-nums text-text">{XP_PER_SESSION}</span> XP plus <span className="font-mono tabular-nums text-text">10</span> per level you’ve reached, and{' '}
          <span className="font-mono tabular-nums text-text">{XP_PER_MINUTE}</span> XP per minute trained. Some days give double or more.
        </p>

        <h3 className="mt-6 mb-1 text-[13.5px] font-semibold">Rewards</h3>
        <ul>
          {LEVEL_REWARDS.map(r => {
            const got = stats.level >= r.level;
            const color = r.value ? THEMES[r.value as keyof typeof THEMES]?.primary : undefined;
            return (
              <li key={r.level} className="flex items-center gap-3 py-2.5 border-b border-border">
                <span className="w-16 shrink-0 font-mono tabular-nums text-[12.5px] text-text-muted">Level {r.level}</span>
                {color && <span aria-hidden="true" className="w-3 h-3 rounded-full shrink-0 border-2" style={{ borderColor: `oklch(from ${color} 0.6 min(c, 0.16) h)`, backgroundColor: got ? `oklch(from ${color} 0.6 min(c, 0.16) h)` : 'transparent' }} />}
                <span className={`flex-1 ${got ? 'text-text' : 'text-text-muted'}`}>{r.type === 'theme' ? `${r.label.replace(' Theme', '')} accent color` : 'Custom accent colors'}</span>
                <span className={`text-[12.5px] ${got ? 'text-primary' : 'text-text-muted'}`}>{got ? 'Unlocked' : 'Locked'}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
};
