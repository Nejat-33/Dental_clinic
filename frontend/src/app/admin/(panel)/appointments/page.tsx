'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Mail, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { appointmentsQuery } from '@/lib/admin-queries';
import { cn } from '@/lib/cn';
import { formatClinicShort } from '@/lib/dates';
import type { Appointment, AppointmentStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/field';
import { StatusBadge } from '@/components/admin/status-badge';

const TABS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'All', value: '' },
];

const DONE_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'set to pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'marked as completed',
  CANCELLED: 'cancelled',
};

const LIMIT = 10;

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('PENDING');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    ...appointmentsQuery({ status, date, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: (_data, vars) => {
      toast.success(`Appointment ${DONE_LABEL[vars.status]}`);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  function change(a: Appointment, next: AppointmentStatus) {
    if (next === 'CANCELLED' && !window.confirm(`Cancel ${a.patientName}'s appointment?`)) return;
    mutation.mutate({ id: a.id, status: next });
  }

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => { setStatus(t.value); setPage(1); }}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition',
                status === t.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            aria-label="Filter by date"
            className={cn(inputClass, 'w-44 py-2')}
          />
          {date && (
            <Button variant="outline" onClick={() => { setDate(''); setPage(1); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {query.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        )}

        {query.isError && (
          <p className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
            Could not load appointments.{' '}
            <button className="font-semibold underline" onClick={() => query.refetch()}>Retry</button>
          </p>
        )}

        {query.isSuccess && items.length === 0 && (
          <p className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
            No appointments found.
          </p>
        )}

        <ul className={cn('space-y-3', query.isPlaceholderData && 'opacity-60 transition-opacity')}>
          {items.map((a) => {
            const busy = mutation.isPending && mutation.variables?.id === a.id;
            return (
              <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{a.patientName}</p>
                    <p className="text-sm text-slate-500">{a.service.name}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                  <span className="flex items-center gap-2">
                    <Calendar className="size-4 text-brand-600" /> {formatClinicShort(a.appointmentDate)}
                  </span>
                  <a href={`tel:${a.phone}`} className="flex items-center gap-2 hover:text-brand-700">
                    <Phone className="size-4 text-brand-600" /> {a.phone}
                  </a>
                  {a.email && (
                    <a href={`mailto:${a.email}`} className="flex items-center gap-2 truncate hover:text-brand-700">
                      <Mail className="size-4 shrink-0 text-brand-600" /> {a.email}
                    </a>
                  )}
                </div>

                {a.message && (
                  <p className="mt-3 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <MessageSquare className="mt-0.5 size-4 shrink-0 text-slate-400" /> {a.message}
                  </p>
                )}

                {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {a.status === 'PENDING' && (
                      <Button disabled={busy} onClick={() => change(a, 'CONFIRMED')}>Confirm</Button>
                    )}
                    {a.status === 'CONFIRMED' && (
                      <Button disabled={busy} onClick={() => change(a, 'COMPLETED')}>Mark completed</Button>
                    )}
                    <Button variant="outline" disabled={busy} onClick={() => change(a, 'CANCELLED')}>
                      {a.status === 'PENDING' ? 'Decline' : 'Cancel'}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {meta && meta.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-slate-500">Page {meta.page} of {meta.pages} · {meta.total} total</span>
            <Button variant="outline" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}