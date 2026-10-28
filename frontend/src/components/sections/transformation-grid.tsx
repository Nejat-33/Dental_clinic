'use client';

import NextImage from 'next/image';
import { MoveHorizontal, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { GalleryImage } from '@/types/api';

export type PatientTransformation = {
  id: string;
  treatment: 'Veneers' | 'Orthodontics' | 'Whitening' | 'Other';
  before: GalleryImage;
  after: GalleryImage;
};

const filters = ['All', 'Veneers', 'Orthodontics', 'Whitening'] as const;
type Filter = (typeof filters)[number];

export function TransformationGrid({ cases }: { cases: PatientTransformation[] }) {
  const [filter, setFilter] = useState<Filter>('All');
  const [positions, setPositions] = useState<Record<string, number>>({});
  const visibleCases = cases.filter((item) => filter === 'All' || item.treatment === filter);

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">Care in pictures</p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#2c1d18] sm:text-4xl">Before &amp; after</h2>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter transformations by treatment">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`rounded-full border px-4 py-2.5 text-[10px] font-medium transition ${
                filter === option
                  ? 'border-[#2c1d18] bg-[#2c1d18] text-white'
                  : 'border-[#e7d8d1] bg-white text-[#79675f] hover:border-[#d57f6d]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {visibleCases.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleCases.map((item) => {
            const comparison = positions[item.id] ?? 52;
            const label = item.before.title
              ?.replace(/\b(before|pre[\s-]?treatment)\b/gi, '')
              .replace(/[\s:_/.-]+/g, ' ')
              .trim();

            return (
              <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-[#eadbd3] bg-white shadow-[0_12px_42px_-32px_rgba(70,43,32,0.35)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f7e9e3]">
                  <NextImage
                    src={item.after.imageUrl}
                    alt={item.after.title ?? `After ${item.treatment.toLowerCase()} treatment`}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}
                    aria-hidden="true"
                  >
                    <NextImage
                      src={item.before.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${comparison}%` }}>
                    <span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#d57f6d] text-white shadow">
                      <MoveHorizontal className="size-3.5" />
                    </span>
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-[#fdf7f5]/95 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5b453d]">Before</span>
                  <span className="absolute right-3 top-3 rounded-full bg-[#fdf7f5]/95 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5b453d]">After</span>
                  <label className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-full border border-white/40 bg-[#2c1d18]/65 px-3 py-2.5 text-white backdrop-blur-md">
                    <span className="sr-only">Compare before and after photos</span>
                    <span aria-hidden="true" className="text-[9px]">Before</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={comparison}
                      onChange={(event) => setPositions((current) => ({ ...current, [item.id]: Number(event.target.value) }))}
                      className="h-1 w-full cursor-ew-resize accent-white"
                    />
                    <span aria-hidden="true" className="text-[9px]">After</span>
                  </label>
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-serif text-lg text-[#2c1d18]">{label || `${item.treatment} transformation`}</h3>
                    <p className="mt-1 text-[10px] font-medium text-[#8f6254]">{item.treatment}</p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#faf0eb] text-[#c28866]">
                    <Sparkles className="size-4" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.5rem] border border-[#eadbd3] bg-white px-6 py-10 text-center">
          <p className="font-serif text-2xl text-[#2c1d18]">
            {cases.length ? `No ${filter.toLowerCase()} transformations yet.` : 'Transformation stories are on their way.'}
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#817068]">
            Matched before-and-after photos will appear here once they are shared by the clinic.
          </p>
        </div>
      )}
    </div>
  );
}
