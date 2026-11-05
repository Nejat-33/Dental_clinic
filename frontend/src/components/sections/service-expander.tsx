'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Activity, AlignCenter, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '@/types/api';

type Props = {
  services: Service[];
};

const treatments = [
  {
    name: 'Aesthetic dentistry',
    matches: /aesthetic|cosmetic|veneer/,
    summary: 'Smile restoration, built to last',
    description: 'Thoughtful restorative and cosmetic care brings balance, function, and confidence together.',
    points: ['Personalized smile planning', 'Natural-looking materials', 'Care shaped around your goals'],
    Icon: Sparkles,
  },
  {
    name: 'Orthodontics',
    matches: /orthodont|align|braces/,
    summary: 'A straighter smile, your way',
    description: 'Explore a considered path to a more comfortable bite and beautifully aligned smile.',
    points: ['A plan tailored to your bite', 'Clear guidance at every step', 'Progress reviewed by your clinician'],
    Icon: AlignCenter,
  },
  {
    name: 'Implantology',
    matches: /implant/,
    summary: 'A confident smile, made whole',
    description: 'Replace missing teeth with a carefully planned solution designed for lasting comfort.',
    points: ['Detailed assessment and planning', 'Modern restorative options', 'Long-term maintenance guidance'],
    Icon: ShieldCheck,
  },
  {
    name: 'Whitening',
    matches: /whiten|bleach/,
    summary: 'A brighter smile, beautifully',
    description: 'Refresh your smile with professional whitening guidance that puts comfort first.',
    points: ['A shade plan suited to you', 'Clinician-led treatment options', 'Advice for lasting results'],
    Icon: WandSparkles,
  },
  {
    name: 'Surgical dentistry',
    matches: /surg|extraction|oral/,
    summary: 'Expert care, with comfort in mind',
    description: 'Receive clear, compassionate support for surgical treatment and recovery.',
    points: ['A thorough consultation first', 'Careful treatment planning', 'Support through recovery'],
    Icon: Activity,
  },
] as const;

export default function ServiceExpander({ services }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [dismissedHoverIndex, setDismissedHoverIndex] = useState<number | null>(null);

  return (
    <div className="mt-10 flex items-start gap-3 overflow-x-auto pb-3 [scrollbar-width:thin] lg:overflow-visible">
      {treatments.map((treatment, index) => {
        const service = services.find((item) => treatment.matches.test(item.name));
        const active = pinnedIndex === index || (
          pinnedIndex === null && hoveredIndex === index && dismissedHoverIndex !== index
        );
        const Icon = treatment.Icon;

        return (
          <article
            key={treatment.name}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => {
              setHoveredIndex((current) => current === index ? null : current);
              setDismissedHoverIndex((current) => current === index ? null : current);
            }}
            className={`h-auto shrink-0 overflow-hidden rounded-[1.75rem] border transition-[flex,background-color,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:shrink ${
              active
                ? 'w-[min(82vw,560px)] border-[#d57f6d]/40 bg-white shadow-[0_18px_50px_-32px_rgba(80,48,36,0.35)] lg:flex-[2.5]'
                : 'w-[min(64vw,280px)] border-[#eadbd3] bg-white/70 hover:bg-white lg:flex-[0.8]'
            }`}
          >
            <button
              type="button"
              aria-expanded={active}
              onClick={() => {
                if (active) {
                  setPinnedIndex(null);
                  setDismissedHoverIndex(index);
                } else {
                  setPinnedIndex(index);
                  setDismissedHoverIndex(null);
                }
              }}
              className="flex min-h-[86px] w-full items-center justify-between gap-3 px-5 py-5 text-left sm:px-6"
            >
              <span className={`font-serif text-lg leading-tight sm:text-xl ${active ? 'text-[#2c1d18]' : 'text-[#79675f]'}`}>
                {treatment.name}
              </span>
              <span className={`grid size-9 shrink-0 place-items-center rounded-full transition-all duration-500 ease-out ${active ? 'rotate-45 bg-[#d57f6d] text-white' : 'bg-[#f5e9e3] text-[#a66e5e]'}`}>
                <ArrowUpRight className="size-4" />
              </span>
            </button>

            <div className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${active ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="min-h-0 overflow-hidden">
                <div className="grid gap-5 p-5 pt-0 sm:grid-cols-[0.82fr_1.18fr] sm:gap-6 sm:p-6 sm:pt-0">
                <div className="relative min-h-[150px] overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#f3ded4] via-[#e6c1b2] to-[#bd806d] sm:min-h-0">
                  {service?.imageUrl ? (
                    <NextImage
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      sizes="(max-width: 640px) 75vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <span className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/60 bg-white/25 shadow-[12px_18px_30px_rgba(86,49,37,0.15)] backdrop-blur-sm [transform:translate(-50%,-50%)_rotate(-10deg)]" />
                      <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#fff9f5] text-[#bd806d] shadow-xl">
                        <Icon className="size-9" strokeWidth={1.4} />
                      </span>
                      <span className="absolute bottom-4 left-4 rounded-full bg-white/75 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8a5a4d]">Care, considered</span>
                    </>
                  )}
                  {service?.imageUrl && (
                    <span className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8a5a4d]">Care, considered</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#b36f5e]">Made for your smile</p>
                  <h3 className="mt-2 font-serif text-2xl leading-tight tracking-[-0.03em] text-[#2c1d18] sm:text-[1.7rem]">{treatment.summary}</h3>
                  <p className="mt-3 text-xs leading-5 text-[#817068]">{service?.shortDescription || treatment.description}</p>
                  <ul className="mt-4 space-y-2">
                    {treatment.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[10px] leading-4 text-[#67564f]">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#d57f6d]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={service ? `/services/${service.slug}` : '/services'}
                    className="mt-5 inline-flex w-fit items-center gap-2 text-[10px] font-semibold text-[#a65f4f] transition hover:text-[#2c1d18]"
                  >
                    Explore treatment <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
              </div>
            </div>
            {!active && (
              <div className="flex items-center gap-3 px-5 pb-5 text-[#817068] sm:px-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f3ded4] to-[#d8a997] text-[#a66e5e]">
                  <Icon className="size-5" strokeWidth={1.4} />
                </span>
                <p className="line-clamp-2 text-[10px] leading-4">{treatment.description}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
