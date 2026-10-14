import type { Metadata } from 'next';
import { format } from 'date-fns';
import { getServices, getTestimonials } from '@/lib/queries';
import type { Service, Testimonial } from '@/types/api';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { Stars } from '@/components/ui/stars';
import { TestimonialForm } from '@/components/forms/testimonial-form';

export const metadata: Metadata = {
  title: 'Patient Reviews',
  description: 'Read what our patients say about their experience.',
};

export default async function TestimonialsPage() {
  const [testimonials, services] = await Promise.all([
    getTestimonials().catch(() => [] as Testimonial[]),
    getServices().catch(() => [] as Service[]),
  ]);

  const average = testimonials.length
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Testimonials"
        title="What our patients say"
        description="Honest words from the people we've had the pleasure of caring for."
      />

      <section className="pb-16">
        <Container>
          {testimonials.length > 0 ? (
            <>
              <div className="mb-10 flex flex-wrap items-center justify-center gap-3 text-slate-600">
                <Stars rating={average} className="[&_svg]:size-6" />
                <span className="text-lg">
                  <strong className="text-slate-900">{average.toFixed(1)}</strong> average from{' '}
                  {testimonials.length} review{testimonials.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
                {testimonials.map((t) => (
                  <figure
                    key={t.id}
                    className="mb-6 break-inside-avoid rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <Stars rating={t.rating} />
                    <blockquote className="mt-4 leading-relaxed text-slate-700">{t.content}</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                        {t.patientName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm">
                        <span className="block font-semibold text-slate-900">{t.patientName}</span>
                        <span className="text-slate-500">
                          {t.service ? `${t.service} · ` : ''}
                          {format(new Date(t.createdAt), 'MMM yyyy')}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
              No reviews yet. Be the first to share your experience below.
            </p>
          )}
        </Container>
      </section>

      <section className="bg-slate-50 py-16">
        <Container className="max-w-2xl">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Share your experience</h2>
            <p className="mb-6 mt-1 text-sm text-slate-600">
              Reviews are published after a quick check by our team.
            </p>
            <TestimonialForm serviceNames={services.map((s) => s.name)} />
          </div>
        </Container>
      </section>
    </>
  );
}