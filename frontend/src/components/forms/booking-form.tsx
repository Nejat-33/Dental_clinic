'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { CalendarDays, CheckCircle2, Clock, Loader2, Stethoscope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { clinicHour, formatClinicDateTime, formatClinicTime, formatDateLabel, nextDays } from '@/lib/dates';
import { isEthiopianMobile } from '@/lib/validation';
import type { Availability, BookingConfirmation, Service } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Field, inputClass } from '@/components/ui/field';

const MAX_DAYS = 60; // must match the backend booking window
const STRIP_DAYS = 14;

const detailsSchema = z.object({
  patientName: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: z.string().trim().refine(isEthiopianMobile, 'Enter a valid mobile number, e.g. 0911 223 344'),
  email: z.union([z.literal(''), z.string().email('Enter a valid email address')]),
  message: z.string().trim().max(1000, 'Please keep it under 1000 characters'),
});

type Details = z.infer<typeof detailsSchema>;
type Slot = Availability['slots'][number];

function Step({
  n, id, title, error, children,
}: { n: number; id?: string; title: string; error?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm text-white">{n}</span>
        {title}
      </h2>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SlotGroup({
  title, slots, selected, onSelect,
}: { title: string; slots: Slot[]; selected: string | null; onSelect: (time: string) => void }) {
  if (slots.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-500">{title}</p>
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
                ? 'border-brand-600 bg-brand-600 text-white'
                : s.available
                  ? 'border-slate-300 bg-white text-slate-800 hover:border-brand-600 hover:text-brand-700'
                  : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through',
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
      <Icon className="mt-0.5 size-4 shrink-0 text-brand-600" />
      <div>
        <dt className="text-slate-500">{label}</dt>
        <dd className={cn('font-semibold', value ? 'text-slate-900' : 'text-slate-400')}>
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
  const [serviceId, setServiceId] = useState(initialServiceId ?? '');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [pickErrors, setPickErrors] = useState<{ service?: string; slot?: string }>({});
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

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
    if (!serviceId || !slot) return;
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
    void submit(e); // still runs so detail errors show too; onSubmit ignores incomplete picks
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-100 sm:p-10">
        <CheckCircle2 className="mx-auto size-16 text-brand-600" />
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Request received</h2>
        <p className="mt-2 text-slate-600">
          Thank you! Our team will review your request and confirm your appointment.
        </p>

        <dl className="mt-8 space-y-3 rounded-2xl bg-brand-50 p-5 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Service</dt>
            <dd className="font-semibold text-slate-900">{confirmation.service.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">When</dt>
            <dd className="text-right font-semibold text-slate-900">
              {formatClinicDateTime(confirmation.appointmentDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-semibold text-amber-600">Awaiting confirmation</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Reference</dt>
            <dd className="font-mono font-semibold uppercase text-slate-900">{confirmation.id.slice(0, 8)}</dd>
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
    <form onSubmit={onFormSubmit} noValidate className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        {/* 1. Service */}
        <Step n={1} id="step-service" title="Choose a service" error={pickErrors.service}>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Service">
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
                  'rounded-xl border p-4 text-left transition',
                  serviceId === s.id
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20'
                    : 'border-slate-200 hover:border-brand-200',
                )}
              >
                <span className="block font-semibold text-slate-900">{s.name}</span>
                {s.duration && <span className="mt-1 block text-sm text-slate-500">About {s.duration} min</span>}
              </button>
            ))}
          </div>
        </Step>

        {/* 2. Date and time */}
        <Step n={2} id="step-time" title="Pick a date and time" error={pickErrors.slot}>
          <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
            {days.slice(0, STRIP_DAYS).map((d) => (
              <button
                key={d.date}
                type="button"
                aria-pressed={date === d.date}
                onClick={() => pickDate(d.date)}
                className={cn(
                  'flex w-16 shrink-0 flex-col items-center rounded-xl border py-3 transition',
                  date === d.date
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-600',
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
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-6 space-y-5">
            {!date && <p className="text-sm text-slate-500">Select a date to see available times.</p>}

            {date && availability.isLoading && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
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
                <p className="text-sm font-medium text-slate-700">{formatDateLabel(date)}</p>
                {hasFree ? (
                  <>
                    <SlotGroup title="Morning" slots={morning} selected={slot} onSelect={(t) => { setSlot(t); setPickErrors((p) => ({ ...p, slot: undefined })); }} />
                    <SlotGroup title="Afternoon" slots={afternoon} selected={slot} onSelect={(t) => { setSlot(t); setPickErrors((p) => ({ ...p, slot: undefined })); }} />
                  </>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    No times available on this day. We may be closed or fully booked, so please try another date.
                  </p>
                )}
              </>
            )}
          </div>
        </Step>

        {/* 3. Details */}
        <Step n={3} title="Your details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="patientName" error={errors.patientName?.message}>
              <input id="patientName" autoComplete="name" className={inputClass} aria-invalid={!!errors.patientName} {...register('patientName')} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message}>
              <input id="phone" type="tel" autoComplete="tel" placeholder="0911 223 344" className={inputClass} aria-invalid={!!errors.phone} {...register('phone')} />
            </Field>
          </div>
          <div className="mt-5 space-y-5">
            <Field label="Email" htmlFor="email" optional error={errors.email?.message}>
              <input id="email" type="email" autoComplete="email" className={inputClass} aria-invalid={!!errors.email} {...register('email')} />
            </Field>
            <Field label="Anything we should know?" htmlFor="message" optional error={errors.message?.message}>
              <textarea id="message" rows={3} className={inputClass} aria-invalid={!!errors.message} {...register('message')} />
            </Field>
          </div>
        </Step>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Your appointment</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <SummaryRow icon={Stethoscope} label="Service" value={service?.name} />
            <SummaryRow icon={CalendarDays} label="Date" value={date ? formatDateLabel(date) : undefined} />
            <SummaryRow icon={Clock} label="Time" value={slot ? formatClinicTime(slot) : undefined} />
          </dl>
          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-6 w-full">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? 'Booking...' : 'Request appointment'}
          </Button>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Your request goes to our team for confirmation. All times are in the clinic&apos;s local time.
          </p>
        </div>
      </aside>
    </form>
  );
}