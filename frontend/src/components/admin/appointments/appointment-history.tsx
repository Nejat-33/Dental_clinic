'use client';

import { useQuery } from '@tanstack/react-query';
import { appointmentHistoryQuery } from '@/lib/admin-queries';
import { formatClinicDateTime } from '@/lib/dates';
import { ErrorBox, ListSkeleton } from '@/components/admin/page-states';

const EVENT_LABELS: Record<string, string> = {
  APPOINTMENT_CREATED: 'Booked by staff',
  APPOINTMENT_RESCHEDULED: 'Rescheduled',
  APPOINTMENT_DOCTOR_ASSIGNED: 'Doctor assigned',
  APPOINTMENT_CHECKED_IN: 'Checked in',
  APPOINTMENT_CONFIRMED: 'Confirmed',
  APPOINTMENT_CANCELLED: 'Cancelled',
  APPOINTMENT_NO_SHOW: 'Marked as no-show',
};

function eventLabel(action: string) {
  return EVENT_LABELS[action] ?? action;
}

export function AppointmentHistory({ id }: { id: string }) {
  const history = useQuery(appointmentHistoryQuery(id));

  if (history.isLoading) return <ListSkeleton rows={2} />;
  if (history.isError) {
    return <ErrorBox message="Could not load this appointment's history." onRetry={() => history.refetch()} />;
  }

  const { assignments = [], events = [] } = history.data ?? {};

  return (
    <section className="space-y-4 border-t border-slate-100 pt-6">
      <h3 className="text-sm font-semibold text-slate-900">History</h3>

      {events.length === 0 && assignments.length === 0 && (
        <p className="text-sm text-slate-500">No history recorded yet.</p>
      )}

      {events.length > 0 && (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-teal-500" aria-hidden />
              <div>
                <p className="font-medium text-slate-800">{eventLabel(event.action)}</p>
                <p className="text-slate-500">
                  {formatClinicDateTime(event.createdAt)}
                  {event.user?.name ? ` by ${event.user.name}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {assignments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor assignments</p>
          <ul className="space-y-2 text-sm text-slate-700">
            {assignments.map((a) => (
              <li key={a.id}>
                {a.doctor.name} · assigned {formatClinicDateTime(a.assignedAt)}
                {a.assignedBy?.name ? ` by ${a.assignedBy.name}` : ''}
                {a.reason ? ` (${a.reason})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
