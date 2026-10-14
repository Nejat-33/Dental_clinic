import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Phone, Smile } from 'lucide-react';
import { site } from '@/config/site';
import { ApiError } from '@/lib/api';
import { getService, getServices } from '@/lib/queries';
import type { Service } from '@/types/api';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button-link';
import { SectionHeading } from '@/components/ui/section-heading';
import { ServiceCard } from '@/components/sections/service-card';

type Props = { params: Promise<{ slug: string }> };

async function loadService(slug: string) {
  try {
    return await getService(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await loadService(slug);
  return {
    title: service.name,
    description: service.shortDescription ?? service.description.slice(0, 160),
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await loadService(slug);
  const others = (await getServices().catch(() => [] as Service[]))
    .filter((s) => s.id !== service.id)
    .slice(0, 3);

  return (
    <>
      <Container className="py-10 lg:py-14">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" /> All services
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-brand-50">
              {service.imageUrl ? (
                <Image
                  src={service.imageUrl}
                  alt={service.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-brand-600">
                  <Smile className="size-16" />
                </div>
              )}
            </div>

            <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {service.name}
            </h1>
            {/* whitespace-pre-line keeps paragraph breaks typed in the admin panel */}
            <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-slate-600">
              {service.description}
            </p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Book this service</h2>
              {service.duration && (
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="size-4 text-brand-600" /> About {service.duration} minutes
                </p>
              )}
              <ButtonLink href={`/appointment?service=${service.id}`} size="lg" className="mt-6 w-full">
                Book appointment
              </ButtonLink>
              <a
                href={`tel:${site.phone.replace(/\s/g, '')}`}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
              >
                <Phone className="size-4" /> {site.phone}
              </a>
            </div>
          </aside>
        </div>
      </Container>

      {others.length > 0 && (
        <section className="bg-slate-50 py-16">
          <Container>
            <SectionHeading title="Other services" center={false} />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}