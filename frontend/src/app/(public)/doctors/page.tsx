import type { Metadata } from 'next';
import Image from 'next/image';
import { Briefcase, GraduationCap, Languages } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { site } from '@/config/site';
import { getDoctors } from '@/lib/queries';
import type { Doctor } from '@/types/api';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { CtaBanner } from '@/components/sections/cta-banner';

export const metadata: Metadata = {
  title: 'Our Doctors',
  description: 'Meet our experienced dental team.',
};

const initials = (name: string) =>
  name
    .replace(/^dr\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand-600" />
      <div>
        <dt className="font-medium text-slate-800">{label}</dt>
        <dd className="text-slate-600">{value}</dd>
      </div>
    </div>
  );
}

export default async function DoctorsPage() {
  const doctors = await getDoctors().catch(() => null as Doctor[] | null);

  return (
    <>
      <PageHeader
        eyebrow="Our team"
        title="Meet our doctors"
        description="Experienced, caring dental professionals dedicated to your comfort and health."
      />

      <section className="pb-8">
        <Container>
          {doctors === null ? (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
              Our team page is temporarily unavailable. Please call us on {site.phone}.
            </p>
          ) : doctors.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
              Our doctors will be listed here soon.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((d) => (
                <article key={d.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="relative aspect-4/3 bg-brand-50">
                    {d.imageUrl ? (
                      <Image
                        src={d.imageUrl}
                        alt={d.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <span className="grid size-24 place-items-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
                          {initials(d.name)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900">{d.name}</h2>
                    <p className="text-sm font-semibold text-brand-600">{d.specialization}</p>
                    {d.bio && <p className="mt-3 text-sm leading-relaxed text-slate-600">{d.bio}</p>}

                    {(d.education || d.experience || d.languages) && (
                      <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                        {d.education && <Detail icon={GraduationCap} label="Education" value={d.education} />}
                        {d.experience && <Detail icon={Briefcase} label="Experience" value={d.experience} />}
                        {d.languages && <Detail icon={Languages} label="Languages" value={d.languages} />}
                      </dl>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}