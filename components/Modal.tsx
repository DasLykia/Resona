import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconClose } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, width = 'max-w-md' }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 no-drag"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`bg-surface border border-border rounded-2xl shadow-pop w-full ${width} max-h-[85vh] flex flex-col`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: EASE_OUT } }}
          >
            <div className="flex items-center justify-between pl-5 pr-3 h-12 border-b border-border shrink-0">
              <h2 className="text-[15px] font-semibold text-text">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 grid place-items-center rounded-lg text-text-muted hover:text-text hover:bg-text/[0.06] transition-colors"
              >
                <IconClose />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
