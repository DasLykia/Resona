import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchor: React.RefObject<HTMLElement | null>;
  align?: 'start' | 'end';
  label: string;
  children: React.ReactNode;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Portalled (escapes overflow), anchored under its trigger, grows from and shrinks back into the trigger
export const Popover: React.FC<PopoverProps> = ({ open, onClose, anchor, align = 'end', label, children }) => {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });

  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const r = anchor.current.getBoundingClientRect();
    setPos(align === 'end'
      ? { top: r.bottom + 6, right: window.innerWidth - r.right }
      : { top: r.bottom + 6, left: r.left });
  }, [open, anchor, align]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown); };
  }, [open, onClose, anchor]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          role="dialog"
          aria-label={label}
          className="fixed z-[60] no-drag bg-surface border border-border rounded-2xl shadow-pop p-4"
          style={{ ...pos, transformOrigin: align === 'end' ? 'top right' : 'top left' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, ease: EASE_OUT } }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.145, ease: EASE_OUT } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
