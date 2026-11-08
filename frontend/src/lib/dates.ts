export const CLINIC_TZ = 'Africa/Addis_Ababa';

/** Today's date in the clinic's timezone, as YYYY-MM-DD */
export function clinicToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CLINIC_TZ }).format(new Date());
}

/** The next `count` calendar days starting today (clinic time) */
export function nextDays(count: number) {
  const [y, m, d] = clinicToday().split('-').map(Number) as [number, number, number];
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    return {
      date: dt.toISOString().slice(0, 10),
      weekday: dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      day: dt.getUTCDate(),
      month: dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
    };
  });
}

export const formatDateLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

export const formatClinicTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: CLINIC_TZ, hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );

export const formatClinicDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

/** Hour of day (0-23) in clinic time, used to split morning/afternoon */
export const clinicHour = (iso: string) =>
  Number(
    new Intl.DateTimeFormat('en-US', { timeZone: CLINIC_TZ, hour: 'numeric', hour12: false }).format(
      new Date(iso),
    ),
  ) % 24;

export const formatClinicDay = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));

export const formatClinicShort = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));