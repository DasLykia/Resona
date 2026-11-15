import React, { useId } from 'react';
import { motion } from 'motion/react';

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-0.5 rounded-lg bg-text/[0.06]">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative h-7 px-3 text-[13px] rounded-[5px] transition-colors duration-150 ${active ? 'text-text font-medium' : 'text-text-muted hover:text-text'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[5px] bg-surface shadow-[0_1px_2px_oklch(0_0_0/0.12)] dark:bg-text/[0.12]"
                transition={{ duration: 0.22, ease: EASE_IN_OUT }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
