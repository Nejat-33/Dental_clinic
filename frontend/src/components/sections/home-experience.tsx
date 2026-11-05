'use client';

import NextImage from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  MoveHorizontal,
  Phone,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import { site } from '@/config/site';
import { BookingForm } from '@/components/forms/booking-form';
import { BeforeAfterSlider, type SmileTransformation } from '@/components/sections/before-after-slider';
import ServiceExpander from '@/components/sections/service-expander';
import SmileEstimator from '@/components/sections/smile-estimator';
import SpecialistsCarousel from '@/components/sections/specialists-carousel';
import type { Doctor, GalleryImage, Service, Testimonial } from '@/types/api';

type Props = {
  services: Service[];
  doctors: Doctor[];
  testimonials: Testimonial[];
  gallery: GalleryImage[];
};

const goals = [
  'Straighter teeth',
  'Replace a missing tooth',
  'A brighter smile',
  'Complete makeover',
] as const;
const methods = ['Aligners', 'Veneers', 'Implants'] as const;
const loyaltyPlans = ['First visit', 'Returning patient', 'Smile Circle member'] as const;

function classifyTreatment(value: string): SmileTransformation['treatment'] {
  const normalized = value.toLowerCase();
  if (/implant/.test(normalized)) return 'Implants';
  if (/orthodont|align|braces/.test(normalized)) return 'Orthodontics';
  if (/aesthetic|cosmetic|whiten|veneer/.test(normalized)) return 'Aesthetic';
  return 'Other';
}

function imagePhase(image: GalleryImage): 'before' | 'after' | null {
  const text = `${image.title ?? ''} ${image.category ?? ''}`;
  if (/\b(before|pre[\s-]?treatment)\b/i.test(text)) return 'before';
  if (/\b(after|post[\s-]?treatment)\b/i.test(text)) return 'after';
  return null;
}

function cleanImageLabel(value: string | null) {
  return (value ?? '')
    .replace(/\b(before|after|pre[\s-]?treatment|post[\s-]?treatment)\b/gi, '')
    .replace(/[\s:_/.-]+/g, ' ')
    .trim()
    .toLowerCase();
}

function isSeedPlaceholderImage(imageUrl: string | null | undefined) {
  return imageUrl?.startsWith('/images/') ?? false;
}

