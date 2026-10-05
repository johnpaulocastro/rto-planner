import { statuses, validDate } from './calendar.js';
export const storageKey = 'nygci.schedule_plot.v1';
export function validatePlots(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.entries(data).some(([date, status]) => !validDate(date) || !statuses.includes(status))) {
    throw new Error('Invalid schedule JSON. Use dates (YYYY-MM-DD) mapped to RTO, WFH, HOLIDAY, or LEAVE.');
  }
  return data;
}
export function savePlots(storage, data) {
  validatePlots(data);
  storage.setItem(storageKey, JSON.stringify(data));
  return data;
}
export async function loadPlots(storage, fetchSeed) {
  const saved = storage.getItem(storageKey);
  if (saved !== null) return validatePlots(JSON.parse(saved));
  const response = await fetchSeed();
  if (!response.ok) throw new Error('Could not load the project schedule. Please retry.');
  return validatePlots(await response.json());
}
