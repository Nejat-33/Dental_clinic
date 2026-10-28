'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ExternalLink, LayoutDashboard, Loader2, LogOut, Mail, Star, Smile, Stethoscope, Images, Users  } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAdmin } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { Appointment, Paginated } from '@/types/api';
import { site } from '@/config/site';



// Add new admin pages here as we build them
const nav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Services', href: '/admin/services', icon: Stethoscope },
  { label: 'Doctors', href: '/admin/doctors', icon: Users },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
  { label: 'Gallery', href: '/admin/gallery', icon: Images },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const me = useAdmin();

  const unread = useQuery({
  queryKey: ['messages', 'unread'],
  queryFn: () => api<{ count: number }>('/messages/unread-count'),
  enabled: !!me.data,
  refetchInterval: 60_000,
});
const unreadCount = unread.data?.count ?? 0;
 const pending = useQuery({
  queryKey: ['appointments', 'pending-count'],
  queryFn: () => api<Paginated<Appointment>>('/appointments?status=PENDING&page=1&limit=1'),
  enabled: !!me.data,
  refetchInterval: 30_000,
  refetchIntervalInBackground: true,
});
const pendingCount = pending.data?.meta.total ?? 0;
const lastCount = useRef<number | null>(null);

// Toast whenever the pending count goes up (not on first load, not when you confirm one)
useEffect(() => {
  if (!pending.data) return;
  const total = pending.data.meta.total;
  if (lastCount.current !== null && total > lastCount.current) {
    const n = total - lastCount.current;
    toast.info(n === 1 ? 'New appointment request' : `${n} new appointment requests`, {
      action: { label: 'View', onClick: () => router.push('/admin/appointments') },
      duration: 10_000,
    });
  }
  lastCount.current = total;
}, [pending.data, router]);

const badge = (href: string) =>
  href === '/admin/appointments' ? pendingCount : href === '/admin/messages' ? unreadCount : 0;

  const unauthorized = me.error instanceof ApiError && me.error.status === 401;

  // Cookie exists but session is invalid or expired: clear it, then go to login
  useEffect(() => {
    if (unauthorized) {
      api('/auth/logout', { method: 'POST' })
        .catch(() => {})
        .finally(() => router.replace('/admin/login'));
    }
  }, [unauthorized, router]);

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    queryClient.clear();
    router.replace('/admin/login');
  }

  if (me.isLoading || unauthorized) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <Loader2 className="size-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (me.isError || !me.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
        <div>
          <p className="text-slate-700">Could not reach the server.</p>
          <button onClick={() => me.refetch()} className="mt-3 font-semibold text-brand-700 underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  const brand = (
    <Link href="/admin" className="flex items-center gap-2 font-bold text-slate-900">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
        <Smile className="size-5" />
      </span>
      Admin
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">{brand}</div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <Icon className="size-5" /> {label}
              {badge(href) > 0 && (
  <span className="ml-auto rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
    {badge(href)}
  </span>
)}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-slate-100 p-3">
          <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <ExternalLink className="size-5" /> View website
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <LogOut className="size-5" /> Sign out
          </button>
          <p className="truncate px-3 pt-2 text-xs text-slate-400">{me.data.email}</p>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        <header className="border-b border-slate-200 bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            {brand}
            <button onClick={logout} aria-label="Sign out" className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
              <LogOut className="size-5" />
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
  {nav.map(({ label, href }) => (
    <Link
      key={href}
      href={href}
      className={cn(
        'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium',
        isActive(href) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700',
      )}
    >
      {label}
      {badge(href) > 0 && ` (${badge(href)})`}   {/* <- old line */}
    </Link>
  ))}
</nav>
        </header>

        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}