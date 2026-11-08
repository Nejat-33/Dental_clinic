'use client';

import { Search, X } from 'lucide-react';
import { FilterTabs } from '@/components/admin/page-states';
import { inputClass } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import type { AdminDoctor, AdminService } from '@/types/api';

export type AppointmentFilters = {
  search: string;
  status: string;
  date: string;
  doctorId: string;
  serviceId: string;
};

export const DEFAULT_FILTERS: AppointmentFilters = {
  search: '',
  status: 'PENDING',
  date: '',
  doctorId: '',
  serviceId: '',
};

const STATUS_TABS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Checked in', value: 'CHECKED_IN' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'No-show', value: 'NO_SHOW' },
  { label: 'All', value: '' },
];

type Props = {
  filters: AppointmentFilters;
  doctors: AdminDoctor[];
  services: AdminService[];
  onChange: (patch: Partial<AppointmentFilters>) => void;
};

export function AppointmentFilterBar({ filters, doctors, services, onChange }: Props) {
  const hasExtraFilters = Boolean(filters.date || filters.doctorId || filters.serviceId || filters.search);

  return (
    <div className="space-y-4">
      <FilterTabs
        tabs={STATUS_TABS}
        value={filters.status}
        onChange={(status) => onChange({ status })}
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by patient name or phone"
            aria-label="Search appointments"
            className={cn(inputClass, 'py-2.5 pl-10')}
          />
        </div>

        <input
          type="date"
          value={filters.date}
          onChange={(e) => onChange({ date: e.target.value })}
          aria-label="Filter by date"
          className={cn(inputClass, 'py-2.5')}
        />

        <select
          value={filters.doctorId}
          onChange={(e) => onChange({ doctorId: e.target.value })}
          aria-label="Filter by doctor"
          className={cn(inputClass, 'py-2.5')}
        >
          <option value="">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={filters.serviceId}
          onChange={(e) => onChange({ serviceId: e.target.value })}
          aria-label="Filter by service"
          className={cn(inputClass, 'py-2.5')}
        >
          <option value="">All services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {hasExtraFilters ? (
          <button
            type="button"
            onClick={() => onChange({ search: '', date: '', doctorId: '', serviceId: '' })}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <X className="size-4" /> Clear
          </button>
        ) : (
          <span className="hidden md:block" />
        )}
      </div>
    </div>
  );
}
