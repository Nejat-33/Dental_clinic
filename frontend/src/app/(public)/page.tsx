import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, CalendarCheck, Clock, HeartHandshake, Phone, ShieldCheck, Smile, Sparkles,
} from 'lucide-react';
import { site } from '@/config/site';
import { getServices } from '@/lib/queries';
import type { Service } from '@/types/api';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button-link';
import { SectionHeading } from '@/components/ui/section-heading';

const features = [
  { icon: HeartHandshake, title: 'Gentle, caring approach', text: 'Comfortable visits for patients of every age, including anxious first-timers.' },
  { icon: ShieldCheck, title: 'Safe and hygienic', text: 'Strict sterilization standards and modern, well-maintained equipment.' },
  { icon: CalendarCheck, title: 'Easy online booking', text: 'Pick a time that suits you in under a minute, no phone call needed.' },
];

export default async function HomePage() {
  const services = await getServices().catch(() => [] as Service[]);

  return (
    <>
      {/* Hero */}
      <section className="bg-linear-to-b from-brand-50 to-white">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
              <Sparkles className="size-4" /> Now accepting new patients
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {site.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">{site.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/appointment" size="lg">
                Book an appointment <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/services" variant="outline" size="lg">
                Our services
              </ButtonLink>
            </div>
          </div>

          <aside className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
            <div className="flex items-center gap-3 text-slate-900">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Clock className="size-5" />
              </span>
              <h2 className="text-lg font-bold">Opening hours</h2>
            </div>
            <dl className="mt-6 divide-y divide-slate-100">
              {site.hours.map((h) => (
                <div key={h.days} className="flex justify-between py-3 text-sm">
                  <dt className="font-medium text-slate-700">{h.days}</dt>
                  <dd className="text-slate-500">{h.time}</dd>
                </div>
              ))}
            </dl>
            <a
              href={`tel:${site.phone.replace(/\s/g, '')}`}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-3 font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Phone className="size-4" /> {site.phone}
            </a>
          </aside>
        </Container>
      </section>

      {/* Services preview */}
      {services.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading
              eyebrow="What we do"
              title="Our dental services"
              description="From routine check-ups to complete smile makeovers, everything under one roof."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  href={`/services/${s.slug}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-16/10 bg-brand-50">
                    {s.imageUrl ? (
                      <Image
                        src={s.imageUrl}
                        alt={s.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-brand-600">
                        <Smile className="size-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900">{s.name}</h3>
                    {s.shortDescription && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{s.shortDescription}</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                      Learn more
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center">
              <ButtonLink href="/services" variant="outline">View all services</ButtonLink>
            </div>
          </Container>
        </section>
      )}

      {/* Why choose us */}
      <section className="bg-slate-50 py-20">
        <Container>
          <SectionHeading eyebrow="Why choose us" title="Dental care you can trust" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
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

      {/* Call to action */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl bg-brand-700 px-8 py-14 text-center text-white sm:px-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready for a healthier smile?</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Book your visit online and we&apos;ll confirm your appointment shortly.
            </p>
            <ButtonLink href="/appointment" variant="light" size="lg" className="mt-8">
              Book an appointment
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}