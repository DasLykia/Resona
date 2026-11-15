// Run: node --experimental-strip-types services/routines.selftest.ts
import assert from 'node:assert/strict';
import { copyRoutine, migrateRoutines, parseDuration } from './routines.ts';

let n = 0;
const id = () => `id${++n}`;
const def = { id: 'default', name: 'Default', blocks: [{ id: 'b1', title: 'A', duration: 60, description: '' }] };
const defaults = { routine: def, planText: 'DEFAULT PLAN' };
const mine = { id: 'mine', name: 'Mine', blocks: [{ id: 'x', title: 'X', duration: 30, description: 'd' }] };

// Fresh install / no legacy data → default routine
assert.deepEqual(migrateRoutines({}, defaults, id), { routines: [def], activeRoutineId: 'default' });

// Legacy custom routine is kept and active; untouched default plan text is dropped
let m = migrateRoutines({ currentRoutine: mine, simplePlanText: '  DEFAULT PLAN \n' }, defaults, id);
assert.deepEqual(m.routines, [mine]);
assert.equal(m.activeRoutineId, 'mine');

// A customised written plan survives as an open-ended block
m = migrateRoutines({ currentRoutine: mine, simplePlanText: 'My own warm-up' }, defaults, id);
assert.equal(m.routines.length, 2);
assert.equal(m.routines[1].blocks[0].description, 'My own warm-up');
assert.equal(m.routines[1].blocks[0].duration, 0);

// Already migrated: keep list; repair a dangling active id
assert.deepEqual(migrateRoutines({ routines: [mine], activeRoutineId: 'mine' }, defaults, id), { routines: [mine], activeRoutineId: 'mine' });
assert.equal(migrateRoutines({ routines: [mine], activeRoutineId: 'gone' }, defaults, id).activeRoutineId, 'mine');

// Copies get new ids everywhere and don't share prompt arrays
const src = { name: 'S', blocks: [{ id: 'b', title: 'T', duration: 10, description: '', prompts: ['p'] }] };
const c = copyRoutine(src, 'S copy', id);
assert.notEqual(c.blocks[0].id, 'b');
c.blocks[0].prompts!.push('q');
assert.deepEqual(src.blocks[0].prompts, ['p']);

assert.equal(parseDuration('3:05'), 185);
assert.equal(parseDuration('3'), 180);
assert.equal(parseDuration('2.5'), 150);
assert.equal(parseDuration('0:45'), 45);
assert.equal(parseDuration('3:75'), null);
assert.equal(parseDuration('abc'), null);
console.log('routines ok');
