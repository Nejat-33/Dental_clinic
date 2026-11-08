'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminDoctorsQuery, adminServicesQuery, appointmentsQuery } from '@/lib/admin-queries';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { Button } from '@/components/ui/button';
import { EmptyBox, ErrorBox, ListSkeleton } from '@/components/admin/page-states';
import {
  AppointmentFilterBar,
  DEFAULT_FILTERS,
  type AppointmentFilters,
} from '@/components/admin/appointments/appointment-filters';
import { AppointmentTable } from '@/components/admin/appointments/appointment-table';
import { AppointmentDetailModal } from '@/components/admin/appointments/appointment-detail-modal';
import { AppointmentCreateModal } from '@/components/admin/appointments/appointment-create-modal';

const LIMIT = 10;

export default function AppointmentsPage() {
  const [filters, setFilters] = useState<AppointmentFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const search = useDebouncedValue(filters.search.trim());

  const query = useQuery({
    ...appointmentsQuery({
      status: filters.status,
      date: filters.date,
      doctorId: filters.doctorId,
      serviceId: filters.serviceId,
      search,
      page,
      limit: LIMIT,
    }),
    placeholderData: keepPreviousData,
  });

  const doctors = useQuery(adminDoctorsQuery);
  const services = useQuery(adminServicesQuery);

  function updateFilters(patch: Partial<AppointmentFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  const items = query.data?.appointments ?? [];
  const pagination = query.data?.pagination;
  const filtersActive = filters.status !== DEFAULT_FILTERS.status || Boolean(search || filters.date || filters.doctorId || filters.serviceId);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          {pagination && (
            <p className="mt-1 text-sm text-slate-500">
              {pagination.total} {pagination.total === 1 ? 'appointment' : 'appointments'}
              {filtersActive ? ' match these filters' : ''}
            </p>
          )}
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          New appointment
        </Button>
      </div>

      <div className="mt-6">
        <AppointmentFilterBar
          filters={filters}
          doctors={doctors.data ?? []}
          services={services.data ?? []}
          onChange={updateFilters}
        />
      </div>

      <div className="mt-6">
        {query.isLoading && <ListSkeleton rows={4} />}

        {query.isError && (
          <ErrorBox
            message={query.error instanceof Error ? query.error.message : 'Could not load appointments.'}
            onRetry={() => query.refetch()}
          />
        )}

        {query.isSuccess && items.length === 0 && (
          <EmptyBox>
            {filtersActive ? 'No appointments match these filters.' : 'No appointments yet.'}
          </EmptyBox>
        )}

        {items.length > 0 && (
          <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <AppointmentTable items={items} onView={setSelectedId} />
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="outline" disabled={!pagination.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button variant="outline" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      {createOpen && (
        <AppointmentCreateModal
          services={services.data ?? []}
          doctors={doctors.data ?? []}
          onClose={() => setCreateOpen(false)}
        />
      )}

      <AppointmentDetailModal appointmentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