export default function HomeExperience({ services, doctors, testimonials, gallery }: Props) {
  const [goal, setGoal] = useState<(typeof goals)[number]>(goals[0]);
  const [method, setMethod] = useState<(typeof methods)[number]>(methods[0]);
  const [loyalty, setLoyalty] = useState<(typeof loyaltyPlans)[number]>(loyaltyPlans[0]);
  const [previewAngle, setPreviewAngle] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  const availableGallery = useMemo(
    () => gallery.filter((image) => !isSeedPlaceholderImage(image.imageUrl)),
    [gallery],
  );

  const heroImages = useMemo(() => {
    const images = availableGallery.length ? availableGallery : services
      .filter((service) => service.imageUrl && !isSeedPlaceholderImage(service.imageUrl))
      .map((service) => ({
        id: service.id,
        title: service.name,
        imageUrl: service.imageUrl!,
        category: null,
      }));
    return images.length ? images : [{
      id: 'clinic-preview',
      title: 'Care designed around you',
      imageUrl: '/smile-illustration.svg',
      category: null,
    }];
  }, [availableGallery, services]);

  const transformations = useMemo(() => {
    const groups = new Map<string, { before?: GalleryImage; after?: GalleryImage; treatment: SmileTransformation['treatment'] }>();

    availableGallery.forEach((image) => {
      const phase = imagePhase(image);
      if (!phase) return;

      const titleKey = cleanImageLabel(image.title);
      const categoryKey = cleanImageLabel(image.category);
      const key = `${titleKey}|${categoryKey}`;
      const group = groups.get(key) ?? {
        treatment: classifyTreatment(`${image.title ?? ''} ${image.category ?? ''}`),
      };
      group[phase] = image;
      groups.set(key, group);
    });

    return Array.from(groups.entries()).flatMap(([id, group]) => (
      group.before && group.after
        ? [{ id, treatment: group.treatment, before: group.before, after: group.after }]
        : []
    ));
  }, [availableGallery]);

  useEffect(() => {
    if (heroImages.length < 2) return;
    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  const estimate = useMemo(() => {
    let min = 12_000;
    let max = 38_000;
    let time = '2–4 visits';
    let complexity = 42;
    let specialist = 'Aesthetic dentist';
    let methodNote = `${method} is an initial preference; your clinician will confirm whether it suits your goals.`;

    if (goal === 'Straighter teeth') {
      min = 28_000;
      max = 62_000;
      time = '6–18 months';
      complexity = 64;
      specialist = 'Orthodontist';
      if (method === 'Veneers') {
        min = 22_000;
        max = 60_000;
        time = '2–4 visits';
        complexity = 56;
        specialist = 'Aesthetic dentist';
      } else if (method === 'Implants') {
        methodNote = 'Implants are not typically used to straighten teeth. Ask your clinician about suitable options.';
      }
    }
    if (goal === 'Replace a missing tooth') {
      min = 45_000;
      max = 90_000;
      time = '3–6 months';
      complexity = 78;
      specialist = 'Implant specialist';
      if (method !== 'Implants') {
        methodNote = 'Implants are the usual option for replacing a missing tooth; your clinician can discuss alternatives.';
      }
    }
    if (goal === 'A brighter smile') {
      min = 8_000;
      max = 20_000;
      time = '1–2 visits';
      complexity = 24;
      specialist = 'Aesthetic dentist';
      if (method === 'Veneers') {
        min = 20_000;
        max = 48_000;
        time = '2–4 visits';
        complexity = 52;
      } else {
        methodNote = `${method} is not typically used for tooth whitening. Ask your clinician about suitable options.`;
      }
    }
    if (goal === 'Complete makeover') {
      min = 55_000;
      max = 120_000;
      time = '4–8 visits';
      complexity = 86;
      specialist = 'Multidisciplinary team';
    }
    return { min, max, time, complexity, specialist, methodNote };
  }, [goal, method]);

  return (
    <>
        <section id="about" className="scroll-mt-24 px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16 lg:px-12 lg:pt-20">
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
            <div className="max-w-[570px]">
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eadbd3] bg-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">
                <span className="size-1.5 rounded-full bg-[#d57f6d]" />
                A new kind of dental care
              </p>
              <h1 className="font-serif text-[clamp(3.2rem,7.4vw,6.6rem)] leading-[0.92] tracking-[-0.065em] text-[#2c1d18]">
                Not all smiles need fixing.
                <span className="mt-2 block italic text-[#d57f6d]">Some need vision.</span>
              </h1>
              <p className="mt-7 max-w-md text-base leading-7 text-[#7b6961] sm:text-lg sm:leading-8">
                Luxury care, made personal. Thoughtful dentistry for the smile you have — and the one you imagine.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#services" className="group inline-flex items-center gap-3 rounded-full bg-[#2c1d18] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#49332b]">
                  Explore treatments
                  <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                </a>
                <a href="#booking" className="inline-flex items-center gap-2 rounded-full border border-[#d57f6d] bg-[#fdf7f5] px-5 py-4 text-sm font-semibold text-[#9b5b4d] transition hover:bg-[#d57f6d] hover:text-white">
                  <CalendarDays className="size-4" />
                  Book Appointment
                </a>
              </div>
              <div className="mt-12 flex items-center gap-4 border-t border-[#e9ddd7] pt-6">
                <div className="flex -space-x-3" aria-hidden="true">
                  {['A', 'M', 'S'].map((initial, index) => (
                    <span key={initial} className={`grid size-10 place-items-center rounded-full border-2 border-[#fdf7f5] text-xs font-semibold text-white ${index === 0 ? 'bg-[#bd806d]' : index === 1 ? 'bg-[#92796a]' : 'bg-[#c89f80]'}`}>
                      {initial}
                    </span>
                  ))}
                  <span className="grid size-10 place-items-center rounded-full border-2 border-[#fdf7f5] bg-white text-[#76645d]"><Plus className="size-3.5" /></span>
                </div>
                <div>
                  <p className="text-xs font-semibold">Care that feels considered</p>
                  <p className="mt-1 text-[11px] text-[#8b7971]">One smile, one thoughtful plan at a time</p>
                </div>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="absolute -left-7 top-14 z-10 hidden max-w-[170px] rounded-2xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-[#5b3b2e]/10 backdrop-blur-lg md:block">
                <div className="flex items-center gap-2 text-[#c28866]"><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /></div>
                <p className="mt-2 text-xs font-semibold">A softer kind of dentistry</p>
                <p className="mt-1 text-[10px] leading-4 text-[#86736b]">Personal care, with every detail in mind.</p>
              </div>
              <div className="relative aspect-[1.05/1] overflow-hidden rounded-[2rem] bg-[#eadbd3] sm:aspect-[1.25/1] lg:rounded-[2.5rem]">
                {heroImages.map((image, index) => (
                  <div key={image.id} aria-hidden={index !== heroIndex} className={`absolute inset-0 transition-opacity duration-1000 ${index === heroIndex ? 'opacity-100' : 'opacity-0'}`}>
                    <NextImage
                      src={image.imageUrl}
                      alt={image.title ?? 'A glimpse of thoughtful dental care'}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-[#271a16]/55 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-8">
                  <div className="text-white">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/75">A little more at ease</p>
                    <p className="mt-2 text-xl font-medium sm:text-2xl">{heroImages[heroIndex]?.title ?? 'Care made personal'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" aria-label="Previous clinic image" onClick={() => setHeroIndex((heroIndex - 1 + heroImages.length) % heroImages.length)} className="grid size-10 place-items-center rounded-full border border-white/50 bg-black/10 text-white backdrop-blur transition hover:bg-white hover:text-[#2c1d18]">
                      <ChevronLeft className="size-4" />
                    </button>
                    <button type="button" aria-label="Next clinic image" onClick={() => setHeroIndex((heroIndex + 1) % heroImages.length)} className="grid size-10 place-items-center rounded-full border border-white/50 bg-black/10 text-white backdrop-blur transition hover:bg-white hover:text-[#2c1d18]">
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 right-5 flex items-center gap-2 rounded-full border border-white/70 bg-[#fdf7f5]/90 px-4 py-3 text-xs font-medium shadow-lg backdrop-blur sm:right-8">
                <Heart className="size-3.5 text-[#d57f6d]" /> Your comfort comes first
              </div>
            </div>
          </div>
          <div className="mx-auto mt-20 grid max-w-[1440px] grid-cols-2 gap-6 border-t border-[#e9ddd7] pt-7 sm:grid-cols-4">
            {[
              ['01', 'Listen first', 'Your goals guide every plan'],
              ['02', 'Thoughtful care', 'Expertise, without the rush'],
              ['03', 'Modern comfort', 'A calmer visit by design'],
              ['04', 'Made for you', 'Care that feels personal'],
            ].map(([number, title, caption]) => (
              <div key={number} className="flex gap-3">
                <span className="pt-0.5 text-[10px] tracking-widest text-[#c28866]">{number}</span>
                <div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-[10px] text-[#8b7971]">{caption}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="scroll-mt-20 bg-[#faf0eb] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a66e5e]">Services</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.04em] text-[#2c1d18] sm:text-5xl">Expert care for every smile</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#817068]">Personalized treatments, considered in every detail and shaped around what matters to you.</p>
            </div>
            <ServiceExpander services={services} />
            <div className="mt-8 text-center">
              <a href="#booking" className="inline-flex items-center gap-2 rounded-full bg-[#d57f6d] px-7 py-4 text-xs font-semibold text-white transition hover:bg-[#bd6858]">
                Schedule a visit <CalendarDays className="size-4" />
              </a>
            </div>
          </div>
        </section>

        <section id="specialists" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <SpecialistsCarousel doctors={doctors} />
            <SmileEstimator />
          </div>
        </section>

        <section id="calculator" className="scroll-mt-20 bg-[#2c1d18] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e2a99a]">A first step, made simple</p>
                <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">Your smile journey, imagined.</h2>
              </div>
              <p className="max-w-sm text-xs leading-5 text-white/55">Explore a starting point for your treatment. Your specialist will tailor the final plan and estimate after a consultation.</p>
            </div>
            <div className="mt-10 grid gap-3 lg:grid-cols-[1fr_0.85fr_1fr]">
              <div className="space-y-3">
                <fieldset className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <legend className="px-2 text-xs font-semibold">01 <span className="ml-2 text-white/55">What would you love to change?</span></legend>
                  <div className="mt-3 grid gap-2">
                    {goals.map((option) => (
                      <label key={option} className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-xs transition ${goal === option ? 'bg-[#d57f6d] text-white' : 'text-white/65 hover:bg-white/[0.07]'}`}>
                        <span>{option}</span>
                        <input type="radio" name="smile-goal" value={option} checked={goal === option} onChange={() => setGoal(option)} className="size-4 accent-[#2c1d18]" />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <legend className="px-2 text-xs font-semibold">02 <span className="ml-2 text-white/55">Your preferred method</span></legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {methods.map((option) => (
                      <button key={option} type="button" aria-pressed={method === option} onClick={() => setMethod(option)} className={`rounded-full border px-4 py-2.5 text-[11px] transition ${method === option ? 'border-[#d57f6d] bg-[#d57f6d] text-white' : 'border-white/15 text-white/65 hover:border-white/40'}`}>{option}</button>
                    ))}
                  </div>
                </fieldset>
                <label className="block rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <span className="block text-xs font-semibold">03 <span className="ml-2 text-white/55">Loyalty programme</span></span>
                  <span className="relative mt-3 block">
                    <select value={loyalty} onChange={(event) => setLoyalty(event.target.value as (typeof loyaltyPlans)[number])} className="w-full appearance-none rounded-xl border border-white/10 bg-[#382721] px-4 py-3 pr-10 text-xs text-white outline-none focus:border-[#d57f6d]">
                      {loyaltyPlans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-white/50" />
                  </span>
                </label>
              </div>

              <div className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#60473c] via-[#392820] to-[#281c17] p-6">
                <div className="absolute size-64 rounded-full border border-white/10" />
                <div className="absolute size-48 rounded-full border border-white/10" />
                <div className="absolute size-32 rounded-full border border-white/10" />
                <div className="relative flex size-40 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] shadow-[0_0_70px_rgba(213,127,109,0.16)]" style={{ transform: `perspective(700px) rotateY(${previewAngle}deg)`, transition: 'transform 300ms ease-out' }}>
                  <NextImage src={availableGallery[0]?.imageUrl ?? '/smile-illustration.svg'} alt="Illustrated preview of a smile treatment" width={240} height={240} className="size-32 rounded-full object-cover opacity-90" />
                  <span className="absolute -right-2 top-7 grid size-8 place-items-center rounded-full bg-[#d57f6d]"><Sparkles className="size-3.5" /></span>
                </div>
                <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-white/50">Your smile, in focus</p>
                <label className="mt-4 flex w-full max-w-[200px] items-center gap-3 text-[10px] text-white/45">
                  <MoveHorizontal className="size-3.5 shrink-0" />
                  <input aria-label="Rotate smile preview" type="range" min="-180" max="180" value={previewAngle} onChange={(event) => setPreviewAngle(Number(event.target.value))} className="h-1 w-full accent-[#d57f6d]" />
                  <span>360°</span>
                </label>
              </div>

              <div className="flex flex-col rounded-[1.5rem] bg-[#faf0eb] p-6 text-[#2c1d18] sm:p-7">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b6b5c]">Your starting estimate</p>
                  <span className="rounded-full bg-[#ead6cd] px-3 py-1.5 text-[9px] font-medium text-[#855949]">Planning only</span>
                </div>
                <div className="mt-5 flex items-center gap-5">
                  <div className="relative grid size-[92px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#d57f6d ${estimate.complexity}%, #e8d8d1 ${estimate.complexity}% 100%)` }}>
                    <span className="grid size-[72px] place-items-center rounded-full bg-[#faf0eb] text-center">
                      <span><span className="block text-lg font-semibold">{estimate.complexity}</span><span className="text-[8px] uppercase tracking-wider text-[#89776f]">complexity</span></span>
                    </span>
                  </div>
                  <div><p className="text-[10px] text-[#89776f]">Estimated journey</p><p className="mt-1 text-lg font-semibold">{estimate.time}</p></div>
                </div>
                <div className="mt-6 space-y-3 border-t border-[#e5d4cb] pt-5 text-[11px]">
                  <div className="flex justify-between gap-3"><span className="text-[#85716a]">Recommended specialist</span><span className="text-right font-semibold">{estimate.specialist}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-[#85716a]">Selected method</span><span className="text-right font-semibold">{method}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-[#85716a]">Patient status</span><span className="text-right font-semibold">{loyalty}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-[#85716a]">Estimated range</span><span className="text-right font-semibold">{estimate.min.toLocaleString()}–{estimate.max.toLocaleString()} ETB</span></div>
                  <p className="pt-1 text-[9px] leading-4 text-[#94827b]">{estimate.methodNote}</p>
                  <p className="pt-1 text-[9px] leading-4 text-[#94827b]">Illustrative planning range only, not a clinic quote or guaranteed fee. Your clinician will confirm the plan and price after an examination. Loyalty benefits are confirmed by the clinic.</p>
                </div>
                <a href="#booking" className="mt-auto inline-flex items-center justify-between rounded-full bg-[#2c1d18] px-5 py-4 text-xs font-semibold text-white transition hover:bg-[#49332b]">
                  Talk through your options <ArrowUpRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <BeforeAfterSlider cases={transformations} testimonials={testimonials} gallery={availableGallery} />

        <section id="booking" className="scroll-mt-20 bg-[#faf0eb] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a66e5e]">Your first step</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">Let&apos;s make time for you.</h2>
              <p className="mt-4 text-sm leading-6 text-[#817068]">Share a few details and choose a time that works. Our team will be in touch to confirm your visit.</p>
            </div>
            {services.length ? (
              <div className="rounded-[1.75rem] border border-[#ecdfd9] bg-[#fdf7f5] p-4 shadow-sm sm:p-7">
                <BookingForm services={services} />
              </div>
            ) : (
              <div className="mx-auto max-w-xl rounded-[1.75rem] border border-[#ecdfd9] bg-[#fdf7f5] p-8 text-center">
                <p className="text-sm leading-6 text-[#817068]">Online booking is temporarily unavailable. Please call us and we&apos;ll be happy to help.</p>
                <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2c1d18] px-6 py-4 text-xs font-semibold text-white"><Phone className="size-4" /> Call {site.phone}</a>
              </div>
            )}
          </div>
        </section>

    </>
  );
}
