import type { Metadata } from 'next';
import Image from 'next/image';
import { CheckCircle2, Heart, ShieldCheck, Users } from 'lucide-react';
import { site } from '@/config/site';
import { getGallery } from '@/lib/queries';
import type { GalleryImage } from '@/types/api';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { ButtonLink } from '@/components/ui/button-link';
import { CtaBanner } from '@/components/sections/cta-banner';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about ${site.name}, our approach to dental care and our values.`,
};

const values = [
  { icon: Heart, title: 'Compassion first', text: 'We take the time to listen, explain, and make every visit as comfortable as possible.' },
  { icon: ShieldCheck, title: 'Safety and quality', text: 'Strict hygiene standards and carefully maintained equipment for every patient.' },
  { icon: Users, title: 'Care for the whole family', text: 'From children to grandparents, we look after smiles at every stage of life.' },
];

const expect = [
  'A clear explanation of every treatment before we start',
  'Honest advice, and only the treatment you actually need',
  'Modern, carefully sterilized equipment',
  'Simple online booking that fits your schedule',
];

export default async function AboutPage() {
  const gallery = await getGallery().catch(() => [] as GalleryImage[]);

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title={`Welcome to ${site.name}`}
        description="A modern dental clinic built around comfort, trust, and long-term oral health."
      />

      <section className="pb-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Our story</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Replace this paragraph with the clinic&apos;s real story: when it opened, why it was
              started, and what makes the team different.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Our goal is simple: to give every patient dental care that is gentle, honest, and
              easy to access.
            </p>
            <ButtonLink href="/doctors" variant="outline" className="mt-8">
              Meet our doctors
            </ButtonLink>
          </div>

          <div className="rounded-3xl bg-brand-50 p-8 sm:p-10">
            <h3 className="text-xl font-bold text-slate-900">What to expect</h3>
            <ul className="mt-6 space-y-4">
              {expect.map((item) => (
                <li key={item} className="flex gap-3 text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <SectionHeading eyebrow="Our values" title="What guides our care" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {gallery.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading eyebrow="Gallery" title="Take a look inside" />
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {gallery.slice(0, 8).map((g) => (
                <div key={g.id} className="relative aspect-square overflow-hidden rounded-2xl bg-brand-50">
                  <Image
                    src={g.imageUrl}
                    alt={g.title ?? 'Clinic photo'}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBanner />
    </>
  );
}