'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatClinicTime } from '@/lib/dates';

type AvailabilityResponse = { date: string; slots: { time: string; available: boolean }[] };

type Props = {
  date: string;
  value: string;
  onChange: (time: string) => void;
  error?: string;
};

export function SlotPicker({ date, value, onChange, error }: Props) {
  const availability = useQuery({
    queryKey: ['appointments', 'availability', date],
    queryFn: () => api<AvailabilityResponse>(`/appointments/availability?date=${date}`),
    enabled: Boolean(date),
  });
  const openSlots = availability.data?.slots.filter((s) => s.available) ?? [];

  return (
    <section>
      <p className="mb-2 text-sm font-medium text-slate-700">Available times</p>
      {availability.isLoading && <p className="text-sm text-slate-500">Loading available times...</p>}
      {availability.isError && (
        <p className="text-sm text-red-600">
          {availability.error instanceof Error ? availability.error.message : 'Could not load available times.'}
        </p>
      )}
      {availability.isSuccess && openSlots.length === 0 && (
        <p className="text-sm text-slate-500">No available times on this date.</p>
      )}
      {openSlots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {openSlots.map((s) => {
            const selected = value === s.time;
            return (
              <button
                key={s.time}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(s.time)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-teal-600 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                }`}
              >
                {formatClinicTime(s.time)}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
