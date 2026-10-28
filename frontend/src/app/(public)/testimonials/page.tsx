import type { Metadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowUpRight, BadgeCheck, Quote, Sparkles, Star } from 'lucide-react';
import { getGallery, getServices, getTestimonials } from '@/lib/queries';
import type { GalleryImage, Service, Testimonial } from '@/types/api';
import { Container } from '@/components/ui/container';
import { TestimonialForm } from '@/components/forms/testimonial-form';
import { TransformationGrid, type PatientTransformation } from '@/components/sections/transformation-grid';

export const metadata: Metadata = {
  title: 'Patient Stories',
  description: 'Read patient reviews and explore smile transformations at our clinic.',
};

function getTransformations(images: GalleryImage[]): PatientTransformation[] {
  const groups = new Map<string, { before?: GalleryImage; after?: GalleryImage }>();

  for (const image of images) {
    const text = `${image.title ?? ''} ${image.category ?? ''}`;
    const phase = /\b(before|pre[\s-]?treatment)\b/i.test(text)
      ? 'before'
      : /\b(after|post[\s-]?treatment)\b/i.test(text)
        ? 'after'
        : null;
    if (!phase) continue;

    const clean = (value: string | null) => (value ?? '')
      .replace(/\b(before|after|pre[\s-]?treatment|post[\s-]?treatment)\b/gi, '')
      .replace(/[\s:_/.-]+/g, ' ')
      .trim()
      .toLowerCase();
    const key = `${clean(image.title)}|${clean(image.category)}`;
    const group = groups.get(key) ?? {};
    group[phase] = image;
    groups.set(key, group);
  }

  return Array.from(groups.entries()).flatMap(([id, group]) => {
    if (!group.before || !group.after) return [];
    const treatmentText = `${group.before.title ?? ''} ${group.before.category ?? ''} ${group.after.title ?? ''} ${group.after.category ?? ''}`.toLowerCase();
    const treatment: PatientTransformation['treatment'] =
      /orthodont|align|braces/.test(treatmentText) ? 'Orthodontics'
        : /whiten|bleach/.test(treatmentText) ? 'Whitening'
          : /veneer|aesthetic|cosmetic/.test(treatmentText) ? 'Veneers'
            : 'Other';
    return [{ id, treatment, before: group.before, after: group.after }];
  });
}

export default async function TestimonialsPage() {
  const [testimonials, services, gallery] = await Promise.all([
    getTestimonials().catch(() => [] as Testimonial[]),
    getServices().catch(() => [] as Service[]),
    getGallery().catch(() => [] as GalleryImage[]),
  ]);

  const average = testimonials.length
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    : 0;
  const transformations = getTransformations(gallery);

  return (
    <>
      <section className="bg-[#fdf7f5] px-5 pb-14 pt-16 sm:px-8 sm:pb-16 sm:pt-20 lg:px-12">
        <Container className="grid max-w-[1440px] gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#eadbd3] bg-white/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">
              <Sparkles className="size-3.5 text-[#d57f6d]" />
              Patient stories
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.055em] text-[#2c1d18] sm:text-6xl lg:text-7xl">
              Real patient stories &amp; transformations.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#817068]">
              A glimpse into the experiences and care journeys shared by our patients.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#eadbd3] bg-white p-6 sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b6b5c]">Patient reviews</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-serif text-5xl text-[#2c1d18]">{average.toFixed(1)}</span>
              <span className="pb-1 text-xs text-[#817068]">out of 5</span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[#c28866]" aria-label={`${average.toFixed(1)} out of 5 stars`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={`size-4 ${index < Math.round(average) ? 'fill-current' : ''}`} aria-hidden="true" />
              ))}
              <span className="ml-2 text-[10px] text-[#817068]">{testimonials.length} shared stories</span>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#faf0eb] px-5 py-14 sm:px-8 sm:py-18 lg:px-12">
        <Container className="max-w-[1440px]">
          <TransformationGrid cases={transformations} />
        </Container>
      </section>

      <section className="bg-[#fdf7f5] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <Container className="max-w-[1440px]">
          <div className="mb-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">Words from our community</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#2c1d18] sm:text-4xl">Notes from our patients</h2>
          </div>
          {testimonials.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="flex h-full flex-col rounded-[1.5rem] border border-[#eadbd3] bg-white p-6 shadow-[0_12px_42px_-32px_rgba(70,43,32,0.35)] sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#c28866]" aria-label={`${t.rating} out of 5 stars`}>
                      {Array.from({ length: Math.max(0, Math.min(5, t.rating)) }, (_, index) => (
                        <Star key={index} className="size-3.5 fill-current" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f7eee9] px-2.5 py-1.5 text-[9px] font-medium text-[#8f6254]">
                      <BadgeCheck className="size-3.5 text-[#c28866]" /> Patient review
                    </span>
                  </div>
                  <Quote className="mt-6 size-6 text-[#d57f6d]/60" />
                  <blockquote className="mt-2 flex-1 font-serif text-xl leading-relaxed text-[#2c1d18]">&ldquo;{t.content}&rdquo;</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-[#f0e5df] pt-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f2dfd7] text-sm font-semibold text-[#9b6254]">
                      {t.patientName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 text-xs">
                      <span className="block truncate font-semibold text-[#2c1d18]">{t.patientName}</span>
                      <span className="mt-1 block truncate text-[#817068]">
                        {t.service ? `${t.service} · ` : ''}{format(new Date(t.createdAt), 'MMM yyyy')}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="rounded-[1.75rem] border border-[#eadbd3] bg-white p-8 text-center text-sm text-[#6e5c54]">
              No reviews yet. Be the first to share your experience below.
            </p>
          )}
        </Container>
      </section>

      <section className="bg-[#faf0eb] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <Container className="max-w-2xl">
          <div className="rounded-[1.75rem] border border-[#eadbd3] bg-white p-6 shadow-[0_24px_70px_-45px_rgba(70,43,32,0.4)] sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">Your voice matters</p>
            <h2 className="mt-3 font-serif text-3xl text-[#2c1d18]">Share your experience</h2>
            <p className="mb-6 mt-2 text-sm leading-6 text-[#817068]">
              Reviews are published after a quick check by our team.
            </p>
            <TestimonialForm serviceNames={services.map((s) => s.name)} />
          </div>
        </Container>
      </section>

      <section className="bg-[#fdf7f5] px-5 pb-16 sm:px-8 lg:px-12">
        <Container className="flex max-w-[1440px] flex-col justify-between gap-6 rounded-[1.75rem] bg-[#2c1d18] px-7 py-9 text-white sm:flex-row sm:items-center sm:px-10 sm:py-11">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2a99a]">Your story starts here</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Let&apos;s make time for your smile.</h2>
          </div>
          <Link href="/appointment" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d57f6d] px-6 py-4 text-xs font-semibold text-white transition hover:bg-[#bd6858]">
            Book an appointment <ArrowUpRight className="size-4" />
          </Link>
        </Container>
      </section>
    </>
  );
}