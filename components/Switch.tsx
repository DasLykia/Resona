import React from 'react';
import { motion } from 'motion/react';

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tone?: 'primary' | 'danger';
  ref?: React.Ref<HTMLButtonElement>;
}

// Windows-style toggle; the knob stretches ~12% while it travels (ease-in-out move)
export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, tone = 'primary', ref }) => (
  <button
    ref={ref}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-5 shrink-0 rounded-full border before:absolute before:-inset-2 before:content-[''] transition-colors duration-200 active:scale-[0.97]
      ${checked ? (tone === 'danger' ? 'bg-danger border-danger' : 'bg-primary border-primary') : 'bg-transparent border-text/45 hover:bg-text/[0.05]'}`}
  >
    <motion.span
      className={`absolute top-1/2 -mt-[6px] left-[3px] h-3 w-3 rounded-full ${checked ? 'bg-on-primary' : 'bg-text/70'}`}
      initial={false}
      animate={{ x: checked ? 20 : 0, scaleX: [1, 1.12, 1] }}
      transition={{ x: { duration: 0.2, ease: EASE_IN_OUT }, scaleX: { duration: 0.2, ease: EASE_IN_OUT } }}
    />
  </button>
);
