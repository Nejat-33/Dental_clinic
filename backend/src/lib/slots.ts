// src/lib/slots.ts
import { CLINIC } from './clinic.js';

const OFFSET_MS = CLINIC.utcOffsetHours * 60 * 60 * 1000;
const parseDate = (s: string) => s.split('-').map(Number) as [number, number, number];

/** UTC range covering one clinic-local calendar day */
export function clinicDayRange(dateStr: string) {
  const [y, m, d] = parseDate(dateStr);
  const start = Date.UTC(y, m - 1, d) - OFFSET_MS;
  return { gte: new Date(start), lt: new Date(start + 24 * 60 * 60 * 1000) };
}

/** Is this instant a valid, bookable slot start in clinic-local time? */
export function isValidSlot(date: Date): boolean {
  if (date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) return false;
  const local = new Date(date.getTime() + OFFSET_MS);
  const hours = CLINIC.hours[local.getUTCDay()];
  if (!hours) return false;
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  return (
    minutes % CLINIC.slotMinutes === 0 &&
    minutes >= hours.open &&
    minutes + CLINIC.slotMinutes <= hours.close
  );
}

/** All slot start times for a clinic-local date (YYYY-MM-DD) */
export function slotsForDate(dateStr: string): Date[] {
  const [y, m, d] = parseDate(dateStr);
  const hours = CLINIC.hours[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  if (!hours) return [];
  const midnight = clinicDayRange(dateStr).gte.getTime();
  const slots: Date[] = [];
  for (let t = hours.open; t + CLINIC.slotMinutes <= hours.close; t += CLINIC.slotMinutes) {
    slots.push(new Date(midnight + t * 60_000));
  }
  return slots;
}