import type { Metadata } from 'next';
import { CheckCircle2, Heart, ShieldCheck, Users, Sparkles, Award } from 'lucide-react';
import { site } from '@/config/site';
import { getGallery } from '@/lib/queries';
import type { GalleryImage } from '@/types/api';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { ButtonLink } from '@/components/ui/button-link';
import { CtaBanner } from '@/components/sections/cta-banner';
import { ImageRotator } from '@/components/ui/image-rotator';
import NextImage from 'next/image'; 

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about ${site.name}, our approach to modern dental care and our values.`,
};

const values = [
  {
    icon: Heart,
    title: 'Compassion First',
    text: 'We prioritize patient comfort with gentle techniques, clear explanations, and a relaxing environment.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety & Precision',
    text: 'Hospital-grade sterilization, modern diagnostic technology, and transparent care plans.',
  },
  {
    icon: Users,
    title: 'Family-Centered Care',
    text: 'Comprehensive treatments tailored for children, teens, adults, and seniors under one roof.',
  },
];

const expect = [
  'Clear explanation of every treatment before we start',
  'Honest advice, and only the treatment you actually need',
  'Modern, carefully sterilized equipment & digital scans',
  'Simple online booking that fits seamlessly into your schedule',
];

export default async function AboutPage() {
  const gallery = await getGallery().catch(() => [] as GalleryImage[]);

  return (
    <div className="bg-terracotta-50/30 text-terracotta-900">
      {/* Hero / Page Header */}
      <PageHeader
        eyebrow="About Our Clinic"
        title={`Welcome to ${site.name}`}
        description="A modern, warm, and patient-centered dental clinic built around comfort, trust, and exceptional care."
      />

      {/* Main Story Section with Dynamic Rotating Image Showcase */}
      <section className="py-16 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Narrative */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-terracotta-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta-700">
              <Sparkles className="size-3.5 text-terracotta-500" />
              Our Story & Philosophy
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-terracotta-900">
              Redefining the Dental Experience for Your Smile
            </h2>
            
            <p className="text-lg leading-relaxed text-slate-600">
              Welcome to modern dental care. Our practice was established with one core mission: to eliminate dental anxiety through transparent care, cutting-edge technology, and an unyielding commitment to patient comfort.
            </p>
            
            <p className="text-lg leading-relaxed text-slate-600">
              Whether you are visiting for a routine checkup or complete smile transformation, our team provides personalized attention tailored to your exact needs.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <ButtonLink
                href="/doctors"
                className="bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-lg shadow-terracotta-500/20 rounded-xl px-6 py-3 transition-all"
              >
                Meet Our Specialists
              </ButtonLink>
              <ButtonLink
                href="/appointments"
                variant="outline"
                className="border-terracotta-200 text-terracotta-700 hover:bg-terracotta-100 rounded-xl px-6 py-3"
              >
                Book a Visit
              </ButtonLink>
            </div>
          </div>

          {/* Right Column: Dynamic Auto-changing Gallery Rotator */}
          <div className="relative">
            <ImageRotator images={gallery} intervalMs={5_000} />
            
            {/* Accent Floating Badge */}
            <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 rounded-2xl bg-white p-4 shadow-xl border border-terracotta-100 z-30">
              <div className="grid size-12 place-items-center rounded-xl bg-terracotta-500 text-white">
                <Award className="size-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-terracotta-900">Certified Excellence</p>
                <p className="text-xs text-slate-500">Advanced Pain-Free Dental Tech</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Expectation Box Section */}
      <section className="py-12 bg-white border-y border-terracotta-100/60">
        <Container>
          <div className="rounded-3xl bg-gradient-to-br from-terracotta-100/70 via-terracotta-50/50 to-white p-8 sm:p-12 border border-terracotta-200/50 shadow-sm">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight text-terracotta-900">
                What You Can Expect During Every Visit
              </h3>
              <p className="mt-2 text-slate-600">
                We set a high standard for patient comfort and care transparency.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {expect.map((item) => (
                <div key={item} className="flex gap-3.5 items-start rounded-xl bg-white/80 p-4 shadow-sm border border-terracotta-100/50">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-terracotta-500" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-terracotta-50/50">
        <Container>
          <SectionHeading eyebrow="Core Values" title="What Guides Our Patient Care" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group relative rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-terracotta-100"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-terracotta-100 text-terracotta-500 group-hover:bg-terracotta-500 group-hover:text-white transition-colors duration-300">
                  <Icon className="size-7" />
                </span>
                <h3 className="mt-6 text-xl font-bold text-terracotta-900">{title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {gallery.length > 0 && (
  <section className="py-20 bg-white">
    <Container>
      <SectionHeading eyebrow="Interactive Look" title="Take a Tour of Our Clinic" />
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {gallery.slice(0, 8).map((g, index) => (
          <div
            key={g.id || index}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-terracotta-100 shadow-sm"
          >
            {/* Use NextImage here */}
            <NextImage
              src={g.imageUrl}
              alt={g.title ?? 'Clinic interior view'}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-terracotta-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    </Container>
  </section>
)}

      <CtaBanner />
    </div>
  );
}