'use client';

import { clinicToday, formatClinicTime } from '@/lib/dates';
import {
  addDays,
  clinicDateKey,
  dayOfMonth,
  monthGrid,
  monthStart,
  WEEKDAY_SHORT,
} from '@/lib/calendar-dates';
import { StatusBadge } from '@/components/admin/status-badge';
import { EmptyBox } from '@/components/admin/page-states';
import type { AppointmentCalendarItem } from '@/types/api';

type Items = AppointmentCalendarItem[];

function groupByDay(items: Items) {
  const groups = new Map<string, Items>();
  for (const item of items) {
    const key = clinicDateKey(item.appointmentDate);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function AppointmentRow({ item, onView }: { item: AppointmentCalendarItem; onView: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onView(item.id)}
      className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/40"
    >
      <span className="w-14 shrink-0 text-sm font-semibold text-slate-900">{formatClinicTime(item.appointmentDate)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-900">{item.patientName}</span>
        <span className="block truncate text-xs text-slate-500">
          {item.service.name} · {item.doctor ? item.doctor.name : 'Unassigned'}
        </span>
      </span>
      <StatusBadge status={item.status} />
    </button>
  );
}

export function CalendarDayView({ items, onView }: { items: Items; onView: (id: string) => void }) {
  if (items.length === 0) return <EmptyBox>No appointments on this day.</EmptyBox>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <AppointmentRow key={item.id} item={item} onView={onView} />
      ))}
    </div>
  );
}

export function CalendarWeekView({
  start,
  items,
  onView,
  onDay,
}: {
  start: string;
  items: Items;
  onView: (id: string) => void;
  onDay: (day: string) => void;
}) {
  const groups = groupByDay(items);
  const today = clinicToday();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid gap-4 lg:grid-cols-7">
      {days.map((day, i) => {
        const dayItems = groups.get(day) ?? [];
        return (
          <section key={day} className="min-w-0 space-y-2">
            <button
              type="button"
              onClick={() => onDay(day)}
              className={`flex w-full items-baseline justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-100 ${
                day === today ? 'bg-teal-50 text-teal-800' : 'text-slate-700'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide">{WEEKDAY_SHORT[i]}</span>
              <span className="text-lg font-bold">{dayOfMonth(day)}</span>
            </button>
            {dayItems.length === 0 && <p className="px-3 text-xs text-slate-400">No appointments</p>}
            {dayItems.map((item) => (
              <AppointmentRow key={item.id} item={item} onView={onView} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function CalendarMonthView({
  anchor,
  items,
  onDay,
}: {
  anchor: string;
  items: Items;
  onDay: (day: string) => void;
}) {
  const groups = groupByDay(items);
  const today = clinicToday();
  const month = monthStart(anchor).slice(0, 7);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {WEEKDAY_SHORT.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid(anchor).map((day) => {
          const count = groups.get(day)?.length ?? 0;
          const inMonth = day.startsWith(month);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDay(day)}
              className={`flex min-h-16 flex-col items-start gap-1 border-b border-r border-slate-100 p-2 text-left transition-colors hover:bg-teal-50/50 sm:min-h-24 ${
                inMonth ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-sm font-medium ${
                  day === today ? 'bg-teal-600 text-white' : ''
                }`}
              >
                {dayOfMonth(day)}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
                  {count} {count === 1 ? 'visit' : 'visits'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
