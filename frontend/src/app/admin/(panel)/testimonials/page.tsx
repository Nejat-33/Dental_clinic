'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatClinicShort } from '@/lib/dates';
import type { AdminTestimonial } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Stars } from '@/components/ui/stars';
import { EmptyBox, ErrorBox, FilterTabs, ListSkeleton } from '@/components/admin/page-states';

const TABS = [
  { label: 'Pending', value: 'false' },
  { label: 'Published', value: 'true' },
  { label: 'All', value: '' },
];

export default function AdminTestimonialsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('false');

  const query = useQuery({
    queryKey: ['testimonials', { published: tab }],
    queryFn: () => api<AdminTestimonial[]>(`/testimonials/all${tab ? `?isPublished=${tab}` : ''}`),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['testimonials'] });
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Something went wrong');

  const publishMut = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify({ isPublished }) }),
    onSuccess: (_d, vars) => {
      toast.success(vars.isPublished ? 'Published on the website' : 'Hidden from the website');
      refresh();
    },
    onError,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/testimonials/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Review deleted'); refresh(); },
    onError,
  });

  const items = query.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Testimonials</h1>
      <p className="mt-1 text-slate-500">
        Reviews submitted on the website wait here until you publish them. Changes can take up to a minute to appear on the site.
      </p>

      <div className="mt-6">
        <FilterTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {query.isLoading && <ListSkeleton />}
        {query.isError && <ErrorBox message="Could not load reviews." onRetry={() => query.refetch()} />}
        {query.isSuccess && items.length === 0 && <EmptyBox>No reviews here.</EmptyBox>}

        <ul className="space-y-3">
          {items.map((t) => {
            const busy = publishMut.isPending && publishMut.variables?.id === t.id;
            return (
              <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{t.patientName}</p>
                    <p className="text-sm text-slate-500">
                      {t.service ? `${t.service} · ` : ''}{formatClinicShort(t.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Stars rating={t.rating} />
                    <span
                      className={
                        t.isPublished
                          ? 'rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200'
                          : 'rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200'
                      }
                    >
                      {t.isPublished ? 'Published' : 'Pending'}
                    </span>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line text-slate-700">{t.content}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {t.isPublished ? (
                    <Button variant="outline" disabled={busy} onClick={() => publishMut.mutate({ id: t.id, isPublished: false })}>
                      <EyeOff className="size-4" /> Unpublish
                    </Button>
                  ) : (
                    <Button disabled={busy} onClick={() => publishMut.mutate({ id: t.id, isPublished: true })}>
                      <Check className="size-4" /> Publish
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete ${t.patientName}'s review permanently?`)) deleteMut.mutate(t.id);
                    }}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}