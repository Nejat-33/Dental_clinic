'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage } from '@/types/api';

interface ImageRotatorProps {
  images: GalleryImage[];
  intervalMs?: number;
}

export function ImageRotator({ images, intervalMs = 5_000 }: ImageRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl bg-brand-100 text-brand-700">
        No images available
      </div>
    );
  }

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div
      className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/70 bg-brand-100 shadow-2xl shadow-brand-900/10"
      aria-label="Clinic photo slideshow"
    >
      {images.map((img, idx) => (
        <div
          key={img.id || idx}
          aria-hidden={idx !== currentIndex}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
            idx === currentIndex ? 'z-10 opacity-100' : 'z-0 opacity-0'
          }`}
        >
          <NextImage
            src={img.imageUrl}
            alt={img.title ?? 'Inside our dental clinic'}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            preload={idx === 0}
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#342522]/55 via-transparent to-transparent" />
          {img.title && (
            <p className="absolute bottom-7 left-7 z-10 max-w-[75%] text-lg font-semibold text-white drop-shadow sm:text-xl">
              {img.title}
            </p>
          )}
        </div>
      ))}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/60 bg-white/75 p-3 text-brand-900 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={nextImage}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/60 bg-white/75 p-3 text-brand-900 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full border border-white/20 bg-brand-900/35 px-3 py-2 backdrop-blur-md">
            {images.map((_, idx) => (
              <button
                key={images[idx].id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Show photo ${idx + 1}`}
                aria-current={idx === currentIndex}
                className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  idx === currentIndex ? 'w-7 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}