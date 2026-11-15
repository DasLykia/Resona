import React, { useRef, useState } from 'react';
import { Popover } from './Popover';
import { Button } from './Button';

interface ConfirmButtonProps {
  children: React.ReactNode;          // trigger label
  message: React.ReactNode;           // what will happen
  confirmLabel: string;               // e.g. "Delete 3 sessions"
  onConfirm: () => void;
  variant?: 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md';
  align?: 'start' | 'end';
  className?: string;
}

// Replaces window.confirm: the question grows out of the button that asked it
export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  children, message, confirmLabel, onConfirm, variant = 'ghost', size = 'sm', align = 'end', className = '',
}) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button ref={trigger} variant={variant} size={size} className={className} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {children}
      </Button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={trigger} align={align} label={confirmLabel}>
        <div className="w-64">
          <p className="text-[13.5px] leading-relaxed">{message}</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} autoFocus>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => { setOpen(false); onConfirm(); }}>{confirmLabel}</Button>
          </div>
        </div>
      </Popover>
    </>
  );
};
