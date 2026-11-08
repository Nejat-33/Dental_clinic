const CLINIC_TZ = 'Africa/Addis_Ababa';

export type CalendarMode = 'day' | 'week' | 'month';

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function clinicDateKey(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function addDays(key: string, days: number) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function mondayIndex(key: string) {
  return (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function weekStart(key: string) {
  return addDays(key, -mondayIndex(key));
}

export function monthStart(key: string) {
  return `${key.slice(0, 8)}01`;
}

export function monthGrid(key: string) {
  const start = weekStart(monthStart(key));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function dayOfMonth(key: string) {
  return new Date(`${key}T00:00:00Z`).getUTCDate();
}

export function calendarRange(mode: CalendarMode, anchor: string) {
  if (mode === 'day') return { from: anchor, to: anchor };
  if (mode === 'week') {
    const start = weekStart(anchor);
    return { from: start, to: addDays(start, 6) };
  }
  const grid = monthGrid(anchor);
  return { from: grid[0], to: grid[41] };
}

export function shiftAnchor(mode: CalendarMode, anchor: string, direction: 1 | -1) {
  if (mode === 'day') return addDays(anchor, direction);
  if (mode === 'week') return addDays(anchor, 7 * direction);
  const d = new Date(`${monthStart(anchor)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + direction);
  return d.toISOString().slice(0, 10);
}

const longDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function calendarLabel(mode: CalendarMode, anchor: string) {
  const at = (key: string) => new Date(`${key}T00:00:00Z`);
  if (mode === 'day') return longDate.format(at(anchor));
  if (mode === 'month') return monthYear.format(at(anchor));
  const start = weekStart(anchor);
  return `${shortDate.format(at(start))} - ${shortDate.format(at(addDays(start, 6)))}`;
}
