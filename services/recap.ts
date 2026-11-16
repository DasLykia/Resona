// Monthly recaps for the Journey tab: what you did, and how your voice moved from the start to the end of the month

export interface RecapSession { startTime: number; median: number | null; brightness?: number | null }
export interface MonthRecap {
  month: string;              // "2026-10"
  minutes: number;
  sessions: number;
  daysTrained: number;
  startMedian: number | null; // median of the month's first few sessions' medians
  endMedian: number | null;   // ...and of its last few
  startBrightness: number | null; // same for the resonance estimate
  endBrightness: number | null;
}

const SAMPLE = 3; // sessions averaged at each end, so one odd session doesn't decide it
const monthOf = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const mid = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
};

// secondsByDay is stats.history ("2026-10-03" → seconds); it outlives deleted sessions, so time comes from there
export const monthRecaps = (sessions: RecapSession[], secondsByDay: Record<string, number>): MonthRecap[] => {
  const months = new Set([...sessions.map(s => monthOf(s.startTime)), ...Object.keys(secondsByDay).map(k => k.slice(0, 7))]);
  return [...months].sort().reverse().map(month => {
    const inMonth = sessions.filter(s => monthOf(s.startTime) === month).sort((a, b) => a.startTime - b.startTime);
    const days = Object.entries(secondsByDay).filter(([k, v]) => k.startsWith(month) && v > 0);
    // Start and end only mean something with at least two measured sessions
    const ends = (xs: (number | null | undefined)[]) => {
      const v = xs.filter((x): x is number => typeof x === 'number');
      const n = Math.min(SAMPLE, Math.floor(v.length / 2));
      return n ? [mid(v.slice(0, n)), mid(v.slice(-n))] : [null, null];
    };
    const [startMedian, endMedian] = ends(inMonth.map(s => s.median));
    const [startBrightness, endBrightness] = ends(inMonth.map(s => s.brightness));
    return {
      month,
      minutes: Math.round(days.reduce((a, [, v]) => a + v, 0) / 60),
      sessions: inMonth.length,
      daysTrained: days.length,
      startMedian, endMedian, startBrightness, endBrightness,
    };
  });
};
