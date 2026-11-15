import type { Routine } from '../types';

// Saved settings from ≤1.0.5 had one `currentRoutine` and an optional free-text `simplePlanText`.
// Turn them into the routines list without losing anything the user wrote.
export const migrateRoutines = (
  loaded: { routines?: Routine[]; activeRoutineId?: string; currentRoutine?: Routine; simplePlanText?: string },
  defaults: { routine: Routine; planText: string },
  newId: () => string,
): { routines: Routine[]; activeRoutineId: string } => {
  if (loaded.routines?.length) {
    const active = loaded.routines.some(r => r.id === loaded.activeRoutineId) ? loaded.activeRoutineId! : loaded.routines[0].id;
    return { routines: loaded.routines, activeRoutineId: active };
  }
  const routines: Routine[] = [loaded.currentRoutine?.blocks ? loaded.currentRoutine : defaults.routine];
  const plan = loaded.simplePlanText?.trim();
  // A customised written plan becomes a routine with one open-ended block, so it still shows during a session
  if (plan && plan !== defaults.planText.trim()) {
    routines.push({ id: newId(), name: 'My written plan', blocks: [{ id: newId(), title: 'My plan', duration: 0, description: plan }] });
  }
  return { routines, activeRoutineId: routines[0].id };
};

// Fresh ids so copies never share blocks with their source
export const copyRoutine = (r: Pick<Routine, 'name' | 'blocks'>, name: string, newId: () => string): Routine => ({
  id: newId(),
  name,
  blocks: r.blocks.map(b => ({ ...b, id: newId(), prompts: b.prompts ? [...b.prompts] : undefined })),
});

// Length shown next to a routine name; an untimed routine has no minutes to show
export const routineLength = (r: Pick<Routine, 'blocks'>) => {
  const min = Math.round(r.blocks.reduce((a, b) => a + b.duration, 0) / 60);
  return min > 0 ? `${min} min` : r.blocks.length ? 'open-ended' : 'empty';
};

// "m:ss" or plain minutes ("3", "2.5") → seconds; null when unreadable
export const parseDuration = (text: string): number | null => {
  const t = text.trim();
  const ms = /^(\d{1,3}):([0-5]?\d)$/.exec(t);
  if (ms) return parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10);
  const m = /^\d+(\.\d+)?$/.exec(t);
  return m ? Math.round(parseFloat(t) * 60) : null;
};
