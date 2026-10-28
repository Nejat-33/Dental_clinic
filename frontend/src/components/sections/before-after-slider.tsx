'use client';

import NextImage from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowRight, Heart, MoveHorizontal, Star } from 'lucide-react';
import type { GalleryImage, Testimonial } from '@/types/api';

export type SmileTransformation = {
  id: string;
  treatment: 'Aesthetic' | 'Orthodontics' | 'Implants' | 'Other';
  before: GalleryImage;
  after: GalleryImage;
};

type Props = {
  cases: SmileTransformation[];
  testimonials: Testimonial[];
};

const filters = ['All stories', 'Aesthetic', 'Orthodontics', 'Implants'] as const;
type Filter = (typeof filters)[number];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function matchesFilter(value: string | null, filter: Filter) {
  if (filter === 'All stories') return true;
  const text = value?.toLowerCase() ?? '';
  if (filter === 'Aesthetic') return /aesthetic|cosmetic|whiten|veneer/.test(text);
  if (filter === 'Orthodontics') return /orthodont|align|braces/.test(text);
  return /implant/.test(text);
}

export function BeforeAfterSlider({ cases, testimonials }: Props) {
  const [filter, setFilter] = useState<Filter>('All stories');
  const [comparison, setComparison] = useState(52);

  const visibleCases = useMemo(
    () => cases.filter((item) => filter === 'All stories' || item.treatment === filter),
    [cases, filter],
  );
  const activeCase = visibleCases[0];
  const visibleTestimonials = testimonials.filter((story) => matchesFilter(story.service, filter));
  const story = visibleTestimonials[0];

  return (
    <section id="stories" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a66e5e]">Notes from our patients</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">Real stories. Real smiles.</h2>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter patient stories by treatment">
            {filters.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => {
                  setFilter(option);
                  setComparison(52);
                }}
                className={`rounded-full border px-4 py-2.5 text-[10px] transition ${
                  filter === option
                    ? 'border-[#2c1d18] bg-[#2c1d18] text-white'
                    : 'border-[#e7d8d1] text-[#79675f] hover:border-[#d57f6d]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] bg-[#faf0eb] sm:min-h-[430px]">
            {activeCase ? (
              <>
                <NextImage
                  src={activeCase.after.imageUrl}
                  alt={activeCase.after.title ?? `After ${activeCase.treatment.toLowerCase()} treatment`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}
                  aria-hidden="true"
                >
                  <NextImage
                    src={activeCase.before.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                  />
                </div>
                <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${comparison}%` }}>
                  <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-[#d57f6d] text-white shadow-lg">
                    <MoveHorizontal className="size-4" />
                  </span>
                </div>
                <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider">Before</span>
                <span className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider">After</span>
                <label className="absolute inset-x-0 bottom-5 mx-auto flex w-[min(calc(100%-2.5rem),24rem)] items-center gap-3 rounded-full border border-white/40 bg-[#2c1d18]/60 px-4 py-3 text-white backdrop-blur-md">
                  <span className="sr-only">Compare before and after treatment photos</span>
                  <span aria-hidden="true" className="text-[9px]">Before</span>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={comparison}
                    onChange={(event) => setComparison(Number(event.target.value))}
                    className="h-1 w-full cursor-ew-resize accent-white"
                  />
                  <MoveHorizontal className="size-3.5 shrink-0" aria-hidden="true" />
                  <span aria-hidden="true" className="text-[9px]">After</span>
                </label>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-8 py-12 text-center sm:min-h-[430px]">
                <span className="grid size-14 place-items-center rounded-full bg-white text-[#c28866]">
                  <Heart className="size-6" />
                </span>
                <h3 className="mt-5 font-serif text-2xl">Transformation stories are on their way.</h3>
                <p className="mt-3 max-w-sm text-xs leading-5 text-[#817068]">
                  Before-and-after comparisons will appear here once the clinic publishes matched treatment photos.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-[1.75rem] bg-[#faf0eb] p-7 sm:p-10">
            {story ? (
              <>
                <div>
                  <div className="flex items-center gap-1 text-[#c28866]" aria-label={`${story.rating} out of 5 stars`}>
                    {Array.from({ length: Math.max(0, Math.min(5, story.rating)) }, (_, index) => (
                      <Star key={index} className="size-3.5 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="mt-7 font-serif text-2xl leading-relaxed tracking-tight sm:text-3xl">&ldquo;{story.content}&rdquo;</p>
                </div>
                <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#e4d3ca] pt-5">
                  <div>
                    <p className="text-sm font-semibold">{story.patientName}</p>
                    <p className="mt-1 text-[10px] text-[#8c7770]">{story.service || 'A visit at our clinic'}</p>
                  </div>
                  <span className="grid size-12 place-items-center rounded-full bg-[#d8b7a8] text-sm font-semibold text-white">
                    {initials(story.patientName)}
                  </span>
                </div>
                <p className="mt-5 text-[9px] leading-4 text-[#95817a]">
                  Patient stories and treatment photos are shared separately and do not necessarily represent the same patient or outcome.
                </p>
              </>
            ) : (
              <>
                <div>
                  <span className="grid size-12 place-items-center rounded-full bg-white text-[#c28866]">
                    <Heart className="size-5" />
                  </span>
                  <h3 className="mt-7 font-serif text-3xl tracking-tight">Every smile has a story.</h3>
                  <p className="mt-4 max-w-md text-sm leading-6 text-[#817068]">
                    We believe the best care starts with listening. Patient stories in this treatment category will appear here when available.
                  </p>
                </div>
                <a href="#booking" className="mt-8 inline-flex w-fit items-center gap-2 text-xs font-semibold text-[#a65f4f]">
                  Start your story <ArrowRight className="size-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
