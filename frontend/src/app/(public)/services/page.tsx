import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react';
import { site } from '@/config/site';
import { getServices } from '@/lib/queries';
import type { Service } from '@/types/api';
import { Container } from '@/components/ui/container';
import { ServiceCard } from '@/components/sections/service-card';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore our dental services: check-ups, cleaning, whitening, orthodontics and more.',
};

export default async function ServicesPage() {
  const services = await getServices().catch(() => null as Service[] | null);

  return (
    <>
      <section className="bg-[#fdf7f5] px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-20 lg:px-12">
        <Container className="grid max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#eadbd3] bg-white/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">
              <Sparkles className="size-3.5 text-[#d57f6d]" />
              Treatments &amp; Care
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.055em] text-[#2c1d18] sm:text-6xl lg:text-7xl">
              Thoughtful care for every smile.
            </h1>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-7 text-[#817068]">
              Discover considered treatments led by experienced clinicians, with a plan tailored to your comfort and goals.
            </p>
            <Link
              href="#treatments"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#a65f4f] transition hover:text-[#2c1d18]"
            >
              Explore treatments <ArrowDown className="size-3.5" />
            </Link>
          </div>
        </Container>
      </section>

      <section id="treatments" className="scroll-mt-24 bg-[#faf0eb] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <Container className="max-w-[1440px]">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">Care, considered</p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#2c1d18] sm:text-4xl">Our treatments</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#817068]">
              Every visit begins with a conversation and a clear recommendation from your dental team.
            </p>
          </div>
          {services === null ? (
            <p className="rounded-[1.75rem] border border-[#eadbd3] bg-white p-8 text-center text-sm text-[#6e5c54]">
              Our services are temporarily unavailable. Please call us on{' '}
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="font-semibold text-[#a65f4f]">
                {site.phone}
              </a>
              .
            </p>
          ) : services.length === 0 ? (
            <p className="rounded-[1.75rem] border border-[#eadbd3] bg-white p-8 text-center text-sm text-[#6e5c54]">
              No services listed yet. Please check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="bg-[#fdf7f5] px-5 py-16 sm:px-8 lg:px-12">
        <Container className="flex max-w-[1440px] flex-col justify-between gap-6 rounded-[1.75rem] bg-[#2c1d18] px-7 py-9 text-white sm:flex-row sm:items-center sm:px-10 sm:py-11">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2a99a]">Your next step</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Ready to talk about your smile?</h2>
          </div>
          <Link href="/appointment" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d57f6d] px-6 py-4 text-xs font-semibold text-white transition hover:bg-[#bd6858]">
            Book an appointment <ArrowUpRight className="size-4" />
          </Link>
        </Container>
      </section>
    </>
  );
}