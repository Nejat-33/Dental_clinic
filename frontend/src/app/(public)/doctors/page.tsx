import type { Metadata } from 'next';
import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowUpRight, Briefcase, CalendarDays, GraduationCap, Languages, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { site } from '@/config/site';
import { getDoctors } from '@/lib/queries';
import type { Doctor } from '@/types/api';
import { Container } from '@/components/ui/container';

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
      <Icon className="mt-0.5 size-4 shrink-0 text-[#c28866]" />
      <div>
        <dt className="font-medium text-[#2c1d18]">{label}</dt>
        <dd className="text-[#817068]">{value}</dd>
      </div>
    </div>
  );
}

export default async function DoctorsPage() {
  const doctors = await getDoctors().catch(() => null as Doctor[] | null);

  return (
    <>
      <section className="bg-[#fdf7f5] px-5 pb-14 pt-16 sm:px-8 sm:pb-16 sm:pt-20 lg:px-12">
        <Container className="max-w-[1440px]">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#eadbd3] bg-white/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">
                <Sparkles className="size-3.5 text-[#d57f6d]" />
                Meet our dental experts
              </p>
              <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.055em] text-[#2c1d18] sm:text-6xl lg:text-7xl">
                Care shaped around you.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#817068]">
                Get to know the thoughtful clinicians behind your care. Our team brings skill, warmth, and a personal approach to every visit.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.5rem] border border-[#eadbd3] bg-white p-5 sm:p-6">
                <span className="text-3xl font-semibold tracking-tight text-[#d57f6d]">{doctors?.length ?? '—'}</span>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#817068]">Dental experts</p>
              </div>
              <div className="rounded-[1.5rem] border border-[#eadbd3] bg-white p-5 sm:p-6">
                <span className="text-3xl font-semibold tracking-tight text-[#d57f6d]">
                  {doctors ? new Set(doctors.map((doctor) => doctor.specialization.trim()).filter(Boolean)).size : '—'}
                </span>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#817068]">Care specialties</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#faf0eb] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <Container className="max-w-[1440px]">
          <div className="mb-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">The people behind your care</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#2c1d18] sm:text-4xl">Meet the team</h2>
          </div>
          {doctors === null ? (
            <p className="rounded-[1.75rem] border border-[#eadbd3] bg-white p-8 text-center text-sm text-[#6e5c54]">
              Our team page is temporarily unavailable. Please call us on {site.phone}.
            </p>
          ) : doctors.length === 0 ? (
            <p className="rounded-[1.75rem] border border-[#eadbd3] bg-white p-8 text-center text-sm text-[#6e5c54]">
              Our doctors will be listed here soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {doctors.map((d) => (
                <article key={d.id} className="group overflow-hidden rounded-[1.75rem] border border-[#eadbd3] bg-white shadow-[0_12px_42px_-32px_rgba(70,43,32,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_-38px_rgba(70,43,32,0.4)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f7e9e3]">
                    {d.imageUrl ? (
                      <NextImage
                        src={d.imageUrl}
                        alt={d.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <span className="grid size-24 place-items-center rounded-full bg-[#eed8ce] text-3xl font-semibold text-[#a65f4f]">
                          {initials(d.name)}
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-4 left-4 rounded-full border border-white/60 bg-[#fdf7f5]/90 px-3 py-2 text-[10px] font-semibold text-[#8f6254] shadow-sm backdrop-blur">
                      {d.specialization}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="font-serif text-2xl tracking-tight text-[#2c1d18]">{d.name}</h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b96757]">{d.specialization}</p>

                    {d.education && (
                      <div className="mt-5 flex gap-3 rounded-xl bg-[#faf0eb] p-3.5">
                        <GraduationCap className="mt-0.5 size-4 shrink-0 text-[#c28866]" />
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9b6b5c]">Qualification</p>
                          <p className="mt-1 text-xs leading-5 text-[#5b453d]">{d.education}</p>
                        </div>
                      </div>
                    )}

                    {d.bio && (
                      <details className="group/bio mt-4 border-t border-[#f0e5df] pt-4">
                        <summary className="cursor-pointer list-none text-xs font-semibold text-[#8f6254] marker:hidden">
                          <span className="flex items-center justify-between">
                            About {d.name}
                            <span className="text-lg leading-none transition group-open/bio:rotate-45">+</span>
                          </span>
                        </summary>
                        <p className="mt-3 text-sm leading-6 text-[#817068]">{d.bio}</p>
                      </details>
                    )}

                    {(d.experience || d.languages) && (
                      <dl className="mt-4 space-y-3 border-t border-[#f0e5df] pt-4 text-xs">
                        {d.experience && <Detail icon={Briefcase} label="Experience" value={d.experience} />}
                        {d.languages && <Detail icon={Languages} label="Languages" value={d.languages} />}
                      </dl>
                    )}

                    <Link
                      href="/appointment"
                      className="mt-6 inline-flex w-full items-center justify-between rounded-full bg-[#d57f6d] px-5 py-4 text-[10px] font-semibold text-white transition hover:bg-[#bd6858]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-3.5" />
                        Book consultation with {d.name}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="bg-[#fdf7f5] px-5 py-16 sm:px-8 lg:px-12">
        <Container className="flex max-w-[1440px] flex-col justify-between gap-6 rounded-[1.75rem] bg-[#2c1d18] px-7 py-9 text-white sm:flex-row sm:items-center sm:px-10 sm:py-11">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2a99a]">Here when you need us</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Let&apos;s find the right care for you.</h2>
          </div>
          <Link href="/appointment" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d57f6d] px-6 py-4 text-xs font-semibold text-white transition hover:bg-[#bd6858]">
            Plan your visit <ArrowUpRight className="size-4" />
          </Link>
        </Container>
      </section>
    </>
  );
}