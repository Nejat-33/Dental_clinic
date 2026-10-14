'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';

const schema = z.object({
  patientName: z.string().trim().min(2, 'Please enter your name').max(100),
  rating: z.number().int().min(1, 'Please choose a rating').max(5),
  content: z.string().trim().min(10, 'Please write at least 10 characters').max(1000),
  service: z.string().max(100),
  website: z.string(), // honeypot
});

type FormValues = z.infer<typeof schema>;

export function TestimonialForm({ serviceNames }: { serviceNames: string[] }) {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { patientName: '', rating: 0, content: '', service: '', website: '' },
  });

  const rating = watch('rating');

  async function onSubmit(values: FormValues) {
    try {
      await api('/testimonials/submit', {
        method: 'POST',
        body: JSON.stringify({ ...values, service: values.service || undefined }),
      });
      setSent(true);
      reset();
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) {
        e.errors.forEach(({ path, message }) => {
          if (path in values) setError(path as keyof FormValues, { message });
        });
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Could not submit your review');
    }
  }

  if (sent) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-brand-600" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">Thank you for your review!</h3>
        <p className="mt-2 text-slate-600">It will appear on this page once our team has approved it.</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          Write another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div aria-hidden="true" className="absolute -left-2499.75 h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <Field label="Your name" htmlFor="patientName" error={errors.patientName?.message}>
        <input id="patientName" autoComplete="name" className={inputClass} aria-invalid={!!errors.patientName} {...register('patientName')} />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-800">Your rating</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setValue('rating', n, { shouldValidate: true })}
              className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <Star
                className={cn('size-8 transition', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')}
              />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.rating.message}
          </p>
        )}
      </div>

      {serviceNames.length > 0 && (
        <Field label="Service you received" htmlFor="service" optional error={errors.service?.message}>
          <select id="service" className={inputClass} {...register('service')}>
            <option value="">Select a service</option>
            {serviceNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Your experience" htmlFor="content" error={errors.content?.message}>
        <textarea id="content" rows={4} className={inputClass} aria-invalid={!!errors.content} {...register('content')} />
      </Field>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? 'Submitting...' : 'Submit review'}
      </Button>
    </form>
  );
}