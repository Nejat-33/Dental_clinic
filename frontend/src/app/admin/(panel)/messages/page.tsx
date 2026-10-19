'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, ChevronDown, Mail, MailOpen, Phone, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatClinicShort } from '@/lib/dates';
import type { Message, MessageStatus, Paginated } from '@/types/api';
import { Button } from '@/components/ui/button';
import { EmptyBox, ErrorBox, FilterTabs, ListSkeleton } from '@/components/admin/page-states';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Unread', value: 'UNREAD' },
  { label: 'Read', value: 'READ' },
  { label: 'Archived', value: 'ARCHIVED' },
  { label: 'Trash', value: 'TRASH' },
];

const LIMIT = 15;

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const inTrash = tab === 'TRASH';

  const list = useQuery({
    queryKey: ['messages', 'list', { status: tab, page }],
    queryFn: () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (tab) qs.set('status', tab);
      return api<Paginated<Message>>(`/messages?${qs}`);
    },
    enabled: !inTrash,
    placeholderData: keepPreviousData,
  });

  const trash = useQuery({
    queryKey: ['messages', 'trash'],
    queryFn: () => api<Message[]>('/messages/trash'),
    enabled: inTrash,
  });

  const active = inTrash ? trash : list;
  const items = inTrash ? (trash.data ?? []) : (list.data?.data ?? []);
  const meta = list.data?.meta;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['messages'] });
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Something went wrong');

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MessageStatus }) =>
      api(`/messages/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: refresh,
    onError,
  });

  // Silent: opening a message marks it read without removing it from the current tab
  const markRead = useMutation({
    mutationFn: (id: string) =>
      api(`/messages/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'READ' }) }),
    onSuccess: (_d, id) => {
      queryClient.setQueriesData<Paginated<Message>>({ queryKey: ['messages', 'list'] }, (old) =>
        old && { ...old, data: old.data.map((m) => (m.id === id ? { ...m, status: 'READ' as const } : m)) },
      );
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });
    },
  });

  const trashMut = useMutation({
    mutationFn: (id: string) => api(`/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Moved to trash'); refresh(); },
    onError,
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => api(`/messages/${id}/restore`, { method: 'POST' }),
    onSuccess: () => { toast.success('Message restored'); refresh(); },
    onError,
  });

  const purgeMut = useMutation({
    mutationFn: (id: string) => api(`/messages/${id}/permanent`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Message deleted forever'); refresh(); },
    onError,
  });

  function toggle(m: Message) {
    const opening = expanded !== m.id;
    setExpanded(opening ? m.id : null);
    if (opening && m.status === 'UNREAD' && !inTrash) markRead.mutate(m.id);
  }

  function setStatus(m: Message, status: MessageStatus, doneText: string) {
    statusMut.mutate({ id: m.id, status }, { onSuccess: () => toast.success(doneText) });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>

      <div className="mt-6">
        <FilterTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); setPage(1); setExpanded(null); }} />
      </div>

      {inTrash && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Messages in the trash are deleted permanently after 7 days.
        </p>
      )}

      <div className="mt-6">
        {active.isLoading && <ListSkeleton />}
        {active.isError && <ErrorBox message="Could not load messages." onRetry={() => active.refetch()} />}
        {active.isSuccess && items.length === 0 && (
          <EmptyBox>{inTrash ? 'The trash is empty.' : 'No messages here.'}</EmptyBox>
        )}

        <ul className={cn('space-y-3', list.isPlaceholderData && 'opacity-60 transition-opacity')}>
          {items.map((m) => {
            const open = expanded === m.id;
            const unread = m.status === 'UNREAD';
            return (
              <li key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button
                  onClick={() => toggle(m)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50"
                >
                  <span className={cn('size-2.5 shrink-0 rounded-full', unread ? 'bg-brand-600' : 'bg-transparent')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className={cn('truncate', unread ? 'font-bold text-slate-900' : 'font-medium text-slate-800')}>
                        {m.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatClinicShort(inTrash && m.deletedAt ? m.deletedAt : m.createdAt)}
                        {inTrash && ' (deleted)'}
                      </span>
                    </span>
                    <span className="block truncate text-sm text-slate-500">
                      {m.subject ? `${m.subject} — ` : ''}{m.message}
                    </span>
                  </span>
                  {m.status === 'ARCHIVED' && <Archive className="size-4 shrink-0 text-slate-400" />}
                  <ChevronDown className={cn('size-5 shrink-0 text-slate-400 transition', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="border-t border-slate-100 p-5">
                    {m.subject && <p className="font-semibold text-slate-900">{m.subject}</p>}
                    <p className="mt-2 whitespace-pre-line text-slate-700">{m.message}</p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? 'Your message'}`)}`}
                        className="flex items-center gap-2 text-brand-700 hover:underline"
                      >
                        <Mail className="size-4" /> {m.email}
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="flex items-center gap-2 text-brand-700 hover:underline">
                          <Phone className="size-4" /> {m.phone}
                        </a>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {inTrash ? (
                        <>
                          <Button size="md" onClick={() => restoreMut.mutate(m.id)} disabled={restoreMut.isPending}>
                            <RotateCcw className="size-4" /> Restore
                          </Button>
                          <Button
                            variant="outline"
                            disabled={purgeMut.isPending}
                            onClick={() => {
                              if (window.confirm('Delete this message forever? This cannot be undone.')) purgeMut.mutate(m.id);
                            }}
                          >
                            <Trash2 className="size-4" /> Delete forever
                          </Button>
                        </>
                      ) : (
                        <>
                          {m.status === 'READ' && (
                            <Button variant="outline" onClick={() => setStatus(m, 'UNREAD', 'Marked as unread')}>
                              <Mail className="size-4" /> Mark unread
                            </Button>
                          )}
                          {m.status === 'UNREAD' && (
                            <Button variant="outline" onClick={() => setStatus(m, 'READ', 'Marked as read')}>
                              <MailOpen className="size-4" /> Mark read
                            </Button>
                          )}
                          {m.status !== 'ARCHIVED' ? (
                            <Button variant="outline" onClick={() => setStatus(m, 'ARCHIVED', 'Message archived')}>
                              <Archive className="size-4" /> Archive
                            </Button>
                          ) : (
                            <Button variant="outline" onClick={() => setStatus(m, 'READ', 'Moved back to inbox')}>
                              <ArchiveRestore className="size-4" /> Unarchive
                            </Button>
                          )}
                          <Button variant="outline" disabled={trashMut.isPending} onClick={() => trashMut.mutate(m.id)}>
                            <Trash2 className="size-4" /> Move to trash
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!inTrash && meta && meta.pages > 1 && (
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