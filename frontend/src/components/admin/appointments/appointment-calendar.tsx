'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentCalendarQuery } from '@/lib/admin-queries';
import { calendarLabel, calendarRange, shiftAnchor, type CalendarMode } from '@/lib/calendar-dates';
import { clinicToday } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ErrorBox, ListSkeleton } from '@/components/admin/page-states';
import { CalendarDayView, CalendarMonthView, CalendarWeekView } from '@/components/admin/appointments/calendar-views';

const MODE_OPTIONS: { value: CalendarMode; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

type Props = {
  onView: (id: string) => void;
};

export function AppointmentCalendar({ onView }: Props) {
  const [mode, setMode] = useState<CalendarMode>('day');
  const [anchor, setAnchor] = useState(clinicToday());
  const { from, to } = calendarRange(mode, anchor);

  const query = useQuery({
    ...appointmentCalendarQuery(from, to),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.appointments ?? [];

  function openDay(day: string) {
    setMode('day');
    setAnchor(day);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" aria-label="Previous" onClick={() => setAnchor(shiftAnchor(mode, anchor, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" aria-label="Next" onClick={() => setAnchor(shiftAnchor(mode, anchor, 1))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => setAnchor(clinicToday())}>
            Today
          </Button>
          <p className="ml-2 text-base font-semibold text-slate-900">{calendarLabel(mode, anchor)}</p>
        </div>
        <SegmentedControl label="Calendar range" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      </div>

      {query.isLoading && <ListSkeleton rows={4} />}
      {query.isError && (
        <ErrorBox
          message={query.error instanceof Error ? query.error.message : 'Could not load the calendar.'}
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && (
        <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          {mode === 'day' && <CalendarDayView items={items} onView={onView} />}
          {mode === 'week' && <CalendarWeekView start={from} items={items} onView={onView} onDay={openDay} />}
          {mode === 'month' && <CalendarMonthView anchor={anchor} items={items} onDay={openDay} />}
        </div>
      )}
    </div>
  );
}
