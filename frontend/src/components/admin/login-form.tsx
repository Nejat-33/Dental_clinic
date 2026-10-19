'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { AdminUser } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      const user = await api<AdminUser>('/auth/login', { method: 'POST', body: JSON.stringify(values) });
      queryClient.setQueryData(['me'], user);
      router.replace('/admin');
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) setFormError('Please check your email and password.');
      else setFormError(e instanceof ApiError ? e.message : 'Could not sign in. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      )}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="username" className={inputClass} aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <input id="password" type="password" autoComplete="current-password" className={inputClass} aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}