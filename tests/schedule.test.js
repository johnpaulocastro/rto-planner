import test from 'node:test';
import assert from 'node:assert/strict';



import { validDate, monthWeeks, exportCsv, exportText } from '../lib/calendar.js';
test('Text export preserves the exact comma-separated format and legends', () => {
  const lines = exportText(2026, 9, {'2026-10-01': 'WFH'}).split('\r\n');
  assert.equal(lines[0], 'October 2026');
  assert.equal(lines[1], 'Week,Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday');
  assert.equal(lines[2], 'Week 1,---,---,---,---,WFH,UNP,UNP');
  assert.equal(exportText(2026, 9, {}), exportCsv(2026, 9, {}));
  assert.ok(lines.includes('UNP - Unplotted'));
  assert.ok(lines.includes('--- - Not part of the month'));
});
test('calendar aligns every day with its weekday across leap years and year boundaries', () => {
  for (const year of [2024, 2025, 2026, 2027]) for (let month = 0; month < 12; month++) {
    const cells = monthWeeks(year, month).flat();
    assert.equal(cells.filter(Boolean).length, new Date(year, month + 1, 0).getDate());
    cells.forEach((date, index) => { if (date) assert.equal(new Date(date + 'T12:00:00Z').getUTCDay(), index % 7); });
  }
  assert.equal(validDate('2024-02-29'), true); assert.equal(validDate('2025-02-29'), false); assert.equal(validDate('2026-13-01'), false);
});
test('CSV matches the October full-week format and exports statuses only', () => {
  const rows = exportCsv(2026, 9, {'2026-10-01':'WFH','2026-10-02':'WFH','2026-10-05':'RTO','2026-10-06':'RTO','2026-10-07':'RTO','2026-10-08':'WFH','2026-10-09':'WFH','2026-10-12':'HOLIDAY','2026-10-13':'LEAVE'}).trim().split('\r\n');
  assert.equal(rows[0], 'October 2026');
  assert.equal(rows[1], 'Week,Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday');
  assert.equal(rows[2], 'Week 1,---,---,---,---,WFH,WFH,UNP');
  assert.equal(rows[3], 'Week 2,UNP,RTO,RTO,RTO,WFH,WFH,UNP');
  assert.equal(rows[4], 'Week 3,UNP,HOLIDAY,LEAVE,UNP,UNP,UNP,UNP');
  assert.equal(rows[7], '');
  assert.ok(rows.slice(1, 7).every(row => row.split(',').length === 8));
  assert.deepEqual(rows.slice(8), ['Legends', 'RTO - Return-to-office', 'WFH - Work-from-home', 'UNP - Unplotted', '--- - Not part of the month', 'HOLIDAY - Holiday', 'LEAVE - Leave']);
});
test('CSV preserves weekend plots and pads partial weeks', () => {
  const november = exportCsv(2026, 10, {'2026-11-01':'LEAVE','2026-11-07':'RTO'}).split('\r\n\r\n')[0].split('\r\n');
  assert.equal(november[2], 'Week 1,LEAVE,UNP,UNP,UNP,UNP,UNP,RTO');
  assert.equal(november.at(-1), 'Week 5,UNP,UNP,---,---,---,---,---');
  const august = exportCsv(2026, 7, {'2026-08-01':'WFH'}).split('\r\n');
  assert.equal(august[2], 'Week 1,---,---,---,---,---,---,WFH');
  const february = exportCsv(2024, 1, {'2024-02-29':'RTO'}).split('\r\n\r\n')[0].split('\r\n');
  assert.equal(february.at(-1), 'Week 5,UNP,UNP,UNP,UNP,RTO,---,---');
});


import { loadPlots, savePlots, validatePlots, storageKey } from '../lib/storage.js';
test('loads bundled JSON, then prefers browser edits; clearing remains cleared', async () => {
  const values = new Map();
  const storage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
  let requests = 0;
  const seed = async () => { requests++; return {ok: true, json: async () => ({'2026-10-05':'RTO'})}; };
  assert.deepEqual(await loadPlots(storage, seed), {'2026-10-05':'RTO'});
  savePlots(storage, {});
  assert.deepEqual(await loadPlots(storage, seed), {});
  assert.equal(requests, 1);
  assert.throws(() => validatePlots({'2026-02-30':'RTO'}));
  assert.throws(() => validatePlots({'2026-10-05':'INVALID'}));
  assert.throws(() => validatePlots([]));
  values.set(storageKey, 'broken');
  await assert.rejects(loadPlots(storage, seed));
  assert.equal(values.get(storageKey), 'broken');
});
