'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { isEthiopianMobile } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || isEthiopianMobile(v), 'Enter a valid mobile number, e.g. 0911 223 344'),
  subject: z.string().trim().max(150),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
  website: z.string(), // honeypot
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '', website: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          phone: values.phone || undefined,
          subject: values.subject || undefined,
        }),
      });
      setSent(true);
      reset();
    } catch (e) {
      // Show the backend's per-field validation errors next to the right inputs
      if (e instanceof ApiError && e.errors?.length) {
        e.errors.forEach(({ path, message }) => {
          if (path in values) setError(path as keyof FormValues, { message });
        });
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Could not send your message');
    }
  }

  if (sent) {
    return (
      <div className="py-10 text-center">
        <CheckCircle2 className="mx-auto size-14 text-brand-600" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">Message sent</h3>
        <p className="mt-2 text-slate-600">Thank you! We&apos;ll get back to you as soon as possible.</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Honeypot: hidden from people, bots fill it in and get silently ignored */}
      <div aria-hidden="true" className="absolute -left-2499.75 h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <input id="name" autoComplete="name" className={inputClass} aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass} aria-invalid={!!errors.email} {...register('email')} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone" optional error={errors.phone?.message}>
          <input id="phone" type="tel" autoComplete="tel" placeholder="0911 223 344" className={inputClass} aria-invalid={!!errors.phone} {...register('phone')} />
        </Field>
        <Field label="Subject" htmlFor="subject" optional error={errors.subject?.message}>
          <input id="subject" className={inputClass} aria-invalid={!!errors.subject} {...register('subject')} />
        </Field>
      </div>

      <Field label="Message" htmlFor="message" error={errors.message?.message}>
        <textarea id="message" rows={5} className={inputClass} aria-invalid={!!errors.message} {...register('message')} />
      </Field>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {isSubmitting ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  );
}