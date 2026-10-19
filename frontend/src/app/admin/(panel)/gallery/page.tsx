'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { discardUpload } from '@/lib/upload';
import type { AdminGalleryImage } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { GalleryForm } from '@/components/admin/gallery-form';
import { EmptyBox, ErrorBox, FilterTabs, ListSkeleton } from '@/components/admin/page-states';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Visible', value: 'true' },
  { label: 'Hidden', value: 'false' },
];

export default function AdminGalleryPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminGalleryImage | 'new' | null>(null);
  const [tab, setTab] = useState('');

  const query = useQuery({
    queryKey: ['gallery', 'admin'],
    queryFn: () => api<AdminGalleryImage[]>('/gallery/all'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['gallery'] });
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Something went wrong');

  const toggleMut = useMutation({
    mutationFn: (g: AdminGalleryImage) =>
      api(`/gallery/${g.id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !g.isPublished }) }),
    onSuccess: (_d, g) => {
      toast.success(g.isPublished ? 'Hidden from the website' : 'Now visible on the website');
      refresh();
    },
    onError,
  });

  const deleteMut = useMutation({
    mutationFn: (g: AdminGalleryImage) => api(`/gallery/${g.id}`, { method: 'DELETE' }),
    onSuccess: (_d, g) => {
      discardUpload(g.imageUrl);
      toast.success('Image deleted');
      refresh();
    },
    onError,
  });

  const all = query.data ?? [];
  const items = all.filter((g) => tab === '' || String(g.isPublished) === tab);
  const categories = [...new Set(all.map((g) => g.category).filter((c): c is string => !!c))].sort();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Gallery</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Add image
        </Button>
      </div>
      <p className="mt-1 text-slate-500">
        Photos shown on the About page. Changes can take up to a minute to appear on the website.
      </p>

      <div className="mt-6">
        <FilterTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {query.isLoading && <ListSkeleton />}
        {query.isError && <ErrorBox message="Could not load the gallery." onRetry={() => query.refetch()} />}
        {query.isSuccess && items.length === 0 && (
          <EmptyBox>{all.length === 0 ? 'No photos yet. Add your first one.' : 'Nothing in this view.'}</EmptyBox>
        )}

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <li key={g.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative aspect-square bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.imageUrl}
                  alt={g.title ?? 'Gallery image'}
                  className={cn('size-full object-cover', !g.isPublished && 'opacity-50 grayscale')}
                />
                {!g.isPublished && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-white">
                    Hidden
                  </span>
                )}
              </div>

              <div className="p-3">
                <p className="truncate text-sm font-semibold text-slate-900">{g.title ?? 'Untitled'}</p>
                <p className="truncate text-xs text-slate-500">{g.category ?? 'No category'}</p>

                <div className="mt-3 flex gap-1.5">
                  <Button variant="outline" className="flex-1 px-2" onClick={() => setEditing(g)} aria-label="Edit image">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 px-2"
                    disabled={toggleMut.isPending}
                    onClick={() => toggleMut.mutate(g)}
                    aria-label={g.isPublished ? 'Hide image' : 'Show image'}
                  >
                    {g.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 px-2"
                    disabled={deleteMut.isPending}
                    aria-label="Delete image"
                    onClick={() => {
                      if (window.confirm('Delete this image? This cannot be undone.')) deleteMut.mutate(g);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add image' : 'Edit image'}
      >
        {editing !== null && (
          <GalleryForm
            key={editing === 'new' ? 'new' : editing.id}
            item={editing === 'new' ? undefined : editing}
            categories={categories}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}