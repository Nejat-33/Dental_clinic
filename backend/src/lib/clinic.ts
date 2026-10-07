// src/config/clinic.ts
export const CLINIC = {
  utcOffsetHours: 3,        // Africa/Addis_Ababa, no DST
  slotMinutes: 30,
  maxPerSlot: 2,            // simultaneous bookings per slot
  bookingWindowDays: 60,
  minLeadMinutes: 60,       // can't book less than 1h ahead
  hours: {
    0: null,
    1: { open: 8 * 60, close: 17 * 60 },
    2: { open: 8 * 60, close: 17 * 60 },
    3: { open: 8 * 60, close: 17 * 60 },
    4: { open: 8 * 60, close: 17 * 60 },
    5: { open: 8 * 60, close: 17 * 60 },
    6: { open: 8 * 60, close: 13 * 60 },
  } as Record<number, { open: number; close: number } | null>,
};