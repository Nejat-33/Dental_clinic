'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import { BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Doctor } from '@/types/api';

type Props = {
  doctors: Doctor[];
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function yearsPracticing(experience: string | null) {
  if (!experience) return 'Experienced clinician';

  const duration = experience.match(/(\d+)\s*(\+?)\s*(?:years?|yrs?)/i);
  if (duration) return `${duration[1]}${duration[2]} years practicing`;

  const range = experience.match(/\b(19\d{2}|20\d{2})\s*[-–]\s*(19\d{2}|20\d{2})\b/);
  if (range) return `${Math.max(1, Number(range[2]) - Number(range[1]))}+ years practicing`;

  const startingYear = experience.match(/\b(?:since|from)\s+(19\d{2}|20\d{2})\b/i)?.[1];
  if (startingYear) return `Practicing since ${startingYear}`;

  return 'Experienced clinician';
}

function isSeedPlaceholderImage(imageUrl: string | null) {
  return imageUrl?.startsWith('/images/') ?? false;
}

export default function SpecialistsCarousel({ doctors }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeDoctor = doctors[activeIndex];

  function move(direction: -1 | 1) {
    setActiveIndex((index) => (index + direction + doctors.length) % doctors.length);
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-stretch lg:gap-12">
      <div className="flex flex-col justify-center py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a66e5e]">Your care, in good hands</p>
        <h2 className="mt-4 max-w-lg font-serif text-4xl leading-[1.06] tracking-[-0.045em] text-[#2c1d18] sm:text-5xl">
          Meet the minds behind your smile
        </h2>
        <p className="mt-5 max-w-md text-sm leading-6 text-[#817068]">
          A thoughtful team of clinicians brings expertise and a personal touch to every step of your care.
        </p>
        <div className="mt-7 flex items-center gap-4">
          <div className="flex -space-x-3" aria-label={`${doctors.length} specialists`}>
            {doctors.slice(0, 3).map((doctor) => (
              <span key={doctor.id} className="grid size-11 place-items-center overflow-hidden rounded-full border-2 border-[#fdf7f5] bg-[#eadbd3] text-[10px] font-semibold text-[#6d5147]">
                {doctor.imageUrl && !isSeedPlaceholderImage(doctor.imageUrl) ? (
                  <NextImage src={doctor.imageUrl} alt="" width={44} height={44} className="size-full object-cover" />
                ) : initials(doctor.name)}
              </span>
            ))}
            <span className="grid size-11 place-items-center rounded-full border-2 border-[#fdf7f5] bg-[#d57f6d] text-[10px] font-semibold text-white">
              +{Math.max(0, doctors.length - 3)}
            </span>
          </div>
          <p className="text-[10px] leading-4 text-[#8b7971]">A team of {doctors.length} specialists<br />here for your smile</p>
        </div>
        <Link
          href="/doctors"
          className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[#d57f6d] px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-[#bd6858]"
        >
          View all specialists <span aria-hidden="true">→</span>
        </Link>
        <div className="mt-8 flex items-center gap-4" aria-label="Specialists carousel controls">
          <button
            type="button"
            aria-label="Previous specialist"
            disabled={doctors.length < 2}
            onClick={() => move(-1)}
            className="grid size-10 place-items-center rounded-full border border-[#e7d8d1] transition hover:border-[#d57f6d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[3.5rem] text-center text-[10px] font-semibold tabular-nums text-[#75635b]">
            {doctors.length ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(doctors.length).padStart(2, '0')}` : '00 / 00'}
          </span>
          <button
            type="button"
            aria-label="Next specialist"
            disabled={doctors.length < 2}
            onClick={() => move(1)}
            className="grid size-10 place-items-center rounded-full border border-[#e7d8d1] transition hover:border-[#d57f6d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {activeDoctor ? (
        <article className="group relative min-h-[420px] overflow-hidden rounded-[2rem] bg-[#e7d5cb] sm:min-h-[520px]">
          {activeDoctor.imageUrl && !isSeedPlaceholderImage(activeDoctor.imageUrl) ? (
            <NextImage
              key={activeDoctor.id}
              src={activeDoctor.imageUrl}
              alt={activeDoctor.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#eadbd3] via-[#d8b8a8] to-[#b98270]">
              <span className="grid size-40 place-items-center rounded-full border border-white/60 bg-white/20 font-serif text-5xl text-white backdrop-blur">{initials(activeDoctor.name)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#271a16]/75 via-transparent to-[#271a16]/10" />
          <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2.5 text-[10px] font-semibold text-[#67483e] shadow-sm">
            {activeDoctor.specialization || 'Dental specialist'}
          </span>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-9">
            <div className="max-w-lg">
              <h3 className="font-serif text-3xl tracking-tight sm:text-4xl">{activeDoctor.name}</h3>
              <p className="mt-2 text-xs leading-5 text-white/80">{activeDoctor.bio || `Focused on ${activeDoctor.specialization.toLowerCase()} and care that feels personal.`}</p>
              <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-medium text-white/90">
                <BadgeCheck className="size-4 text-[#e9b9a7]" />
                {yearsPracticing(activeDoctor.experience)}
              </p>
            </div>
            <Link href="#booking" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/50 px-5 py-3 text-[10px] font-semibold text-white transition hover:bg-white hover:text-[#2c1d18]">
              Meet your specialist <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] bg-white p-8 text-center">
          <div>
            <h3 className="font-serif text-2xl">A team shaped around you.</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#817068]">Our specialists will help you find the right care for your smile.</p>
            <Link href="/doctors" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#a65f4f]">Meet our specialists ↗</Link>
          </div>
        </div>
      )}
    </div>
  );
}
