import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconMark } from '../icons';

interface TitleBarProps {
  status?: string;
}

// Draggable custom title bar. Windows draws min/max/close on the right (titleBarOverlay), so that strip stays clear.
export const TitleBar: React.FC<TitleBarProps> = ({ status }) => (
  <header className="drag h-[var(--titlebar-h)] shrink-0 flex items-center gap-2.5 pl-4 pr-[148px] select-none">
    <IconMark size={15} className="text-primary" strokeWidth={1.75} />
    <span className="text-[12px] font-medium text-text">Resona</span>
    <AnimatePresence mode="wait" initial={false}>
      {status && (
        <motion.span
          key={status}
          className="text-[12px] text-text-muted truncate"
          initial={{ opacity: 0, filter: 'blur(3px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.2 } }}
          exit={{ opacity: 0, filter: 'blur(3px)', transition: { duration: 0.16 } }}
        >
          {status}
        </motion.span>
      )}
    </AnimatePresence>
  </header>
);
