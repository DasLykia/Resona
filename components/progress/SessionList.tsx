import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { PitchRange, TrainingSession } from '../../types';
import { computePitchStats, STRAIN_LABELS, strainFromEffort } from '../../services/pitchStats';
import { Button } from '../Button';
import { ConfirmButton } from '../ConfirmButton';
import { StoredRecording } from '../RecordingPlayer';
import { IconChevronRight } from '../icons';
import { PitchTrace } from './PitchTrace';

const PAGE = 25;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Fits the 880px minimum window; time of day only shows on wide windows
const COLS = 'grid grid-cols-[minmax(4.5rem,1fr)_minmax(6rem,1.8fr)_3.5rem_4.5rem_4rem_5.75rem_1rem] gap-3 xl:gap-4 items-baseline';

export const sessionStrain = (s: TrainingSession) =>
  s.healthLog ? (s.healthLog.strain ?? strainFromEffort(s.healthLog.effort)) : null;

interface SessionListProps {
  sessions: TrainingSession[];                 // newest first
  range: PitchRange;
  title: (s: TrainingSession) => string;
  highlight: { id: string; at: number } | null;
  syncDelete: boolean;
  onUpdateNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onRemoveRecording: (recordingId: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ sessions, range, title, highlight, syncDelete, onUpdateNote, onDelete, onBulkDelete, onRemoveRecording }) => {
  const [query, setQuery] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null); // brief tint on the row you jumped to
  const [openId, setOpenId] = useState<string | null>(null);
  const wide = useWide();
  // A detail pane is never empty when there's something to show: start on the newest session
  useEffect(() => { if (wide && !openId && sessions[0]) setOpenId(sessions[0].id); }, [wide, openId, sessions]);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => sessions.map(s => ({
    s,
    date: new Date(s.startTime),
    stats: computePitchStats(s.pitchData, s.targetRange ?? range),
    strain: sessionStrain(s),
  })), [sessions, range]);

  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter(r =>
    r.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase().includes(q) ||
    title(r.s).toLowerCase().includes(q) ||
    (r.s.notes || '').toLowerCase().includes(q)) : rows;

  // Arriving from the trend chart or calendar: open that session and bring it into view
  useEffect(() => {
    if (!highlight) return;
    const idx = sessions.findIndex(s => s.id === highlight.id);
    if (idx < 0) return;
    setQuery('');
    setLimit(l => Math.max(l, idx + 1));
    setOpenId(highlight.id);
    setFlashId(highlight.id);
    const scroll = window.setTimeout(() => document.getElementById(`session-${highlight.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    const fade = window.setTimeout(() => setFlashId(null), 1600);
    return () => { clearTimeout(scroll); clearTimeout(fade); };
  }, [highlight?.at]);

  const toggleSel = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const stopSelecting = () => { setSelecting(false); setSelected(new Set()); };

  if (sessions.length === 0) {
    return <p className="text-[13.5px] text-text-muted">Your sessions will be listed here, newest first, each with its recording, pitch and notes.</p>;
  }

  const openSession = wide ? sessions.find(s => s.id === openId) : undefined;

  return (
    // Wide windows: list + detail pane (like Mail). Narrow: the row expands in place.
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_34rem] gap-x-12 items-start">
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-4 mb-3">
        <input
          type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by date, routine or note"
          aria-label="Search sessions"
          className="h-8 w-72 max-w-full rounded-lg border border-border-strong bg-surface px-3 text-[13px] outline-none focus:border-primary transition-colors placeholder:text-text-muted"
        />
        <div className="flex items-center gap-2">
          {selecting ? (
            <>
              <span className="text-[13px] text-text-muted mr-1"><span className="font-mono tabular-nums">{selected.size}</span> selected</span>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(filtered.map(r => r.s.id)))}>Select all</Button>
              {selected.size > 0 && (
                <ConfirmButton variant="danger" confirmLabel={`Delete ${selected.size}`}
                  message={<>Delete <span className="font-mono tabular-nums">{selected.size}</span> session{selected.size === 1 ? '' : 's'}?{syncDelete ? ' Their recordings are deleted too.' : ''} This can’t be undone.</>}
                  onConfirm={() => { onBulkDelete([...selected]); stopSelecting(); }}>
                  Delete
                </ConfirmButton>
              )}
              <Button variant="ghost" size="sm" onClick={stopSelecting}>Done</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setSelecting(true)}>Select</Button>
          )}
        </div>
      </div>

      <div className={`${COLS} py-2 border-b border-border-strong text-[12px] text-text-muted ${selecting ? 'pl-8' : ''}`}>
        <span>Date</span><span>Session</span><span className="text-right">Length</span><span className="text-right whitespace-nowrap">Median Hz</span><span className="text-right whitespace-nowrap">In range</span><span>Strain</span><span />
      </div>

      {filtered.length === 0 && <p className="py-6 text-[13.5px] text-text-muted">No sessions match “{query}”.</p>}

      <motion.ul initial="hidden" animate="shown" variants={{ shown: { transition: { staggerChildren: 0.03 } } }}>
        {filtered.slice(0, limit).map(({ s, date, stats, strain }) => {
          const open = openId === s.id;
          return (
            <motion.li key={s.id} id={`session-${s.id}`} layout="position"
              variants={{ hidden: { opacity: 0, y: 4 }, shown: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } } }}
              transition={{ layout: { duration: 0.22, ease: [0.65, 0, 0.35, 1] } }}
              className={`border-b border-border transition-colors duration-700 ${flashId === s.id ? 'bg-primary/[0.06]' : wide && open ? 'bg-text/[0.05]' : ''}`}>
              <div className="flex items-center">
                {selecting && (
                  <input type="checkbox" className="ml-1 mr-3 shrink-0" checked={selected.has(s.id)} onChange={() => toggleSel(s.id)}
                    aria-label={`Select session on ${date.toLocaleDateString()}`} />
                )}
                <button onClick={() => (selecting ? toggleSel(s.id) : setOpenId(open && !wide ? null : s.id))}
                  aria-expanded={wide ? undefined : open} aria-current={wide && open ? 'true' : undefined}
                  className={`${COLS} flex-1 py-3 text-left text-[13.5px] hover:bg-text/[0.03] transition-colors rounded-lg`}>
                  <span className="font-mono tabular-nums text-[12.5px] whitespace-nowrap">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<span className="hidden xl:inline text-text-muted"> · {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></span>
                  <span className="truncate">{title(s)}{s.notes && <span className="text-text-muted"> · {s.notes}</span>}</span>
                  <span className="font-mono tabular-nums text-[12.5px] text-right">{Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, '0')}</span>
                  <span className="font-mono tabular-nums text-[12.5px] text-right">{stats.median ?? '–'}</span>
                  <span className="font-mono tabular-nums text-[12.5px] text-right">{stats.median === null ? '–' : `${stats.inRangePct}%`}</span>
                  <span className={`text-[13px] ${strain !== null && strain >= 4 ? 'text-danger' : 'text-text-muted'}`}>{strain ? STRAIN_LABELS[strain - 1] : '–'}</span>
                  <IconChevronRight className={`text-text-muted transition-transform duration-200 ${open && !wide ? 'rotate-90' : ''}`} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {open && !selecting && !wide && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1, transition: { duration: 0.24, ease: EASE_OUT } }}
                    exit={{ height: 0, opacity: 0, transition: { duration: 0.19, ease: EASE_OUT } }}
                    className="overflow-hidden"
                  >
                    <SessionDetail session={s} range={s.targetRange ?? range} syncDelete={syncDelete}
                      onUpdateNote={onUpdateNote} onDelete={onDelete} onRemoveRecording={onRemoveRecording} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </motion.ul>

      {filtered.length > limit && (
        <div className="pt-4">
          <Button variant="ghost" onClick={() => setLimit(l => l + PAGE)}>
            Show <span className="font-mono tabular-nums">{Math.min(PAGE, filtered.length - limit)}</span> more
          </Button>
        </div>
      )}
    </div>

    {wide && (
      <aside className="sticky top-0 pt-11 min-w-0" aria-label="Session details">
        <AnimatePresence mode="wait" initial={false}>
          {openSession ? (
            <motion.div key={openSession.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title(openSession)}</h2>
              <p className="mt-0.5 mb-4 text-[13px] text-text-muted">
                {new Date(openSession.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at{' '}
                {new Date(openSession.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
              <SessionDetail session={openSession} range={openSession.targetRange ?? range} syncDelete={syncDelete}
                onUpdateNote={onUpdateNote} onDelete={onDelete} onRemoveRecording={onRemoveRecording} />
            </motion.div>
          ) : (
            <motion.p key="empty" className="text-[13.5px] text-text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Select a session to see its pitch, play its recording and edit its note.
            </motion.p>
          )}
        </AnimatePresence>
      </aside>
    )}
    </div>
  );
};

// Tailwind's 2xl breakpoint as a live flag, so layout and behaviour switch together
const useWide = () => {
  const q = '(min-width: 1536px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
};

const SessionDetail: React.FC<{
  session: TrainingSession; range: PitchRange; syncDelete: boolean;
  onUpdateNote: (id: string, note: string) => void; onDelete: (id: string) => void; onRemoveRecording: (recordingId: string) => void;
}> = ({ session, range, syncDelete, onUpdateNote, onDelete, onRemoveRecording }) => {
  const [note, setNote] = useState(session.notes ?? '');
  const [playhead, setPlayhead] = useState<number | null>(null);
  const dirty = note !== (session.notes ?? '');

  return (
    <div className="pt-2 pb-6 pl-1 pr-1 space-y-5">
      <PitchTrace traces={[{ data: session.pitchData ?? [], tone: 'accent' }]} range={range}
        durationMs={session.duration * 1000} playheadMs={playhead} height={150} />
      {session.recordingId && (
        <StoredRecording id={session.recordingId} fallbackLength={session.duration} onTime={t => setPlayhead(t * 1000)} />
      )}
      <div>
        <label htmlFor={`note-${session.id}`} className="block text-[13px] text-text-muted mb-1.5">Note</label>
        <textarea id={`note-${session.id}`} value={note} onChange={e => setNote(e.target.value)}
          placeholder="Anything worth remembering about this session?"
          className="w-full min-h-[4rem] resize-y rounded-lg border border-border-strong focus:border-primary bg-surface px-3 py-2 text-[13.5px] leading-relaxed outline-none transition-colors placeholder:text-text-muted" />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            <ConfirmButton align="start" confirmLabel="Delete session"
              message={<>Delete this session?{syncDelete && session.recordingId ? ' Its recording is deleted too.' : ''} This can’t be undone.</>}
              onConfirm={() => onDelete(session.id)}>
              Delete session
            </ConfirmButton>
            {session.recordingId && !syncDelete && (
              <ConfirmButton align="start" confirmLabel="Remove recording"
                message="Remove the audio but keep this session’s log and pitch data? This can’t be undone."
                onConfirm={() => onRemoveRecording(session.recordingId!)}>
                Remove recording
              </ConfirmButton>
            )}
          </div>
          {dirty && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNote(session.notes ?? '')}>Cancel</Button>
              <Button size="sm" onClick={() => onUpdateNote(session.id, note)}>Save note</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
