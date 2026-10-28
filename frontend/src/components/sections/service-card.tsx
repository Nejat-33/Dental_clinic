import NextImage from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Clock3,
  HeartPulse,
  Smile,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import type { Service } from '@/types/api';

function ServiceIcon({ name, className }: { name: string; className: string }) {
  const normalizedName = name.toLowerCase();
  if (/orthodont|align|braces/.test(normalizedName)) return <Stethoscope className={className} strokeWidth={1.2} />;
  if (/whiten|aesthetic|cosmetic|veneer/.test(normalizedName)) return <Sparkles className={className} strokeWidth={1.2} />;
  if (/care|check|clean|prevent/.test(normalizedName)) return <HeartPulse className={className} strokeWidth={1.2} />;
  return <Smile className={className} strokeWidth={1.2} />;
}

export function ServiceCard({ service: s }: { service: Service }) {
  const features = (s.description || s.shortDescription || '')
    .split(/(?<=[.!?])\s+/)
    .map((feature) => feature.trim())
    .filter(Boolean)
    .slice(0, 2);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#eadbd3] bg-white shadow-[0_12px_42px_-32px_rgba(70,43,32,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_-38px_rgba(70,43,32,0.4)]">
      <Link href={`/services/${s.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[#faf0eb]">
        {s.imageUrl ? (
          <NextImage
            src={s.imageUrl}
            alt={s.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-[#c28866]">
            <ServiceIcon name={s.name} className="size-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2c1d18]/50 via-transparent to-transparent" />
        <span className="absolute left-5 top-5 grid size-11 place-items-center rounded-full bg-[#fdf7f5]/90 text-[#b96757] shadow-sm backdrop-blur">
          <ServiceIcon name={s.name} className="size-5" />
        </span>
        {s.duration !== null && (
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-[#fdf7f5]/95 px-3 py-2 text-[10px] font-semibold text-[#5b453d] shadow-sm">
            <Clock3 className="size-3.5 text-[#c28866]" />
            {s.duration} min
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <Link href={`/services/${s.slug}`} className="w-fit">
          <h2 className="font-serif text-2xl tracking-tight text-[#2c1d18] transition group-hover:text-[#a65f4f]">
            {s.name}
          </h2>
        </Link>
        {s.shortDescription && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#817068]">{s.shortDescription}</p>
        )}
        {features.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-xs leading-5 text-[#6e5c54]">
                <Check className="mt-0.5 size-3.5 shrink-0 text-[#d57f6d]" />
                <span className="line-clamp-2">{feature}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          <Link
            href={`/appointment?service=${encodeURIComponent(s.id)}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#d57f6d] px-4 py-3 text-[10px] font-semibold text-white transition hover:bg-[#bd6858]"
          >
            Book this service <ArrowUpRight className="size-3.5" />
          </Link>
          <Link
            href={`/services/${s.slug}`}
            className="px-2 py-2 text-[10px] font-semibold text-[#8f6254] transition hover:text-[#2c1d18]"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}