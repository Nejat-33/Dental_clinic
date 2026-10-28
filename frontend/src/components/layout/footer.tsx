import Link from 'next/link';
import { Clock, Mail, MapPin, Phone, Smile } from 'lucide-react';
import { site } from '@/config/site';
import { Container } from '@/components/ui/container';

export function Footer() {
  return (
    <footer className="bg-[#2c1d18] text-white">
      <Container className="grid gap-10 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <span className="grid size-9 place-items-center rounded-full bg-[#d57f6d]">
              <Smile className="size-5" />
            </span>
            {site.name}
          </div>
          <p className="mt-4 max-w-xs text-xs leading-5 text-white/55">{site.tagline}</p>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Quick links</h3>
          <ul className="mt-4 space-y-2 text-xs text-white/65">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">{item.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/appointment" className="transition hover:text-white">Book appointment</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Visit us</h3>
          <ul className="mt-4 space-y-3 text-xs text-white/65">
            <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#c28866]" />{site.address}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-[#c28866]" />{site.phone}</li>
            <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-[#c28866]" />{site.email}</li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-[#c28866]" />
              <div>
                {site.hours.map((h) => (
                  <div key={h.days}>{h.days}: {h.time}</div>
                ))}
              </div>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-5 text-center text-[10px] text-white/40">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}