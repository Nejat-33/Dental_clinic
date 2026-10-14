import type { Metadata } from 'next';
import { site } from '@/config/site';
import { getServices } from '@/lib/queries';
import type { Service } from '@/types/api';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { ServiceCard } from '@/components/sections/service-card';
import { CtaBanner } from '@/components/sections/cta-banner';


export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore our dental services: check-ups, cleaning, whitening, orthodontics and more.',
};

export default async function ServicesPage() {
  const services = await getServices().catch(() => null as Service[] | null);

  return (
    <>
      <PageHeader
        eyebrow="Our services"
        title="Complete dental care"
        description="Everything you need for a healthy, confident smile, from prevention to treatment."
      />

      <section className="pb-8">
        <Container>
          {services === null ? (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
              Our services are temporarily unavailable. Please call us on{' '}
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="font-semibold text-brand-700">
                {site.phone}
              </a>
              .
            </p>
          ) : services.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
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

      <CtaBanner />
    </>
  );
}