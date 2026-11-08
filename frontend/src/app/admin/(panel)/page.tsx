'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { appointmentsQuery } from '@/lib/admin-queries';
import { clinicToday, formatClinicShort, formatClinicTime } from '@/lib/dates';
import { useAdmin } from '@/lib/auth';
import { StatusBadge } from '@/components/admin/status-badge';

function Stat({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: number | string; href?: string }) {
  const body = (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-6" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="transition hover:opacity-90">{body}</Link> : body;
}

export default function DashboardPage() {
  const me = useAdmin();
  const today = clinicToday();

  const pending = useQuery(appointmentsQuery({ status: 'PENDING', page: 1, limit: 5 }));
  const todays = useQuery(appointmentsQuery({ date: today, page: 1, limit: 50 }));
  const unread = useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: () => api<{ count: number }>('/messages/unread-count'),
  });

  const todaysActive = (todays.data?.appointments ?? []).filter((a) => a.status !== 'CANCELLED');

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Welcome back{me.data ? `, ${me.data.name}` : ''}</h1>
      <p className="mt-1 text-slate-500">Here&apos;s what needs your attention.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat icon={Clock} label="Pending requests" value={pending.data?.pagination.total ?? '–'} href="/admin/appointments" />
        <Stat icon={CalendarCheck} label="Today's appointments" value={todays.data ? todaysActive.length : '–'} />
        <Stat icon={Mail} label="Unread messages" value={unread.data?.count ?? '–'} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Latest pending requests</h2>
            <Link href="/admin/appointments" className="text-sm font-semibold text-brand-700">View all</Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {pending.data?.appointments.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No pending requests 🎉</li>}
            {pending.data?.appointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{a.patientName}</p>
                  <p className="text-slate-500">{a.service.name} · {formatClinicShort(a.appointmentDate)}</p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Today</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {todays.data && todaysActive.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">No appointments today.</li>
            )}
            {todaysActive.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{formatClinicTime(a.appointmentDate)} · {a.patientName}</p>
                  <p className="text-slate-500">{a.service.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}