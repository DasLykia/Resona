import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// One quiet sentence under a page title the first time a page is opened; "Got it" folds it away for good
export const PageHint: React.FC<{ show: boolean; onDismiss: () => void; children: React.ReactNode }> = ({ show, onDismiss, children }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        className="overflow-hidden -mt-3"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
        exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
      >
        <p className="mb-7 max-w-[72ch] text-[13.5px] leading-relaxed text-text-muted">
          {children}{' '}
          <button onClick={onDismiss} className="relative before:absolute before:-inset-1.5 before:content-[''] ml-1 text-text underline decoration-border-strong underline-offset-[3px] hover:decoration-text transition-colors">
            Got it
          </button>
        </p>
      </motion.div>
    )}
  </AnimatePresence>
);
