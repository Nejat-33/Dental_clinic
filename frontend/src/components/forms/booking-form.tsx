'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { clinicHour, formatClinicDateTime, formatClinicTime, formatDateLabel, nextDays } from '@/lib/dates';
import { isEthiopianMobile } from '@/lib/validation';
import type { Availability, BookingConfirmation, Service } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Field } from '@/components/ui/field';

const MAX_DAYS = 60; // must match the backend booking window
const STRIP_DAYS = 14;
type RequestMode = 'appointment' | 'inquiry';

const detailsSchema = z.object({
  patientName: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: z.string().trim().refine(isEthiopianMobile, 'Enter a valid mobile number, e.g. 0911 223 344'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]),
  message: z.string().trim().max(2000, 'Please keep it under 2000 characters'),
});

type Details = z.infer<typeof detailsSchema>;
type Slot = Availability['slots'][number];

function Step({
  n, id, title, error, children,
}: { n: number; id?: string; title: string; error?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-[#ecdfd9] bg-[#fdf7f5] p-5 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-3 text-base font-semibold text-[#2c1d18] sm:text-lg">
        <span className="grid size-8 place-items-center rounded-full bg-[#d57f6d] text-sm text-white">{n}</span>
        {title}
      </h2>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function serviceIcon(name: string) {
  const normalized = name.toLowerCase();
  if (/orthodont|align|braces/.test(normalized)) return Activity;
  if (/cosmetic|aesthetic|whiten|smile/.test(normalized)) return Sparkles;
  if (/implant|surg|extract/.test(normalized)) return Heart;
  return Stethoscope;
}

const warmInputClass =
  'w-full rounded-xl border border-[#e5d4cb] bg-white px-4 py-3.5 text-sm text-[#2c1d18] ' +
  'placeholder:text-[#ad9a91] focus:border-[#d57f6d] focus:outline-none focus:ring-2 focus:ring-[#d57f6d]/15 ' +
  'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 disabled:opacity-60';

function SlotGroup({
  title, slots, selected, onSelect,
}: { title: string; slots: Slot[]; selected: string | null; onSelect: (time: string) => void }) {
  if (slots.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-[#817068]">{title}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((s) => (
          <button
            key={s.time}
            type="button"
            disabled={!s.available}
            aria-pressed={selected === s.time}
            onClick={() => onSelect(s.time)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
              selected === s.time
                ? 'border-[#d57f6d] bg-[#d57f6d] text-white'
                : s.available
                  ? 'border-[#e5d4cb] bg-white text-[#4c3932] hover:border-[#d57f6d] hover:text-[#a65f4f]'
                  : 'cursor-not-allowed border-[#f1e8e3] bg-[#faf7f5] text-[#c8bbb4] line-through',
            )}
          >
            {formatClinicTime(s.time)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-[#c28866]" />
      <div>
        <dt className="text-[#817068]">{label}</dt>
        <dd className={cn('font-semibold', value ? 'text-[#2c1d18]' : 'text-[#ad9a91]')}>
          {value ?? 'Not selected'}
        </dd>
      </div>
    </div>
  );
}

export function BookingForm({
  services,
  initialServiceId,
}: {
  services: Service[];
  initialServiceId?: string;
}) {
  const queryClient = useQueryClient();
  const [days] = useState(() => nextDays(MAX_DAYS));
  const [mode, setMode] = useState<RequestMode>('appointment');
  const [serviceId, setServiceId] = useState(initialServiceId ?? '');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [pickErrors, setPickErrors] = useState<{ service?: string; slot?: string }>({});
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [inquirySent, setInquirySent] = useState(false);

  const {
    register, handleSubmit, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { patientName: '', phone: '', email: '', message: '' },
  });

  const availability = useQuery({
    queryKey: ['availability', date],
    queryFn: () => api<Availability>(`/appointments/availability?date=${date}`),
    enabled: Boolean(date),
    staleTime: 10_000,
  });

  const service = services.find((s) => s.id === serviceId);
  const slots = availability.data?.slots ?? [];
  const morning = slots.filter((s) => clinicHour(s.time) < 12);
  const afternoon = slots.filter((s) => clinicHour(s.time) >= 12);
  const hasFree = slots.some((s) => s.available);

  function pickDate(d: string) {
    if (!d) return;
    setDate(d);
    setSlot(null);
    setPickErrors((p) => ({ ...p, slot: undefined }));
  }

  async function onSubmit(values: Details) {
    if (mode === 'inquiry') {
      const email = values.email.trim();
      const message = values.message.trim();
      let hasError = false;

      if (!email || !z.string().email().safeParse(email).success) {
        setError('email', { type: 'validate', message: 'Enter a valid email address so our team can reply.' });
        hasError = true;
      }
      if (message.length < 10) {
        setError('message', { type: 'validate', message: 'Please include at least 10 characters.' });
        hasError = true;
      }
      if (hasError) return;

      try {
        await api<{ ok: boolean }>('/messages', {
          method: 'POST',
          body: JSON.stringify({
            name: values.patientName,
            email,
            phone: values.phone,
            subject: service ? `Website inquiry: ${service.name}` : 'Website inquiry',
            message,
          }),
        });
        setInquirySent(true);
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'Could not send your message. Please try again.');
      }
      return;
    }

    if (values.message.length > 1000) {
      setError('message', { type: 'validate', message: 'Please keep appointment notes under 1000 characters.' });
      return;
    }

    if (!serviceId || !slot) {
      setPickErrors({
        service: serviceId ? undefined : 'Please choose a service',
        slot: slot ? undefined : 'Please choose a date and time',
      });
      return;
    }

    try {
      const created = await api<BookingConfirmation>('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientName: values.patientName,
          phone: values.phone,
          email: values.email || undefined,
          message: values.message || undefined,
          serviceId,
          appointmentDate: slot,
        }),
      });
      setConfirmation(created);
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) {
          toast.error('Sorry, that time is no longer available. Please choose another.');
          setSlot(null);
          queryClient.invalidateQueries({ queryKey: ['availability'] });
          return;
        }
        if (e.errors?.length) {
          e.errors.forEach(({ path, message }) => {
            if (path in values) setError(path as keyof Details, { message });
            else if (path === 'serviceId') setPickErrors((p) => ({ ...p, service: message }));
            else if (path === 'appointmentDate') setPickErrors((p) => ({ ...p, slot: message }));
          });
          return;
        }
        toast.error(e.message);
        return;
      }
      toast.error('Could not book your appointment. Please try again.');
    }
  }

  const submit = handleSubmit(onSubmit);

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (mode === 'appointment') {
      const missing = {
        service: serviceId ? undefined : 'Please choose a service',
        slot: slot ? undefined : 'Please choose a date and time',
      };
      setPickErrors(missing);
      if (missing.service || missing.slot) {
        document
          .getElementById(missing.service ? 'step-service' : 'step-time')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    void submit(e);
  }

  if (inquirySent) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#ecdfd9] bg-[#fdf7f5] p-8 text-center shadow-sm sm:p-10">
        <CheckCircle2 className="mx-auto size-14 text-[#d57f6d]" />
        <h2 className="mt-5 text-2xl font-semibold text-[#2c1d18]">Message received</h2>
        <p className="mt-2 text-sm leading-6 text-[#817068]">
          Thank you for getting in touch. Our team will reply as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => {
            setInquirySent(false);
            reset();
          }}
          className="mt-6 rounded-full border border-[#e5d4cb] px-5 py-3 text-sm font-semibold text-[#6e5c54] transition hover:border-[#d57f6d] hover:text-[#a65f4f]"
        >
          Send another message
        </button>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#ecdfd9] bg-[#fdf7f5] p-8 text-center shadow-sm sm:p-10">
        <CheckCircle2 className="mx-auto size-14 text-[#d57f6d]" />
        <h2 className="mt-5 text-2xl font-semibold text-[#2c1d18]">Request received</h2>
        <p className="mt-2 text-[#817068]">
          Thank you! Our team will review your request and confirm your appointment.
        </p>

        <dl className="mt-8 space-y-3 rounded-2xl bg-[#faf0eb] p-5 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#817068]">Service</dt>
            <dd className="font-semibold text-[#2c1d18]">{confirmation.service.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#817068]">When</dt>
            <dd className="text-right font-semibold text-[#2c1d18]">
              {formatClinicDateTime(confirmation.appointmentDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#817068]">Status</dt>
            <dd className="font-semibold text-[#a66e5e]">Awaiting confirmation</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#817068]">Reference</dt>
            <dd className="font-mono font-semibold uppercase text-[#2c1d18]">{confirmation.id.slice(0, 8)}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmation(null);
              setSlot(null);
              reset();
            }}
          >
            Book another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onFormSubmit} noValidate className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-2xl border border-[#ecdfd9] bg-[#fdf7f5] p-5 shadow-sm sm:p-7 lg:col-span-3">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a66e5e]">Let&apos;s get started</p>
          <h2 className="mt-2 font-serif text-2xl tracking-tight text-[#2c1d18] sm:text-3xl">How would you like us to help?</h2>
          <p className="mt-2 text-sm text-[#817068]">Book a visit or send us a question — we&apos;re happy to help either way.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose appointment or inquiry">
          <button
            type="button"
            aria-pressed={mode === 'appointment'}
            onClick={() => {
              setMode('appointment');
              setPickErrors({});
            }}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4 text-left transition',
              mode === 'appointment'
                ? 'border-[#d57f6d] bg-[#d57f6d]/10 ring-2 ring-[#d57f6d]/15'
                : 'border-[#e5d4cb] bg-white hover:border-[#d57f6d]',
            )}
          >
            <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', mode === 'appointment' ? 'bg-[#d57f6d] text-white' : 'bg-[#faf0eb] text-[#a66e5e]')}>
              <CalendarDays className="size-4" />
            </span>
            <span><span className="block text-sm font-semibold text-[#2c1d18]">Book an appointment</span><span className="mt-1 block text-xs text-[#817068]">Choose a service, date and time.</span></span>
          </button>
          <button
            type="button"
            aria-pressed={mode === 'inquiry'}
            onClick={() => {
              setMode('inquiry');
              setPickErrors({});
            }}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4 text-left transition',
              mode === 'inquiry'
                ? 'border-[#d57f6d] bg-[#d57f6d]/10 ring-2 ring-[#d57f6d]/15'
                : 'border-[#e5d4cb] bg-white hover:border-[#d57f6d]',
            )}
          >
            <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', mode === 'inquiry' ? 'bg-[#d57f6d] text-white' : 'bg-[#faf0eb] text-[#a66e5e]')}>
              <MessageCircle className="size-4" />
            </span>
            <span><span className="block text-sm font-semibold text-[#2c1d18]">Send an inquiry</span><span className="mt-1 block text-xs text-[#817068]">Ask us anything about your care.</span></span>
          </button>
        </div>
      </div>

      <div className="space-y-5 lg:col-span-2">
        <Step n={1} id="step-service" title={mode === 'appointment' ? 'Choose a service' : 'What are you interested in?'} error={pickErrors.service}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Service">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={serviceId === s.id}
                onClick={() => {
                  setServiceId(s.id);
                  setPickErrors((p) => ({ ...p, service: undefined }));
                }}
                className={cn(
                  'group flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5',
                  serviceId === s.id
                    ? 'border-[#d57f6d] bg-[#d57f6d]/10 ring-2 ring-[#d57f6d]/15'
                    : 'border-[#e5d4cb] bg-white hover:border-[#d57f6d]',
                )}
              >
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl transition-colors', serviceId === s.id ? 'bg-[#d57f6d] text-white' : 'bg-[#faf0eb] text-[#a66e5e] group-hover:bg-[#d57f6d] group-hover:text-white')}>
                  {(() => {
                    const Icon = serviceIcon(s.name);
                    return <Icon className="size-4" />;
                  })()}
                </span>
                <span>
                  <span className="block font-semibold text-[#2c1d18]">{s.name}</span>
                  {s.duration && <span className="mt-1 block text-xs text-[#817068]">About {s.duration} min</span>}
                </span>
              </button>
            ))}
          </div>
          {mode === 'inquiry' && <p className="mt-3 text-xs text-[#817068]">Choosing a service is optional for inquiries.</p>}
        </Step>

        {mode === 'appointment' && <Step n={2} id="step-time" title="Choose a date and time" error={pickErrors.slot}>
          <div className="mb-4 flex items-center gap-2 text-xs text-[#817068]">
            <CalendarDays className="size-4 text-[#c28866]" />
            <span>Pick a day that works for you. All times use the clinic&apos;s local time.</span>
          </div>
          <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
            {days.slice(0, STRIP_DAYS).map((d) => (
              <button
                key={d.date}
                type="button"
                aria-pressed={date === d.date}
                onClick={() => pickDate(d.date)}
                className={cn(
                  'flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border py-3 transition',
                  date === d.date
                    ? 'border-[#d57f6d] bg-[#d57f6d] text-white shadow-md shadow-[#d57f6d]/20'
                    : 'border-[#e5d4cb] bg-white text-[#4c3932] hover:border-[#d57f6d]',
                )}
              >
                <span className="text-xs font-medium opacity-80">{d.weekday}</span>
                <span className="text-xl font-bold">{d.day}</span>
                <span className="text-xs opacity-80">{d.month}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 max-w-xs">
            <Field label="Or choose another date" htmlFor="other-date">
              <input
                id="other-date"
                type="date"
                min={days[0]?.date}
                max={days[days.length - 1]?.date}
                value={date}
                onChange={(e) => pickDate(e.target.value)}
                className={warmInputClass}
              />
            </Field>
          </div>

          <div className="mt-6 space-y-5">
            {!date && <p className="text-sm text-[#817068]">Select a date to see available times.</p>}

            {date && availability.isLoading && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-[#faf0eb]" />
                ))}
              </div>
            )}

            {date && availability.isError && (
              <p className="text-sm text-red-600">
                Could not load times.{' '}
                <button type="button" className="font-semibold underline" onClick={() => availability.refetch()}>
                  Try again
                </button>
              </p>
            )}

            {date && availability.isSuccess && (
              <>
                <p className="text-sm font-medium text-[#4c3932]">{formatDateLabel(date)}</p>
                {hasFree ? (
                  <>
                    <SlotGroup title="Morning" slots={morning} selected={slot} onSelect={(t) => { setSlot(t); setPickErrors((p) => ({ ...p, slot: undefined })); }} />
                    <SlotGroup title="Afternoon" slots={afternoon} selected={slot} onSelect={(t) => { setSlot(t); setPickErrors((p) => ({ ...p, slot: undefined })); }} />
                  </>
                ) : (
                  <p className="rounded-xl bg-[#faf0eb] p-4 text-sm text-[#6e5c54]">
                    No times available on this day. We may be closed or fully booked, so please try another date.
                  </p>
                )}
              </>
            )}
          </div>
        </Step>}

        <Step n={mode === 'appointment' ? 3 : 2} title={mode === 'appointment' ? 'Your details' : 'Your details and message'}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="patientName" error={errors.patientName?.message}>
              <input id="patientName" autoComplete="name" placeholder="Your name" className={warmInputClass} aria-invalid={!!errors.patientName} {...register('patientName')} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message}>
              <input id="phone" type="tel" autoComplete="tel" placeholder="0911 223 344" className={warmInputClass} aria-invalid={!!errors.phone} {...register('phone')} />
            </Field>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Email address" htmlFor="email" optional={mode === 'appointment'} error={errors.email?.message}>
              <input id="email" type="email" autoComplete="email" placeholder={mode === 'inquiry' ? 'you@example.com' : 'Optional for appointment requests'} required={mode === 'inquiry'} className={warmInputClass} aria-invalid={!!errors.email} {...register('email')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={mode === 'inquiry' ? 'Your message' : 'Anything we should know?'} htmlFor="message" optional={mode === 'appointment'} error={errors.message?.message}>
                <textarea id="message" rows={4} maxLength={mode === 'inquiry' ? 2000 : 1000} placeholder="Tell us about your dental needs or ask a question..." required={mode === 'inquiry'} className={cn(warmInputClass, 'min-h-28 resize-y leading-6')} aria-invalid={!!errors.message} {...register('message')} />
              </Field>
            </div>
          </div>
        </Step>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-[#ecdfd9] bg-[#fdf7f5] p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[#2c1d18]">{mode === 'appointment' ? 'Your appointment' : 'Send us a message'}</h2>
          {mode === 'appointment' ? (
            <dl className="mt-5 space-y-4 text-sm">
              <SummaryRow icon={Stethoscope} label="Service" value={service?.name} />
              <SummaryRow icon={CalendarDays} label="Date" value={date ? formatDateLabel(date) : undefined} />
              <SummaryRow icon={Clock} label="Time" value={slot ? formatClinicTime(slot) : undefined} />
            </dl>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#817068]">
              Our team will respond using the email and phone number you provide.
            </p>
          )}
          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-6 w-full rounded-xl bg-[#d57f6d] text-white transition hover:bg-[#bd6858]">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? (mode === 'appointment' ? 'Booking...' : 'Sending...') : (mode === 'appointment' ? 'Request appointment' : 'Send message')}
          </Button>
          <p className="mt-4 text-xs leading-relaxed text-[#817068]">
            {mode === 'appointment'
              ? 'Your request goes to our team for confirmation. All times are in the clinic’s local time.'
              : 'Your message is sent directly to our clinic team.'}
          </p>
        </div>
      </aside>
    </form>
  );
}