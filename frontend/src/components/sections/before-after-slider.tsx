'use client';

import NextImage from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MoveHorizontal, Star } from 'lucide-react';
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
  gallery: GalleryImage[];
};

const filters = ['Aesthetic dentistry', 'Orthodontics', 'Implantology', 'Whitening'] as const;
type Filter = (typeof filters)[number];

function matchesFilter(value: string | null, filter: Filter) {
  const text = value?.toLowerCase() ?? '';
  if (!text) return true;
  if (filter === 'Aesthetic dentistry') return /aesthetic|cosmetic|veneer/.test(text);
  if (filter === 'Orthodontics') return /orthodont|align|braces/.test(text);
  if (filter === 'Implantology') return /implant/.test(text);
  return /whiten|bleach/.test(text);
}

function matchesTreatment(value: SmileTransformation['treatment'], filter: Filter) {
  if (filter === 'Aesthetic dentistry') return value === 'Aesthetic';
  if (filter === 'Orthodontics') return value === 'Orthodontics';
  if (filter === 'Implantology') return value === 'Implants';
  return value === 'Aesthetic';
}

export function BeforeAfterSlider({ cases, testimonials, gallery }: Props) {
  const [filter, setFilter] = useState<Filter>(filters[0]);
  const [comparison, setComparison] = useState(52);
  const [storyIndex, setStoryIndex] = useState(0);
  const isDragging = useRef(false);

  const visibleCases = useMemo(
    () => cases.filter((item) => matchesTreatment(item.treatment, filter)),
    [cases, filter],
  );
  const visibleTestimonials = useMemo(
    () => testimonials.filter((story) => matchesFilter(story.service, filter)),
    [testimonials, filter],
  );
  const story = visibleTestimonials[storyIndex];
  const activeCase = visibleCases.length ? visibleCases[storyIndex % visibleCases.length] : undefined;
  const storyImage = gallery.find((image) => /portrait|patient|testimonial/i.test(`${image.title ?? ''} ${image.category ?? ''}`))
    ?? activeCase?.after;

  function moveStory(direction: -1 | 1) {
    setStoryIndex((index) => (index + direction + visibleTestimonials.length) % visibleTestimonials.length);
  }

  function updateComparison(clientX: number, container: HTMLElement) {
    const bounds = container.getBoundingClientRect();
    const percent = ((clientX - bounds.left) / bounds.width) * 100;
    setComparison(Math.max(5, Math.min(95, percent)));
  }

  return (
    <section id="stories" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a66e5e]">Testimonials</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.04em] text-[#2c1d18] sm:text-5xl">Real stories. Real smiles.</h2>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter patient stories by treatment">
            {filters.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => {
                  setFilter(option);
                  setStoryIndex(0);
                  setComparison(52);
                }}
                className={`rounded-full border px-4 py-2.5 text-[10px] transition ${
                  filter === option
                    ? 'border-[#d57f6d] bg-[#d57f6d] text-white'
                    : 'border-[#e7d8d1] bg-white/70 text-[#79675f] hover:border-[#d57f6d]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-9 grid gap-3 lg:grid-cols-[0.86fr_1.28fr_0.72fr]">
          <article className="flex min-h-[410px] flex-col rounded-[1.75rem] bg-[#faf0eb] p-6 sm:min-h-[470px] sm:p-8">
            {story ? (
              <>
                <div className="flex items-center gap-1 text-[#c28866]" aria-label={`${story.rating} out of 5 stars`}>
                  {Array.from({ length: Math.max(0, Math.min(5, story.rating)) }, (_, index) => (
                    <Star key={index} className="size-3.5 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a66e5e]">{story.service || filter}</p>
                <h3 className="mt-3 font-serif text-2xl leading-tight tracking-[-0.03em] text-[#2c1d18] sm:text-3xl">
                  {story.patientName}&apos;s smile, transformed
                </h3>
                <p className="mt-4 text-xs leading-5 text-[#817068]">&ldquo;{story.content}&rdquo;</p>
                <div className="mt-auto border-t border-[#e4d3ca] pt-5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a66e5e]">What we did</p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      'Listened closely to the patient’s goals',
                      'Created a treatment plan around their needs',
                      'Provided thoughtful support at every step',
                    ].map((item) => (
                      <li key={item} className="flex gap-2 text-[10px] leading-4 text-[#67564f]">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#d57f6d]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="my-auto">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a66e5e]">{filter}</p>
                <h3 className="mt-4 font-serif text-3xl leading-tight text-[#2c1d18]">Every smile has a story.</h3>
                <p className="mt-4 text-xs leading-5 text-[#817068]">
                  Patient stories in this treatment category will appear here when available.
                </p>
              </div>
            )}
          </article>

          <div
            className="relative min-h-[410px] touch-pan-y overflow-hidden rounded-[1.75rem] bg-[#eadbd3] sm:min-h-[470px]"
            onPointerDown={(event) => {
              if (!activeCase || event.button !== 0) return;
              isDragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              updateComparison(event.clientX, event.currentTarget);
            }}
            onPointerMove={(event) => {
              if (isDragging.current) updateComparison(event.clientX, event.currentTarget);
            }}
            onPointerUp={() => {
              isDragging.current = false;
            }}
            onPointerCancel={() => {
              isDragging.current = false;
            }}
            onLostPointerCapture={() => {
              isDragging.current = false;
            }}
          >
            {activeCase ? (
              <>
                <NextImage
                  src={activeCase.before.imageUrl}
                  alt={activeCase.before.title ?? `Before ${activeCase.treatment.toLowerCase()} treatment`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}
                >
                  <NextImage
                    src={activeCase.after.imageUrl}
                    alt={activeCase.after.title ?? `After ${activeCase.treatment.toLowerCase()} treatment`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    className="object-cover"
                  />
                </div>
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Before and after image comparison"
                  aria-valuemin={5}
                  aria-valuemax={95}
                  aria-valuenow={Math.round(comparison)}
                  aria-valuetext={`${Math.round(comparison)} percent after image shown`}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                      event.preventDefault();
                      setComparison((value) => Math.max(5, value - 2));
                    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      setComparison((value) => Math.min(95, value + 2));
                    } else if (event.key === 'Home') {
                      event.preventDefault();
                      setComparison(5);
                    } else if (event.key === 'End') {
                      event.preventDefault();
                      setComparison(95);
                    }
                  }}
                  className="absolute inset-y-0 z-10 w-8 -translate-x-1/2 cursor-col-resize outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                  style={{ left: `${comparison}%` }}
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow" />
                  <span aria-hidden="true" className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-[#d57f6d] text-white shadow-lg transition-transform duration-300 hover:scale-105">
                    <MoveHorizontal className="size-4" />
                  </span>
                  <span className="absolute left-1/2 top-[calc(50%+2rem)] -translate-x-1/2 rounded-full bg-[#2c1d18]/75 px-3 py-1.5 text-[9px] font-semibold text-white backdrop-blur">
                    Drag
                  </span>
                </div>
                <span className="pointer-events-none absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-[#49332b]">Before</span>
                <span className="pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-[#49332b]">After</span>
              </>
            ) : (
              <div className="flex min-h-[410px] flex-col items-center justify-center px-8 py-12 text-center sm:min-h-[470px]">
                <span className="grid size-14 place-items-center rounded-full bg-white text-[#c28866]"><MoveHorizontal className="size-6" /></span>
                <h3 className="mt-5 font-serif text-2xl text-[#2c1d18]">A smile in progress.</h3>
                <p className="mt-3 max-w-sm text-xs leading-5 text-[#817068]">Matched before-and-after photos will appear here when they are available.</p>
              </div>
            )}
          </div>

          <aside className="flex min-h-[410px] flex-col overflow-hidden rounded-[1.75rem] bg-white sm:min-h-[470px]">
            <div className="relative min-h-[250px] flex-1 overflow-hidden bg-gradient-to-br from-[#f3ded4] via-[#d8b8a8] to-[#b98270]">
              {storyImage ? (
                <NextImage
                  src={storyImage.imageUrl}
                  alt={storyImage.title ?? 'A smile transformation'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="grid size-28 place-items-center rounded-full border border-white/60 bg-white/25 font-serif text-3xl text-white">
                    {story?.patientName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? '♡'}
                  </span>
                </div>
              )}
              <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-2 text-[9px] font-semibold text-[#67483e]">
                {story?.patientName ?? 'A smile story'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a66e5e]">Real stories</p>
                <p className="mt-1 text-[10px] leading-4 text-[#817068]">Shared with care and permission</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous patient story"
                  disabled={visibleTestimonials.length < 2}
                  onClick={() => moveStory(-1)}
                  className="grid size-9 place-items-center rounded-full border border-[#e7d8d1] transition hover:border-[#d57f6d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="min-w-[2.75rem] text-center text-[9px] font-semibold tabular-nums text-[#75635b]">
                  {visibleTestimonials.length ? `${String(storyIndex + 1).padStart(2, '0')} / ${String(visibleTestimonials.length).padStart(2, '0')}` : '00 / 00'}
                </span>
                <button
                  type="button"
                  aria-label="Next patient story"
                  disabled={visibleTestimonials.length < 2}
                  onClick={() => moveStory(1)}
                  className="grid size-9 place-items-center rounded-full border border-[#e7d8d1] transition hover:border-[#d57f6d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
        <p className="mt-4 inline-flex items-center gap-2 text-[9px] leading-4 text-[#95817a]">
          Patient testimonials and treatment photographs are displayed separately and may not represent the same patient or outcome.
          <a href="#booking" className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#a65f4f]">Start your story <ArrowRight className="size-3" /></a>
        </p>
      </div>
    </section>
  );
}
