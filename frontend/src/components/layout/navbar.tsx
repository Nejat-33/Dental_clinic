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

  const isActive = (href: string) => {
    const route = href.startsWith('/#') ? '/' : href;
    return pathname === route || (route !== '/' && pathname.startsWith(`${route}/`));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9ddd7]/80 bg-[#fdf7f5]/90 backdrop-blur-xl">
      <Container className="flex h-[76px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-[#2c1d18] sm:text-base">
          <span className="grid size-10 place-items-center rounded-full bg-[#2c1d18] text-white">
            <Smile className="size-5" />
          </span>
          {site.name}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'text-xs font-medium transition-colors',
                isActive(item.href)
                  ? 'text-[#d57f6d]'
                  : 'text-[#74635d] hover:text-[#d57f6d]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ButtonLink
              href="/contact"
              className="rounded-full bg-[#d57f6d] px-5 py-3 text-xs font-semibold text-white hover:bg-[#bd6858]"
            >
              Contact
            </ButtonLink>
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-[#e7d8d1] text-[#74635d] hover:bg-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-[#e9ddd7] bg-[#fdf7f5] lg:hidden">
          <Container className="grid gap-1 py-3">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-xl px-3 py-3 text-sm font-medium',
                  isActive(item.href) ? 'bg-white text-[#d57f6d]' : 'text-[#74635d] hover:bg-white',
                )}
              >
                {item.label}
              </Link>
            ))}
            <ButtonLink href="/contact" size="lg" className="mt-2 rounded-full bg-[#d57f6d] text-white hover:bg-[#bd6858]" onClick={() => setOpen(false)}>
              Contact
            </ButtonLink>
          </Container>
        </div>
      )}
    </header>
  );
}