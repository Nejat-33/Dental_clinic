'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Smile, X } from 'lucide-react';
import { site } from '@/config/site';
import { cn } from '@/lib/cn';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button-link';

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Smile className="size-5" />
          </span>
          {site.name}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ButtonLink href="/appointment">Book appointment</ButtonLink>
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-3 text-base font-medium',
                  isActive(item.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-700',
                )}
              >
                {item.label}
              </Link>
            ))}
            <ButtonLink href="/appointment" size="lg" className="mt-2" onClick={() => setOpen(false)}>
              Book appointment
            </ButtonLink>
          </Container>
        </div>
      )}
    </header>
  );
}