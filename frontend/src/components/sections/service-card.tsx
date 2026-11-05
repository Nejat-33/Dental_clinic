'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  HeartPulse,
  Smile,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { useId, useState } from 'react';
import type { Service } from '@/types/api';

function ServiceIcon({ name, className }: { name: string; className: string }) {
  const normalizedName = name.toLowerCase();
  if (/orthodont|align|braces/.test(normalizedName)) return <Stethoscope className={className} strokeWidth={1.2} />;
  if (/whiten|aesthetic|cosmetic|veneer/.test(normalizedName)) return <Sparkles className={className} strokeWidth={1.2} />;
  if (/care|check|clean|prevent/.test(normalizedName)) return <HeartPulse className={className} strokeWidth={1.2} />;
  return <Smile className={className} strokeWidth={1.2} />;
}

function serviceCategory(name: string) {
  const normalizedName = name.toLowerCase();
  if (/orthodont|align|braces/.test(normalizedName)) return 'Orthodontics';
  if (/implant/.test(normalizedName)) return 'Implant dentistry';
  if (/whiten|aesthetic|cosmetic|veneer/.test(normalizedName)) return 'Aesthetic dentistry';
  if (/clean|prevent|check/.test(normalizedName)) return 'Preventive care';
  if (/fill|crown|root canal|restor/.test(normalizedName)) return 'Restorative care';
  if (/general/.test(normalizedName)) return 'General care';
  return 'Dental care';
}

function serviceHighlights(description: string) {
  return description
    .split(/(?<=[.!?])\s+/)
    .map((highlight) => highlight.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export function ServiceCard({ service: s }: { service: Service }) {
  const highlights = serviceHighlights(s.description);
  const detailsId = useId();
  const [hovered, setHovered] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [dismissedHover, setDismissedHover] = useState(false);
  const expanded = pinnedOpen || (hovered && !dismissedHover);

  return (
    <article
      onMouseEnter={() => {
        setHovered(true);
        setDismissedHover(false);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setDismissedHover(false);
      }}
      className="group flex h-auto self-start flex-col overflow-hidden rounded-[1.5rem] border border-[#eadbd3] bg-white shadow-md shadow-[#5b3b2e]/5 transition-[box-shadow,border-color] duration-500 ease-out hover:shadow-xl hover:shadow-[#5b3b2e]/10"
    >
      <Link href={`/services/${s.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[#faf0eb]">
        {s.imageUrl ? (
          <NextImage
            src={s.imageUrl}
            alt={s.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-[#c28866]">
            <ServiceIcon name={s.name} className="size-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2c1d18]/50 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#d57f6d] px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
          <ServiceIcon name={s.name} className="size-4" />
          {serviceCategory(s.name)}
        </span>
        {s.duration !== null && (
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-[#fdf7f5]/95 px-3 py-2 text-[10px] font-semibold text-[#5b453d] shadow-sm">
            <Clock3 className="size-3.5 text-[#c28866]" />
            {s.duration} min
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/services/${s.slug}`} className="w-fit">
            <h3 className="font-serif text-2xl tracking-tight text-[#2c1d18] transition group-hover:text-[#a65f4f]">
              {s.name}
            </h3>
          </Link>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={`${expanded ? 'Hide' : 'Show'} details for ${s.name}`}
            onClick={() => {
              if (expanded) {
                setPinnedOpen(false);
                setDismissedHover(hovered);
              } else {
                setPinnedOpen(true);
                setDismissedHover(false);
              }
            }}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f5e9e3] text-[#a66e5e] transition-all duration-500 ease-out hover:bg-[#d57f6d] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d57f6d]"
          >
            <ChevronDown className={`size-4 transition-transform duration-500 ease-out ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#817068]">
          {s.shortDescription || s.description}
        </p>
        <div
          id={detailsId}
          aria-hidden={!expanded}
          className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="max-h-44 overflow-y-auto pt-3">
              <p className="text-sm leading-6 text-[#817068]">{s.description}</p>
              {highlights.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2.5 text-xs leading-5 text-[#6e5c54]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-[#c28866]" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/services/${s.slug}`}
                tabIndex={expanded ? 0 : -1}
                className="mt-4 inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold text-[#8f6254] transition hover:text-[#2c1d18]"
              >
                Discover <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          <Link
            href={`/appointment?service=${encodeURIComponent(s.id)}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#d57f6d] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#bd6858] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d57f6d]"
          >
            Book This Service <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}