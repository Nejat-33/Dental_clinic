import type { Metadata } from 'next';
import { site } from '@/config/site';
import { getServices } from '@/lib/queries';
import type { Service } from '@/types/api';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { BookingForm } from '@/components/forms/booking-form';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: 'Choose a service and a time that suits you. Book your dental appointment online.',
};

type Props = { searchParams: Promise<{ service?: string }> };

export default async function AppointmentPage({ searchParams }: Props) {
  const { service } = await searchParams;
  const services = await getServices().catch(() => null as Service[] | null);

  return (
    <>
      <PageHeader
        eyebrow="Appointments"
        title="Book your visit"
        description="Choose a service, pick a time that suits you, and we'll take care of the rest."
      />

      <section className="pb-20">
        <Container>
          {services && services.length > 0 ? (
            <BookingForm
              services={services}
              initialServiceId={services.some((s) => s.id === service) ? service : undefined}
            />
          ) : (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
              Online booking is temporarily unavailable. Please call us on{' '}
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="font-semibold text-brand-700">
                {site.phone}
              </a>
              .
            </p>
          )}
        </Container>
      </section>
    </>
  );
}