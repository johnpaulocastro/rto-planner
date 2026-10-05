export const statuses = ['RTO', 'WFH', 'HOLIDAY', 'LEAVE'];
export const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
export function monthWeeks(year, month) {
  const start = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({length: Math.ceil((start + total) / 7) * 7}, (_, i) => {
    const day = i - start + 1;
    return day > 0 && day <= total ? dateKey(year, month, day) : null;
  });
  return Array.from({length: cells.length / 7}, (_, i) => cells.slice(i * 7, i * 7 + 7));
}
export function scheduleRows(year, month, plots) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', {month: 'long'});
  // Omit calendar rows containing only weekend dates from this month.
  const workweeks = monthWeeks(year, month).map(week => week.slice(1, 6)).filter(week => week.some(Boolean));
  return [[`${monthName} ${year}`], ['Week', ...weekdays.slice(1, 6)],
    ...workweeks.map((week, index) => [`Week ${index + 1}`, ...week.map(date => date ? (plots[date] || 'UNP') : '---')]),
    [], ['Legends'], ['RTO - Return-to-office'], ['WFH - Work-from-home'],
    ['UNP - Unplotted'], ['--- - Not part of the month'], ['HOLIDAY - Holiday'], ['LEAVE - Leave']];
}
export function exportCsv(year, month, plots) {
  return scheduleRows(year, month, plots).map(row => row.join(',')).join('\r\n') + '\r\n';
}
export function exportText(year, month, plots) {
  return exportCsv(year, month, plots);
}
