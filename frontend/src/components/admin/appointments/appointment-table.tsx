import { formatClinicDay, formatClinicTime } from '@/lib/dates';
import { StatusBadge } from '@/components/admin/status-badge';
import type { Appointment } from '@/types/api';

type Props = {
  items: Appointment[];
  onView: (id: string) => void;
};

export function AppointmentTable({ items, onView }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Doctor</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onView(a.id)}
                  className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                >
                  {a.patientName}
                </button>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p>{a.phone}</p>
                {a.email && <p className="max-w-[14rem] truncate text-xs text-slate-400">{a.email}</p>}
              </td>
              <td className="px-4 py-3 text-slate-700">{a.service.name}</td>
              <td className="px-4 py-3 text-slate-700">
                {a.doctor ? a.doctor.name : <span className="text-slate-400">Unassigned</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatClinicDay(a.appointmentDate)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatClinicTime(a.appointmentDate)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatClinicDay(a.createdAt)}</td>
              <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onView(a.id)}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
