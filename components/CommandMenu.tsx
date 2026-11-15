import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconSearch } from './icons';

export interface Command {
  id: string;
  group: string;
  label: string;
  detail?: string;
  keywords?: string;
  run: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Every word typed must appear somewhere in the label, detail or keywords
export const matches = (c: Pick<Command, 'label' | 'detail' | 'keywords'>, query: string) => {
  const hay = `${c.label} ${c.detail ?? ''} ${c.keywords ?? ''}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
};

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];          // always-available actions
  search: (q: string) => Command[]; // results that only make sense for a query (e.g. sessions)
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ open, onClose, commands, search }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setQuery(''); setActive(0); } }, [open]);

  const results = useMemo(() => {
    const q = query.trim();
    return q ? [...commands.filter(c => matches(c, q)), ...search(q)] : commands;
  }, [query, commands, search]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' }); }, [active]);

  const run = (c?: Command) => { if (!c) return; onClose(); c.run(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  let lastGroup = '';
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex justify-center items-start pt-[14vh] px-6 bg-black/20 no-drag"
          initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div role="dialog" aria-label="Command menu" aria-modal="true"
            className="w-full max-w-[560px] bg-surface border border-border rounded-2xl shadow-pop overflow-hidden"
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14, ease: EASE_OUT } }}>
            <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
              <IconSearch className="text-text-muted shrink-0" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKey}
                placeholder="Go to a page, start a session, find a date…"
                role="combobox" aria-expanded="true" aria-controls="command-list" aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
                className="flex-1 bg-transparent outline-none text-[14.5px] placeholder:text-text-muted" />
            </div>
            <div ref={list} id="command-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
              {results.length === 0 && <p className="px-3 py-6 text-[13.5px] text-text-muted">Nothing matches “{query}”.</p>}
              {results.map((c, i) => {
                const header = c.group !== lastGroup ? (lastGroup = c.group) : null;
                return (
                  <React.Fragment key={c.id}>
                    {header && <div className="px-3 pt-2.5 pb-1 text-[12px] text-text-muted">{header}</div>}
                    <div id={`cmd-${c.id}`} role="option" aria-selected={i === active} data-index={i}
                      onMouseMove={() => setActive(i)} onClick={() => run(c)}
                      className={`flex items-baseline justify-between gap-4 px-3 py-2 rounded-lg cursor-pointer text-[13.5px] ${i === active ? 'bg-text/[0.07]' : ''}`}>
                      <span className="truncate">{c.label}</span>
                      {c.detail && <span className="shrink-0 text-[12.5px] text-text-muted">{c.detail}</span>}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
