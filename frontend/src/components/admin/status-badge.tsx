import { cn } from '@/lib/cn';
import type { AppointmentStatus } from '@/types/api';

const styles: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-brand-50 text-brand-700 ring-brand-200',
  COMPLETED: 'bg-slate-100 text-slate-700 ring-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
};

const labels: Record<AppointmentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', styles[status])}>
      {labels[status]}
    </span>
  );
}