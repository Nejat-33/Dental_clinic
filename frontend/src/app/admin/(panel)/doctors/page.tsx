'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { discardUpload } from '@/lib/upload';
import type { AdminDoctor } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Thumb } from '@/components/admin/thumb';
import { DoctorForm } from '@/components/admin/doctor-form';
import { EmptyBox, ErrorBox, ListSkeleton } from '@/components/admin/page-states';

const initials = (name: string) =>
  name
    .replace(/^dr\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminDoctor | 'new' | null>(null);

  const query = useQuery({
    queryKey: ['doctors', 'admin'],
    queryFn: () => api<AdminDoctor[]>('/doctors/all'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['doctors'] });
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Something went wrong');

  const toggleMut = useMutation({
    mutationFn: (d: AdminDoctor) =>
      api(`/doctors/${d.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !d.isActive }) }),
    onSuccess: (_d, d) => {
      toast.success(d.isActive ? 'Hidden from the website' : 'Now visible on the website');
      refresh();
    },
    onError,
  });

  const deleteMut = useMutation({
    mutationFn: (d: AdminDoctor) => api(`/doctors/${d.id}`, { method: 'DELETE' }),
    onSuccess: (_d, d) => {
      discardUpload(d.imageUrl);
      toast.success('Doctor deleted');
      refresh();
    },
    onError,
  });

  const items = query.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Add doctor
        </Button>
      </div>

      <div className="mt-6">
        {query.isLoading && <ListSkeleton />}
        {query.isError && <ErrorBox message="Could not load doctors." onRetry={() => query.refetch()} />}
        {query.isSuccess && items.length === 0 && <EmptyBox>No doctors yet. Add your first one.</EmptyBox>}

        <ul className="space-y-3">
          {items.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Thumb round src={d.imageUrl} fallback={<span className="text-lg font-bold">{initials(d.name)}</span>} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{d.name}</p>
                  <span
                    className={
                      d.isActive
                        ? 'rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700'
                        : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500'
                    }
                  >
                    {d.isActive ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <p className="truncate text-sm text-slate-500">{d.specialization}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(d)} aria-label={`Edit ${d.name}`}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  disabled={toggleMut.isPending}
                  onClick={() => toggleMut.mutate(d)}
                  aria-label={d.isActive ? `Hide ${d.name}` : `Show ${d.name}`}
                >
                  {d.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button
                  variant="outline"
                  disabled={deleteMut.isPending}
                  aria-label={`Delete ${d.name}`}
                  onClick={() => {
                    if (window.confirm(`Delete ${d.name}? This cannot be undone.`)) deleteMut.mutate(d);
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
        title={editing === 'new' ? 'Add doctor' : 'Edit doctor'}
      >
        {editing !== null && (
          <DoctorForm
            key={editing === 'new' ? 'new' : editing.id}
            doctor={editing === 'new' ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}