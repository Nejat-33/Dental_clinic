import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { site } from '@/config/site';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { ContactForm } from '@/components/forms/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with us, find our address and opening hours.',
};

export default function ContactPage() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;

  const info = [
    { icon: Phone, label: 'Phone', value: site.phone, href: `tel:${site.phone.replace(/\s/g, '')}` },
    { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: 'Address', value: site.address, href: mapsUrl },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Questions about a treatment or an appointment? Send us a message or give us a call."
      />

      <section className="pb-20">
        <Container className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {info.map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                {...(label === 'Address' && { target: '_blank', rel: 'noreferrer' })}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-500">{label}</span>
                  <span className="block font-semibold text-slate-900">{value}</span>
                </span>
              </a>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Clock className="size-5" />
                </span>
                <h2 className="font-semibold text-slate-900">Opening hours</h2>
              </div>
              <dl className="mt-4 divide-y divide-slate-100 text-sm">
                {site.hours.map((h) => (
                  <div key={h.days} className="flex justify-between py-2.5">
                    <dt className="font-medium text-slate-700">{h.days}</dt>
                    <dd className="text-slate-500">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100 sm:p-8 lg:col-span-3">
            <h2 className="text-xl font-bold text-slate-900">Send us a message</h2>
            <p className="mb-6 mt-1 text-sm text-slate-600">We usually reply within one working day.</p>
            <ContactForm />
          </div>
        </Container>
      </section>
    </>
  );
}