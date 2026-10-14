import Link from 'next/link';
import { Clock, Mail, MapPin, Phone, Smile } from 'lucide-react';
import { site } from '@/config/site';
import { Container } from '@/components/ui/container';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600">
              <Smile className="size-5" />
            </span>
            {site.name}
          </div>
          <p className="mt-4 max-w-xs text-sm text-slate-400">{site.tagline}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick links</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">{item.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/appointment" className="hover:text-white">Book appointment</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Visit us</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />{site.address}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-brand-500" />{site.phone}</li>
            <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-brand-500" />{site.email}</li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <div>
                {site.hours.map((h) => (
                  <div key={h.days}>{h.days}: {h.time}</div>
                ))}
              </div>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-slate-800 py-5 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}