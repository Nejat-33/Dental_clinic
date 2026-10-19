'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Plus, Smile, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { discardUpload } from '@/lib/upload';
import type { AdminService } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Thumb } from '@/components/admin/thumb';
import { ServiceForm } from '@/components/admin/service-form';
import { EmptyBox, ErrorBox, ListSkeleton } from '@/components/admin/page-states';

export default function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminService | 'new' | null>(null);

  const query = useQuery({
    queryKey: ['services', 'admin'],
    queryFn: () => api<AdminService[]>('/services/all'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['services'] });
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Something went wrong');

  const toggleMut = useMutation({
    mutationFn: (s: AdminService) =>
      api(`/services/${s.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !s.isActive }) }),
    onSuccess: (_d, s) => {
      toast.success(s.isActive ? 'Hidden from the website' : 'Now visible on the website');
      refresh();
    },
    onError,
  });

  const deleteMut = useMutation({
    mutationFn: (s: AdminService) => api(`/services/${s.id}`, { method: 'DELETE' }),
    onSuccess: (_d, s) => {
      discardUpload(s.imageUrl);
      toast.success('Service deleted');
      refresh();
    },
    onError, // a service with bookings returns "in use, deactivate it instead"
  });

  const items = query.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Add service
        </Button>
      </div>

      <div className="mt-6">
        {query.isLoading && <ListSkeleton />}
        {query.isError && <ErrorBox message="Could not load services." onRetry={() => query.refetch()} />}
        {query.isSuccess && items.length === 0 && <EmptyBox>No services yet. Add your first one.</EmptyBox>}

        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Thumb src={s.imageUrl} fallback={<Smile className="size-6" />} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <span
                    className={
                      s.isActive
                        ? 'rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700'
                        : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500'
                    }
                  >
                    {s.isActive ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <p className="truncate text-sm text-slate-500">
                  {s.shortDescription ?? s.description}
                  {s.duration ? ` · ${s.duration} min` : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  disabled={toggleMut.isPending}
                  onClick={() => toggleMut.mutate(s)}
                  aria-label={s.isActive ? `Hide ${s.name}` : `Show ${s.name}`}
                >
                  {s.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button
                  variant="outline"
                  disabled={deleteMut.isPending}
                  aria-label={`Delete ${s.name}`}
                  onClick={() => {
                    if (window.confirm(`Delete "${s.name}"? This cannot be undone.`)) deleteMut.mutate(s);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add service' : 'Edit service'}
      >
        {editing !== null && (
          <ServiceForm
            key={editing === 'new' ? 'new' : editing.id}
            service={editing === 'new' ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}